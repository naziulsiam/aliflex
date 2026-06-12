'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RotateCw, SearchX } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { parseM3U, groupChannels } from '@/lib/m3u';
import { Channel } from '@/lib/types';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import CategoriesDrawer from '@/components/CategoriesDrawer';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryPills from '@/components/CategoryPills';
import ChannelRow from '@/components/ChannelRow';
import ChannelCard from '@/components/ChannelCard';
import SkeletonRow from '@/components/SkeletonRow';
import PlayerModal from '@/components/PlayerModal';

const RAIL_LIMIT     = 20;
const FEATURED_COUNT = 6;

/* Pick N channels with logos from varied groups */
function pickFeatured(channels: Channel[], count: number): Channel[] {
  const withLogo = channels.filter(c => c.logo && c.logo.startsWith('http'));
  if (withLogo.length === 0) return channels.slice(0, count);
  const shuffled = [...withLogo].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* Pick trending: prefer popular-sounding categories, dedupe */
function pickTrending(channels: Channel[], count = 20): Channel[] {
  const popular = channels.filter(c =>
    /news|sport|entertainment|general|hd|movie|tv/i.test(c.group) && c.logo
  );
  const pool = popular.length >= count ? popular : channels.filter(c => c.logo);
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export default function HomePage() {
  const {
    channels, loading, error,
    recentChannels, favorites,
    searchQuery, activeGroup, activeCategory,
    setChannels, setLoading, setError,
    openModal, setActiveCategory,
  } = useAppStore();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [featuredChannels, setFeaturedChannels] = useState<Channel[]>([]);
  const [trendingChannels, setTrendingChannels] = useState<Channel[]>([]);
  const initialized = useRef(false);

  /* ── Fetch playlist ── */
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
          if (parsed.length > 0 && !initialized.current) {
            initialized.current = true;
            setFeaturedChannels(pickFeatured(parsed, FEATURED_COUNT));
            setTrendingChannels(pickTrending(parsed));
          }
        }
      } catch {
        if (!cancelled) setError('Could not load channels. Please check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [setChannels, setLoading, setError]);

  /* ── Derived data ── */
  const grouped    = useMemo(() => groupChannels(channels), [channels]);
  const groupNames = useMemo(() => grouped.map(g => g.name), [grouped]);

  const favoriteChannels = useMemo(
    () => channels.filter(c => favorites.includes(c.id)),
    [channels, favorites]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return channels.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    ).slice(0, 80);
  }, [channels, searchQuery]);

  /* ── Category-filtered rows ── */
  const filteredGroups = useMemo(() => {
    if (!activeCategory) return grouped;
    return grouped.filter(g =>
      g.name.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [grouped, activeCategory]);

  const handleSelect = (channel: Channel) => openModal(channel);

  /* ── Category pill names (simplified, trimmed) ── */
  const pillCategories = useMemo(() => {
    const names = groupNames.map(n => n.split(';')[0].trim());
    return Array.from(new Set(names)).filter(Boolean);
  }, [groupNames]);

  /* ─────────────────────────────────────────
     Loading skeleton
  ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onOpenCategories={() => setCategoriesOpen(true)} />
        <main className="flex-1 pb-24 lg:pb-10">
          {/* Hero skeleton */}
          <div className="shimmer-bg mb-0" style={{ height: 'clamp(300px, 62vh, 580px)' }} />
          {/* Pills skeleton */}
          <div className="h-12 bg-background/96 border-b border-border/40 mb-6 flex items-center gap-2 px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 rounded-full shimmer-bg flex-shrink-0" style={{ width: 64 + i * 8 }} />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cardCount={8} />)}
        </main>
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface/96 border-t border-border/60 lg:hidden" />
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Error state
  ───────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onOpenCategories={() => setCategoriesOpen(true)} />
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
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-sm font-bold"
          >
            <RotateCw className="w-4 h-4" /> Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Main content regions
  ───────────────────────────────────────── */

  /* Search results */
  let mainContent: React.ReactNode;

  if (searchResults !== null) {
    mainContent = (
      <div className="px-4 sm:px-6 py-4">
        <h2 className="text-base sm:text-xl font-bold mb-4">
          {searchResults.length > 0
            ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `No results for "${searchQuery}"`}
        </h2>
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SearchX className="w-14 h-14 text-muted/25 mb-4" />
            <p className="font-semibold mb-1">No channels found</p>
            <p className="text-sm text-muted">Try a different search term or browse by category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {searchResults.map((ch, idx) => (
              <motion.div
                key={`${ch.id}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.35) }}
              >
                <ChannelCard channel={ch} onSelect={handleSelect} index={idx} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* My List view */
  else if (activeGroup === '__favorites') {
    mainContent = (
      <div className="px-4 sm:px-6 py-4">
        <h2 className="text-base sm:text-xl font-bold mb-4">My List</h2>
        {favoriteChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4 text-3xl">♡</div>
            <p className="font-semibold mb-1">No favorites yet</p>
            <p className="text-sm text-muted">Tap the heart icon on any channel card to save it here.</p>
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

  /* Continue Watching view */
  else if (activeGroup === '__recent') {
    mainContent = (
      <div className="px-4 sm:px-6 py-4">
        <h2 className="text-base sm:text-xl font-bold mb-4">Continue Watching</h2>
        {recentChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4 text-3xl">▷</div>
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

  /* Single category view */
  else if (activeGroup && activeGroup !== '__favorites' && activeGroup !== '__recent') {
    const group = grouped.find(g => g.name === activeGroup);
    mainContent = (
      <div className="px-4 sm:px-6 py-4">
        <h2 className="text-base sm:text-xl font-bold mb-4">{activeGroup}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {(group?.channels ?? []).map((ch, idx) => (
            <ChannelCard key={`${ch.id}-${idx}`} channel={ch} onSelect={handleSelect} index={idx} />
          ))}
        </div>
      </div>
    );
  }

  /* ── HOME browse ── */
  else {
    mainContent = (
      <>
        {/* Hero carousel */}
        <HeroCarousel channels={featuredChannels} onPlay={handleSelect} />

        {/* Category pills */}
        <CategoryPills categories={pillCategories} />

        <div className="mt-4">
          {/* Continue Watching */}
          {recentChannels.length > 0 && (
            <ChannelRow title="Continue Watching" channels={recentChannels} onSelect={handleSelect} />
          )}

          {/* My List */}
          {favoriteChannels.length > 0 && (
            <ChannelRow title="My List" channels={favoriteChannels} onSelect={handleSelect} />
          )}

          {/* Trending Now */}
          {trendingChannels.length > 0 && (
            <ChannelRow title="Trending Now 🔥" channels={trendingChannels} onSelect={handleSelect} />
          )}

          {/* Dynamic category rows — filtered by active pill */}
          {filteredGroups.map(group => (
            <ChannelRow
              key={group.name}
              title={group.name}
              channels={group.channels.slice(0, RAIL_LIMIT)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenCategories={() => setCategoriesOpen(true)} />

      <main className="flex-1 min-w-0 pb-24 lg:pb-10 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup ?? (activeCategory ?? 'home')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {mainContent}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileNav
        onOpenCategories={() => setCategoriesOpen(true)}
        onOpenSearch={() => {
          /* trigger mobile search via Header's internal state — use custom event */
          window.dispatchEvent(new CustomEvent('aliflex:open-search'));
        }}
      />

      <CategoriesDrawer
        groups={groupNames}
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />

      {/* Global player modal */}
      <PlayerModal />
    </div>
  );
}
