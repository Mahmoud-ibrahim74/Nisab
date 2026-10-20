import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  RotateCcw,
  Check,
  Copy,
  ChevronDown,
  Sparkles,
  Search,
  Volume2,
  LayoutGrid,
  List,
  BookmarkCheck
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';

export default function AzkarScreen({ onNavigate = null }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Counter progress tracking for each Dhikr item: { [dhikrId]: currentCount }
  const [counts, setCounts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');

  // View Mode: 'grid' (2 columns) | 'list' (1 column)
  const [viewMode, setViewMode] = useState('grid');

  // 1. Load All Categories from Resources/adhkar.json
  useEffect(() => {
    async function loadAzkar() {
      try {
        setLoading(true);
        const data = await window.nisabAPI.readJson('adhkar.json');
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to load adhkar:', err);
      } finally {
        setLoading(false);
      }
    }

    if (window.nisabAPI) {
      loadAzkar();
    }
  }, []);

  const currentCategory = categories[selectedCategoryIndex];

  // Increment counter for a specific zikr
  const handleIncrement = (id, targetCount) => {
    setCounts((prev) => {
      const current = prev[id] || 0;
      if (current < targetCount) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  // Reset single counter
  const handleReset = (id) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  // Reset all in current category
  const handleResetCategory = () => {
    setCounts({});
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter categories by search
  const filteredCategories = categories.filter((c) =>
    c.category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-4 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 flex items-center gap-2.5 sm:gap-3">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              <span>الأذكار والتسبيح اليومي</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              حصن المسلم وأدعية اليوم والليلة بعداد تسبيح تفاعلي
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onNavigate && (
              <button
                onClick={() => onNavigate('various_azkar')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-emerald-950 border border-amber-500/50 hover:border-amber-400 text-xs text-amber-300 font-bold transition shadow hover:bg-emerald-900"
                title="تصفح أذكار وفضائل مأثورة بأصولها من السنة النبوية"
              >
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                <span>أذكار وفضائل مأثورة (بالأدلة)</span>
              </button>
            )}

            {/* Reset All Button */}
            <button
              onClick={handleResetCategory}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-slate-900 border border-emerald-800 text-xs text-slate-300 hover:text-amber-300 transition shadow"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>إعادة تعيين العدادات</span>
            </button>
          </div>
        </div>

        {/* Category Selector Bar & Search */}
        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Category Dropdown */}
            <div className="flex-1 w-full">
              <select
                value={selectedCategoryIndex}
                onChange={(e) => {
                  setSelectedCategoryIndex(Number(e.target.value));
                  setCounts({});
                }}
                className="w-full bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                {categories.map((cat, idx) => (
                  <option key={cat.id || idx} value={idx} className="bg-slate-900 text-slate-100">
                    {cat.category} ({cat.array?.length || 0} أذكار)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Category Filter Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="ابحث في الأبواب..."
                className="w-full bg-slate-950 border border-emerald-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Selected Category Header Banner & View Mode Switcher */}
        {currentCategory && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 sm:py-3 border-b border-emerald-900/30">
            <div className="text-right">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-300">
                {currentCategory.category}
              </h2>
              <div className="text-xs text-emerald-400 mt-0.5">
                عدد الأذكار في هذا الباب: {currentCategory.array?.length || 0}
              </div>
            </div>

            {/* View Mode Toggle: Grid vs List with Spring Indicator */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-900/50 shadow-inner self-end sm:self-auto relative">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`relative p-1.5 rounded-lg transition z-10 ${
                  viewMode === 'grid'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض شبكة (عمودين متناسقين)"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="azkar-view-indicator"
                    className="absolute inset-0 bg-emerald-900/90 rounded-lg shadow border border-amber-500/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
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
                title="عرض قائمة (عمود واحد)"
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="azkar-view-indicator"
                    className="absolute inset-0 bg-emerald-900/90 rounded-lg shadow border border-amber-500/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <List className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Zikr Items List / Grid */}
        {loading ? (
          <div className="py-20 text-center text-emerald-400">جاري تحميل الأذكار...</div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6'
                : 'space-y-4 sm:space-y-6'
            }
          >
            {currentCategory?.array?.map((item) => {
              const target = item.count || 1;
              const current = counts[item.id] || 0;
              const isCompleted = current >= target;
              const progressPct = Math.min((current / target) * 100, 100);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  className={`relative rounded-3xl p-4 sm:p-6 md:p-8 border transition-all shadow-xl backdrop-blur-md overflow-hidden select-text flex flex-col justify-between h-full min-h-[220px] ${
                    isCompleted
                      ? 'bg-emerald-950/40 border-emerald-600/60 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/70 border-emerald-900/40 hover:border-amber-500/40'
                  }`}
                >
                  {/* Progress Line */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-950">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Zikr Arabic Text */}
                  <div className="flex-1 flex items-center font-serif text-lg sm:text-xl md:text-2xl text-slate-100 leading-relaxed sm:leading-loose text-justify mb-4 sm:mb-6 select-text cursor-text selection:bg-amber-400/35 selection:text-amber-100">
                    {item.text}
                  </div>

                  {/* Actions & Interactive Tasbeeh Button */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-emerald-900/40 select-none">
                    {/* Copy Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(item.id, item.text)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        {copiedId === item.id ? 'تم النسخ' : 'نسخ'}
                      </button>

                      {current > 0 && (
                        <button
                          onClick={() => handleReset(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white transition"
                          title="إعادة تعيين هذا الذكر"
                        >
                          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>

                    {/* Interactive Count Button */}
                    <button
                      onClick={() => handleIncrement(item.id, target)}
                      className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl font-bold transition-all shadow-lg select-none text-xs sm:text-sm ${
                        isCompleted
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold active:scale-95 shadow-amber-900/30'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <span>اكتمل ({target}/{target})</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white font-bold">سبّح</span>
                          <span className="font-mono bg-black/30 text-white px-2 py-0.5 rounded-lg font-bold">
                            {current} / {target}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
