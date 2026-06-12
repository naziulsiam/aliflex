'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';

interface CategoryPillsProps {
  categories: string[];
}

const MAX_PILLS = 18;

export default function CategoryPills({ categories }: CategoryPillsProps) {
  const activeCategory    = useAppStore(s => s.activeCategory);
  const setActiveCategory = useAppStore(s => s.setActiveCategory);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Build pill list: 'All' + deduplicated top categories */
  const pills = ['All', ...Array.from(new Set(categories)).slice(0, MAX_PILLS)];

  return (
    <div className="sticky top-[52px] sm:top-[56px] z-30 bg-background/96 backdrop-blur-xl border-b border-border/50">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-hide"
      >
        {pills.map(pill => {
          const isActive =
            pill === 'All' ? activeCategory === null : activeCategory === pill;

          return (
            <button
              key={pill}
              onClick={() => setActiveCategory(pill === 'All' ? null : pill)}
              className={`relative flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold
                transition-colors duration-150 min-h-[36px]
                ${isActive ? 'text-white' : 'text-muted hover:text-text bg-surface hover:bg-surface2 border border-border/60'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="category-pill-active"
                  className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/25"
                  transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{pill}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
