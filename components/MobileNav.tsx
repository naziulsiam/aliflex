'use client';

import { motion } from 'framer-motion';
import { Home, Heart, Clock, Grid3x3 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface MobileNavProps {
  onOpenCategories: () => void;
}

export default function MobileNav({ onOpenCategories }: MobileNavProps) {
  const activeGroup = useAppStore((s) => s.activeGroup);
  const setActiveGroup = useAppStore((s) => s.setActiveGroup);

  const items = [
    { icon: Home, label: 'Home', value: null, onClick: () => setActiveGroup(null) },
    { icon: Heart, label: 'Favorites', value: '__favorites', onClick: () => setActiveGroup('__favorites') },
    { icon: Clock, label: 'Recent', value: '__recent', onClick: () => setActiveGroup('__recent') },
    { icon: Grid3x3, label: 'Categories', value: '__categories', onClick: onOpenCategories },
  ];

  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden items-center justify-around bg-surface/95 backdrop-blur-md border-t border-border py-2 px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {items.map((item) => {
        const isActive = item.value === '__categories' ? false : activeGroup === item.value;
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              isActive ? 'text-primary' : 'text-muted'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </motion.nav>
  );
}
