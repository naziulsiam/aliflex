'use client';

import { motion } from 'framer-motion';
import { Play, Shuffle } from 'lucide-react';
import { Channel } from '@/lib/types';

interface HeroProps {
  channel: Channel | null;
  onPlay: (channel: Channel) => void;
  onShuffle: () => void;
}

export default function Hero({ channel, onPlay, onShuffle }: HeroProps) {
  if (!channel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full h-[40vh] sm:h-[48vh] rounded-xl overflow-hidden mb-8 mx-4 sm:mx-6 mt-2"
      style={{ width: 'calc(100% - 2rem)' }}
    >
      <div className="absolute inset-0 bg-surface flex items-center justify-center">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt=""
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      <div className="absolute bottom-0 left-0 p-5 sm:p-8 max-w-lg">
        {channel.logo && (
          <motion.img
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            src={channel.logo}
            alt={channel.name}
            className="h-12 sm:h-16 object-contain mb-3 bg-white/5 rounded p-2"
          />
        )}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-2xl sm:text-3xl font-bold mb-1 truncate"
        >
          {channel.name}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-muted mb-4"
        >
          {channel.group} {channel.country ? `• ${channel.country}` : ''}
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => onPlay(channel)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 font-semibold text-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch Now
          </button>
          <button
            onClick={onShuffle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold text-sm transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
