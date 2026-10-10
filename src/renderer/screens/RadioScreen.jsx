import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Volume1,
  RotateCw,
  Sparkles,
  Wifi,
  WifiOff,
  Headphones,
  Info,
  Clock,
  Flame
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import SwitchToggle from '../components/SwitchToggle';
import { radioManager } from '../services/RadioManager';

export default function RadioScreen() {
  const [radioState, setRadioState] = useState(() => radioManager.getState());

  useEffect(() => {
    const unsubscribe = radioManager.subscribe((state) => {
      setRadioState(state);
    });

    return () => {
      unsubscribe();
      // Enforce background setting when user leaves the screen
      radioManager.handleScreenLeave();
    };
  }, []);

  const { isPlaying, isLoading, isPaused, isStopped, volume, isMuted, runInBackground, error } =
    radioState;

  const handlePlayPause = () => {
    radioManager.togglePlay();
  };

  const handleStop = () => {
    radioManager.stop();
  };

  const handleVolumeChange = (e) => {
    radioManager.setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = () => {
    radioManager.toggleMute();
  };

  const handleToggleBackground = (checked) => {
    radioManager.setRunInBackground(checked);
  };

  const handleReload = () => {
    radioManager.stop();
    setTimeout(() => {
      radioManager.play();
    }, 250);
  };

  return (
    <div
      style={{ height: '100%', width: '100%', overflow: 'hidden' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 pointer-events-none" />

      {/* Screen Header */}
      <header className="relative z-10 shrink-0 px-4 sm:px-6 md:px-8 pt-5 pb-4 border-b border-emerald-900/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-amber-600 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
                إذاعة القرآن الكريم
              </h1>
              {/* Pulsing Live Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[10px] font-bold shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPlaying ? 'bg-rose-400' : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isPlaying ? 'bg-rose-500' : 'bg-slate-500'
                    }`}
                  />
                </span>
                <span>بث مباشر</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إذاعة القرآن الكريم من القاهرة — تلاوات خاشعة وبرامج إسلامية على مدار الساعة
            </p>
          </div>
        </div>

        {/* Reload Stream Button */}
        <button
          onClick={handleReload}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 border border-emerald-900/60 hover:border-amber-400/60 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-2 text-xs shadow-sm"
          title="إعادة تحميل البث المباشر"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span className="hidden sm:inline">تحديث البث</span>
        </button>
      </header>

      {/* Main Content Area - Auto-fitted to full width with responsive multi-column layout */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 w-full max-w-[1700px] mx-auto min-w-0">
        {/* Error Notice */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={handleReload}
                className="px-3 py-1 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-medium text-xs transition shrink-0"
              >
                إعادة المحاولة
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Grid: Auto-fits on wide screens (two balanced columns) and stacks on small screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Main Column: Grand Player Card (Takes 7 or 8 columns on large screens, full width on mobile/tablet) */}
          <div className="lg:col-span-7 xl:col-span-8 w-full min-w-0 flex flex-col gap-6">
            <div className="relative w-full rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-b from-slate-900/90 via-emerald-950/40 to-slate-900/90 border border-emerald-900/60 shadow-2xl backdrop-blur-xl overflow-hidden text-center flex flex-col items-center justify-center">
              {/* Top Gold Sheen accent */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

              {/* Station Visual Logo / Medallion */}
              <div className="relative mb-5">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 border-2 transition-all ${
                    isPlaying
                      ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.35)] bg-gradient-to-br from-amber-500/25 via-emerald-500/25 to-amber-500/25'
                      : 'border-emerald-800/60 shadow-lg bg-slate-950/80'
                  } flex items-center justify-center`}
                >
                  <div className="w-full h-full rounded-full bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center border border-emerald-900/60 shadow-inner">
                    <Radio
                      className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                        isPlaying ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-bold text-amber-300 font-serif mt-1.5">
                      إذاعة القرآن الكريم
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-mono">98.2 FM • القاهرة</span>
                  </div>
                </motion.div>

                {/* Glowing Live Indicator on Badge */}
                {isPlaying && (
                  <span className="absolute bottom-1 right-2.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-md animate-pulse" />
                )}
              </div>

              {/* Status Label */}
              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-100">
                  إذاعة القرآن الكريم من القاهرة
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                  {isLoading ? (
                    <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      جاري الاتصال بالبث المباشر...
                    </span>
                  ) : isPlaying ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                      <Wifi className="w-4 h-4" />
                      البث المباشر قيد التشغيل الآن
                    </span>
                  ) : isPaused ? (
                    <span className="text-amber-300/80 font-medium">البث المباشر متوقف مؤقتاً</span>
                  ) : (
                    <span className="text-slate-400 font-medium">البث المباشر متوقف</span>
                  )}
                </div>
              </div>

              {/* Live Waveform Equalizer (Animates across width when Playing) */}
              <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-14 w-full max-w-lg mb-8 px-2">
                {[45, 80, 60, 95, 70, 40, 85, 100, 65, 90, 50, 75, 55, 85, 45, 90, 65, 100, 80, 50, 75, 60, 85, 45].map((height, i) => (
                  <motion.div
                    key={`eq-bar-${i}`}
                    className={`flex-1 rounded-full transition-colors ${
                      isPlaying
                        ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-800'
                    }`}
                    animate={
                      isPlaying
                        ? {
                            height: [
                              `${Math.max(12, height * 0.25)}%`,
                              `${height}%`,
                              `${Math.max(15, height * 0.4)}%`,
                              `${Math.min(100, height * 1.15)}%`
                            ]
                          }
                        : { height: '14%' }
                    }
                    transition={
                      isPlaying
                        ? {
                            repeat: Infinity,
                            repeatType: 'reverse',
                            duration: 0.55 + (i % 6) * 0.1,
                            ease: 'easeInOut'
                          }
                        : { duration: 0.3 }
                    }
                  />
                ))}
              </div>

              {/* Primary Audio Action Controls */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 w-full">
                {/* Stop Button */}
                <button
                  onClick={handleStop}
                  disabled={isStopped}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md group"
                  title="إيقاف البث تماماً (Stop)"
                >
                  <Square className="w-5 h-5 fill-current transition-transform group-hover:scale-95" />
                </button>

                {/* Big Play / Pause Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all ${
                    isPlaying
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/30 ring-4 ring-amber-400/20'
                      : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-amber-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
                  }`}
                  title={isPlaying ? 'إيقاف مؤقت (Pause)' : 'تشغيل البث المباشر (Play)'}
                >
                  {isLoading ? (
                    <Sparkles className="w-8 h-8 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </motion.button>

                {/* Mute / Unmute Button */}
                <button
                  onClick={handleToggleMute}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-md ${
                    isMuted
                      ? 'bg-rose-950/40 border-rose-600/60 text-rose-400'
                      : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/50'
                  }`}
                  title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : volume > 0.5 ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <Volume1 className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Volume Slider Control */}
              <div className="w-full max-w-md flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-emerald-900/50 shadow-inner">
                <button
                  onClick={handleToggleMute}
                  className="text-slate-400 hover:text-amber-400 transition"
                  title="كتم / إلغاء الكتم"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  title={`مستوى الصوت: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
                <span className="text-xs font-mono text-slate-400 w-10 text-left">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Setting & Station Information (Takes 5 or 4 columns on large screens) */}
          <div className="lg:col-span-5 xl:col-span-4 w-full min-w-0 flex flex-col gap-6">
            {/* Setting: Run in Background Toggle */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-900/50 shadow-xl backdrop-blur-md flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950/90 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>تشغيل في الخلفية</span>
                    {runInBackground && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/60 font-medium">
                        مفعل
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    الاستمرار في تشغيل البث المباشر بدون انقطاع عند التنقل بين شاشات التطبيق المختلفة (المصحف، الأذكار، التقويم).
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">حالة الاستماع بالخلفية:</span>
                <SwitchToggle
                  id="radio-background-toggle"
                  checked={runInBackground}
                  onChange={handleToggleBackground}
                  ariaLabel="تشغيل إذاعة القرآن في الخلفية"
                />
              </div>
            </div>

            {/* Station Informational Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-emerald-900/50 shadow-xl backdrop-blur-md text-xs sm:text-sm text-slate-300 space-y-3.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-serif text-sm sm:text-base border-b border-emerald-900/40 pb-2.5">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>محطة إذاعة القرآن الكريم</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-justify text-xs sm:text-[13px]">
                إذاعة القرآن الكريم من القاهرة هي أول إذاعة متخصصة في بث آيات الذكر الحكيم في العالم الإسلامي، بدأت بثها في 25 مارس 1964. تبث تلاوات بأصوات كبار قراء العالم الإسلامي أمثال الشيخ عبد الباسط عبد الصمد، محمود خليل الحصري، مصطفى إسماعيل، ومحمد رفعت، بالإضافة إلى برامج التفسير والفتاوى المعتمدة.
              </p>
              <div className="flex flex-col gap-2 pt-1 text-xs text-slate-400">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/50 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>بث مباشر متواصل على مدار 24 ساعة دون انقطاع</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/50 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>بث صوتي رقمي عالي النقاء (Stereo 128kbps)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
