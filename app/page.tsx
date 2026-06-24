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

const DIRECT_STREAM_URL = 'http://162.19.255.233:8080/play/UNbAl57p9hXZClOu56FCTf_5weWAERKDgrt9JpvlAiI/m3u8';

interface StreamChannel {
  name: string;
  url: string;
}

const CHANNELS: StreamChannel[] = [
  {
    name: 'Fox Sports (English - Stable)',
    url: 'https://streamsports.site/api/stream-proxy?url=https%3A%2F%2Fcdn.fifalive.click%2Fplay.m3u8'
  },
  {
    name: 'PTV Sports (English - Stable)',
    url: 'https://trs1.aynaott.com/ptvsports/tracks-v1a1/mono.ts.m3u8'
  },
  {
    name: 'BeIN 4K (Ultra HD - English)',
    url: 'https://pub-4aa1aaf3896e4dd0923f238800b68845.r2.dev/kickbd-bein4k/main.m3u8'
  },
  {
    name: 'AliFlix Stream (Direct)',
    url: DIRECT_STREAM_URL
  },
  {
    name: 'FIFA FHD (Toffee CDN)',
    url: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-3/0/master_2000.m3u8?hdntl=Expires=1782422686~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AVXEwvdw_EW5yg24646Tzt0JTgHcKGu1d-bn9GbywpEI3FBOVE8cEtb0uSgOCgprrb7FYTph1R5J3AWwM5aCDED4FRAH'
  }
];

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsPlayerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mpegtsLoaded, setMpegtsLoaded] = useState(false);
  const [hlsLoaded, setHlsLoaded] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<StreamChannel>(CHANNELS[0]);
  const [streamUrl, setStreamUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [showControls, setShowControls] = useState(true);

  // Determine stream URL protocol on mount and when channel switches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentChannel.name === 'AliFlix Stream (Direct)') {
        const isHttps = window.location.protocol === 'https:';
        setStreamUrl(isHttps ? `${window.location.origin}/api/stream` : DIRECT_STREAM_URL);
      } else {
        setStreamUrl(currentChannel.url);
      }
    }
  }, [currentChannel]);

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

  // Handle stream loading using mpegts.js or hls.js
  const initPlayer = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video || !url) return;

    setLoading(true);
    setError(null);
    setStatus('connecting');

    // Clean up existing players
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error(e);
      }
      playerRef.current = null;
    }
    if (hlsPlayerRef.current) {
      try {
        hlsPlayerRef.current.destroy();
      } catch (e) {
        console.error(e);
      }
      hlsPlayerRef.current = null;
    }

    const isHls = url.includes('.m3u8');

    if (isHls) {
      const HlsClass = (window as any).Hls;
      if (HlsClass && HlsClass.isSupported()) {
        try {
          const hls = new HlsClass({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 4,
            liveMaxLatencyDurationCount: 6
          });

          hlsPlayerRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            setPlaying(true);
            setLoading(false);
            setStatus('live');
            video.play().catch(() => {});
          });

          hls.on(HlsClass.Events.ERROR, (event: any, data: any) => {
            console.error('hls.js error:', data);
            if (data.fatal) {
              setError('Stream source error. Retrying...');
              setStatus('error');
              setLoading(false);
            }
          });
        } catch (err: any) {
          console.error('Failed to initialize hls.js player:', err);
          setError('Failed to initialize HLS engine.');
          setStatus('error');
          setLoading(false);
        }
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS for Safari/iOS
        video.src = url;
        
        const onLoadedMetadata = () => {
          setLoading(false);
          setStatus('live');
          video.play().then(() => setPlaying(true)).catch(() => {});
        };

        const onError = () => {
          setError('Stream offline or incompatible.');
          setStatus('error');
          setLoading(false);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
      } else {
        setError('Your browser does not support HLS playback.');
        setStatus('error');
        setLoading(false);
      }
    } else {
      // MPEG-TS playback
      if (!(window as any).mpegts) return;

      if ((window as any).mpegts.getFeatureList().mseLivePlayback) {
        try {
          const player = (window as any).mpegts.createPlayer({
            type: 'mpegts',
            isLive: true,
            url: url
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
              setLoading(false);
              setStatus('live');
            });

          player.on((window as any).mpegts.Events.ERROR, (type: string, detail: string, info: any) => {
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
        // Fallback for Safari/iOS which support native playback
        video.src = url;
        
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
    }
  }, []);

  // Handle script load event
  const handleScriptLoad = () => {
    setMpegtsLoaded(true);
  };

  // Trigger player setup once library is loaded and URL is resolved
  useEffect(() => {
    if (!streamUrl) return;

    const isHls = streamUrl.includes('.m3u8');

    if (isHls) {
      const hasNativeHls = typeof window !== 'undefined' && videoRef.current?.canPlayType('application/vnd.apple.mpegurl');
      if (hlsLoaded || (window as any).Hls || hasNativeHls) {
        initPlayer(streamUrl);
      }
    } else {
      if (mpegtsLoaded || (window as any).mpegts) {
        initPlayer(streamUrl);
      }
    }
  }, [mpegtsLoaded, hlsLoaded, streamUrl, initPlayer]);

  // Clean up players on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
      }
      if (hlsPlayerRef.current) {
        try {
          hlsPlayerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Re-run player initialization if error occurs and user clicks retry
  const handleRetry = () => {
    if (streamUrl) initPlayer(streamUrl);
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

      {/* HLS CDN Script */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"
        strategy="afterInteractive"
        onLoad={() => setHlsLoaded(true)}
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
        <div className="w-full px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-white/5 pointer-events-auto">
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
        <div className="w-full flex flex-col pointer-events-auto bg-black/85 backdrop-blur-md border-t border-white/10">
          {/* Server Selector Row */}
          <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2 flex-shrink-0">
              Select Server:
            </span>
            <div className="flex items-center gap-2">
              {CHANNELS.map((channel) => (
                <button
                  key={channel.name}
                  onClick={() => setCurrentChannel(channel)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 whitespace-nowrap ${
                    currentChannel.name === channel.name
                      ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                  }`}
                >
                  {channel.name}
                  {channel.url.includes('.m3u8') && (
                    <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-black tracking-widest ${
                      currentChannel.name === channel.name
                        ? 'bg-white text-red-600'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      iOS OK
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 flex items-center justify-between gap-4">
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
