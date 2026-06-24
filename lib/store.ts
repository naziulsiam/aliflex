import { create } from 'zustand';
import { Channel } from './types';
import { parseM3U } from './m3u';

export interface CustomPlaylist {
  id: string;
  name: string;
  url?: string;
  rawText?: string;
  channels: Channel[];
}

interface AppState {
  channels:         Channel[];
  loading:          boolean;
  error:            string | null;
  currentChannel:   Channel | null;   // kept for compat (tracks recents)
  modalChannel:     Channel | null;   // drives the PlayerModal overlay
  recentChannels:   Channel[];
  favorites:        string[];
  searchQuery:      string;
  activeGroup:      string | null;
  activeCategory:   string | null;    // drives CategoryPills filter
  
  // Custom playlists & individual channels
  customPlaylists:  CustomPlaylist[];
  activePlaylistId: string;           // '__default' or custom playlist ID
  customChannels:   Channel[];        // individually added channels

  setChannels:        (channels: Channel[]) => void;
  setLoading:         (loading: boolean) => void;
  setError:           (error: string | null) => void;
  playChannel:        (channel: Channel) => void;  // legacy inline (still tracks recents)
  openModal:          (channel: Channel) => void;  // new: tracks recents + opens modal
  closeModal:         () => void;
  toggleFavorite:     (channelId: string) => void;
  setSearchQuery:     (query: string) => void;
  setActiveGroup:     (group: string | null) => void;
  setActiveCategory:  (cat: string | null) => void;
  
  // Playlist actions
  addCustomPlaylist:  (name: string, url?: string, rawText?: string) => Promise<CustomPlaylist>;
  deleteCustomPlaylist:(id: string) => void;
  setActivePlaylistId:(id: string) => void;
  loadActivePlaylist: () => Promise<void>;
  
  // Individual channel actions
  addIndividualChannel: (name: string, url: string, logo?: string, group?: string, country?: string) => void;
  deleteIndividualChannel: (id: string) => void;
}

const FAVORITES_KEY   = 'aliflex-favorites';
const RECENT_KEY      = 'aliflex-recent';
const PLAYLISTS_KEY   = 'aliflex-custom-playlists';
const ACTIVE_PL_KEY   = 'aliflex-active-playlist-id';
const CUSTOM_CH_KEY   = 'aliflex-custom-channels';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export const useAppStore = create<AppState>((set, get) => ({
  channels:         [],
  loading:          true,
  error:            null,
  currentChannel:   null,
  modalChannel:     null,
  recentChannels:   loadFromStorage<Channel[]>(RECENT_KEY, []),
  favorites:        loadFromStorage<string[]>(FAVORITES_KEY, []),
  searchQuery:      '',
  activeGroup:      null,
  activeCategory:   null,
  
  customPlaylists:  loadFromStorage<CustomPlaylist[]>(PLAYLISTS_KEY, []),
  activePlaylistId: loadFromStorage<string>(ACTIVE_PL_KEY, '__default'),
  customChannels:   loadFromStorage<Channel[]>(CUSTOM_CH_KEY, []),

  setChannels:  (channels) => set({ channels }),
  setLoading:   (loading)  => set({ loading }),
  setError:     (error)    => set({ error }),

  /* Legacy — keeps currentChannel */
  playChannel: (channel) => {
    const recent  = get().recentChannels.filter(c => c.id !== channel.id);
    const updated = [channel, ...recent].slice(0, 12);
    saveToStorage(RECENT_KEY, updated);
    set({ currentChannel: channel, recentChannels: updated });
  },

  /* New — opens modal overlay AND tracks recents */
  openModal: (channel) => {
    const recent  = get().recentChannels.filter(c => c.id !== channel.id);
    const updated = [channel, ...recent].slice(0, 12);
    saveToStorage(RECENT_KEY, updated);
    set({ modalChannel: channel, recentChannels: updated });
  },

  closeModal: () => set({ modalChannel: null }),

  toggleFavorite: (channelId) => {
    const favs    = get().favorites;
    const updated = favs.includes(channelId)
      ? favs.filter(id => id !== channelId)
      : [...favs, channelId];
    saveToStorage(FAVORITES_KEY, updated);
    set({ favorites: updated });
  },

  setSearchQuery:    (query) => set({ searchQuery: query }),
  setActiveGroup:    (group) => set({ activeGroup: group }),
  setActiveCategory: (cat)   => set({ activeCategory: cat }),

  /* ── Playlist Management ── */
  addCustomPlaylist: async (name, url, rawText) => {
    let channelsList: Channel[] = [];

    if (url) {
      // proxy through API route to avoid CORS issues
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`Failed to load playlist from ${url}`);
      const text = await res.text();
      channelsList = parseM3U(text);
    } else if (rawText) {
      channelsList = parseM3U(rawText);
    } else {
      throw new Error('Must provide either a URL or raw M3U text');
    }

    if (channelsList.length === 0) {
      throw new Error('No valid channels found in M3U file');
    }

    const newPlaylist: CustomPlaylist = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      url,
      rawText,
      channels: channelsList,
    };

    const updated = [...get().customPlaylists, newPlaylist];
    saveToStorage(PLAYLISTS_KEY, updated);
    set({ customPlaylists: updated });
    return newPlaylist;
  },

  deleteCustomPlaylist: (id) => {
    const playlists = get().customPlaylists;
    const updated = playlists.filter(p => p.id !== id);
    saveToStorage(PLAYLISTS_KEY, updated);
    
    let activeId = get().activePlaylistId;
    if (activeId === id) {
      activeId = '__default';
      saveToStorage(ACTIVE_PL_KEY, activeId);
    }
    
    set({ customPlaylists: updated, activePlaylistId: activeId });
    get().loadActivePlaylist();
  },

  setActivePlaylistId: (id) => {
    saveToStorage(ACTIVE_PL_KEY, id);
    set({ activePlaylistId: id, activeGroup: null, activeCategory: null });
    get().loadActivePlaylist();
  },

  loadActivePlaylist: async () => {
    set({ loading: true, error: null });
    try {
      const activeId = get().activePlaylistId;
      let loadedChannels: Channel[] = [];

      if (activeId === '__default') {
        // load default matches from API route
        const res = await fetch('/api/playlist');
        if (!res.ok) throw new Error('Failed to load default playlist');
        const text = await res.text();
        loadedChannels = parseM3U(text);
      } else {
        const found = get().customPlaylists.find(p => p.id === activeId);
        if (found) {
          loadedChannels = found.channels;
        } else {
          // fall back to default
          saveToStorage(ACTIVE_PL_KEY, '__default');
          set({ activePlaylistId: '__default' });
          const res = await fetch('/api/playlist');
          if (!res.ok) throw new Error('Failed to load default playlist');
          const text = await res.text();
          loadedChannels = parseM3U(text);
        }
      }

      // Merge individually added custom channels if they exist
      const personalChannels = get().customChannels;
      const combined = [...personalChannels, ...loadedChannels];

      set({ channels: combined, loading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Could not load active playlist', loading: false });
    }
  },

  /* ── Individual Channels ── */
  addIndividualChannel: (name, url, logo = '', group = 'My Streams', country = 'Personal') => {
    const newChan: Channel = {
      id: `custom-stream-${Date.now()}`,
      name,
      url,
      logo,
      group: group || 'My Streams',
      country: country || 'Personal',
      languages: ['EN'],
    };

    const updated = [newChan, ...get().customChannels];
    saveToStorage(CUSTOM_CH_KEY, updated);
    set({ customChannels: updated });
    
    // Add to active channels state dynamically
    set({ channels: [newChan, ...get().channels] });
  },

  deleteIndividualChannel: (id) => {
    const updated = get().customChannels.filter(c => c.id !== id);
    saveToStorage(CUSTOM_CH_KEY, updated);
    
    set({
      customChannels: updated,
      channels: get().channels.filter(c => c.id !== id),
    });
  },
}));

