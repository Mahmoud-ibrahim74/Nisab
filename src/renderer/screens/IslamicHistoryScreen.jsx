import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Landmark,
  Search,
  X,
  History
} from 'lucide-react';
import TextView from '../components/TextView';
import ArabesquePattern from '../components/ArabesquePattern';
import Loader from '../components/Loader';
import { normalizeArabic } from '../../utils/arabicNormalizer';

export default function IslamicHistoryScreen({ onBack = null }) {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Load the 12.4 MB Dataset via Electron IPC with caching
  useEffect(() => {
    let isMounted = true;

    async function loadDataset() {
      setIsLoading(true);
      setLoadError(null);
      try {
        let data = null;
        if (window.nisabAPI?.readJson) {
          data = await window.nisabAPI.readJson('Quran/Islamic-history-data.json');
        } else {
          // Fallback fetch for web / vite preview
          const response = await fetch('Resources/Quran/Islamic-history-data.json');
          data = await response.json();
        }

        if (isMounted) {
          if (Array.isArray(data)) {
            // Pre-process items with normalized title/text for instant sub-millisecond search
            const processed = data.map((item, idx) => ({
              ...item,
              id: item.id || idx + 1,
              idInBook: item.id || idx + 1,
              normTitle: normalizeArabic(item.title || ''),
              normText: normalizeArabic(item.text || '')
            }));
            setHistoryData(processed);
          } else {
            throw new Error('بيانات التاريخ غير صالحة');
          }
        }
      } catch (err) {
        console.error('Failed to load Islamic History data:', err);
        if (isMounted) {
          setLoadError('تعذر تحميل بيانات التاريخ الإسلامي. يرجى إعادة المحاولة.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDataset();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered dataset by search query
  const filteredEvents = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const rawQuery = searchQuery.trim();
    if (!rawQuery) return historyData;

    // Check if user entered an ID search like #45 or 45
    const idMatch = rawQuery.match(/^#?(\d+)$/);
    if (idMatch) {
      const idQuery = parseInt(idMatch[1], 10);
      return historyData.filter(
        (item) =>
          item.id === idQuery ||
          item.idInBook === idQuery ||
          (item.date && item.date.some((d) => d.includes(rawQuery)))
      );
    }

    const normalizedQ = normalizeArabic(rawQuery);
    return historyData.filter((item) => {
      return (
        item.normTitle.includes(normalizedQ) ||
        item.normText.includes(normalizedQ) ||
        (item.date && item.date.some((d) => normalizeArabic(d).includes(normalizedQ)))
      );
    });
  }, [historyData, searchQuery]);

  // Render Loader state
  if (isLoading) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none overflow-hidden">
        <ArabesquePattern />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-3xl bg-slate-900/80 border border-emerald-900/50 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Landmark className="w-8 h-8 animate-pulse text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-300 font-serif">موسوعة التاريخ الإسلامي</h2>
            <p className="text-xs text-emerald-400 mt-1 font-mono">6,128 حدث تاريخي • 15 قرناً من الوقائع</p>
          </div>
          <Loader text="جاري تحميل فهرس وقائع التاريخ الإسلامي..." />
        </div>
      </div>
    );
  }

  // Render Error state
  if (loadError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <ArabesquePattern />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md p-8 rounded-3xl bg-rose-950/40 border border-rose-800/60 shadow-2xl backdrop-blur-xl">
          <History className="w-12 h-12 text-rose-400" />
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

  // Header Extra Component: Clean Search Bar with match count badge
  const headerExtraContent = (
    <div className="w-full pt-1">
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
          placeholder="ابحث في أحداث التاريخ الإسلامي (العنوان، النص، السنة، أو رقم الحدث)..."
          className="w-full pr-10 pl-28 py-3 rounded-2xl bg-slate-900/95 border border-emerald-800/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder-slate-500 text-xs sm:text-sm outline-none transition shadow-inner font-sans"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery.trim() && (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 select-none">
              {filteredEvents.length} نتيجة
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
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      <ArabesquePattern />

      {/* Embedded Single-Text TextView Component (identical to HadithInfoScreen) */}
      <div className="relative z-10 w-full h-full flex flex-col min-w-0">
        <TextView
          itemsList={filteredEvents}
          lazyLoad={true}
          partitionSize={30}
          title="موسوعة التاريخ الإسلامي"
          subtitle="سجل الأحداث والوقائع عبر التاريخ الإسلامي"
          author="سجل التاريخ والوقائع من 53 ق.هـ إلى 1443 هـ"
          onBack={onBack}
          backButtonText="الرجوع"
          headerExtra={headerExtraContent}
          searchQuery={searchQuery}
          emptyMessage="لم يتم العثور على أي أحداث تاريخية تطابق كلمة البحث"
          footerLabel="موسوعة التاريخ الإسلامي الشاملة • نِصاب"
          storageKey="islamic_history"
        />
      </div>
    </div>
  );
}
