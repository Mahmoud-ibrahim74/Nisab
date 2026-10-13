import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
  ExternalLink,
  Bookmark,
  Sparkles,
  Library,
  Filter,
  Check,
  Copy
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import MiniLoader from '../components/MiniLoader';
import { normalizeArabic } from '../../utils/arabicNormalizer';
import booksFallbackData from '../../Resources/books.json';

// Eastern Arabic numerals converter
function toEasternArabic(num) {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// Categories deduction for books
const CATEGORIES = [
  { id: 'all', label: 'جميع الكتب' },
  { id: 'fasting', label: 'الصيام وأحكامه', keywords: ['صيام', 'الصيام', 'رمضان'] },
  { id: 'sunnah', label: 'السيرة والشمائل', keywords: ['عاملهم', 'الأساليب النبوية', 'النبي'] },
  { id: 'worship', label: 'العبادات والمواسم', keywords: ['الصلاة', 'الخشوع', 'الأضحية', 'ذي الحجة'] },
  { id: 'family', label: 'الأسرة والبيوت', keywords: ['البيوت', 'إصلاح البيوت', 'أخطار'] },
  { id: 'heart', label: 'الرقائق والتزكية', keywords: ['الإيمان', 'الثبات', 'التوبة', 'الهموم', 'شكاوى', 'محرمات', 'المنهيات'] }
];

export default function BooksScreen({ onNavigate }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Bookmarks state (saved book titles in localStorage)
  const [savedFavorites, setSavedFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_books_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Load books data
  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        let data = null;
        if (window.nisabAPI?.readJson) {
          try {
            data = await window.nisabAPI.readJson('books.json');
          } catch (e) {}
        }
        if (!data || !Array.isArray(data) || data.length === 0) {
          data = booksFallbackData;
        }
        setBooks(data);
      } catch (err) {
        console.error('Failed to load books.json:', err);
        setBooks(booksFallbackData);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  // Filter books by search & category
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // Category match
      if (selectedCategory !== 'all') {
        const cat = CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat?.keywords) {
          const text = `${b.title} ${b.description}`;
          const matches = cat.keywords.some((kw) => text.includes(kw));
          if (!matches) return false;
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery.trim().toLowerCase());
        const normTitle = normalizeArabic((b.title || '').toLowerCase());
        const normDesc = normalizeArabic((b.description || '').toLowerCase());
        if (!normTitle.includes(q) && !normDesc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [books, selectedCategory, searchQuery]);

  // Toast trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Open book directly from URL
  const handleOpenBook = (book) => {
    if (!book?.link) return;
    try {
      if (window.nisabAPI?.openExternal) {
        window.nisabAPI.openExternal(book.link);
      } else {
        window.open(book.link, '_blank');
      }
      showToast(`جاري فتح: ${book.title}`);
    } catch (e) {
      window.open(book.link, '_blank');
    }
  };

  // Copy book link
  const handleCopyLink = (e, link) => {
    e.stopPropagation();
    if (!link) return;
    try {
      navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
      showToast('تم نسخ رابط الكتاب للحافظة');
    } catch (e) {}
  };

  // Toggle favorite bookmark
  const toggleFavorite = (e, bookTitle) => {
    e.stopPropagation();
    setSavedFavorites((prev) => {
      const exists = prev.includes(bookTitle);
      const updated = exists ? prev.filter((t) => t !== bookTitle) : [...prev, bookTitle];
      try {
        localStorage.setItem('nisab_books_favorites', JSON.stringify(updated));
      } catch (e) {}
      showToast(exists ? 'تمت إزالة الكتاب من المفضلة' : 'تم حفظ الكتاب في المفضلة');
      return updated;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Background Islamic Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <ArabesquePattern />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900 border border-amber-500/60 text-amber-300 shadow-2xl flex items-center gap-2 backdrop-blur-xl text-xs sm:text-sm font-semibold pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library Catalog Container */}
      <div className="relative flex-1 w-full h-full flex flex-col overflow-y-auto z-10 p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-emerald-800">
        {/* Library Header */}
        <header className="mb-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-amber-300 flex items-center gap-2">
                  <span>المكتبة الإسلامية</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 font-sans font-normal">
                    {toEasternArabic(books.length)} كتاباً
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  مجموعة من الرسائل العلمية والكتب المختصرة النافعة المقروءة مباشرة بصيغة PDF
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في عناوين وموضوعات الكتب..."
                className="w-full bg-slate-900/90 border border-emerald-800/80 rounded-xl pr-9 pl-8 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>التصنيف:</span>
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-amber-900/40'
                    : 'bg-slate-900/80 border border-emerald-900/60 text-slate-300 hover:text-amber-300 hover:border-amber-500/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        {/* Books Grid */}
        <main className="max-w-7xl mx-auto w-full flex-1">
          {loading ? (
            <div className="py-24 text-center text-amber-400">
              <MiniLoader size="lg" color="amber" text="جاري تجهيز رفوف المكتبة..." />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-base text-slate-300 font-semibold mb-1">لا توجد كتب تطابق البحث</div>
              <p className="text-xs text-slate-500">جرب كتابة كلمات بحث أخرى أو اختر تصنيفاً آخر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredBooks.map((book, idx) => {
                const originalIndex = books.findIndex((b) => b.title === book.title);
                const isFavorite = savedFavorites.includes(book.title);

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => handleOpenBook(book)}
                    className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/85 border border-emerald-900/60 hover:border-amber-500/60 shadow-xl overflow-hidden backdrop-blur-sm transition-all cursor-pointer"
                  >
                    {/* Top Ribbon & Favorite Bookmark Button */}
                    <button
                      onClick={(e) => toggleFavorite(e, book.title)}
                      className={`absolute top-2.5 left-2.5 z-20 p-2 rounded-full backdrop-blur-md border transition ${
                        isFavorite
                          ? 'bg-red-950/80 border-red-500 text-red-400'
                          : 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-amber-300'
                      }`}
                      title={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-400' : ''}`} />
                    </button>

                    {/* Card Cover Area */}
                    <div className="relative w-full h-56 bg-slate-950/60 overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="h-full object-contain rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://files.zadapps.info/islamqa.info/uploads/2024/08/cover-book-1-كونوا-على-الخير-أعوانا-540b86921cab3ae7ea0375bd6e3f7b33.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                        كتاب #{toEasternArabic(originalIndex + 1)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="font-serif font-bold text-sm sm:text-base text-amber-200 group-hover:text-amber-300 line-clamp-1 mb-2 transition"
                          title={book.title}
                        >
                          {book.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 text-justify">
                          {book.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-emerald-900/40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBook(book);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs transition shadow group/btn"
                        >
                          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                          <span>فتح وقراءة الكتاب</span>
                        </button>

                        <button
                          onClick={(e) => handleCopyLink(e, book.link)}
                          className={`p-2 rounded-xl bg-slate-950/80 border transition shadow ${
                            copiedLink === book.link
                              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
                              : 'border-slate-700/60 hover:border-amber-500/60 text-slate-300 hover:text-amber-300'
                          }`}
                          title="نسخ رابط الكتاب للحافظة"
                        >
                          {copiedLink === book.link ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
