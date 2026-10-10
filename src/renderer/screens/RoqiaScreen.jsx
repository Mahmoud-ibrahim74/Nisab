import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  Heart,
  RotateCcw,
  Check,
  Copy,
  Star,
  Search,
  X,
  LayoutGrid,
  List,
  ZoomIn,
  ZoomOut,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import { normalizeArabic } from '../../utils/arabicNormalizer';

export default function RoqiaScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'quran' | 'prophetic' | 'sihr' | 'fav'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [fontSize, setFontSize] = useState(20); // base font size in px
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Progress counters: { [itemUid]: currentCount }
  const [counts, setCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_roqia_counts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Favorites list: [itemUid, ...]
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_favorite_roqia');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load roqia.json data
  useEffect(() => {
    async function loadRoqia() {
      try {
        setLoading(true);
        const res = await window.nisabAPI.readJson('roqia.json');
        if (res && res.ruqyah) {
          setData(res.ruqyah);
        }
      } catch (err) {
        console.error('Failed to load roqia.json:', err);
      } finally {
        setLoading(false);
      }
    }

    if (window.nisabAPI) {
      loadRoqia();
    }
  }, []);

  // Save counts to localStorage
  const handleIncrement = (uid, targetRepeat) => {
    setCounts((prev) => {
      const current = prev[uid] || 0;
      if (current < targetRepeat) {
        const updated = { ...prev, [uid]: current + 1 };
        try {
          localStorage.setItem('nisab_roqia_counts', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      }
      return prev;
    });
  };

  const handleResetItem = (uid) => {
    setCounts((prev) => {
      const updated = { ...prev, [uid]: 0 };
      try {
        localStorage.setItem('nisab_roqia_counts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleResetAll = () => {
    setCounts({});
    try {
      localStorage.removeItem('nisab_roqia_counts');
    } catch (e) {}
  };

  // Toggle favorite
  const toggleFavorite = (uid, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      let updated;
      if (prev.includes(uid)) {
        updated = prev.filter((id) => id !== uid);
      } else {
        updated = [...prev, uid];
      }
      try {
        localStorage.setItem('nisab_favorite_roqia', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Copy item text
  const handleCopy = (uid, text, title) => {
    const copyContent = `${text}\n[${title || 'الرقية الشرعية'}]`;
    navigator.clipboard.writeText(copyContent);
    setCopiedId(uid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Combine Quran verses and Prophetic supplications into a unified normalized list
  const allItems = useMemo(() => {
    if (!data?.content) return [];

    const quranItems = (data.content.quran_verses || []).map((item) => ({
      ...item,
      uid: `quran_${item.id}`,
      category: 'quran',
      categoryName: 'القرآن الكريم',
      title: item.surah,
      isSihr: (item.type || '').includes('سحر') || (item.type || '').includes('حسد')
    }));

    const propheticItems = (data.content.prophetic_supplications || []).map((item) => ({
      ...item,
      uid: `prophetic_${item.id}`,
      category: 'prophetic',
      categoryName: 'السنة النبوية',
      title: item.reference || 'حديث شريف',
      isSihr: (item.target || '').includes('سحر') || (item.target || '').includes('حسد') || (item.target || '').includes('عين')
    }));

    return [...quranItems, ...propheticItems];
  }, [data]);

  // Filter items by tab and search query
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'fav' && !favorites.includes(item.uid)) {
        return false;
      }
      if (activeTab === 'quran' && item.category !== 'quran') {
        return false;
      }
      if (activeTab === 'prophetic' && item.category !== 'prophetic') {
        return false;
      }
      if (activeTab === 'sihr' && !item.isSihr) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery.trim().toLowerCase());
        const normText = normalizeArabic(item.text);
        const normTitle = normalizeArabic(item.title || '');
        const normType = normalizeArabic(item.type || item.target || '');
        return normText.includes(q) || normTitle.includes(q) || normType.includes(q);
      }

      return true;
    });
  }, [allItems, activeTab, favorites, searchQuery]);

  // Total completed progress
  const completedCount = useMemo(() => {
    return allItems.filter((item) => (counts[item.uid] || 0) >= (item.repeat || 1)).length;
  }, [allItems, counts]);

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-5 sm:space-y-7">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-amber-300 border border-amber-400/30 shadow-lg">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 font-serif flex items-center gap-2">
                  <span>الرقية الشرعية الشاملة</span>
                  <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-sans font-normal">
                    من الكتاب والسنة
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  آيات الشفاء والتحصين من القرآن الكريم والأدعية النبوية الصحيحة لطرد العين والحسد والمس
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Counter Stats */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Progress Badge */}
            <div className="text-xs font-semibold px-3.5 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 shadow flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-400" />
              <span>المكتمل:</span>
              <strong className="text-amber-300 font-mono text-sm">{completedCount}</strong>
              <span className="text-slate-400">/ {allItems.length}</span>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-emerald-900/50 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(16, s - 2))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                title="تصغير الخط"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-amber-300 px-1 font-bold">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                title="تكبير الخط"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Reset All Counters */}
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900 hover:bg-emerald-950 border border-emerald-900/60 text-xs text-slate-300 hover:text-amber-300 transition shadow"
                title="إعادة ضبط جميع العدادات"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الضبط</span>
              </button>
            )}

            {/* Instructions Toggle */}
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs text-amber-300 font-semibold transition shadow"
            >
              <Info className="w-3.5 h-3.5" />
              <span>آداب الرقية</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Ruqyah Etiquettes Banner */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-amber-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 shadow-xl backdrop-blur-md">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>من آداب وشروط الرقية الشرعية الصحيحة:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
                  <li><strong>اليقين التام:</strong> أن الشفاء بيد الله وحده، والرقية سبب شرعي مبارك.</li>
                  <li><strong>الطهارة واستقبال القبلة:</strong> يُستحب للمرقي والراقي الوضوء واستحضار عظمة كلام الله.</li>
                  <li><strong>وضع اليد والنفث:</strong> وضع اليد اليمنى على موضع الألم، والنفث الخفيف بريق يسير بعد قراءة المعوذات والفاتحة.</li>
                  <li><strong>التدبر والترتيل:</strong> القراءة بصوت مسموع مع التأني وتدبر معاني الآيات والأدعية النبوية.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Tabs */}
        <div className="space-y-3.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في آيات وأدعية الرقية أو الغرض (مثال: الفاتحة، الكرسي، السحر، العين، الشفاء)..."
              className="w-full bg-slate-900/80 border border-emerald-800/60 rounded-2xl pr-10 pl-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 shadow-inner transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs & View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `الكل (${allItems.length})` },
                { id: 'quran', label: `آيات القرآن (${allItems.filter((i) => i.category === 'quran').length})` },
                { id: 'prophetic', label: `الأدعية النبوية (${allItems.filter((i) => i.category === 'prophetic').length})` },
                { id: 'sihr', label: 'إبطال السحر والحسد' },
                { id: 'fav', label: `المفضلة (${favorites.length})` },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20'
                        : 'bg-slate-900/80 hover:bg-emerald-950/80 border border-emerald-900/50 text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher (Grid vs List) */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-900/50 shadow-inner mr-auto sm:mr-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-emerald-900/90 text-amber-300 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض شبكة بطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-emerald-900/90 text-amber-300 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض قائمة كاملة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ruqyah Items Content */}
        {loading ? (
          <div className="py-24 text-center text-emerald-400">
            <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
            جاري تحميل آيات وأدعية الرقية الشرعية...
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6'
                : 'space-y-4 sm:space-y-6'
            }
          >
            {filteredItems.map((item, index) => {
              const targetRepeat = item.repeat || 1;
              const current = counts[item.uid] || 0;
              const isCompleted = current >= targetRepeat;
              const isFav = favorites.includes(item.uid);
              const progressPct = Math.min((current / targetRepeat) * 100, 100);
              const isCopied = copiedId === item.uid;

              return (
                <motion.div
                  key={item.uid}
                  whileHover={{ scale: 1.008 }}
                  className={`relative rounded-3xl p-4 sm:p-6 md:p-8 border transition-all shadow-xl backdrop-blur-md overflow-hidden select-text flex flex-col justify-between h-full min-h-[260px] ${
                    isCompleted
                      ? 'bg-emerald-950/45 border-emerald-600/70 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/75 border-emerald-900/50 hover:border-amber-500/40'
                  }`}
                >
                  {/* Progress Line */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-950">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Card Header: Source & Type Tag & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3.5 select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-7 h-7 rounded-full bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-mono font-bold shadow shrink-0">
                        {index + 1}
                      </span>

                      {/* Source Badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${
                          item.category === 'quran'
                            ? 'bg-emerald-900/70 text-emerald-300 border-emerald-700/60'
                            : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                        }`}
                      >
                        {item.title}
                      </span>

                      {/* Type / Healing Goal Badge */}
                      {(item.type || item.target) && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-950/80 text-slate-300 border border-emerald-900/40">
                          {item.type || item.target}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.uid, item.text, item.title)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                        title="نسخ النص"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.uid, e)}
                        className={`p-1.5 rounded-xl hover:bg-slate-800 transition ${
                          isFav ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Main Text Content (Uthmani Quran or Hadith) */}
                  <div
                    style={{ fontSize: `${fontSize}px` }}
                    className="flex-1 flex items-center font-serif text-slate-100 leading-relaxed sm:leading-loose text-justify my-3 select-text cursor-text selection:bg-amber-400/35 selection:text-amber-100"
                  >
                    {item.text}
                  </div>

                  {/* Additional Practical Instruction / Target if available */}
                  {item.target && item.target.includes('يسبقها') && (
                    <div className="text-xs text-amber-300/80 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/30 my-2">
                      💡 {item.target}
                    </div>
                  )}

                  {/* Bottom Action Bar: Repeat Counter & Tasbeeh Button */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-emerald-900/40 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        التكرار الموصى به: <strong className="text-amber-300 font-mono">{targetRepeat}</strong> مرات
                      </span>

                      {current > 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetItem(item.uid)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="إعادة ضبط عداد هذا الذكر"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Interactive Tasbeeh Counter Button */}
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.uid, targetRepeat)}
                      className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl font-bold transition-all shadow-lg text-xs sm:text-sm active:scale-95 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <span>اكتملت القراءة ({targetRepeat}/{targetRepeat})</span>
                        </>
                      ) : (
                        <>
                          <span>اقرأ وكرّر</span>
                          <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                            {current} / {targetRepeat}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400/40 mx-auto" />
                <div>لا توجد آيات أو أدعية مطابقة للبحث المحدد.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
