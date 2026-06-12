'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RotateCw, SearchX } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { parseM3U, groupChannels } from '@/lib/m3u';
import { Channel } from '@/lib/types';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import CategoriesDrawer from '@/components/CategoriesDrawer';
import ChannelRow from '@/components/ChannelRow';
import ChannelCard from '@/components/ChannelCard';
import Hero from '@/components/Hero';
import VideoPlayer from '@/components/VideoPlayer';
import SkeletonRow from '@/components/SkeletonRow';

/* Number of rows to render immediately; rest are lazy via ChannelRow's IntersectionObserver */
const EAGER_ROWS = 4;
/* Max channels shown per row rail */
const RAIL_LIMIT = 20;

export default function HomePage() {
  const {
    channels, loading, error, currentChannel,
    recentChannels, favorites, searchQuery, activeGroup,
    setChannels, setLoading, setError, playChannel,
  } = useAppStore();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [heroChannel, setHeroChannel]       = useState<Channel | null>(null);

  /* ── Fetch playlist ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/playlist');
        if (!res.ok) throw new Error('Failed to load playlist');
        const text = await res.text();
        const parsed = parseM3U(text);
        if (!cancelled) {
          setChannels(parsed);
          if (parsed.length > 0) {
            setHeroChannel(parsed[Math.floor(Math.random() * Math.min(parsed.length, 300))]);
          }
        }
      } catch {
        if (!cancelled) setError('Could not load the channel list. Please check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [setChannels, setLoading, setError]);

  /* ── Derived data ───────────────────────────────────────────── */
  const grouped        = useMemo(() => groupChannels(channels), [channels]);
  const groupNames     = useMemo(() => grouped.map(g => g.name), [grouped]);

  const favoriteChannels = useMemo(
    () => channels.filter(c => favorites.includes(c.id)),
    [channels, favorites]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    ).slice(0, 80);
  }, [channels, searchQuery]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleShuffle = () => {
    if (channels.length === 0) return;
    setHeroChannel(channels[Math.floor(Math.random() * channels.length)]);
  };

  const handleSelect = (channel: Channel) => playChannel(channel);

  /* ── Loading state — skeleton rows ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <div className="hidden lg:block w-56 flex-shrink-0 border-r border-border/60" />
          <main className="flex-1 min-w-0 pb-24 lg:pb-10 pt-2">
            {/* Hero skeleton */}
            <div
              className="mx-0 mb-8 shimmer-bg"
              style={{ height: 'clamp(280px, 48vh, 520px)' }}
            />
            {/* Row skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cardCount={8} />
            ))}
          </main>
        </div>
        {/* Mobile nav skeleton */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface/96 border-t border-border/60 lg:hidden" />
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold mb-1">Something went wrong</p>
            <p className="text-sm text-muted max-w-sm">{error}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-sm font-bold transition-colors"
          >
            <RotateCw className="w-4 h-4" /> Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  /* ── Main content ── */
  let content: React.ReactNode;

  /* Search results */
  if (searchResults !== null) {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-xl font-bold mb-4">
          {searchResults.length > 0
            ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `No results for "${searchQuery}"`}
        </h2>
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SearchX className="w-14 h-14 text-muted/30 mb-4" />
            <p className="text-sm text-muted">Try a different search term or browse by category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {searchResults.map((channel, idx) => (
              <motion.div
                key={`${channel.id}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
              >
                <ChannelCard channel={channel} onSelect={handleSelect} index={idx} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* My List */
  else if (activeGroup === '__favorites') {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-xl font-bold mb-4">My List</h2>
        {favoriteChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4">
              <span className="text-3xl">♡</span>
            </div>
            <p className="font-semibold mb-1">No favorites yet</p>
            <p className="text-sm text-muted">Tap the heart icon on any channel to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {favoriteChannels.map((ch, idx) => (
              <ChannelCard key={`${ch.id}-${idx}`} channel={ch} onSelect={handleSelect} index={idx} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Continue Watching */
  else if (activeGroup === '__recent') {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-xl font-bold mb-4">Continue Watching</h2>
        {recentChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4">
              <span className="text-3xl">▷</span>
            </div>
            <p className="font-semibold mb-1">Nothing watched yet</p>
            <p className="text-sm text-muted">Channels you watch will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recentChannels.map((ch, idx) => (
              <ChannelCard key={`${ch.id}-${idx}`} channel={ch} onSelect={handleSelect} index={idx} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Specific category */
  else if (activeGroup) {
    const group = grouped.find(g => g.name === activeGroup);
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-xl font-bold mb-4">{activeGroup}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {(group?.channels ?? []).map((ch, idx) => (
            <ChannelCard key={`${ch.id}-${idx}`} channel={ch} onSelect={handleSelect} index={idx} />
          ))}
        </div>
      </div>
    );
  }

  /* Home browse */
  else {
    content = (
      <>
        <Hero channel={heroChannel} onPlay={handleSelect} onShuffle={handleShuffle} />

        {recentChannels.length > 0 && (
          <ChannelRow
            title="Continue Watching"
            channels={recentChannels}
            onSelect={handleSelect}
          />
        )}

        {favoriteChannels.length > 0 && (
          <ChannelRow
            title="My List"
            channels={favoriteChannels}
            onSelect={handleSelect}
          />
        )}

        {grouped.slice(0, EAGER_ROWS).map(group => (
          <ChannelRow
            key={group.name}
            title={group.name}
            channels={group.channels.slice(0, RAIL_LIMIT)}
            onSelect={handleSelect}
          />
        ))}

        {grouped.slice(EAGER_ROWS).map(group => (
          <ChannelRow
            key={group.name}
            title={group.name}
            channels={group.channels.slice(0, RAIL_LIMIT)}
            onSelect={handleSelect}
          />
        ))}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar groups={groupNames} />

        <main className="flex-1 min-w-0 pb-24 lg:pb-10 overflow-x-hidden">
          {/* Active player */}
          <AnimatePresence>
            {currentChannel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="px-4 sm:px-6 pt-4 pb-2 overflow-hidden"
              >
                <VideoPlayer
                  channel={currentChannel}
                  onClose={() => useAppStore.setState({ currentChannel: null })}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup ?? 'home'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-2"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav onOpenCategories={() => setCategoriesOpen(true)} />
      <CategoriesDrawer
        groups={groupNames}
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </div>
  );
}
