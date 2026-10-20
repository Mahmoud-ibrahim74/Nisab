import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import {
  Sparkles,
  Search,
  X,
  Heart,
  RotateCcw,
  Check,
  BookOpen,
  Layers,
  List,
  LayoutList,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import TextView from '../components/TextView';
import ArabesquePattern from '../components/ArabesquePattern';
import Loader from '../components/Loader';
import { normalizeArabic } from '../../utils/arabicNormalizer';

export default function VariousAzkarScreen({ onBack = null }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'hundred' | 'istighfar' | 'tasbeeh' | 'tahmeed' | 'tahleel'
  const [isContinuousView, setIsContinuousView] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Active Dhikr interactive repetition counter: { [itemId]: count }
  const [counters, setCounters] = useState({});

  // 1. Load Dataset from Resources/various_adkar.json via IPC
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        let rawData = null;
        if (window.nisabAPI?.readJson) {
          rawData = await window.nisabAPI.readJson('various_adkar.json');
        } else {
          const response = await fetch('Resources/various_adkar.json');
          rawData = await response.json();
        }

        if (isMounted) {
          if (Array.isArray(rawData)) {
            const processed = rawData.map((item, idx) => {
              const id = idx + 1;
              const rawDesc = item.ZekrDesc
                ? item.ZekrDesc.replace(/^\[|\]$/g, '').trim()
                : '';
              const title = rawDesc || `الذكر المأثور #${id}`;
              const reps = Number(item.ZekrNoOfRep) || 1;
              const repsText =
                reps === 1
                  ? 'يُقال مرة واحدة'
                  : reps === 2
                  ? 'يُقال مرتان'
                  : reps <= 10
                  ? `يُقال ${reps} مرات`
                  : `يُقال ${reps} مرة`;

              const fullFormattedText = [
                `« ${item.ZekrContent.trim()} »`,
                '',
                `• عدد التكرار المشروع: ${repsText}`,
                rawDesc ? `• فضل الذكر: ${rawDesc}` : null,
                '',
                '• الفضل والدليل من السنة النبوية الشريفة:',
                item.Fadl.trim()
              ]
                .filter(Boolean)
                .join('\n');

              return {
                id,
                idInBook: id,
                title,
                subtitle: repsText,
                arabic: fullFormattedText,
                text: fullFormattedText,
                zekrContent: item.ZekrContent.trim(),
                fadl: item.Fadl.trim(),
                desc: rawDesc,
                reps,
                normContent: normalizeArabic(item.ZekrContent || ''),
                normFadl: normalizeArabic(item.Fadl || ''),
                normTitle: normalizeArabic(title || ''),
                sourceFile: 'various_adkar.json',
                bookFile: 'various_adkar.json'
              };
            });

            setItems(processed);
          } else {
            throw new Error('بيانات الأذكار غير صالحة');
          }
        }
      } catch (err) {
        console.error('Failed to load various_adkar data:', err);
        if (isMounted) {
          setLoadError('تعذر تحميل ملف الأذكار المتنوعة. يرجى إعادة المحاولة.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items based on activeFilter and searchQuery
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let list = items;

    // Filter by category
    if (activeFilter === 'hundred') {
      list = list.filter((it) => it.reps >= 100);
    } else if (activeFilter === 'istighfar') {
      list = list.filter(
        (it) =>
          it.normContent.includes('استغف') ||
          it.normContent.includes('غفر') ||
          it.normFadl.includes('استغف') ||
          it.normFadl.includes('غفر') ||
          it.normTitle.includes('استغفار') ||
          it.normTitle.includes('غفر')
      );
    } else if (activeFilter === 'tasbeeh') {
      list = list.filter(
        (it) =>
          it.normContent.includes('سبحان') ||
          it.normContent.includes('تسبيح') ||
          it.normFadl.includes('سبحان') ||
          it.normTitle.includes('سبحان')
      );
    } else if (activeFilter === 'tahmeed') {
      list = list.filter(
        (it) =>
          it.normContent.includes('الحمد') ||
          it.normFadl.includes('الحمد') ||
          it.normFadl.includes('حمادون') ||
          it.normTitle.includes('الحمد')
      );
    } else if (activeFilter === 'tahleel') {
      list = list.filter(
        (it) =>
          it.normContent.includes('لا اله الا الله') ||
          it.normContent.includes('لا حول') ||
          it.normFadl.includes('تهليل') ||
          it.normFadl.includes('حوقله')
      );
    }

    // Filter by search query
    const q = searchQuery.trim();
    if (!q) return list;

    // Check if ID search like #5 or 5
    const idMatch = q.match(/^#?(\d+)$/);
    if (idMatch) {
      const idNum = parseInt(idMatch[1], 10);
      const match = list.filter((it) => it.id === idNum);
      if (match.length > 0) return match;
    }

    const normQ = normalizeArabic(q);
    return list.filter((it) => {
      return (
        it.normContent.includes(normQ) ||
        it.normFadl.includes(normQ) ||
        it.normTitle.includes(normQ)
      );
    });
  }, [items, activeFilter, searchQuery]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none overflow-hidden">
        <ArabesquePattern />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-3xl bg-slate-900/80 border border-emerald-900/50 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Sparkles className="w-8 h-8 animate-pulse text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-300 font-serif">أذكار وفضائل مأثورة</h2>
            <p className="text-xs text-emerald-400 mt-1 font-mono">34 ذكراً مأثوراً مع أصولها وفضائلها من دواوين السنة</p>
          </div>
          <Loader text="جاري تحميل الأذكار وفضائلها..." />
        </div>
      </div>
    );
  }

  // Error Screen
  if (loadError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <ArabesquePattern />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-3xl bg-rose-950/40 border border-rose-800/60 shadow-2xl backdrop-blur-xl">
          <Heart className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-bold text-rose-200">حدث خطأ أثناء التحميل</h2>
          <p className="text-xs text-rose-300">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-2xl bg-rose-900/80 hover:bg-rose-850 text-white font-semibold text-xs transition border border-rose-700/60 shadow"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Header Extra Component: Search Bar + Filter Chips + View Mode Switcher
  const headerExtraContent = (
    <div className="w-full space-y-3 pt-1">
      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            startTransition(() => {
              setSearchQuery(val);
            });
          }}
          placeholder="ابحث في نصوص الأذكار أو فضائلها والأحاديث النبوية (مثال: الاستغفار، سيد الاستغفار، غفرت ذنوبه)..."
          className="w-full pr-10 pl-28 py-2.5 sm:py-3 rounded-2xl bg-slate-900/95 border border-emerald-800/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder-slate-500 text-xs sm:text-sm outline-none transition shadow-inner font-sans"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery.trim() && (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 select-none">
              {filteredItems.length} نتيجة
            </span>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition font-medium select-none shadow-sm ${
              activeFilter === 'all'
                ? 'bg-amber-600 text-white font-bold shadow-amber-900/40'
                : 'bg-slate-900/80 hover:bg-emerald-950 text-slate-300 hover:text-white border border-emerald-900/60'
            }`}
          >
            الكل ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('hundred')}
            className={`px-3 py-1.5 rounded-xl transition font-medium select-none shadow-sm ${
              activeFilter === 'hundred'
                ? 'bg-amber-600 text-white font-bold shadow-amber-900/40'
                : 'bg-slate-900/80 hover:bg-emerald-950 text-slate-300 hover:text-white border border-emerald-900/60'
            }`}
          >
            المكررة (100 مرة)
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('istighfar')}
            className={`px-3 py-1.5 rounded-xl transition font-medium select-none shadow-sm ${
              activeFilter === 'istighfar'
                ? 'bg-amber-600 text-white font-bold shadow-amber-900/40'
                : 'bg-slate-900/80 hover:bg-emerald-950 text-slate-300 hover:text-white border border-emerald-900/60'
            }`}
          >
            الاستغفار ومحو الذنوب
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('tasbeeh')}
            className={`px-3 py-1.5 rounded-xl transition font-medium select-none shadow-sm ${
              activeFilter === 'tasbeeh'
                ? 'bg-amber-600 text-white font-bold shadow-amber-900/40'
                : 'bg-slate-900/80 hover:bg-emerald-950 text-slate-300 hover:text-white border border-emerald-900/60'
            }`}
          >
            التسبيح والتحميد
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('tahleel')}
            className={`px-3 py-1.5 rounded-xl transition font-medium select-none shadow-sm ${
              activeFilter === 'tahleel'
                ? 'bg-amber-600 text-white font-bold shadow-amber-900/40'
                : 'bg-slate-900/80 hover:bg-emerald-950 text-slate-300 hover:text-white border border-emerald-900/60'
            }`}
          >
            التهليل وكنوز الجنة
          </button>
        </div>

        {/* View Mode Toggle: Single with arrows vs Continuous stream */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-900/60 self-end sm:self-auto shadow-inner text-xs">
          <button
            type="button"
            onClick={() => setIsContinuousView(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
              !isContinuousView
                ? 'bg-emerald-900/90 text-amber-300 font-bold border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="تصفح ذكر بذكر مع أزرار التنقل"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ذكر بذكر</span>
          </button>

          <button
            type="button"
            onClick={() => setIsContinuousView(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
              isContinuousView
                ? 'bg-emerald-900/90 text-amber-300 font-bold border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="عرض جميع الأذكار في قائمة مستمرة"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>عرض متتابع</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      <ArabesquePattern />

      {/* Universal TextView Component */}
      <div className="relative z-10 w-full h-full flex flex-col min-w-0">
        <TextView
          itemsList={filteredItems}
          lazyLoad={isContinuousView}
          partitionSize={20}
          title="موسوعة الأذكار والفضائل المأثورة"
          sourceTitle="صحيح الأذكار النبوية وفضائلها"
          sourceAuthor="ديوان الأذكار والأدعية من دواوين السنة المطهرة"
          subtitle={isContinuousView ? 'عرض متتابع لجميع الأذكار' : undefined}
          onBack={onBack}
          backButtonText="الرجوع"
          headerExtra={headerExtraContent}
          searchQuery={searchQuery}
          emptyMessage="لم يتم العثور على أي ذكر يطابق كلمة البحث أو التصنيف المحدد"
          footerLabel="موسوعة الأذكار والفضائل المأثورة • نِصاب"
          storageKey="various_adkar_highlights"
          enablePen={true}
          enablePrint={true}
          enableCopy={true}
          enableFavorite={true}
          enableFontResize={true}
          enableNavigation={!isContinuousView}
          enableAutoScroll={true}
          enableFullscreen={true}
        />
      </div>
    </div>
  );
}
