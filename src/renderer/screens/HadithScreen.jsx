import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scroll,
  Search,
  BookOpen,
  Copy,
  Check,
  X,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  LayoutGrid,
  List,
  Info,
  Star
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import Loader from '../components/Loader';
import { findArabicMatches, normalizeArabic } from '../../utils/arabicNormalizer';

// The 9 Canonical Hadith Books in Resources/Hadiths/
const HADITH_BOOKS = [
  { file: 'bukhari.json', title: 'صحيح البخاري', author: 'الإمام البخاري', count: 7277 },
  { file: 'muslim.json', title: 'صحيح مسلم', author: 'الإمام مسلم', count: 7453 },
  { file: 'abudawud.json', title: 'سنن أبي داود', author: 'الإمام أبو داود', count: 5274 },
  { file: 'tirmidhi.json', title: 'جامع الترمذي', author: 'الإمام الترمذي', count: 3956 },
  { file: 'nasai.json', title: 'سنن النسائي', author: 'الإمام النسائي', count: 5758 },
  { file: 'ibnmajah.json', title: 'سنن ابن ماجه', author: 'الإمام ابن ماجه', count: 4341 },
  { file: 'malik.json', title: 'موطأ مالك', author: 'الإمام مالك', count: 1858 },
  { file: 'ahmed.json', title: 'مسند أحمد', author: 'الإمام أحمد بن حنبل', count: 2764 },
  { file: 'darimi.json', title: 'سنن الدارمي', author: 'الإمام الدارمي', count: 3503 },
];

/**
 * Animated Highlighting Component for Arabic Hadith text
 * Highlights matches accurately even when original text has Tashkeel (diacritics)
 */
function HighlightedArabicText({ text, query }) {
  if (!text || !query || !query.trim()) {
    return <span>{text}</span>;
  }

  const ranges = findArabicMatches(text, query);
  if (ranges.length === 0) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  ranges.forEach((range, idx) => {
    // Unmatched text before current match
    if (range.start > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>{text.slice(lastIndex, range.start)}</span>
      );
    }

    // Clean static highlighted segment
    const matchedSegment = text.slice(range.start, range.end);
    parts.push(
      <mark
        key={`match-${idx}`}
        className="bg-amber-400/25 text-amber-300 font-bold px-1.5 py-0.5 rounded-lg border border-amber-400/40 inline-block align-baseline mx-0.5 select-text"
      >
        {matchedSegment}
      </mark>
    );

    lastIndex = range.end;
  });

  // Remaining unmatched text after the last match
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">{text.slice(lastIndex)}</span>
    );
  }

  return <span>{parts}</span>;
}

/**
 * HadithCard Component:
 * - Displays a uniform card height across all grid/list items
 * - Allows full text selection and quick copying
 * - Includes a dedicated "عرض تفاصيل الحديث" button navigating to HadithInfoScreen
 */
function HadithCard({
  hadith,
  bookTitle,
  activeSearchTerm,
  isCopied,
  onCopy,
  onViewInfo,
  isFavorite,
  onToggleFavorite
}) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-3xl p-4 sm:p-6 bg-slate-900/75 border border-emerald-900/50 hover:border-amber-500/40 transition-all shadow-xl backdrop-blur-md text-right select-text h-[360px] sm:h-[380px] group"
    >
      {/* Top Gold Sheen accent */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      {/* Header Badge, Favorite & Copy Buttons */}
      <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3 mb-3 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-950 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-mono font-bold shadow">
            {hadith.idInBook || hadith.id}
          </span>
          <span className="text-xs font-semibold text-emerald-400 truncate max-w-[120px] sm:max-w-[180px]">
            {hadith.bookTitle || bookTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Star Favorite Button */}
          <button
            onClick={(e) => onToggleFavorite(hadith, e)}
            className={`p-1.5 rounded-xl transition ${
              isFavorite
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800'
            }`}
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={() => onCopy(hadith)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            title="نسخ الحديث"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">{isCopied ? 'تم' : 'نسخ'}</span>
          </button>
        </div>
      </div>

      {/* Arabic Content with Highlight & Soft Bottom Fade */}
      <div className="relative flex-1 select-text cursor-text overflow-hidden">
        <div className="font-serif text-base sm:text-lg md:text-xl text-slate-100 leading-relaxed sm:leading-loose select-text cursor-text selection:bg-amber-400/35 selection:text-amber-100">
          « <HighlightedArabicText text={hadith.arabic} query={activeSearchTerm} /> »
        </div>

        {/* Soft Fade Overlay */}
        <div className="absolute bottom-0 right-0 left-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pointer-events-none" />
      </div>

      {/* Card Footer: View Details Button */}
      <div className="mt-3 pt-2.5 border-t border-emerald-900/30 shrink-0 select-none">
        <button
          onClick={() => onViewInfo(hadith)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 active:scale-[0.98]"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>عرض تفاصيل الحديث</span>
          <ChevronLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default function HadithScreen({ onViewHadithInfo }) {
  const [selectedBookFile, setSelectedBookFile] = useState('bukhari.json');
  const [currentBookData, setCurrentBookData] = useState(null);
  const [hadithsList, setHadithsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search state (Offloaded to background worker thread via IPC)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  // Pagination for browsing
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // View Mode: 'grid' (2 uniform columns) | 'list' (1 uniform column)
  const [viewMode, setViewMode] = useState('grid');

  // 1. Load Selected Hadith Book
  useEffect(() => {
    async function loadBook() {
      setLoading(true);
      setSearchResults(null);
      setSearchQuery('');
      setActiveSearchTerm('');
      setPage(1);
      try {
        const data = await window.nisabAPI.readJson(`Hadiths/${selectedBookFile}`);
        setCurrentBookData(data);
        if (data?.hadiths) {
          setHadithsList(data.hadiths);
        }
      } catch (err) {
        console.error('Failed to load hadith book:', err);
      } finally {
        setLoading(false);
      }
    }

    if (window.nisabAPI) {
      loadBook();
    }
  }, [selectedBookFile]);

  // 2. Perform Normalized Search via Worker Thread IPC
  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      setActiveSearchTerm('');
      return;
    }

    setIsSearching(true);
    setActiveSearchTerm(query);
    try {
      // Offloads to background worker thread
      const results = await window.nisabAPI.searchHadith(query, {
        books: [selectedBookFile],
        limit: 100
      });
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
    setActiveSearchTerm('');
  };

  const handleCopyHadith = (hadith) => {
    const textToCopy = `« ${hadith.arabic} »\n[${hadith.bookTitle || currentBookData?.metadata?.arabic?.title || ''} - حديث رقم ${hadith.idInBook || hadith.id}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(hadith.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Favorites State initialized from localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_favorite_hadiths');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Active Filter: 'all' (Book hadiths) | 'fav' (Favorite hadiths)
  const [activeFilter, setActiveFilter] = useState('all');

  // Listen to favorite change events across screens
  useEffect(() => {
    const handleFavChange = () => {
      try {
        const saved = localStorage.getItem('nisab_favorite_hadiths');
        if (saved) {
          setFavorites(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('nisab-favorites-changed', handleFavChange);
    return () => window.removeEventListener('nisab-favorites-changed', handleFavChange);
  }, []);

  const getHadithKey = (h, bFile) => {
    const file = h.bookFile || bFile || selectedBookFile;
    const num = h.idInBook || h.id;
    return `${file}:${num}`;
  };

  const isFavorite = (h) => {
    const key = getHadithKey(h, selectedBookFile);
    return favorites.some((f) => f.key === key);
  };

  const toggleFavorite = (h, e) => {
    e?.stopPropagation();
    const key = getHadithKey(h, selectedBookFile);
    setFavorites((prev) => {
      const exists = prev.some((item) => item.key === key);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.key !== key);
      } else {
        const newFav = {
          key,
          id: h.id,
          idInBook: h.idInBook || h.id,
          bookFile: h.bookFile || selectedBookFile,
          bookTitle: h.bookTitle || currentBookData?.metadata?.arabic?.title,
          bookAuthor: h.bookAuthor || currentBookData?.metadata?.arabic?.author,
          arabic: h.arabic,
          chapterId: h.chapterId
        };
        updated = [newFav, ...prev];
      }
      try {
        localStorage.setItem('nisab_favorite_hadiths', JSON.stringify(updated));
        window.dispatchEvent(new Event('nisab-favorites-changed'));
      } catch (err) {}
      return updated;
    });
  };

  // Filtered Favorites based on search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const norm = normalizeArabic(searchQuery);
    return favorites.filter((f) => normalizeArabic(f.arabic).includes(norm));
  }, [favorites, searchQuery]);

  const displayedHadiths = activeFilter === 'fav'
    ? filteredFavorites.slice((page - 1) * pageSize, page * pageSize)
    : searchResults
    ? searchResults
    : hadithsList.slice((page - 1) * pageSize, page * pageSize);

  const totalItems = activeFilter === 'fav'
    ? filteredFavorites.length
    : searchResults
    ? searchResults.length
    : hadithsList.length;

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-4 sm:space-y-6">
        {/* Header & Book Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 flex items-center gap-2.5 sm:gap-3">
              <Scroll className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              <span>موسوعة الحديث الشريف</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              تصفح وابحث في دواوين السنة التسعة المعتمدة دون الحاجة للإنترنت
            </p>
          </div>

          {/* Book Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">الكتاب:</span>
            <select
              value={selectedBookFile}
              onChange={(e) => setSelectedBookFile(e.target.value)}
              className="w-full sm:w-auto bg-emerald-950/80 border border-emerald-700/60 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-300 font-semibold focus:outline-none cursor-pointer shadow-lg"
            >
              {HADITH_BOOKS.map((b) => (
                <option key={b.file} value={b.file} className="bg-slate-900 text-slate-100">
                  {b.title} ({b.count} حديث)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Search Bar (Normalized Arabic Search) */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3.5 sm:right-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في نصوص الأحاديث بدقة وبدون تشكيل (مثال: إنما الأعمال بالنيات)..."
            className="w-full bg-slate-900/80 border border-emerald-800/60 rounded-2xl pr-10 sm:pr-12 pl-20 sm:pl-24 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 shadow-inner transition"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute left-2 sm:left-2.5 top-1.5 sm:top-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-900/30"
          >
            {isSearching ? 'جاري البحث...' : 'بحث'}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-16 sm:left-20 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Filter Chips: All Hadiths vs Favorites (similar to AsmaScreen) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setPage(1);
              }}
              className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                activeFilter === 'all'
                  ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/30'
                  : 'bg-slate-900/80 hover:bg-emerald-950/80 border border-emerald-900/50 text-slate-300 hover:text-white'
              }`}
            >
              الكل ({currentBookData?.metadata?.arabic?.title || 'الكتاب الحالي'})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter('fav');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                activeFilter === 'fav'
                  ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/30'
                  : 'bg-slate-900/80 hover:bg-emerald-950/80 border border-emerald-900/50 text-slate-300 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeFilter === 'fav' ? 'fill-white text-white' : 'text-amber-400'}`} />
              <span>المفضلة ({favorites.length})</span>
            </button>
          </div>

          {activeFilter === 'fav' && favorites.length > 0 && (
            <div className="text-xs text-amber-300/80">
              عرض {displayedHadiths.length} من أصل {favorites.length} حديث في المفضلة
            </div>
          )}
        </div>

        {/* Search status or active book indicator & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-2 gap-2">
          <div>
            {activeFilter === 'fav' ? (
              <span className="text-amber-400 font-semibold">
                قائمة الأحاديث المفضلة ({favorites.length} حديث محفوظ)
              </span>
            ) : searchResults ? (
              <span className="text-amber-400 font-semibold">
                نتائج البحث: تم العثور على {searchResults.length} حديث مطابقة لكلمة «{activeSearchTerm}»
              </span>
            ) : (
              <span>
                الكتاب الحالي: <strong className="text-emerald-300">{currentBookData?.metadata?.arabic?.title || 'جاري التحميل...'}</strong> ({hadithsList.length} حديث)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!searchResults && (
              <div>صفحة {page} من {totalPages || 1}</div>
            )}

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-emerald-900/50 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-emerald-900/90 text-amber-300 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض شبكة (عمودين متناسقين)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-emerald-900/90 text-amber-300 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="عرض قائمة (عمود واحد)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hadith Cards Grid/List */}
        {loading ? (
          <Loader text="جاري تحميل الأحاديث..." />
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 items-start'
                : 'space-y-4 sm:space-y-6'
            }
          >
            {displayedHadiths.map((hadith) => (
              <HadithCard
                key={hadith.key || hadith.id}
                hadith={hadith}
                bookTitle={hadith.bookTitle || currentBookData?.metadata?.arabic?.title}
                activeSearchTerm={activeSearchTerm}
                isCopied={copiedId === hadith.id}
                onCopy={handleCopyHadith}
                isFavorite={isFavorite(hadith)}
                onToggleFavorite={toggleFavorite}
                onViewInfo={(h) => {
                  if (onViewHadithInfo) {
                    onViewHadithInfo({
                      hadith: h,
                      bookTitle: h.bookTitle || currentBookData?.metadata?.arabic?.title,
                      bookAuthor: h.bookAuthor || currentBookData?.metadata?.arabic?.author,
                      currentBookData,
                      selectedBookFile: h.bookFile || selectedBookFile
                    });
                  }
                }}
              />
            ))}

            {displayedHadiths.length === 0 && (
              <div className="col-span-full py-16 text-center space-y-3">
                {activeFilter === 'fav' ? (
                  <>
                    <Star className="w-12 h-12 text-amber-400/40 mx-auto" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-200">
                      لا توجد أحاديث في المفضلة بعد
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      يمكنك تمييز أي حديث وحفظه في قائمة المفضلة بالضغط على أيقونة النجمة ⭐ على بطاقة الحديث للرجوع إليه في أي وقت.
                    </p>
                  </>
                ) : (
                  <div className="text-slate-400">لا توجد أحاديث مطابقة لبحثك.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pagination Navigation (when not in search mode) */}
        {!searchResults && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-4 sm:pt-6 pb-8 sm:pb-12">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900 border border-emerald-800 text-xs text-slate-200 disabled:opacity-40"
            >
              الصفحة السابقة
            </button>
            <span className="text-xs text-amber-300 font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900 border border-emerald-800 text-xs text-slate-200 disabled:opacity-40"
            >
              الصفحة التالية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
