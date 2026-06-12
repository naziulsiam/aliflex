'use client';

import { motion } from 'framer-motion';
import { Tv, Heart } from 'lucide-react';
import { Channel } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface ChannelCardProps {
  channel: Channel;
  onSelect: (channel: Channel) => void;
}

export default function ChannelCard({ channel, onSelect }: ChannelCardProps) {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = favorites.includes(channel.id);

  return (
    <motion.button
      onClick={() => onSelect(channel)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="relative flex-shrink-0 w-40 sm:w-44 rounded-lg overflow-hidden bg-surface border border-border text-left group"
    >
      <div className="relative w-full aspect-video bg-surface2 flex items-center justify-center overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            loading="lazy"
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${channel.logo ? 'hidden' : ''} flex flex-col items-center justify-center text-muted`}>
          <Tv className="w-8 h-8" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Toggle favorite"
        >
          <Heart
            className={`w-3.5 h-3.5 ${isFavorite ? 'fill-primary text-primary' : 'text-white'}`}
          />
        </button>

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
      </div>

      <div className="p-2.5">
        <p className="text-sm font-medium truncate">{channel.name}</p>
        <p className="text-xs text-muted truncate mt-0.5">{channel.country || channel.group}</p>
      </div>
    </motion.button>
  );
}
