'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tv2, ArrowLeft, Heart, LayoutGrid, ListPlus } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface HeaderProps {
  onOpenCategories?: () => void;
  onOpenPlaylistManager?: () => void;
}

const NAV_LINKS = [
  { label: 'Home',       action: 'home' },
  { label: 'Live TV',    action: 'home' },
  { label: 'Categories', action: 'categories' },
  { label: 'Favorites',  action: 'favorites' },
  { label: 'Manage Streams', action: 'playlist-manager' },
] as const;

export default function Header({ onOpenCategories, onOpenPlaylistManager }: HeaderProps) {
  const searchQuery      = useAppStore(s => s.searchQuery);
  const setSearchQuery   = useAppStore(s => s.setSearchQuery);
  const activeGroup      = useAppStore(s => s.activeGroup);
  const setActiveGroup   = useAppStore(s => s.setActiveGroup);
  const setActiveCategory = useAppStore(s => s.setActiveCategory);

  const [scrolled,      setScrolled]      = useState(false);
  const [mobileSearch,  setMobileSearch]  = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Listen for mobile search open event from MobileNav */
  useEffect(() => {
    const h = () => setMobileSearch(true);
    window.addEventListener('aliflex:open-search', h);
    return () => window.removeEventListener('aliflex:open-search', h);
  }, []);

  useEffect(() => {
    if (mobileSearch) setTimeout(() => mobileInputRef.current?.focus(), 100);
  }, [mobileSearch]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobileSearch(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeMobileSearch = () => {
    setMobileSearch(false);
    setSearchQuery('');
  };

  const handleNav = (action: string) => {
    setActiveCategory(null);
    if (action === 'home') {
      setActiveGroup(null);
    } else if (action === 'categories') {
      onOpenCategories?.();
    } else if (action === 'favorites') {
      setActiveGroup('__favorites');
    } else if (action === 'playlist-manager') {
      onOpenPlaylistManager?.();
    }
  };

  const isNavActive = (action: string) => {
    if (action === 'home')      return activeGroup === null;
    if (action === 'favorites') return activeGroup === '__favorites';
    return false;
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`sticky top-0 z-40 flex items-center gap-4 px-4 sm:px-6 py-3 transition-all duration-300 ${
          scrolled
            ? 'bg-background/96 backdrop-blur-xl border-b border-border/60 shadow-md shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        {/* ── Brand ── */}
        <motion.div
          className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer select-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setActiveGroup(null); setActiveCategory(null); }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-md shadow-primary/40">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">AliFlex</span>
        </motion.div>

        {/* ── Center nav links (desktop) ── */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(link => {
            const active = isNavActive(link.action);
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.action)}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'text-white' : 'text-muted hover:text-text'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="header-nav-active"
                    className="absolute inset-0 rounded-lg bg-surface2"
                    transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right: desktop search ── */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          {/* Favorites shortcut (desktop, medium screens) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setActiveGroup('__favorites'); setActiveCategory(null); }}
            className="hidden md:flex p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="My List"
          >
            <Heart className={`w-5 h-5 ${activeGroup === '__favorites' ? 'fill-primary text-primary' : 'text-muted'}`} />
          </motion.button>

          {/* Playlist Manager shortcut (desktop) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenPlaylistManager}
            className="flex p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Manage Playlists"
          >
            <ListPlus className="w-5 h-5 text-muted hover:text-text" />
          </motion.button>

          {/* Search bar */}
          <div className="relative w-56 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search channels…"
              className="w-full bg-surface/80 border border-border hover:border-border/80 rounded-full pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-primary/50 focus:bg-surface transition-all placeholder:text-muted"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile right icons ── */}
        <div className="flex sm:hidden items-center gap-1 ml-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileSearch(true)}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenPlaylistManager}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Manage Playlists"
          >
            <ListPlus className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenCategories?.()}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Categories"
          >
            <LayoutGrid className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      {/* ── Mobile fullscreen search overlay ── */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col sm:hidden"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeMobileSearch}
                className="p-2 -ml-1 rounded-full hover:bg-surface transition-colors"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search channels, countries…"
                  className="w-full bg-surface border border-border rounded-full pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {!searchQuery ? (
              <div className="flex-1 flex items-center justify-center text-center px-8">
                <div>
                  <Search className="w-12 h-12 text-muted/25 mx-auto mb-3" />
                  <p className="text-sm text-muted">Search live channels,<br />categories or countries</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-start justify-center pt-10">
                <p className="text-sm text-muted animate-pulse">Searching for &ldquo;{searchQuery}&rdquo;…</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
