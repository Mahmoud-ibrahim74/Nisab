import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  BookMarked,
  CheckCircle2,
  Calendar,
  Flame,
  Compass,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Plus,
  Play,
  Layers,
  Award,
  History,
  Settings2,
  X,
  Copy,
  CheckCheck,
  BookmarkCheck,
  Target,
  Clock,
  Share2,
  Trash2
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import MiniLoader from '../components/MiniLoader';
import { useKhatmah } from '../hooks/useKhatmah';
import {
  KHATMAH_PRESETS,
  JUZ_METADATA,
  SURAHS_LIST,
  DUA_KHATM_AL_QURAN,
  calculateWerdTargets,
  getJuzForPage,
  getSurahForPage
} from '../utils/khatmahConstants';

export default function KhatmahTrackerScreen({ onNavigateToQuran }) {
  const {
    hasActiveKhatmah,
    plan,
    currentPage,
    currentSurahId,
    completedDaysCount,
    streak,
    history,
    loading,
    completedPages,
    remainingPages,
    completionPercentage,
    isCompleted,
    daysElapsed,
    remainingDays,
    currentJuz,
    currentSurah,
    todayWerd,
    startNewKhatmah,
    updateBookmark,
    completeTodayWerd,
    archiveCurrentKhatmah,
    deleteKhatmah,
    deleteHistoryItem,
    resetKhatmah
  } = useKhatmah();

  // Modals & UI States
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [duaModalOpen, setDuaModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [manualEditOpen, setManualEditOpen] = useState(false);
  const [selectedJuzModal, setSelectedJuzModal] = useState(null);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

  // Success Feedback Toast / Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handle Delete Active Khatmah
  const handleDeleteActiveKhatmah = async () => {
    await deleteKhatmah();
    setConfirmDeleteModalOpen(false);
    showToast('تم حذف الختمة الحالية بنجاح');
  };

  // Handle Mark Today's Werd Done
  const [completingWerd, setCompletingWerd] = useState(false);
  const handleMarkWerdCompleted = async () => {
    setCompletingWerd(true);
    try {
      await completeTodayWerd();
      showToast('تقبل الله طاعتكم! تم إتمام ورد اليوم وتقدمت الختمة بنجاح ✨');
      if (currentPage + (plan?.dailyPages || 20) >= 604) {
        setDuaModalOpen(true);
      }
    } finally {
      setCompletingWerd(false);
    }
  };

  // Navigate to Quran Reader
  const handleContinueReading = (targetPage = currentPage) => {
    if (onNavigateToQuran) {
      const p = Math.max(1, Math.min(604, Number(targetPage) || 1));
      const surah = getSurahForPage(p);
      onNavigateToQuran({
        page: p,
        surahId: surah.id,
        ayahNumber: 1
      });
    }
  };

  return (
    <div
      style={{ height: '100%', width: '100%', minWidth: 0, overflowY: 'auto' }}
      className="relative h-full w-full min-w-0 bg-slate-950 text-slate-100 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 p-3 sm:p-5 md:p-6 lg:p-8"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 pointer-events-none" />

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-950 border border-amber-400 text-amber-300 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full min-w-0 max-w-[1700px] mx-auto space-y-5 sm:space-y-6 md:space-y-8 pb-16">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-emerald-900/40 pb-4 sm:pb-5 w-full min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-950 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 shrink-0">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif tracking-wide flex items-center gap-2 flex-wrap">
                <span>متابعة الختمة المباركة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-sans">
                  ختمة القرآن
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                تتبع وردك القرآني اليومي، واضبط خطة الختم بأيسر السبل
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {hasActiveKhatmah && (
              <>
                <button
                  type="button"
                  onClick={() => setDuaModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition active:scale-95"
                  title="قراءة دعاء ختم القرآن الكريم"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">دعاء الختم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-semibold transition active:scale-95"
                  title="تعديل موضع التوقف الحالي"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تعديل الموضع</span>
                </button>

                {/* Delete Khatmah Button */}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-500/80 text-rose-300 hover:text-rose-200 text-xs font-semibold transition active:scale-95 shadow-sm"
                  title="حذف الختمة الحالية وإلغاء الخطة"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">حذف الختمة</span>
                </button>
              </>
            )}

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-semibold transition active:scale-95"
                title="سجل الختمات السابقة"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">السجل ({history.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{hasActiveKhatmah ? 'بدء ختمة جديدة' : 'إنشاء خطة ختمة'}</span>
            </button>
          </div>
        </header>

        {/* State A: No Active Khatmah Placeholder Banner */}
        {!hasActiveKhatmah ? (
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950 border border-amber-500/30 text-center shadow-2xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <BookMarked className="w-10 h-10" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-300">
                ابدأ رحلتك المباركة مع القرآن الكريم
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                حدد المدة المناسبة لك (أسبوع، شهر، أو أي مدة تفضلها)، وسيقوم التطبيق بحساب وردك اليومي بدقة وتوجيهك لموضع القراءة في كل يوم.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/25 active:scale-95 transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>إعداد خطة الختمة الآن</span>
              <ChevronLeft className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        ) : (
          /* State B: Active Khatmah Full Dashboard */
          <div className="space-y-6 sm:space-y-8">
            {/* Top Dashboard: Centerpiece Progress Ring + 4 Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch w-full min-w-0">
              {/* Circular Gauge Centerpiece (4 cols on xl, 5 cols on lg) */}
              <div className="lg:col-span-5 xl:col-span-4 2xl:col-span-4 w-full min-w-0 rounded-3xl p-5 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900/90 to-emerald-950/40 border border-amber-500/30 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-2">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-slate-800/80"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    {/* Animated Progress Gradient Ring */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="url(#khatmah-gold-emerald-gradient)"
                      strokeWidth="7"
                      strokeDasharray={264}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * completionPercentage) / 100 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="khatmah-gold-emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="60%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Centered Percentage & Stats */}
                  <div className="absolute flex flex-col items-center justify-center select-none">
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300 tracking-tight"
                    >
                      {completionPercentage}%
                    </motion.span>
                    <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold mt-1">
                      نسبة إنجاز الختمة
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {completedPages} من 604 صفحة
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                  <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                    المتبقي: {remainingPages} صفحة
                  </div>
                  {isCompleted && (
                    <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold animate-pulse">
                      الختمة مكتملة 100% ✨
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Stats Cards Grid (Auto-fits 1 col mobile, 2 cols tablet/laptop, 4 cols 2xl screen) */}
              <div className="lg:col-span-7 xl:col-span-8 2xl:col-span-8 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {/* Metric 1: Completed vs Remaining Pages */}
                <div className="w-full min-w-0 p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/60 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">الصفحات المنجزة</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold font-mono text-slate-100">
                      {completedPages}{' '}
                      <span className="text-xs text-slate-400 font-sans font-normal">/ 604</span>
                    </div>
                    {/* Mini Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                      <span>البداية: ص {plan.startPage}</span>
                      <span>المتبقي: {remainingPages} ص</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Current Position */}
                <div className="w-full min-w-0 p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/60 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">الموضع الحالي</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-lg font-bold font-serif text-amber-300 truncate">
                      {currentSurah.name} • ص {currentPage}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      {currentJuz.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      نهاية الجزء: ص {currentJuz.endPage}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Plan Schedule (Days) */}
                <div className="w-full min-w-0 p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/60 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">أيام الخطة</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-950/60 text-cyan-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold font-mono text-cyan-300">
                      {remainingDays}{' '}
                      <span className="text-xs text-slate-400 font-sans font-normal">أيام متبقية</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      منقضي: {daysElapsed} من {plan.targetDays} يوماً
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      معدل القراءة: {plan.dailyPages} صفحة/يوم
                    </div>
                  </div>
                </div>

                {/* Metric 4: Consecutive Reading Streak */}
                <div className="w-full min-w-0 p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/60 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">المواظبة المتتالية</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold font-mono text-rose-400 flex items-center gap-1.5">
                      <span>{streak}</span>
                      <span className="text-xs text-slate-300 font-sans font-normal">أيام متتالية 🔥</span>
                    </div>
                    <div className="text-[11px] text-amber-300/90 font-serif mt-1 truncate">
                      « أَحَبُّ الأَعْمَالِ إِلَى اللهِ أَدْوَمُهَا »
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      تم إتمام {completedDaysCount} أوراد حتى الآن
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Werd Action Card - Responsive Auto-fit Width */}
            <div className="w-full min-w-0 rounded-3xl p-5 sm:p-6 md:p-8 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-700/60 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 w-full min-w-0">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>الورد اليومي المطلوب</span>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-bold text-slate-100 font-serif break-words">
                    {todayWerd.summaryText}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    مقدار الورد: <span className="font-bold text-amber-300">{todayWerd.pagesCount} صفحة</span> • يغطي من{' '}
                    <span className="text-emerald-400 font-semibold">{todayWerd.startJuzName}</span> إلى{' '}
                    <span className="text-emerald-400 font-semibold">{todayWerd.endJuzName}</span>.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                  {/* Continue Reading Button */}
                  <button
                    type="button"
                    onClick={() => handleContinueReading(currentPage)}
                    className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-900/40 active:scale-95 transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>متابعة القراءة في المصحف</span>
                  </button>

                  {/* Mark Werd as Completed */}
                  <button
                    type="button"
                    onClick={handleMarkWerdCompleted}
                    disabled={completingWerd || isCompleted}
                    className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
                  >
                    {completingWerd ? (
                      <MiniLoader size="xs" color="current" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    )}
                    <span>إتمام ورد اليوم</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive 30-Juz Visual Grid - Auto-fits perfectly on any screen width */}
            <div className="space-y-4 w-full min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 font-serif">
                    خريطة أجزاء القرآن الكريم (30 جزءاً)
                  </h3>
                </div>
                <div className="text-xs text-slate-400">
                  انقر على أي جزء لمراجعته أو الانتقال إليه
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10 gap-2.5 sm:gap-3 w-full min-w-0">
                {JUZ_METADATA.map((juz) => {
                  const isJuzCompleted = currentPage > juz.endPage;
                  const isJuzActive = currentPage >= juz.startPage && currentPage <= juz.endPage;
                  const isJuzUpcoming = currentPage < juz.startPage;

                  return (
                    <motion.div
                      key={juz.juz}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedJuzModal(juz)}
                      className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative overflow-hidden select-none ${
                        isJuzCompleted
                          ? 'bg-emerald-950/40 border-emerald-600/80 hover:border-emerald-400 text-slate-200'
                          : isJuzActive
                          ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          #{juz.juz}
                        </span>
                        {isJuzCompleted ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : isJuzActive ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse">
                            أنت هنا
                          </span>
                        ) : null}
                      </div>

                      {/* Juz Title */}
                      <div className="text-xs font-bold font-serif text-slate-200 truncate">
                        {juz.name}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        {juz.startSurahName}
                      </div>

                      {/* Page Range */}
                      <div className="mt-2 text-[10px] font-mono text-emerald-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
                        <span>ص {juz.startPage}</span>
                        <span>-</span>
                        <span>ص {juz.endPage}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. KHATMAH SETUP WIZARD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {setupModalOpen && (
          <KhatmahSetupModal
            initialDays={plan?.targetDays || 30}
            onClose={() => setSetupModalOpen(false)}
            onConfirm={async (config) => {
              await startNewKhatmah(config);
              setSetupModalOpen(false);
              showToast('مبارك! تم تفعيل خطة الختمة الجديدة بنجاح ✨');
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. DUA KHATM AL-QURAN MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {duaModalOpen && (
          <DuaKhatmModal
            isCompleted={isCompleted}
            onClose={() => setDuaModalOpen(false)}
            onArchive={async () => {
              await archiveCurrentKhatmah();
              setDuaModalOpen(false);
              showToast('تم أرشفة الختمة بنجاح في سجل الختمات!');
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. KHATMAH HISTORY LOG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {historyModalOpen && (
          <KhatmahHistoryModal
            history={history}
            onClose={() => setHistoryModalOpen(false)}
            onDeleteItem={deleteHistoryItem}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. MANUAL PROGRESS EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {manualEditOpen && (
          <ManualEditModal
            currentPage={currentPage}
            onClose={() => setManualEditOpen(false)}
            onSave={async (newPage) => {
              await updateBookmark({ page: newPage });
              setManualEditOpen(false);
              showToast(`تم تحديث موضع التوقف إلى صفحة ${newPage} بنجاح ✨`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. JUZ DETAILS POPUP MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedJuzModal && (
          <JuzDetailsModal
            juz={selectedJuzModal}
            currentPage={currentPage}
            onClose={() => setSelectedJuzModal(null)}
            onJumpToPage={(p) => {
              setSelectedJuzModal(null);
              handleContinueReading(p);
            }}
            onSetBookmark={async (p) => {
              await updateBookmark({ page: p });
              setSelectedJuzModal(null);
              showToast(`تم تعيين علامة التوقف عند بداية ${selectedJuzModal.name}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. CONFIRM DELETE KHATMAH MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {confirmDeleteModalOpen && (
          <ConfirmDeleteModal
            khatmahName={plan?.name || 'ختمتي المباركة'}
            onClose={() => setConfirmDeleteModalOpen(false)}
            onConfirm={handleDeleteActiveKhatmah}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Khatmah Setup / Goal Wizard Modal
 * -----------------------------------------------------------------------------
 */
function KhatmahSetupModal({ initialDays = 30, onClose, onConfirm }) {
  const [selectedPreset, setSelectedPreset] = useState(initialDays);
  const [isCustomDays, setIsCustomDays] = useState(![7, 15, 30, 60].includes(initialDays));
  const [customDaysVal, setCustomDaysVal] = useState(isCustomDays ? initialDays : 45);
  const [startPageVal, setStartPageVal] = useState(1);
  const [khatmahName, setKhatmahName] = useState('ختمتي المباركة');

  const effectiveDays = isCustomDays ? Math.max(1, Number(customDaysVal) || 30) : selectedPreset;

  const targets = calculateWerdTargets({
    targetDays: effectiveDays,
    startPage: startPageVal,
    endPage: 604
  });

  const estimatedEndDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + effectiveDays);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [effectiveDays]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      name: khatmahName.trim() || 'ختمتي المباركة',
      targetDays: effectiveDays,
      startPage: startPageVal
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-700/60 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-serif">
              إعداد خطة الختمة القرآنية
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Khatmah Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">اسم الختمة:</label>
            <input
              type="text"
              value={khatmahName}
              onChange={(e) => setKhatmahName(e.target.value)}
              placeholder="مثال: ختمة شهر رمضان المبارك"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-900/80 focus:border-amber-400 text-sm text-slate-100 outline-none"
            />
          </div>

          {/* Duration Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">مدة الختمة المستهدفة:</label>
            <div className="grid grid-cols-2 gap-2">
              {KHATMAH_PRESETS.map((preset) => {
                const isSelected = !isCustomDays && selectedPreset === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setIsCustomDays(false);
                      setSelectedPreset(preset.days);
                    }}
                    className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                        : 'bg-slate-950 border-emerald-900/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                        {preset.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Days Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustomDays(true)}
                className={`w-full p-2.5 rounded-xl border text-right transition flex items-center justify-between text-xs ${
                  isCustomDays
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-slate-950 border-emerald-900/60 text-slate-400 hover:text-white'
                }`}
              >
                <span>تحديد عدد أيام مخصص (Custom)</span>
                {isCustomDays && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDaysVal}
                      onChange={(e) => setCustomDaysVal(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 px-2 py-1 rounded bg-slate-900 text-center font-bold text-amber-300 border border-amber-400/60 outline-none"
                    />
                    <span>يوماً</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Starting Point Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">نقطة البداية:</label>
            <select
              value={startPageVal}
              onChange={(e) => setStartPageVal(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-900/80 focus:border-amber-400 text-sm text-slate-100 outline-none"
            >
              <option value={1}>البداية من سورة الفاتحة (صفحة 1)</option>
              {SURAHS_LIST.slice(1).map((s) => (
                <option key={s.id} value={s.startPage}>
                  سورة {s.name} (صفحة {s.startPage})
                </option>
              ))}
            </select>
          </div>

          {/* Calculated Werd Live Preview Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>معاينة الورد اليومي المحسوب:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                <div className="text-base font-bold font-mono text-amber-300">
                  {targets.dailyPages}
                </div>
                <div className="text-[10px] text-slate-400">صفحة/يوم</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                <div className="text-base font-bold font-mono text-emerald-300">
                  {targets.dailyJuz}
                </div>
                <div className="text-[10px] text-slate-400">جزء/يوم</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                <div className="text-base font-bold font-mono text-cyan-300">
                  {targets.dailyHizb}
                </div>
                <div className="text-[10px] text-slate-400">حزب/يوم</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                <div className="text-base font-bold font-mono text-slate-200">
                  {targets.dailyAyahs}
                </div>
                <div className="text-[10px] text-slate-400">آية/يوم</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 text-center pt-1">
              تاريخ الختم المتوقع: <span className="text-amber-300 font-bold">{estimatedEndDateStr}</span>
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              توكلت على الله • ابدأ الختمة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Dua Khatm Al-Quran Celebratory Modal
 * -----------------------------------------------------------------------------
 */
function DuaKhatmModal({ isCompleted, onClose, onArchive }) {
  const [copied, setCopied] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: 16px, 1: 19px, 2: 23px
  const fontSizes = ['text-base leading-relaxed', 'text-lg leading-loose', 'text-xl leading-[2.4]'];

  const fullDuaText = DUA_KHATM_AL_QURAN.map((item) => `${item.title}:\n${item.arabic}`).join('\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullDuaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-300">
                دعاء ختم القرآن الكريم
              </h2>
              <p className="text-xs text-emerald-400">
                الدعاء المأثور عن أئمة الحرم المكي الشريف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size toggles */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-emerald-900/60 text-xs">
              {['صغير', 'متوسط', 'كبير'].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFontSizeIndex(idx)}
                  className={`px-2 py-1 rounded-lg transition ${
                    fontSizeIndex === idx
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="نسخ نص الدعاء"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Celebratory Message when 100% completed */}
        {isCompleted && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/60 text-center space-y-1 shrink-0 animate-pulse">
            <div className="text-base sm:text-lg font-bold font-serif text-amber-300">
              🎉 هَنِيئاً لَكَ خَتْمُ كِتَابِ اللَّهِ عَزَّ وَجَلَّ! 🎉
            </div>
            <div className="text-xs text-slate-200">
              « يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا »
            </div>
          </div>
        )}

        {/* Scrollable Dua Body */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 my-4 p-4 sm:p-6 rounded-2xl bg-slate-950/90 border border-emerald-950 space-y-6">
          <div className="text-center font-serif text-xl sm:text-2xl font-bold text-slate-200 border-b border-emerald-900/40 pb-3">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          {DUA_KHATM_AL_QURAN.map((item, idx) => (
            <div key={idx} className="space-y-1.5 text-right">
              <span className="text-[11px] font-bold text-amber-400/90 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                {item.title}
              </span>
              <p className={`font-serif text-slate-100 font-medium ${fontSizes[fontSizeIndex]}`}>
                {item.arabic}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 shrink-0 border-t border-emerald-900/60">
          {isCompleted && (
            <button
              type="button"
              onClick={onArchive}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>أرشفة الختمة والبدء بختمة جديدة</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm mr-auto"
          >
            إغلاق النافذة
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Khatmah History Modal
 * -----------------------------------------------------------------------------
 */
function KhatmahHistoryModal({ history = [], onClose, onDeleteItem }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-700/60 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif text-slate-100">
              سجل الختمات السابقة ({history.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              لا توجد ختمات سابقة مؤرشفة حتى الآن.
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-amber-300 font-serif text-sm truncate">
                    {item.name || `ختمة رقم #${history.length - idx}`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    اكتملت في {item.completedAt ? new Date(item.completedAt).toLocaleDateString('ar-EG') : 'تاريخ غير محدد'} • استغرقت {item.daysTaken || item.targetDays || 30} يوماً
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={() => onDeleteItem(idx)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition"
                      title="حذف هذه الختمة من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition shrink-0"
        >
          إغلاق
        </button>
      </motion.div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Manual Progress Update Modal
 * -----------------------------------------------------------------------------
 */
function ManualEditModal({ currentPage, onClose, onSave }) {
  const [pageInput, setPageInput] = useState(currentPage);

  const handleSubmit = (e) => {
    e.preventDefault();
    const p = Math.max(1, Math.min(604, Number(pageInput) || 1));
    onSave(p);
  };

  const surahAtPage = getSurahForPage(pageInput);
  const juzAtPage = getJuzForPage(pageInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-700/60 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold font-serif text-slate-100">
              تعديل موضع التوقف يدوياً
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold">
              رقم الصفحة التي وصلت إليها (1 إلى 604):
            </label>
            <input
              type="number"
              min="1"
              max="604"
              value={pageInput}
              onChange={(e) => setPageInput(Math.max(1, Math.min(604, Number(e.target.value) || 1)))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-900/80 focus:border-amber-400 text-lg font-bold font-mono text-center text-amber-300 outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center text-xs space-y-1">
            <div className="font-serif font-bold text-slate-200">
              سورة {surahAtPage.name} • {juzAtPage.name}
            </div>
            <div className="text-[11px] text-emerald-400">
              سيتم حفظ هذا الموضع كعلامة انطلاق وردك التالي.
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow transition active:scale-95"
            >
              حفظ الموضع الجديد
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Juz Details Popup Modal
 * -----------------------------------------------------------------------------
 */
function JuzDetailsModal({ juz, currentPage, onClose, onJumpToPage, onSetBookmark }) {
  const isJuzCompleted = currentPage > juz.endPage;
  const isJuzActive = currentPage >= juz.startPage && currentPage <= juz.endPage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-700/60 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-950 text-amber-400 font-bold font-mono text-xs flex items-center justify-center border border-amber-500/40">
              #{juz.juz}
            </span>
            <h2 className="text-base font-bold font-serif text-slate-100">
              {juz.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-900/60 space-y-1.5">
            <div className="text-slate-400 text-[11px]">مفتتح الجزء:</div>
            <div className="font-serif font-bold text-slate-100 text-sm">
              « {juz.firstText} »
            </div>
            <div className="text-[11px] text-emerald-400">
              يبدأ من سورة {juz.startSurahName} (آية {juz.startAyah}) حتى سورة {juz.endSurahName} (آية {juz.endAyah})
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-emerald-900/40">
            <span>نطاق الصفحات:</span>
            <span className="font-mono font-bold text-amber-300">
              ص {juz.startPage} إلى ص {juz.endPage} ({juz.endPage - juz.startPage + 1} صفحة)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-emerald-900/40">
            <span>حالة الإنجاز:</span>
            <span className="font-bold">
              {isJuzCompleted ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> تم إنجازه بالكامل
                </span>
              ) : isJuzActive ? (
                <span className="text-amber-400 font-bold">أنت تقرأ في هذا الجزء حالياً</span>
              ) : (
                <span className="text-slate-400">لم تصل إليه بعد</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onJumpToPage(juz.startPage)}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-xs shadow active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة هذا الجزء في المصحف</span>
          </button>

          <button
            type="button"
            onClick={() => onSetBookmark(juz.startPage)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            title="تعيين هذا الجزء كنقطة انطلاق الختمة الحالية"
          >
            تعيين كعلامة
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * -----------------------------------------------------------------------------
 * SUB-COMPONENT: Confirm Delete Khatmah Modal
 * -----------------------------------------------------------------------------
 */
function ConfirmDeleteModal({ khatmahName, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-800/60 shadow-2xl p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-slate-100">
              حذف الختمة الحالية
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            هل أنت متأكد من رغبتك في حذف <strong className="text-rose-300 font-serif">«{khatmahName}»</strong>؟
          </p>
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-200 text-xs space-y-1">
            <div className="font-bold">⚠️ تنبيه:</div>
            <div>
              سيتم إلغاء خطة الختمة الحالية ومسح مؤشر التوقف اليومي. لن يؤثر ذلك على الختمات السابقة المؤرشفة في السجل.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-900/40 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <MiniLoader size="xs" color="white" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الختمة</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}

