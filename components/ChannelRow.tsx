'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Channel } from '@/lib/types';
import ChannelCard from './ChannelCard';

interface ChannelRowProps {
  title: string;
  channels: Channel[];
  onSelect: (channel: Channel) => void;
}

export default function ChannelRow({ title, channels, onSelect }: ChannelRowProps) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLElement>(null);
  const [rowHovered, setRowHovered] = useState(false);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [visible,  setVisible]  = useState(false);

  /* ── IntersectionObserver for lazy entrance ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── Update arrow visibility on scroll ── */
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -(el.clientWidth * 0.75) : el.clientWidth * 0.75, behavior: 'smooth' });
    setTimeout(updateArrows, 350);
  };

  if (channels.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative mb-6 sm:mb-8 group/row"
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
    >
      {/* ── Row title ── */}
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
        <h2 className="text-base sm:text-xl font-bold tracking-tight">{title}</h2>
        <span className="hidden sm:block text-xs text-muted font-medium">
          {channels.length} channel{channels.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Scroll container + edge chevrons ── */}
      <div className="relative">
        {/* Left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className={`absolute left-0 top-0 bottom-0 z-10 hidden sm:flex items-center justify-center w-12 transition-opacity duration-200
              bg-gradient-to-r from-background to-transparent
              ${rowHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="p-2 rounded-full bg-surface2/80 hover:bg-surface3 backdrop-blur-sm transition-colors shadow-lg">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Right arrow */}
        {canRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className={`absolute right-0 top-0 bottom-0 z-10 hidden sm:flex items-center justify-center w-12 transition-opacity duration-200
              bg-gradient-to-l from-background to-transparent
              ${rowHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="p-2 rounded-full bg-surface2/80 hover:bg-surface3 backdrop-blur-sm transition-colors shadow-lg">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Rail */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2"
        >
          {visible
            ? channels.map((channel, idx) => (
                <ChannelCard
                  key={`${channel.id}-${idx}`}
                  channel={channel}
                  onSelect={onSelect}
                  index={idx}
                />
              ))
            : /* placeholder before visible */
              Array.from({ length: Math.min(channels.length, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[152px] sm:w-[168px]"
                >
                  <div className="w-full aspect-video rounded-xl shimmer-bg mb-2" />
                  <div className="h-3 w-3/4 rounded shimmer-bg mb-1.5" />
                  <div className="h-2.5 w-1/2 rounded shimmer-bg" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
