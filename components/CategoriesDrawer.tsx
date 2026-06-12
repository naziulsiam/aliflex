'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface CategoriesDrawerProps {
  groups: string[];
  open: boolean;
  onClose: () => void;
}

export default function CategoriesDrawer({ groups, open, onClose }: CategoriesDrawerProps) {
  const setActiveGroup = useAppStore((s) => s.setActiveGroup);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl max-h-[75vh] overflow-y-auto lg:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface">
              <h3 className="text-base font-semibold">Categories</h3>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 pb-8">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => {
                    setActiveGroup(group);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface2 hover:bg-border transition-colors text-sm font-medium text-left"
                >
                  <Tv className="w-4 h-4 flex-shrink-0 text-muted" />
                  <span className="truncate">{group}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
