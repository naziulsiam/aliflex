'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import VideoPlayer from './VideoPlayer';

export default function PlayerModal() {
  const modalChannel = useAppStore(s => s.modalChannel);
  const closeModal   = useAppStore(s => s.closeModal);

  /* Escape key */
  useEffect(() => {
    if (!modalChannel) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modalChannel, closeModal]);

  /* Lock body scroll */
  useEffect(() => {
    if (modalChannel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalChannel]);

  return (
    <AnimatePresence>
      {modalChannel && (
        <>
          {/* Backdrop */}
          <motion.div
            key="player-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="player-panel"
            initial={{ opacity: 0, scale: 0.9, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none"
          >
            <div className="w-full max-w-5xl pointer-events-auto">

              {/* Channel header above player */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3 min-w-0">
                  {modalChannel.logo && (
                    <img
                      src={modalChannel.logo}
                      alt=""
                      className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1 flex-shrink-0"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-base truncate leading-tight">{modalChannel.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {modalChannel.group && (
                        <span className="text-xs text-muted truncate">{modalChannel.group}</span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={closeModal}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex-shrink-0 ml-4"
                  aria-label="Close player"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Player */}
              <VideoPlayer channel={modalChannel} onClose={closeModal} />

              {/* Close hint */}
              <p className="text-center text-xs text-muted/50 mt-3">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Esc</kbd> or click outside to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
