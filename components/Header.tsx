'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tv2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function Header() {
  const searchQuery    = useAppStore(s => s.searchQuery);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const [scrolled, setScrolled]       = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Focus mobile input when overlay opens */
  useEffect(() => {
    if (mobileSearch) setTimeout(() => mobileInputRef.current?.focus(), 100);
  }, [mobileSearch]);

  /* Close overlay on Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileSearch(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const closeMobileSearch = () => {
    setMobileSearch(false);
    setSearchQuery('');
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`sticky top-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 transition-all duration-300 ${
          scrolled
            ? 'bg-background/96 backdrop-blur-xl border-b border-border/60 shadow-md shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        {/* Brand */}
        <motion.div
          className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer select-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => useAppStore.getState().setActiveGroup(null)}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-md shadow-primary/40">
            <Tv2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">AliFlex</span>
        </motion.div>

        {/* Desktop search bar */}
        <div className="hidden sm:flex flex-1 max-w-sm ml-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search channels, countries, categories…"
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

        {/* Mobile search icon */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileSearch(true)}
          className="sm:hidden p-2 rounded-full hover:bg-surface transition-colors"
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </motion.button>
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
            {/* Top bar */}
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
                  placeholder="Search channels…"
                  className="w-full bg-surface border border-border rounded-full pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-label="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Hint */}
            {!searchQuery && (
              <div className="flex-1 flex items-center justify-center text-center px-8">
                <div>
                  <Search className="w-12 h-12 text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-muted">Search for live channels,<br />categories or countries</p>
                </div>
              </div>
            )}

            {/* When user types, results appear below via page.tsx — overlay stays on top */}
            {searchQuery && (
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
