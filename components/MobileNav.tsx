'use client';

import { motion } from 'framer-motion';
import { Home, Search, Heart, Grid3x3, ListPlus } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface MobileNavProps {
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onOpenPlaylistManager: () => void;
}

const ITEMS = [
  { icon: Home,     label: 'Home',       value: null as string | null, action: 'home' },
  { icon: Search,   label: 'Search',     value: '__search',            action: 'search' },
  { icon: Heart,    label: 'Favorites',  value: '__favorites',         action: 'favorites' },
  { icon: Grid3x3,  label: 'Categories', value: '__categories',        action: 'categories' },
  { icon: ListPlus, label: 'Playlists',  value: '__playlists',         action: 'playlist-manager' },
] as const;

export default function MobileNav({ onOpenCategories, onOpenSearch, onOpenPlaylistManager }: MobileNavProps) {
  const activeGroup      = useAppStore(s => s.activeGroup);
  const setActiveGroup   = useAppStore(s => s.setActiveGroup);
  const setActiveCategory = useAppStore(s => s.setActiveCategory);

  const handleClick = (action: string, value: string | null) => {
    if (action === 'search')     { onOpenSearch(); return; }
    if (action === 'categories') { onOpenCategories(); return; }
    if (action === 'playlist-manager') { onOpenPlaylistManager(); return; }
    setActiveGroup(value);
    setActiveCategory(null);
  };

  const isActive = (action: string, value: string | null) => {
    if (action === 'search' || action === 'categories' || action === 'playlist-manager') return false;
    return activeGroup === value;
  };

  return (
    <motion.nav
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden items-center bg-surface/96 backdrop-blur-xl border-t border-border/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {ITEMS.map(item => {
        const active = isActive(item.action, item.value);
        return (
          <button
            key={item.label}
            onClick={() => handleClick(item.action, item.value)}
            className="relative flex flex-col items-center gap-1 flex-1 pt-2.5 pb-1 min-h-[56px] transition-colors"
            aria-label={item.label}
          >
            {active && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute top-1 left-3 right-3 h-8 rounded-full bg-primary/15"
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}
            <item.icon
              className={`w-5 h-5 relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
            />
            <span className={`text-[10px] font-semibold relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
