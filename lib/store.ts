import { create } from 'zustand';
import { Channel } from './types';

interface AppState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  currentChannel: Channel | null;
  recentChannels: Channel[];
  favorites: string[];
  searchQuery: string;
  activeGroup: string | null;

  setChannels: (channels: Channel[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  playChannel: (channel: Channel) => void;
  toggleFavorite: (channelId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveGroup: (group: string | null) => void;
}

const FAVORITES_KEY = 'aliflex-favorites';
const RECENT_KEY = 'aliflex-recent';

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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  channels: [],
  loading: true,
  error: null,
  currentChannel: null,
  recentChannels: loadFromStorage<Channel[]>(RECENT_KEY, []),
  favorites: loadFromStorage<string[]>(FAVORITES_KEY, []),
  searchQuery: '',
  activeGroup: null,

  setChannels: (channels) => set({ channels }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  playChannel: (channel) => {
    const recent = get().recentChannels.filter((c) => c.id !== channel.id);
    const updated = [channel, ...recent].slice(0, 12);
    saveToStorage(RECENT_KEY, updated);
    set({ currentChannel: channel, recentChannels: updated });
  },

  toggleFavorite: (channelId) => {
    const favs = get().favorites;
    const updated = favs.includes(channelId)
      ? favs.filter((id) => id !== channelId)
      : [...favs, channelId];
    saveToStorage(FAVORITES_KEY, updated);
    set({ favorites: updated });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveGroup: (group) => set({ activeGroup: group }),
}));
