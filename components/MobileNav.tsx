'use client';

import { motion } from 'framer-motion';
import { Home, Heart, Clock, Grid3x3 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface MobileNavProps {
  onOpenCategories: () => void;
}

const ITEMS = [
  { icon: Home,     label: 'Home',       value: null as string | null },
  { icon: Heart,    label: 'My List',    value: '__favorites' },
  { icon: Clock,    label: 'Recent',     value: '__recent' },
  { icon: Grid3x3,  label: 'Categories', value: '__categories' },
] as const;

export default function MobileNav({ onOpenCategories }: MobileNavProps) {
  const activeGroup    = useAppStore(s => s.activeGroup);
  const setActiveGroup = useAppStore(s => s.setActiveGroup);

  const handleClick = (value: string | null) => {
    if (value === '__categories') { onOpenCategories(); return; }
    setActiveGroup(value);
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
        const isActive =
          item.value !== '__categories' && activeGroup === item.value;

        return (
          <button
            key={item.label}
            onClick={() => handleClick(item.value)}
            className="relative flex flex-col items-center gap-1 flex-1 pt-2.5 pb-1 min-h-[56px] transition-colors"
            aria-label={item.label}
          >
            {/* Animated pill background */}
            {isActive && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute top-1 left-3 right-3 h-8 rounded-full bg-primary/15"
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}

            <item.icon
              className={`w-5 h-5 relative z-10 transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            />
            <span
              className={`text-[10px] font-semibold relative z-10 transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
