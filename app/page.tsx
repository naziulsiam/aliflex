'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Loader2, 
  AlertTriangle, 
  Info, 
  Radio
} from 'lucide-react';

const STREAM_URL = 'http://162.19.255.233:8080/play/UNbAl57p9hXZClOu56FCTf_5weWAERKDgrt9JpvlAiI/m3u8';

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mpegtsLoaded, setMpegtsLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls on mouse/touch inactivity
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    const handleMouseMove = () => resetHideTimer();
    const handleTouchStart = () => resetHideTimer();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [resetHideTimer]);

  // Handle stream loading using mpegts.js
  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !window.mpegts) return;

    setLoading(true);
    setError(null);
    setStatus('connecting');

    // Clean up existing player if any
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error(e);
      }
      playerRef.current = null;
    }

    if (window.mpegts.getFeatureList().mseLivePlayback) {
      try {
        const player = window.mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: STREAM_URL
        }, {
          enableWorker: true,
          enableStashBuffer: false,
          stashInitialSize: 128
        });

        playerRef.current = player;
        player.attachMediaElement(video);
        player.load();

        player.play()
          .then(() => {
            setPlaying(true);
            setLoading(false);
            setStatus('live');
          })
          .catch((err: any) => {
            console.warn('Auto-play blocked or failed:', err);
            // Don't show error immediately as users might need to interact to play
            setLoading(false);
            setStatus('live');
          });

        player.on(window.mpegts.Events.ERROR, (type: string, detail: string, info: any) => {
          console.error('mpegts.js error:', type, detail, info);
          setError('Stream unavailable. Retrying...');
          setStatus('error');
          setLoading(false);
        });

      } catch (err: any) {
        console.error('Failed to create mpegts player:', err);
        setError('Failed to initialize streaming engine.');
        setStatus('error');
        setLoading(false);
      }
    } else {
      // Fallback for Safari/iOS which support native HLS but not MSE
      video.src = STREAM_URL;
      
      const onLoadedMetadata = () => {
        setLoading(false);
        setStatus('live');
        video.play().then(() => setPlaying(true)).catch(() => {});
      };

      const onError = () => {
        setError('Incompatible browser format or stream offline.');
        setStatus('error');
        setLoading(false);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      video.addEventListener('error', onError, { once: true });
    }
  }, []);

  // Handle script load event
  const handleScriptLoad = () => {
    setMpegtsLoaded(true);
    initPlayer();
  };

  // Re-run player initialization if error occurs and user clicks retry
  const handleRetry = () => {
    initPlayer();
  };

  // Control Actions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || !playing) {
      video.play().then(() => {
        setPlaying(true);
      }).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (nextMuted) {
      video.volume = 0;
    } else {
      video.volume = volume || 0.5;
    }
  };

  const handleVolumeChange = (val: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.()
        .then(() => setFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen?.()
        .then(() => setFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white"
    >
      {/* MPEGTS CDN Script */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />

      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black z-0"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 transition-opacity duration-500">
          <div className="text-3xl font-black tracking-widest mb-6">
            ALI<span className="text-red-600">FLIX</span>
          </div>
          <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
          <div className="text-xs uppercase tracking-widest text-zinc-500 animate-pulse">
            Connecting to stream...
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-45 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-bold mb-2">Stream Error</h2>
          <p className="text-sm text-zinc-400 max-w-sm mb-6">{error}</p>
          
          <button
            onClick={handleRetry}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-sm font-semibold transition-colors duration-200"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* UI Controls Overlay */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="w-full px-6 py-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-base font-extrabold tracking-widest">ALIFLIX</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-[10px] font-black tracking-widest text-white shadow-lg shadow-red-600/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full flex flex-col pointer-events-auto">
          <div className="px-6 py-8 flex items-center justify-between bg-gradient-to-t from-black/95 via-black/70 to-transparent gap-4">
            {/* Play & Audio controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-150 backdrop-blur-md border border-white/5"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button 
                  onClick={toggleMute}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-150 backdrop-blur-md border border-white/5"
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 accent-red-600 h-1 rounded-lg bg-white/20 cursor-pointer transition-all duration-200 outline-none"
                  title="Volume"
                />
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  status === 'live' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
                  status === 'error' ? 'bg-red-600 animate-pulse' : 'bg-zinc-500 animate-pulse'
                }`} 
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                {status === 'live' ? 'Connected' : status === 'error' ? 'Connection Error' : 'Connecting...'}
              </span>
            </div>

            {/* Fullscreen control */}
            <div>
              <button 
                onClick={toggleFullscreen}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all duration-150 backdrop-blur-md border border-white/5"
                title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Scrolling Ticker Info Bar */}
          <div className="w-full bg-zinc-950 border-t border-white/5 overflow-hidden z-10 pb-[env(safe-area-inset-bottom)]">
            <div className="w-full h-10 flex items-center">
              <div className="flex-shrink-0 h-full flex items-center gap-1.5 px-4 bg-red-600 text-[10px] font-black tracking-widest uppercase text-white shadow-lg z-20">
                <Info className="w-3.5 h-3.5" />
                INFO
              </div>
              
              <div className="flex-1 overflow-hidden relative h-full flex items-center z-10">
                <div 
                  className="absolute whitespace-nowrap text-xs font-semibold text-zinc-400 tracking-wide uppercase select-none animate-[ticker_30s_linear_infinite]"
                  style={{
                    animationPlayState: 'running'
                  }}
                >
                  ⚽ This site is made by AliSiam — Watch the World Cup 2026 for FREE
                  <span className="text-red-600 mx-6 font-black">|</span>
                  ⚽ This site is made by AliSiam — Watch the World Cup 2026 for FREE
                  <span className="text-red-600 mx-6 font-black">|</span>
                  ⚽ This site is made by AliSiam — Watch the World Cup 2026 for FREE
                  <span className="text-red-600 mx-6 font-black">|</span>
                  ⚽ This site is made by AliSiam — Watch the World Cup 2026 for FREE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline styles for custom animations */}
      <style jsx global>{`
        @keyframes ticker {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
