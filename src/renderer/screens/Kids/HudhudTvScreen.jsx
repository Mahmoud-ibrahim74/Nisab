import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Shuffle,
  List,
  Maximize2,
  Minimize2,
  Tv,
  Radio,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Film
} from 'lucide-react';
import hudhudData from '../../../Resources/kids_tv.json';
import { soundFx } from './audio';

// Helper to extract YouTube ID or Playlist ID
function parseYouTubeUrl(url) {
  if (!url) return { type: 'unknown', id: '' };
  if (url.includes('list=')) {
    const match = url.match(/[?&]list=([^#&?]+)/);
    if (match && match[1]) {
      return { type: 'playlist', id: match[1] };
    }
  }
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return { type: 'video', id: match[1] };
  }
  return { type: 'unknown', id: '' };
}

// Clean channel titles for display
function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/\|\s*قناة هدهد\s*-\s*Hudhud/gi, '')
    .replace(/بدون موسيقى/gi, '')
    .replace(/بدون ايقاع/gi, '')
    .replace(/بدون إيقاع/gi, '')
    .trim();
}

export default function HudhudTvScreen() {
  const [channels] = useState(() => {
    return (hudhudData || []).map((item, index) => {
      const parsed = parseYouTubeUrl(item.url);
      return {
        id: index,
        channelNum: index + 1,
        title: item.video_name,
        cleanTitle: cleanTitle(item.video_name),
        url: item.url,
        type: parsed.type,
        videoId: parsed.id,
        thumbnail:
          parsed.type === 'video'
            ? `https://img.youtube.com/vi/${parsed.id}/mqdefault.jpg`
            : null
      };
    });
  });

  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [isPowerOn, setIsPowerOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [numKeyBuffer, setNumKeyBuffer] = useState('');

  // OSD (On Screen Display) state
  const [showOsdBanner, setShowOsdBanner] = useState(true);
  const [osdFeedback, setOsdFeedback] = useState(null); // { type: 'vol' | 'play' | 'pause' | 'mute' | 'ch', val }

  const iframeRef = useRef(null);
  const tvContainerRef = useRef(null);
  const osdTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const numKeyTimerRef = useRef(null);

  const currentChannel = channels[currentChannelIndex] || channels[0];

  // Send command to YouTube Iframe Player
  const sendIframeCommand = useCallback((command, args = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args }),
        '*'
      );
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Show temporary banner when switching channels
  const triggerOsdBanner = useCallback(() => {
    setShowOsdBanner(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsdBanner(false);
    }, 4500);
  }, []);

  // Show quick center feedback (Volume / Play / Pause / Mute)
  const triggerFeedback = useCallback((feedback) => {
    setOsdFeedback(feedback);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setOsdFeedback(null);
    }, 1800);
  }, []);

  // Change Channel
  const changeChannel = useCallback(
    (index) => {
      if (channels.length === 0) return;
      const normalized = (index + channels.length) % channels.length;
      setCurrentChannelIndex(normalized);
      triggerOsdBanner();
      triggerFeedback({ type: 'ch', val: normalized + 1 });
      setIsPlaying(true);
    },
    [channels.length, triggerOsdBanner, triggerFeedback]
  );

  const handleNextChannel = () => {
    soundFx.playPop();
    changeChannel(currentChannelIndex + 1);
  };

  const handlePrevChannel = () => {
    soundFx.playPop();
    changeChannel(currentChannelIndex - 1);
  };

  const handleTogglePower = () => {
    soundFx.playPop();
    setIsPowerOn((prev) => {
      const next = !prev;
      if (!next) {
        sendIframeCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendIframeCommand('playVideo');
        setIsPlaying(true);
        triggerOsdBanner();
      }
      return next;
    });
  };

  const handleTogglePlay = () => {
    soundFx.playPop();
    if (!isPowerOn) return;
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        sendIframeCommand('playVideo');
        triggerFeedback({ type: 'play' });
      } else {
        sendIframeCommand('pauseVideo');
        triggerFeedback({ type: 'pause' });
      }
      return next;
    });
  };

  const handleVolumeUp = () => {
    soundFx.playPop();
    if (!isPowerOn) return;
    setVolume((prev) => {
      const next = Math.min(100, prev + 10);
      sendIframeCommand('setVolume', [next]);
      if (isMuted) {
        setIsMuted(false);
        sendIframeCommand('unMute');
      }
      triggerFeedback({ type: 'vol', val: next });
      return next;
    });
  };

  const handleVolumeDown = () => {
    soundFx.playPop();
    if (!isPowerOn) return;
    setVolume((prev) => {
      const next = Math.max(0, prev - 10);
      sendIframeCommand('setVolume', [next]);
      triggerFeedback({ type: 'vol', val: next });
      return next;
    });
  };

  const handleToggleMute = () => {
    soundFx.playPop();
    if (!isPowerOn) return;
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        sendIframeCommand('mute');
        triggerFeedback({ type: 'mute', val: true });
      } else {
        sendIframeCommand('unMute');
        sendIframeCommand('setVolume', [volume]);
        triggerFeedback({ type: 'mute', val: false });
      }
      return next;
    });
  };

  const handleRestartVideo = () => {
    soundFx.playPop();
    if (!isPowerOn) return;
    sendIframeCommand('seekTo', [0, true]);
    sendIframeCommand('playVideo');
    setIsPlaying(true);
    triggerFeedback({ type: 'restart' });
  };

  const handleShuffle = () => {
    soundFx.playChime();
    if (channels.length <= 1) return;
    let rand = Math.floor(Math.random() * channels.length);
    if (rand === currentChannelIndex) rand = (rand + 1) % channels.length;
    changeChannel(rand);
  };

  const handleToggleFullscreen = () => {
    soundFx.playPop();
    if (!tvContainerRef.current) return;
    if (!document.fullscreenElement) {
      tvContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Direct channel number input from remote numeric keys (e.g. "12")
  const handleNumKeyPress = (digit) => {
    soundFx.playPop();
    const newBuf = (numKeyBuffer + digit).slice(-2);
    setNumKeyBuffer(newBuf);

    if (numKeyTimerRef.current) clearTimeout(numKeyTimerRef.current);
    numKeyTimerRef.current = setTimeout(() => {
      const parsedNum = parseInt(newBuf, 10);
      if (parsedNum >= 1 && parsedNum <= channels.length) {
        changeChannel(parsedNum - 1);
      }
      setNumKeyBuffer('');
    }, 1200);
  };

  // Listen to postMessage from YouTube iframe (auto advance on end)
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'onStateChange') {
          // YT.PlayerState.ENDED is 0
          if (data.info === 0) {
            handleNextChannel();
          } else if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleNextChannel]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Filter channels for guide
  const filteredChannels = channels.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Construct iframe embed URL
  const embedUrl = (() => {
    if (!currentChannel) return '';
    const originParam =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:')
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : '';
    const baseParams =
      `enablejsapi=1&autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&playsinline=1${originParam}`;
    if (currentChannel.type === 'playlist') {
      return `https://www.youtube.com/embed/videoseries?list=${currentChannel.videoId}&${baseParams}`;
    }
    return `https://www.youtube.com/embed/${currentChannel.videoId}?${baseParams}`;
  })();

  return (
    <div
      dir="rtl"
      className="w-full h-full min-h-[calc(100vh-4rem)] min-w-0 p-3 sm:p-5 flex flex-col items-center justify-start bg-slate-950 text-slate-100 select-none overflow-y-auto"
    >
      {/* Top Banner / HUD Header */}
      <header className="w-full min-w-0 max-w-[1700px] rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-amber-950/90 border border-emerald-500/40 shadow-xl mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 text-2xl shrink-0">
            📺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-serif text-amber-300">
                تلفزيون هدهد للأطفال (بدون موسيقى)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                أناشيد تربوية هادفة
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block mt-0.5">
              شاشة التلفاز الذكية وجهاز التحكم عن بُعد التفاعلي • {channels.length} أنشودة وقصة كرتونية
            </p>
          </div>
        </div>

        {/* Quick status actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <List className="w-4 h-4" />
            <span>دليل القنوات ({channels.length})</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-emerald-400" />
            <span>عشوائي</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'إنهاء التكبير' : 'ملء الشاشة'}</span>
          </button>
        </div>
      </header>

      {/* Main Stage: The Smart TV (Monitor) + The Tactile Physical Remote */}
      <div className="w-full min-w-0 max-w-[1700px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* 1. THE BIG MONITOR (SMART TV) - 8 or 9 cols on desktop */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center">
          
          {/* Ambilight Ambient Glow Wrapper */}
          <div
            ref={tvContainerRef}
            className={`relative w-full rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-4 ${
              isPowerOn ? 'border-amber-500/30' : 'border-slate-800'
            } shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col items-center`}
          >
            {/* Ambilight Glow Effect Behind Bezel */}
            {isPowerOn && (
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-amber-500/20 blur-3xl pointer-events-none opacity-70 animate-pulse" />
            )}

            {/* TV Screen Outer Frame / Ultra-Thin Bezel */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center">
              
              {/* Standby State (Screen is OFF) */}
              {!isPowerOn ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-black to-slate-950 text-slate-500 relative">
                  {/* Subtle glossy TV glass glare */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
                  <div className="w-20 h-20 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
                    <Power className="w-8 h-8 text-rose-500 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold font-serif text-slate-400">
                    التلفاز في وضع الاستعداد (Standby)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    اضغط على زر التشغيل الأحمر ⏻ في جهاز التحكم لتشغيل الشاشة
                  </p>
                </div>
              ) : (
                /* Active State (Screen is ON with YouTube Clean Player) */
                <div className="relative w-full h-full bg-black">
                  <iframe
                    ref={iframeRef}
                    key={currentChannel.id}
                    src={embedUrl}
                    title={currentChannel.title}
                    className="w-full h-full border-0 pointer-events-auto"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                  {/* Clean YouTube Click Shield: allows remote control only without external distractions */}
                  <div className="absolute inset-0 pointer-events-none" />

                  {/* Top-Right/Left OSD Channel & Song Banner (shown on channel change) */}
                  <AnimatePresence>
                    {showOsdBanner && (
                      <motion.div
                        initial={{ opacity: 0, y: -25 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 inset-x-4 z-20 pointer-events-none flex items-start justify-between"
                      >
                        {/* Channel Badge */}
                        <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/50 shadow-2xl flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                          <div>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              قناة CH {String(currentChannel.channelNum).padStart(2, '0')} / {channels.length}
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 font-serif leading-tight mt-0.5 line-clamp-1">
                              {currentChannel.cleanTitle || currentChannel.title}
                            </h4>
                          </div>
                        </div>

                        {/* HD / No Music Logo Tag */}
                        <div className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-[11px] font-bold text-emerald-300 shadow-lg">
                          هدهد • بدون موسيقى
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Center OSD Feedback (Volume Bar / Pause / Play / Mute) */}
                  <AnimatePresence>
                    {osdFeedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                      >
                        <div className="px-6 py-4 rounded-3xl bg-slate-950/85 backdrop-blur-xl border border-amber-400/50 shadow-2xl flex flex-col items-center gap-2 text-center min-w-[180px]">
                          {osdFeedback.type === 'vol' && (
                            <>
                              <Volume2 className="w-8 h-8 text-amber-400" />
                              <span className="text-sm font-bold font-mono text-slate-200">
                                مستوى الصوت: {osdFeedback.val}%
                              </span>
                              <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-150"
                                  style={{ width: `${osdFeedback.val}%` }}
                                />
                              </div>
                            </>
                          )}

                          {osdFeedback.type === 'mute' && (
                            <>
                              {osdFeedback.val ? (
                                <VolumeX className="w-8 h-8 text-rose-400" />
                              ) : (
                                <Volume2 className="w-8 h-8 text-emerald-400" />
                              )}
                              <span className="text-sm font-bold text-slate-200">
                                {osdFeedback.val ? 'كتم الصوت (Mute)' : 'تشغيل الصوت'}
                              </span>
                            </>
                          )}

                          {osdFeedback.type === 'play' && (
                            <>
                              <Play className="w-8 h-8 text-emerald-400 fill-emerald-400" />
                              <span className="text-sm font-bold text-slate-200">متابعة التشغيل</span>
                            </>
                          )}

                          {osdFeedback.type === 'pause' && (
                            <>
                              <Pause className="w-8 h-8 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-bold text-slate-200">إيقاف مؤقت</span>
                            </>
                          )}

                          {osdFeedback.type === 'ch' && (
                            <>
                              <Tv className="w-8 h-8 text-amber-400" />
                              <span className="text-sm font-bold font-mono text-amber-300">
                                CH {String(osdFeedback.val).padStart(2, '0')}
                              </span>
                            </>
                          )}

                          {osdFeedback.type === 'restart' && (
                            <>
                              <RotateCcw className="w-8 h-8 text-cyan-400" />
                              <span className="text-sm font-bold text-slate-200">إعادة البدء</span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Channel Number Typing Indicator (e.g. typing "12" on remote) */}
                  {numKeyBuffer && (
                    <div className="absolute top-4 left-4 z-40 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-mono font-bold text-xl shadow-2xl animate-pulse">
                      CH {numKeyBuffer}_
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart TV Bottom Chin Bezel & Power LED */}
            <div className="w-full pt-3 pb-1 flex items-center justify-between px-3 text-xs text-slate-500">
              <span className="font-mono tracking-widest text-[10px] text-slate-400 font-bold">
                HUDHUD SMART TV 4K
              </span>

              {/* Central Metallic TV Stand Connector */}
              <div className="w-24 h-1.5 rounded-full bg-slate-800 border-t border-slate-700" />

              {/* Status Power LED */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono">
                  {isPowerOn ? 'POWER ON' : 'STANDBY'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors shadow-md ${
                    isPowerOn
                      ? 'bg-emerald-400 shadow-emerald-400/50'
                      : 'bg-rose-500 shadow-rose-500/50'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* TV Metallic Stand Base */}
          <div className="w-48 h-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-b-xl shadow-xl border-x border-b border-slate-600/50" />
        </div>

        {/* ======================================================== */}
        {/* 2. THE TACTILE SMART REMOTE CONTROL (Secondary Panel)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col items-center">
          
          {/* Realistic Ergonomic TV Remote Body */}
          <div className="w-full max-w-[320px] rounded-[40px] p-4 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center">
            
            {/* Top IR Emitter Bulb Graphic */}
            <div className="w-12 h-2.5 rounded-full bg-slate-800 border-b border-slate-700 mb-3 flex items-center justify-center">
              <div className="w-2 h-1 rounded-full bg-rose-600/70" />
            </div>

            {/* Remote Top Controls: Red Power Button + Mute Button */}
            <div className="w-full flex items-center justify-between px-2 mb-3.5">
              {/* Red Power Button */}
              <button
                onClick={handleTogglePower}
                title="تشغيل / وضع الاستعداد"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition active:scale-95 cursor-pointer ${
                  isPowerOn
                    ? 'bg-gradient-to-b from-rose-600 to-rose-700 shadow-rose-900/50 hover:from-rose-500 hover:to-rose-600'
                    : 'bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-emerald-900/50 hover:from-emerald-500'
                }`}
              >
                <Power className="w-6 h-6" />
              </button>

              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">
                HUDHUD REMOTE
              </span>

              {/* Mute Button */}
              <button
                onClick={handleToggleMute}
                title="كتم الصوت"
                className={`w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 shadow-md transition active:scale-95 cursor-pointer ${
                  isMuted ? 'text-rose-400 border-rose-500/60 ring-2 ring-rose-500/30' : ''
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Glowing Mini LCD Screen on Remote */}
            <div className="w-full rounded-2xl p-3 bg-gradient-to-b from-cyan-950/80 to-slate-950 border border-cyan-500/40 shadow-inner mb-4 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 font-bold border-b border-cyan-900/40 pb-1">
                <span>CH {String(currentChannel.channelNum).padStart(2, '0')}</span>
                <span className="text-[10px] text-emerald-400">
                  {isPowerOn ? (isPlaying ? '▶ PLAYING' : '⏸ PAUSED') : '💤 STANDBY'}
                </span>
                <span>VOL {volume}%</span>
              </div>

              {/* Scrolling Song Title */}
              <div className="overflow-hidden whitespace-nowrap pt-1">
                <p className="text-xs font-bold text-cyan-200 font-serif truncate">
                  {currentChannel.cleanTitle || currentChannel.title}
                </p>
              </div>
            </div>

            {/* Numeric Keypad for direct channel jumping (1-9, 0) */}
            <div className="w-full grid grid-cols-3 gap-2 mb-4 px-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumKeyPress(num)}
                  className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 font-bold font-mono text-sm border border-slate-700/60 shadow transition cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumKeyPress('0')}
                className="col-start-2 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 font-bold font-mono text-sm border border-slate-700/60 shadow transition cursor-pointer"
              >
                0
              </button>
            </div>

            {/* Directional Pad (D-Pad) Navigation Circle */}
            <div className="relative w-48 h-48 rounded-full bg-slate-800/90 border-2 border-slate-700 p-2 shadow-2xl flex items-center justify-center mb-4">
              {/* Up: Vol+ */}
              <button
                onClick={handleVolumeUp}
                title="رفع الصوت"
                className="absolute top-2 w-12 h-10 rounded-t-2xl bg-slate-700 hover:bg-slate-600 active:bg-amber-500 active:text-slate-950 text-slate-200 flex items-center justify-center text-xs font-bold transition shadow cursor-pointer"
              >
                <span className="font-bold">VOL+</span>
              </button>

              {/* Down: Vol- */}
              <button
                onClick={handleVolumeDown}
                title="خفض الصوت"
                className="absolute bottom-2 w-12 h-10 rounded-b-2xl bg-slate-700 hover:bg-slate-600 active:bg-amber-500 active:text-slate-950 text-slate-200 flex items-center justify-center text-xs font-bold transition shadow cursor-pointer"
              >
                <span className="font-bold">VOL-</span>
              </button>

              {/* Right: Next Channel */}
              <button
                onClick={handleNextChannel}
                title="القناة التالية"
                className="absolute right-2 w-10 h-12 rounded-r-2xl bg-slate-700 hover:bg-slate-600 active:bg-amber-500 active:text-slate-950 text-slate-200 flex items-center justify-center text-xs font-bold transition shadow cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Left: Previous Channel */}
              <button
                onClick={handlePrevChannel}
                title="القناة السابقة"
                className="absolute left-2 w-10 h-12 rounded-l-2xl bg-slate-700 hover:bg-slate-600 active:bg-amber-500 active:text-slate-950 text-slate-200 flex items-center justify-center text-xs font-bold transition shadow cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Center: OK / Play-Pause */}
              <button
                onClick={handleTogglePlay}
                title="تشغيل / إيقاف مؤقت"
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold flex flex-col items-center justify-center shadow-lg transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                <span className="text-[9px] font-bold mt-0.5">OK</span>
              </button>
            </div>

            {/* Dedicated Quick Action Buttons */}
            <div className="w-full grid grid-cols-3 gap-2 px-1 mb-2">
              <button
                onClick={handleRestartVideo}
                title="إعادة بدء الأنشودة من الأول"
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 shadow transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">إعادة البدء</span>
              </button>

              <button
                onClick={() => setIsGuideOpen(true)}
                title="دليل القنوات"
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 shadow transition active:scale-95 cursor-pointer"
              >
                <List className="w-4 h-4 text-amber-400" />
                <span className="text-[10px]">الدليل</span>
              </button>

              <button
                onClick={handleShuffle}
                title="اختيار أنشودة عشوائية"
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 shadow transition active:scale-95 cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">عشوائي</span>
              </button>
            </div>

            {/* Bottom Fullscreen button */}
            <button
              onClick={handleToggleFullscreen}
              className="w-full py-2.5 mt-1 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 hover:from-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow transition active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>ملء الشاشة للتلفاز (TV Fullscreen)</span>
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. CHANNEL GUIDE MODAL (دليل القنوات والشاشة التفاعلية) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl rounded-3xl bg-slate-900 border-2 border-amber-500/60 p-5 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                    📋
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-300">
                      دليل قنوات وأناشيد هدهد ({channels.length} أنشودة)
                    </h2>
                    <p className="text-xs text-slate-400">
                      اضغط على أي أنشودة للانتقال إليها فوراً على شاشة التلفاز
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن أنشودة (مثال: عصفوري، بسم الله، الحواس، محمد نبينا)..."
                  className="w-full py-2.5 pr-10 pl-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-200 text-sm outline-none transition"
                />
                <Search className="w-5 h-5 text-slate-500 absolute top-3 right-3" />
              </div>

              {/* Channels Grid / List */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredChannels.map((ch) => {
                  const isCurrent = ch.id === currentChannelIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        soundFx.playPop();
                        changeChannel(ch.id);
                        setIsGuideOpen(false);
                      }}
                      className={`p-3 rounded-2xl border text-start transition flex items-center gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40 shadow-lg'
                          : 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      {/* Channel Number */}
                      <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-amber-300 shrink-0">
                        {String(ch.channelNum).padStart(2, '0')}
                      </span>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold font-serif truncate">
                          {ch.cleanTitle || ch.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isCurrent ? '▶ قيد العرض الآن' : 'اضغط للتشغيل'}
                        </span>
                      </div>

                      {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
