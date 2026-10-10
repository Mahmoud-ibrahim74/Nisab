import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  X,
  Star,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Heart,
  LayoutGrid,
  List
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import { normalizeArabic } from '../../utils/arabicNormalizer';

export default function AsmaScreen() {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRange, setActiveRange] = useState('all'); // 'all' | 'fav' | '1-25' | '26-50' | '51-75' | '76-99'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_favorite_names');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal State for Viewing Name Details
  const [selectedName, setSelectedName] = useState(null);
  const [modalCount, setModalCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  // 1. Load 99 Names from Resources/99_Names_Of_Allah.json
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await window.nisabAPI.readJson('99_Names_Of_Allah.json');
        if (res && Array.isArray(res.data)) {
          setNames(res.data);
        }
      } catch (err) {
        console.error('Failed to load 99 Names of Allah:', err);
      } finally {
        setLoading(false);
      }
    }

    if (window.nisabAPI) {
      loadData();
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (number, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      let updated;
      if (prev.includes(number)) {
        updated = prev.filter((id) => id !== number);
      } else {
        updated = [...prev, number];
      }
      try {
        localStorage.setItem('nisab_favorite_names', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Copy Name Details (Arabic only)
  const handleCopy = (item, e) => {
    e?.stopPropagation();
    const copyText = `« ${item.name} » (الاسم رقم ${item.number})`;
    navigator.clipboard.writeText(copyText);
    setCopiedId(item.number);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Details Modal
  const handleOpenDetails = (item) => {
    setSelectedName(item);
    setModalCount(0);
  };

  // Navigate inside modal (Previous / Next)
  const handleNavigateModal = (direction) => {
    if (!selectedName || names.length === 0) return;
    const currentIndex = names.findIndex((n) => n.number === selectedName.number);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = names.length - 1;
    if (nextIndex >= names.length) nextIndex = 0;

    setSelectedName(names[nextIndex]);
    setModalCount(0);
  };

  // Name of the day (deterministic based on day of year)
  const nameOfTheDay = useMemo(() => {
    if (names.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % names.length;
    return names[index];
  }, [names]);

  // Filtered Names List
  const filteredNames = useMemo(() => {
    return names.filter((item) => {
      // 1. Filter by range / favorites
      if (activeRange === 'fav' && !favorites.includes(item.number)) {
        return false;
      }
      if (activeRange === '1-25' && (item.number < 1 || item.number > 25)) {
        return false;
      }
      if (activeRange === '26-50' && (item.number < 26 || item.number > 50)) {
        return false;
      }
      if (activeRange === '51-75' && (item.number < 51 || item.number > 75)) {
        return false;
      }
      if (activeRange === '76-99' && (item.number < 76 || item.number > 99)) {
        return false;
      }

      // 2. Filter by search query (Arabic or number)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const normQuery = normalizeArabic(query);
        const normName = normalizeArabic(item.name);
        const numStr = String(item.number);

        const matchesArabic = normName.includes(normQuery);
        const matchesNum = numStr === query;

        return matchesArabic || matchesNum;
      }

      return true;
    });
  }, [names, activeRange, favorites, searchQuery]);

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
        {/* Top Header: Title & Prophetic Hadith Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 font-serif">
                  أسماء الله الحسنى
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  تأمل واستحضر أسماء الله الحسنى التسعة والتسعين وفضل الذكر بها
                </p>
              </div>
            </div>
          </div>

          {/* Prophetic Hadith Card */}
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl px-4 py-2.5 shadow-lg max-w-md">
            <div className="text-xs sm:text-sm font-serif text-amber-200 text-center leading-relaxed">
              « إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ »
            </div>
            <div className="text-[10px] text-emerald-400 text-center font-mono mt-1">
              صحيح البخاري ومسلم
            </div>
          </div>
        </div>

        {/* Hero Card: Name of the Day */}
        {nameOfTheDay && !searchQuery && activeRange === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/40 shadow-2xl overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-right space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 text-xs sm:text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>اسم اليوم المبارك (الاسم رقم {nameOfTheDay.number})</span>
                </div>

                <div className="text-4xl sm:text-5xl font-serif font-bold text-amber-300 tracking-wide">
                  {nameOfTheDay.name}
                </div>

                <div className="text-sm font-serif text-emerald-300">
                  الاسم المبارك رقم {nameOfTheDay.number} من أسماء الله الحسنى
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => handleOpenDetails(nameOfTheDay)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg hover:scale-105 active:scale-95"
                >
                  عرض تفاصيل الاسم والتسبيح
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Bar & Range Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في أسماء الله الحسنى أو بالرقم (مثال: الرحمن، الملك، القدوس، 1)..."
                className="w-full bg-slate-900/80 border border-emerald-800/60 rounded-2xl pr-10 pl-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 shadow-inner transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Stats Pill */}
            <div className="text-xs text-amber-300 bg-emerald-950/80 px-4 py-2.5 rounded-2xl border border-emerald-800/60 font-semibold whitespace-nowrap self-stretch sm:self-auto text-center">
              عدد الأسماء: {filteredNames.length} / 99
            </div>
          </div>

          {/* Filter Range Chips & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'الكل (99)' },
                { id: 'fav', label: `المفضلة (${favorites.length})` },
                { id: '1-25', label: '1 - 25' },
                { id: '26-50', label: '26 - 50' },
                { id: '51-75', label: '51 - 75' },
                { id: '76-99', label: '76 - 99' },
              ].map((chip) => {
                const isActive = activeRange === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveRange(chip.id)}
                    className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-900/70 hover:bg-emerald-950/80 border border-emerald-900/50 text-slate-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle: Grid vs List with Spring Indicator */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-900/50 shadow-inner mr-auto sm:mr-0 relative">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`relative p-1.5 rounded-lg transition z-10 ${
                  viewMode === 'grid'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض شبكة بطاقات"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="asma-view-indicator"
                    className="absolute inset-0 bg-emerald-900/90 rounded-lg shadow border border-amber-500/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <LayoutGrid className="w-3.5 h-3.5" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`relative p-1.5 rounded-lg transition z-10 ${
                  viewMode === 'list'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض قائمة أفقية"
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="asma-view-indicator"
                    className="absolute inset-0 bg-emerald-900/90 rounded-lg shadow border border-amber-500/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <List className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 99 Names Cards Grid or List */}
        {loading ? (
          <div className="py-24 text-center text-emerald-400">
            <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
            جاري تحميل أسماء الله الحسنى...
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {filteredNames.map((item) => {
              const isFav = favorites.includes(item.number);
              const isCopied = copiedId === item.number;

              return (
                <motion.div
                  key={item.number}
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleOpenDetails(item)}
                  className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-slate-900/90 via-emerald-950/40 to-slate-900/90 border border-emerald-900/60 hover:border-amber-400/60 transition-all shadow-xl backdrop-blur-md cursor-pointer flex flex-col justify-between group overflow-hidden"
                >
                  {/* Gold accent sheen */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent group-hover:via-amber-400 transition-all" />

                  {/* Top Bar: Number Badge & Favorite + Copy */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-mono font-bold shadow">
                      {item.number}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleCopy(item, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-amber-300 transition"
                        title="نسخ تفاصيل الاسم"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => toggleFavorite(item.number, e)}
                        className={`p-1 rounded-lg transition ${
                          isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Main Calligraphy Name */}
                  <div className="text-center my-3">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-200 group-hover:text-amber-300 transition-colors tracking-wide py-1">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                      الاسم رقم {item.number}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredNames.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400">
                لا توجد أسماء مطابقة لبحثك.
              </div>
            )}
          </div>
        ) : (
          /* List Mode (Horizontal Rows) */
          <div className="space-y-2.5">
            {filteredNames.map((item) => {
              const isFav = favorites.includes(item.number);
              const isCopied = copiedId === item.number;

              return (
                <motion.div
                  key={item.number}
                  whileHover={{ scale: 1.008, x: -4 }}
                  onClick={() => handleOpenDetails(item)}
                  className="relative rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-slate-900/90 via-emerald-950/40 to-slate-900/90 border border-emerald-900/60 hover:border-amber-400/60 transition-all shadow-md backdrop-blur-md cursor-pointer flex items-center justify-between gap-3 group overflow-hidden"
                >
                  {/* Right Accent Sheen */}
                  <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-transparent via-amber-400/50 to-transparent group-hover:via-amber-400 transition-all" />

                  {/* Right side: Number Badge + Calligraphy Name */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-mono font-bold shadow shrink-0">
                      {item.number}
                    </span>

                    <div>
                      <div className="text-xl sm:text-2xl font-serif font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-emerald-400/80 font-mono">
                        الاسم رقم {item.number} من أسماء الله الحسنى
                      </div>
                    </div>
                  </div>

                  {/* Left side: Copy + Favorite Buttons + Arrow */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleCopy(item, e)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                      title="نسخ تفاصيل الاسم"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => toggleFavorite(item.number, e)}
                      className={`p-1.5 rounded-xl hover:bg-slate-800 transition ${
                        isFav ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>

                    <div className="p-1 rounded-lg text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredNames.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400">
                لا توجد أسماء مطابقة لبحثك.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comprehensive Modal for Name Details & Recitation */}
      <AnimatePresence>
        {selectedName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 overflow-hidden text-right"
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-mono font-bold shadow">
                    {selectedName.number}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-amber-300">
                      اسم الله: {selectedName.name}
                    </h3>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      الاسم رقم {selectedName.number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => toggleFavorite(selectedName.number, e)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-emerald-950/60 transition"
                    title="إضافة للمفضلة"
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(selectedName.number) ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => setSelectedName(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-950/60 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto space-y-5 my-4 px-1 scrollbar-thin scrollbar-thumb-emerald-800">
                {/* Grand Calligraphy Banner */}
                <div className="relative rounded-2xl p-6 text-center bg-gradient-to-b from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-amber-500/30 shadow-lg">
                  <div className="text-5xl sm:text-6xl font-serif font-bold text-amber-300 tracking-wider">
                    {selectedName.name}
                  </div>
                  <div className="text-xs text-amber-200/90 mt-2 font-serif">
                    « وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا »
                  </div>
                </div>

                {/* Interactive Tasbeeh with this Name */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/80 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-emerald-400" />
                      <span>تسبيح وذكر بهذا الاسم:</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      « يَا {selectedName.name.replace(/^ال/, '')} »
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalCount((c) => c + 1)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg active:scale-95"
                    >
                      <span>سبّح</span>
                      <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                        {modalCount}
                      </span>
                    </button>

                    {modalCount > 0 && (
                      <button
                        onClick={() => setModalCount(0)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="إعادة تعيين العداد"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer: Prev / Next Buttons & Copy */}
              <div className="mt-2 pt-3 sm:pt-4 border-t border-emerald-900/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleNavigateModal(1)}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الاسم السابق</span>
                </button>

                <button
                  onClick={(e) => handleCopy(selectedName, e)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-xs text-amber-300 font-semibold border border-emerald-700/50 transition"
                >
                  {copiedId === selectedName.number ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === selectedName.number ? 'تم النسخ' : 'نسخ'}</span>
                </button>

                <button
                  onClick={() => handleNavigateModal(-1)}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  <span>الاسم التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
