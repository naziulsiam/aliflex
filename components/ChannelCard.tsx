'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Heart, Play } from 'lucide-react';
import { Channel } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface ChannelCardProps {
  channel: Channel;
  onSelect: (channel: Channel) => void;
  index?: number;
}

export default function ChannelCard({ channel, onSelect, index = 0 }: ChannelCardProps) {
  const favorites      = useAppStore(s => s.favorites);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const isFavorite     = favorites.includes(channel.id);
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered]     = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
      className="flex-shrink-0 w-[152px] sm:w-[168px] cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(channel)}
    >
      <motion.div
        animate={hovered
          ? { scale: 1.06, zIndex: 10 }
          : { scale: 1.0,  zIndex: 1  }}
        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
        className="relative rounded-xl overflow-hidden bg-surface border border-border"
        style={hovered ? { boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(229,9,20,0.45)' } : {}}
      >
        {/* ── Thumbnail ── */}
        <div className="relative w-full aspect-video bg-surface2 flex items-center justify-center overflow-hidden border-b border-border/20">
          {channel.logo && !imgFailed ? (
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              className="w-full h-full object-contain p-3.5 transition-transform duration-500"
              style={hovered ? { transform: 'scale(1.06)' } : {}}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface3 to-surface2 p-3 text-center select-none">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-1 text-primary shadow-inner">
                <Tv className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-extrabold text-text/90 line-clamp-2 px-1 leading-snug">
                {channel.name}
              </span>
            </div>
          )}

          {/* ── Hover overlay ── */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40"
                >
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Favorite button ── */}
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(channel.id); }}
            className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isFavorite
                ? 'bg-primary/80 opacity-100'
                : 'bg-black/60 opacity-0 group-hover:opacity-100'
            } ${hovered ? 'opacity-100' : ''}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorite ? 'fill-white text-white' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* ── Info strip ── */}
        <div className="px-2.5 py-2">
          <p className="text-[13px] font-semibold truncate leading-tight">{channel.name}</p>
          <p className="text-[11px] text-muted truncate mt-0.5">{channel.country || channel.group}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
