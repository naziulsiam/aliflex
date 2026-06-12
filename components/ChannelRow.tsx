'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '@/lib/types';
import ChannelCard from './ChannelCard';

interface ChannelRowProps {
  title: string;
  channels: Channel[];
  onSelect: (channel: Channel) => void;
}

export default function ChannelRow({ title, channels, onSelect }: ChannelRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (channels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="relative mb-8">
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-surface hover:bg-surface2 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-surface hover:bg-surface2 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-1"
      >
        {channels.map((channel, idx) => (
          <motion.div
            key={`${channel.id}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
          >
            <ChannelCard channel={channel} onSelect={onSelect} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
