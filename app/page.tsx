'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, RotateCw, SearchX } from 'lucide-react';
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

export default function HomePage() {
  const {
    channels,
    loading,
    error,
    currentChannel,
    recentChannels,
    favorites,
    searchQuery,
    activeGroup,
    setChannels,
    setLoading,
    setError,
    playChannel,
  } = useAppStore();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [heroChannel, setHeroChannel] = useState<Channel | null>(null);

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
            setHeroChannel(parsed[Math.floor(Math.random() * Math.min(parsed.length, 200))]);
          }
        }
      } catch (e) {
        if (!cancelled) setError('Could not load the channel list. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setChannels, setLoading, setError]);

  const grouped = useMemo(() => groupChannels(channels), [channels]);
  const groupNames = useMemo(() => grouped.map((g) => g.name), [grouped]);

  const favoriteChannels = useMemo(
    () => channels.filter((c) => favorites.includes(c.id)),
    [channels, favorites]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [channels, searchQuery]);

  const handleShuffle = () => {
    if (channels.length === 0) return;
    setHeroChannel(channels[Math.floor(Math.random() * channels.length)]);
  };

  const handleSelect = (channel: Channel) => {
    playChannel(channel);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted">Loading your channels…</p>
      </div>
    );
  }

  // ---------- Error state ----------
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="w-10 h-10 text-primary" />
        <p className="text-sm text-text font-medium">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface hover:bg-surface2 text-sm font-medium transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // ---------- Main content rendering ----------
  let content;

  if (searchResults !== null) {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          {searchResults.length > 0
            ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${searchQuery}"`
            : `No results for "${searchQuery}"`}
        </h2>
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchX className="w-10 h-10 text-muted mb-3" />
            <p className="text-sm text-muted">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {searchResults.map((channel, idx) => (
              <motion.div
                key={`${channel.id}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
              >
                <ChannelCard channel={channel} onSelect={handleSelect} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeGroup === '__favorites') {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3">Favorites</h2>
        {favoriteChannels.length === 0 ? (
          <p className="text-sm text-muted py-10 text-center">
            No favorites yet. Tap the heart icon on any channel to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {favoriteChannels.map((channel, idx) => (
              <ChannelCard key={`${channel.id}-${idx}`} channel={channel} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeGroup === '__recent') {
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3">Recently Watched</h2>
        {recentChannels.length === 0 ? (
          <p className="text-sm text-muted py-10 text-center">
            Channels you watch will show up here.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recentChannels.map((channel, idx) => (
              <ChannelCard key={`${channel.id}-${idx}`} channel={channel} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeGroup) {
    const group = grouped.find((g) => g.name === activeGroup);
    content = (
      <div className="px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3">{activeGroup}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {(group?.channels || []).map((channel, idx) => (
            <ChannelCard key={`${channel.id}-${idx}`} channel={channel} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    );
  } else {
    content = (
      <>
        <Hero channel={heroChannel} onPlay={handleSelect} onShuffle={handleShuffle} />
        {recentChannels.length > 0 && (
          <ChannelRow title="Continue Watching" channels={recentChannels} onSelect={handleSelect} />
        )}
        {favoriteChannels.length > 0 && (
          <ChannelRow title="Your Favorites" channels={favoriteChannels} onSelect={handleSelect} />
        )}
        {grouped.slice(0, 25).map((group) => (
          <ChannelRow
            key={group.name}
            title={group.name}
            channels={group.channels.slice(0, 20)}
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

        <main className="flex-1 min-w-0 pb-24 lg:pb-10">
          {/* Active player */}
          <AnimatePresence>
            {currentChannel && (
              <div className="px-4 sm:px-6 pt-4">
                <VideoPlayer
                  channel={currentChannel}
                  onClose={() => useAppStore.setState({ currentChannel: null })}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="mt-4">{content}</div>
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
