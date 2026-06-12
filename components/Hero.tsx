'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Shuffle, Info } from 'lucide-react';
import { Channel } from '@/lib/types';

interface HeroProps {
  channel: Channel | null;
  onPlay: (channel: Channel) => void;
  onShuffle: () => void;
}

export default function Hero({ channel, onPlay, onShuffle }: HeroProps) {
  const [imgError, setImgError] = useState(false);

  if (!channel) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={channel.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full overflow-hidden mb-8"
        style={{ height: 'clamp(280px, 48vh, 520px)' }}
        aria-label={`Featured channel: ${channel.name}`}
      >
        {/* ── Ken Burns background ── */}
        <div className="absolute inset-0 bg-surface overflow-hidden">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt=""
              onError={() => setImgError(true)}
              className="w-full h-full object-cover opacity-25 blur-md animate-kenburns-1"
              style={{ transformOrigin: 'center center' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface2 to-surface" />
          )}
        </div>

        {/* ── Bottom scrim for text legibility ── */}
        <div className="absolute inset-0 bg-hero-scrim" />
        {/* ── Side fade ── */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

        {/* ── Content ── */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-7 sm:pb-10 max-w-2xl">
          {/* Logo */}
          {channel.logo && !imgError && (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-3"
            >
              <img
                src={channel.logo}
                alt={channel.name}
                className="h-10 sm:h-14 object-contain rounded-md"
                style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.8))' }}
              />
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-4xl font-black tracking-tight mb-2 drop-shadow-lg line-clamp-2"
          >
            {channel.name}
          </motion.h1>

          {/* Tags */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap items-center gap-2 mb-5"
          >
            {channel.group && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-text/90 border border-white/10">
                {channel.group}
              </span>
            )}
            {channel.country && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-text/90 border border-white/10">
                {channel.country.toUpperCase()}
              </span>
            )}
            {channel.languages?.[0] && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-muted border border-white/10">
                {channel.languages[0]}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-primary font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              LIVE
            </span>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPlay(channel)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-primary hover:bg-primary/90 font-bold text-sm sm:text-base text-white transition-colors shadow-lg shadow-primary/30"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Now
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onShuffle}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm font-bold text-sm sm:text-base transition-colors border border-white/15"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors border border-white/15"
              aria-label="More info"
            >
              <Info className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
