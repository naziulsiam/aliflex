import { create } from 'zustand';
import { Channel } from './types';

interface AppState {
  channels:       Channel[];
  loading:        boolean;
  error:          string | null;
  currentChannel: Channel | null;   // kept for compat (tracks recents)
  modalChannel:   Channel | null;   // drives the PlayerModal overlay
  recentChannels: Channel[];
  favorites:      string[];
  searchQuery:    string;
  activeGroup:    string | null;
  activeCategory: string | null;    // drives CategoryPills filter

  setChannels:      (channels: Channel[]) => void;
  setLoading:       (loading: boolean) => void;
  setError:         (error: string | null) => void;
  playChannel:      (channel: Channel) => void;  // legacy inline (still tracks recents)
  openModal:        (channel: Channel) => void;  // new: tracks recents + opens modal
  closeModal:       () => void;
  toggleFavorite:   (channelId: string) => void;
  setSearchQuery:   (query: string) => void;
  setActiveGroup:   (group: string | null) => void;
  setActiveCategory:(cat: string | null) => void;
}

const FAVORITES_KEY = 'aliflex-favorites';
const RECENT_KEY    = 'aliflex-recent';

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
  channels:       [],
  loading:        true,
  error:          null,
  currentChannel: null,
  modalChannel:   null,
  recentChannels: loadFromStorage<Channel[]>(RECENT_KEY, []),
  favorites:      loadFromStorage<string[]>(FAVORITES_KEY, []),
  searchQuery:    '',
  activeGroup:    null,
  activeCategory: null,

  setChannels:  (channels) => set({ channels }),
  setLoading:   (loading)  => set({ loading }),
  setError:     (error)    => set({ error }),

  /* Legacy — keeps currentChannel (inline player no longer rendered, but kept for compat) */
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
}));
