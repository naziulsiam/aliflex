'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  X, RotateCw, AlertTriangle, Loader2, PictureInPicture2,
} from 'lucide-react';
import { Channel } from '@/lib/types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

export default function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const hlsRef        = useRef<Hls | null>(null);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying]           = useState(true);
  const [muted, setMuted]               = useState(false);
  const [volume, setVolume]             = useState(1);
  const [fullscreen, setFullscreen]     = useState(false);
  const [pip, setPip]                   = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [retryCount, setRetryCount]     = useState(0);
  const [flashPlay, setFlashPlay]       = useState<boolean | null>(null);

  /* ─── Stream loader ─────────────────────────────────────────── */
  const loadStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setLoading(true);
    setError(null);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    video.removeAttribute('src');

    const url   = channel.url;
    const isHls = /\.m3u8|m3u8/i.test(url);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 60 });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => setPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          setError('Stream unavailable. Try another channel or retry.');
          setLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => setPlaying(false));
      }, { once: true });
      video.addEventListener('error', () => {
        setError('Unable to load this channel.');
        setLoading(false);
      }, { once: true });
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => {
        setLoading(false);
        video.play().catch(() => setPlaying(false));
      }, { once: true });
      video.addEventListener('error', () => {
        setError('This stream format is not supported.');
        setLoading(false);
      }, { once: true });
    }
  }, [channel.url]);

  useEffect(() => {
    loadStream();
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, retryCount]);

  /* ─── Auto-hide controls ─────────────────────────────────────── */
  const resetTimer = useCallback(() => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetTimer();
    const el = containerRef.current;
    el?.addEventListener('mousemove', resetTimer);
    el?.addEventListener('touchstart', resetTimer, { passive: true });
    return () => {
      el?.removeEventListener('mousemove', resetTimer);
      el?.removeEventListener('touchstart', resetTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  /* ─── Fullscreen listener ──────────────────────────────────── */
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  /* ─── PiP listeners ───────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setPip(true);
    const onLeave = () => setPip(false);
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  /* ─── Keyboard shortcuts ──────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case ' ': e.preventDefault(); doTogglePlay(); break;
        case 'm': case 'M': doToggleMute(); break;
        case 'f': case 'F': doToggleFullscreen(); break;
        case 'Escape': if (!document.fullscreenElement) onClose(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Actions ─────────────────────────────────────────────── */
  const doTogglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); setFlashPlay(true); }
    else          { v.pause(); setPlaying(false); setFlashPlay(false); }
    setTimeout(() => setFlashPlay(null), 700);
  };

  const doToggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted  = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const doToggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const doTogglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if ((document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled)
        await v.requestPictureInPicture();
    } catch { /* ignore */ }
  };

  const pipSupported =
    typeof document !== 'undefined' &&
    !!(document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled;

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black cursor-pointer"
        playsInline
        autoPlay
        onClick={doTogglePlay}
      />

      {/* ── Loading overlay ── */}
      <AnimatePresence>
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-none"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <p className="mt-3 text-sm text-muted">Tuning in to {channel.name}…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error overlay ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-text mb-1">{channel.name}</p>
            <p className="text-sm text-muted mb-5">{error}</p>
            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
              onClick={() => setRetryCount(c => c + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-sm font-bold transition-colors"
            >
              <RotateCw className="w-4 h-4" /> Retry
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Click-flash icon ── */}
      <AnimatePresence>
        {flashPlay !== null && (
          <motion.div
            key={String(flashPlay)}
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="p-5 rounded-full bg-black/50">
              {flashPlay
                ? <Play  className="w-10 h-10 fill-white text-white" />
                : <Pause className="w-10 h-10 fill-white text-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls overlay ── */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-between"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-4 pb-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3 min-w-0">
                {channel.logo && (
                  <img
                    src={channel.logo} alt=""
                    className="w-9 h-9 object-contain rounded-md bg-white/10 p-1 flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate leading-tight">{channel.name}</p>
                  <p className="text-xs text-muted/80 truncate">{channel.group}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0 ml-3"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 pb-3 sm:pb-4 pt-10 bg-gradient-to-t from-black/80 to-transparent">
              {/* Play / Pause */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={doTogglePlay}
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing
                  ? <Pause className="w-5 h-5" />
                  : <Play  className="w-5 h-5 fill-white" />}
              </motion.button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={doToggleMute}
                  className="p-2 rounded-full hover:bg-white/15 transition-colors"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0
                    ? <VolumeX className="w-5 h-5" />
                    : <Volume2 className="w-5 h-5" />}
                </motion.button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={e => handleVolume(Number(e.target.value))}
                  className="w-0 group-hover/vol:w-20 transition-[width] duration-300 accent-primary cursor-pointer overflow-hidden h-1"
                  aria-label="Volume"
                />
              </div>

              {/* LIVE badge */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-extrabold tracking-widest text-primary">LIVE</span>
              </div>

              <div className="flex-1" />

              {/* PiP */}
              {pipSupported && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={doTogglePiP}
                  className={`hidden sm:flex p-2 rounded-full hover:bg-white/15 transition-colors ${pip ? 'text-primary' : ''}`}
                  aria-label="Picture in Picture"
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </motion.button>
              )}

              {/* Fullscreen */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={doToggleFullscreen}
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
                aria-label="Toggle fullscreen"
              >
                {fullscreen
                  ? <Minimize className="w-5 h-5" />
                  : <Maximize className="w-5 h-5" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
