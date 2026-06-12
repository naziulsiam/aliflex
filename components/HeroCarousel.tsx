'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { Channel } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface HeroCarouselProps {
  channels: Channel[];
  onPlay: (channel: Channel) => void;
}

const ADVANCE_MS = 7000;

export default function HeroCarousel({ channels, onPlay }: HeroCarouselProps) {
  const [index,  setIndex]  = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgErr, setImgErr] = useState<Record<string, boolean>>({});
  const touchStartX = useRef(0);

  const favorites      = useAppStore(s => s.favorites);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);

  const count   = channels.length;
  const channel = channels[index] ?? null;

  const goNext = useCallback(() => setIndex(i => (i + 1) % count), [count]);
  const goPrev = useCallback(() => setIndex(i => (i - 1 + count) % count), [count]);

  /* ── Auto-advance ── */
  useEffect(() => {
    if (paused || count === 0) return;
    const t = setInterval(goNext, ADVANCE_MS);
    return () => clearInterval(t);
  }, [paused, goNext, count]);

  /* ── Touch swipe ── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 44) diff > 0 ? goNext() : goPrev();
    setPaused(false);
  };

  if (!channel) return null;

  const isFav    = favorites.includes(channel.id);
  const hasBg    = channel.logo && !imgErr[channel.id];
  const kenClass = index % 2 === 0 ? 'animate-kenburns-1' : 'animate-kenburns-2';

  return (
    <div
      className="relative w-full overflow-hidden group/carousel select-none"
      style={{ height: 'clamp(300px, 62vh, 580px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background per slide ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${channel.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 bg-surface overflow-hidden"
        >
          {hasBg ? (
            <img
              src={channel.logo}
              alt=""
              className={`w-full h-full object-cover opacity-25 blur-lg ${kenClass}`}
              onError={() => setImgErr(p => ({ ...p, [channel.id]: true }))}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface2 to-surface" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Scrims ── */}
      <div className="absolute inset-0 bg-hero-scrim pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/75 via-background/20 to-transparent pointer-events-none" />

      {/* ── Slide content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${channel.id}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 px-5 sm:px-10 pb-16 sm:pb-20 max-w-xl z-10"
        >
          {/* Logo */}
          {hasBg && (
            <img
              src={channel.logo}
              alt={channel.name}
              className="h-9 sm:h-12 object-contain rounded mb-3 drop-shadow-xl"
              onError={() => setImgErr(p => ({ ...p, [channel.id]: true }))}
            />
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-xl mb-2 line-clamp-2">
            {channel.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {channel.group && (
              <span className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold border border-white/10 text-text/90">
                {channel.group}
              </span>
            )}
            {channel.country && (
              <span className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold border border-white/10 text-text/80">
                {channel.country.toUpperCase()}
              </span>
            )}
            {channel.languages?.[0] && (
              <span className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold border border-white/10 text-muted">
                {channel.languages[0]}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPlay(channel)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 font-bold text-sm sm:text-base shadow-xl shadow-primary/25 transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Now
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFavorite(channel.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm backdrop-blur-sm border transition-colors ${
                isFav
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-white/10 border-white/15 hover:bg-white/20 text-text'
              }`}
            >
              {isFav
                ? <><Check className="w-4 h-4" /> Saved</>
                : <><Plus className="w-4 h-4" /> My List</>}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Prev / Next arrows ── */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={goPrev}
        aria-label="Previous channel"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex
          opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200
          p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={goNext}
        aria-label="Next channel"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex
          opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200
          p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
      >
        <ChevronRight className="w-6 h-6" />
      </motion.button>

      {/* ── Progress dots ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {channels.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIndex(i); setPaused(true); }}
            aria-label={`Slide ${i + 1}`}
            className="relative rounded-full overflow-hidden transition-all duration-300 bg-white/25"
            style={{ width: i === index ? 28 : 8, height: 4 }}
          >
            {i === index && (
              <motion.div
                layoutId="carousel-dot-active"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Slide counter (desktop) ── */}
      <div className="absolute top-4 right-5 z-20 text-xs font-bold text-white/40 hidden sm:block tabular-nums">
        {index + 1} / {count}
      </div>

      {/* ── Progress bar ── */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
          <motion.div
            key={`progress-${index}`}
            className="h-full bg-primary/70"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: ADVANCE_MS / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
