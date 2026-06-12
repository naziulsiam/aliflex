'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, LayoutGrid } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface CategoriesDrawerProps {
  groups: string[];
  open: boolean;
  onClose: () => void;
}

export default function CategoriesDrawer({ groups, open, onClose }: CategoriesDrawerProps) {
  const setActiveGroup = useAppStore(s => s.setActiveGroup);

  const handleSelect = (group: string) => {
    setActiveGroup(group);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl max-h-[78vh] flex flex-col lg:hidden shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold">Categories</h3>
                <span className="text-xs text-muted font-medium ml-1">({groups.length})</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface2 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto flex-1 p-4 pb-8 grid grid-cols-2 gap-2.5">
              {groups.map((group) => (
                <motion.button
                  key={group}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelect(group)}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-surface2 hover:bg-surface3 active:bg-surface3 transition-colors text-sm font-medium text-left min-h-[48px]"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tv className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="truncate leading-tight">{group}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
