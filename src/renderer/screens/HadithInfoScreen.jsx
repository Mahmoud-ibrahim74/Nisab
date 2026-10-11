import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Share2,
  Bookmark,
  Type,
  Scroll,
  Info,
  Printer,
  Star,
  Highlighter,
  Eraser,
  Trash2,
  Palette,
  Save
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import PrintPreview from './PrintPreview';

// Pen Cursor Data URIs
const PEN_CURSORS = {
  amber: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23f59e0b' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='m15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  emerald: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%2310b981' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='m15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  cyan: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%2306b6d4' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='m15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  rose: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23f43f5e' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='m15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  eraser: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23f43f5e' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/><path d='M22 21H7'/><path d='m5 11 9 9'/></svg>") 2 24, pointer`
};

// Available Highlighter Color Palette
const HIGHLIGHT_COLOR_CONFIG = {
  amber: {
    id: 'amber',
    label: 'أصفر ذهبي',
    bg: 'bg-amber-400/35',
    border: 'border-b-2 border-amber-400/90',
    text: 'text-amber-100',
    swatch: 'bg-amber-400',
    ring: 'ring-amber-400'
  },
  emerald: {
    id: 'emerald',
    label: 'أخضر زمردي',
    bg: 'bg-emerald-400/35',
    border: 'border-b-2 border-emerald-400/90',
    text: 'text-emerald-100',
    swatch: 'bg-emerald-400',
    ring: 'ring-emerald-400'
  },
  cyan: {
    id: 'cyan',
    label: 'أزرق سماوي',
    bg: 'bg-cyan-400/35',
    border: 'border-b-2 border-cyan-400/90',
    text: 'text-cyan-100',
    swatch: 'bg-cyan-400',
    ring: 'ring-cyan-400'
  },
  rose: {
    id: 'rose',
    label: 'وردي هادئ',
    bg: 'bg-rose-400/35',
    border: 'border-b-2 border-rose-400/90',
    text: 'text-rose-100',
    swatch: 'bg-rose-400',
    ring: 'ring-rose-400'
  }
};

/**
 * Computes non-overlapping render slices from full text and highlight ranges
 */
function getRenderSlices(fullText, highlights) {
  if (!highlights || highlights.length === 0 || !fullText) {
    return [{ isHighlight: false, text: fullText }];
  }

  const boundaries = new Set([0, fullText.length]);
  highlights.forEach((h) => {
    boundaries.add(Math.max(0, Math.min(fullText.length, h.start)));
    boundaries.add(Math.max(0, Math.min(fullText.length, h.end)));
  });

  const sortedPoints = Array.from(boundaries).sort((a, b) => a - b);
  const slices = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const segStart = sortedPoints[i];
    const segEnd = sortedPoints[i + 1];
    const segText = fullText.slice(segStart, segEnd);

    // Latest applied highlight takes precedence if multiple cover this segment
    const matchingHl = [...highlights].reverse().find(
      (h) => h.start <= segStart && h.end >= segEnd
    );

    if (matchingHl) {
      slices.push({
        isHighlight: true,
        highlightId: matchingHl.id,
        color: matchingHl.color || 'amber',
        text: segText,
        start: segStart,
        end: segEnd
      });
    } else {
      slices.push({
        isHighlight: false,
        text: segText,
        start: segStart,
        end: segEnd
      });
    }
  }

  return slices;
}

/**
 * Accurately extracts start and end character offsets of a window.getSelection()
 * relative to the target element's full text content.
 */
function getSelectionOffsetsWithin(element, fullText = '') {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);

  // Check if selection intersects the target element
  const isInside =
    element.contains(range.startContainer) ||
    element.contains(range.endContainer) ||
    (range.commonAncestorContainer && range.commonAncestorContainer.contains(element));
  if (!isInside) return null;

  let charCount = 0;
  let start = -1;
  let end = -1;

  // Walk all text nodes inside the element to accurately count character offsets
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent.length;

    if (node === range.startContainer) {
      start = charCount + Math.min(range.startOffset, nodeLength);
    }
    if (node === range.endContainer) {
      end = charCount + Math.min(range.endOffset, nodeLength);
    }

    charCount += nodeLength;
  }

  // If start or end wasn't found (e.g. selection started or ended on edge/quote/whitespace)
  if (start === -1) {
    start = 0;
  }
  if (end === -1) {
    end = charCount;
  }

  // Normalize if dragged backwards (from left to right in RTL or vice versa)
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  // Fallback: If range wasn't matched but text was selected, search substring
  const rawSelectedText = selection.toString().trim();
  if ((start === -1 || end === -1 || start >= end) && rawSelectedText && fullText) {
    const foundIdx = fullText.indexOf(rawSelectedText);
    if (foundIdx !== -1) {
      start = foundIdx;
      end = foundIdx + rawSelectedText.length;
    }
  }

  if (start === -1 || end === -1 || start >= end) {
    return null;
  }

  // Clamp within bounds
  const maxLen = fullText ? fullText.length : charCount;
  start = Math.max(0, Math.min(start, maxLen));
  end = Math.max(start, Math.min(end, maxLen));

  if (start >= end) return null;

  const resolvedText = fullText ? fullText.slice(start, end).trim() : rawSelectedText;
  if (!resolvedText) return null;

  return { start, end, text: resolvedText };
}

export default function HadithInfoScreen({ hadithData, onBack }) {
  const initialHadith = hadithData?.hadith || null;
  const currentBookData = hadithData?.currentBookData || null;
  const bookTitle =
    hadithData?.bookTitle ||
    currentBookData?.metadata?.arabic?.title ||
    'ديوان الحديث الشريف';
  const bookAuthor =
    hadithData?.bookAuthor ||
    currentBookData?.metadata?.arabic?.author ||
    '';

  const [hadith, setHadith] = useState(initialHadith);
  const [copied, setCopied] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);

  // Pen Writer States
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('amber'); // 'amber' | 'emerald' | 'cyan' | 'rose'
  const [penMode, setPenMode] = useState('highlight'); // 'highlight' | 'eraser'
  const [highlights, setHighlights] = useState([]);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Ref to the text container containing only hadith.arabic
  const hadithTextContainerRef = useRef(null);

  const fontSizes = [
    { label: 'صغير', className: 'text-base sm:text-lg leading-loose sm:leading-[2.4]' },
    { label: 'متوسط', className: 'text-lg sm:text-2xl leading-loose sm:leading-[2.6]' },
    { label: 'كبير', className: 'text-xl sm:text-3xl leading-loose sm:leading-[2.8]' },
    { label: 'كبير جداً', className: 'text-2xl sm:text-4xl leading-loose sm:leading-[3]' },
  ];

  // Update hadith if parent prop changes
  useEffect(() => {
    if (hadithData?.hadith) {
      setHadith(hadithData.hadith);
    }
  }, [hadithData]);

  const hadithKey = useMemo(() => {
    if (!hadith) return '';
    return `${hadith.bookFile || hadithData?.selectedBookFile || 'bukhari.json'}:${hadith.idInBook || hadith.id}`;
  }, [hadith, hadithData]);

  // Load highlights for this Hadith from localStorage and Disk
  useEffect(() => {
    if (!hadithKey) return;

    // 1. Synchronous fast load from localStorage
    try {
      const cached = localStorage.getItem(`nisab_hl_${hadithKey}`);
      if (cached) {
        setHighlights(JSON.parse(cached));
      } else {
        setHighlights([]);
      }
    } catch (e) {
      setHighlights([]);
    }

    // 2. Asynchronous disk sync via Electron IPC
    if (window.nisabAPI?.getHadithHighlights) {
      window.nisabAPI.getHadithHighlights(hadithKey).then((diskData) => {
        if (Array.isArray(diskData) && diskData.length > 0) {
          setHighlights(diskData);
          try {
            localStorage.setItem(`nisab_hl_${hadithKey}`, JSON.stringify(diskData));
          } catch (e) {}
        }
      }).catch((err) => {
        console.warn('Failed to read hadith highlights from disk:', err);
      });
    }
  }, [hadithKey]);

  // Persist highlights to both localStorage and Disk
  const saveHighlightsToDiskAndStorage = useCallback(
    async (newHighlights, message = 'تم حفظ التظليل على القرص 💾') => {
      setHighlights(newHighlights);
      if (!hadithKey) return;

      // 1. Save to localStorage
      try {
        localStorage.setItem(`nisab_hl_${hadithKey}`, JSON.stringify(newHighlights));
      } catch (e) {}

      // 2. Save to disk file via IPC
      try {
        if (window.nisabAPI?.saveHadithHighlights) {
          await window.nisabAPI.saveHadithHighlights(hadithKey, newHighlights);
        }
      } catch (err) {
        console.error('Failed to save highlights to disk:', err);
      }
    },
    [hadithKey]
  );

  // MouseUp Selection Handler on Hadith Text
  const handleMouseUpText = useCallback(() => {
    if (!isPenActive || penMode === 'eraser' || !hadithTextContainerRef.current || !hadith?.arabic) return;

    const offsets = getSelectionOffsetsWithin(hadithTextContainerRef.current, hadith.arabic);
    if (!offsets || offsets.start >= offsets.end || !offsets.text) return;

    // Add new highlight
    const newHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      start: offsets.start,
      end: offsets.end,
      color: penColor,
      text: offsets.text
    };

    // Filter out any highlights that are completely enveloped by the new range
    const filtered = highlights.filter(
      (h) => !(h.start >= newHighlight.start && h.end <= newHighlight.end)
    );
    const updated = [...filtered, newHighlight].sort((a, b) => a.start - b.start);

    // Clear browser selection
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    saveHighlightsToDiskAndStorage(updated, 'تم حفظ المقطع المظلل على القرص 💾');
  }, [isPenActive, penMode, hadith?.arabic, penColor, highlights, saveHighlightsToDiskAndStorage]);

  // Global document mouseup listener so releasing the mouse in card whitespace or padding still highlights!
  useEffect(() => {
    if (!isPenActive || penMode === 'eraser') return;

    const onDocMouseUp = () => {
      // Small timeout to allow browser selection to finish settling
      setTimeout(() => {
        handleMouseUpText();
      }, 20);
    };

    document.addEventListener('mouseup', onDocMouseUp);
    return () => {
      document.removeEventListener('mouseup', onDocMouseUp);
    };
  }, [isPenActive, penMode, handleMouseUpText]);

  // Click on a highlighted text span
  const handleHighlightClick = (highlightId, e) => {
    if (!isPenActive) return;
    e.stopPropagation();

    // In pen mode or eraser mode, clicking a highlight deletes it
    const updated = highlights.filter((h) => h.id !== highlightId);
    saveHighlightsToDiskAndStorage(updated, '');
  };

  // Clear all highlights for this Hadith
  const handleClearAllHighlights = () => {
    if (highlights.length === 0) return;
    if (window.confirm('هل تريد مسح جميع التظليلات المحفوظة لهذا الحديث على القرص؟')) {
      saveHighlightsToDiskAndStorage([], '');
    }
  };

  if (!hadith) {
    return (
      <div className="relative h-full w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6" dir="rtl">
        <ArabesquePattern className="opacity-10 text-emerald-500" />
        <div className="relative z-10 text-center space-y-4">
          <Scroll className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-200">لم يتم اختيار أي حديث</h2>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg hover:bg-amber-400 transition"
          >
            العودة إلى موسوعة الحديث
          </button>
        </div>
      </div>
    );
  }

  // Find Chapter / Bab information from book metadata if available
  const chapter = currentBookData?.chapters?.find(
    (c) => c.id === hadith.chapterId
  );
  const chapterName = chapter ? chapter.arabic : null;

  // Next and Previous Hadith navigation inside current book
  const hadithsList = currentBookData?.hadiths || [];
  const currentIndex = hadithsList.findIndex(
    (h) => (h.idInBook || h.id) === (hadith.idInBook || hadith.id)
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < hadithsList.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setHadith(hadithsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setHadith(hadithsList[currentIndex + 1]);
    }
  };

  // Copy full Hadith with source attribution
  const handleCopyHadith = () => {
    const lines = [
      `« ${hadith.arabic} »`,
      '',
      `[المصدر: ${bookTitle}${bookAuthor ? ` - ${bookAuthor}` : ''}]`,
      `[رقم الحديث: ${hadith.idInBook || hadith.id}]`,
      chapterName ? `[الباب: ${chapterName}]` : null,
      'تطبيق نِصاب'
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  useEffect(() => {
    const handleFavChange = () => {
      try {
        const saved = localStorage.getItem('nisab_favorite_hadiths');
        if (saved) setFavorites(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('nisab-favorites-changed', handleFavChange);
    return () => window.removeEventListener('nisab-favorites-changed', handleFavChange);
  }, []);

  const isFavorite = favorites.some((f) => f.key === hadithKey);

  const handleToggleFavorite = () => {
    if (!hadith) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.key === hadithKey);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.key !== hadithKey);
      } else {
        const newFav = {
          key: hadithKey,
          id: hadith.id,
          idInBook: hadith.idInBook || hadith.id,
          bookFile: hadith.bookFile || hadithData?.selectedBookFile || 'bukhari.json',
          bookTitle,
          bookAuthor,
          arabic: hadith.arabic,
          chapterId: hadith.chapterId
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

  // Open Print Preview Screen
  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  // Prepared render slices for Hadith text
  const renderSlices = useMemo(() => {
    return getRenderSlices(hadith.arabic, highlights);
  }, [hadith.arabic, highlights]);

  // Current active cursor styling
  const activeCursor = useMemo(() => {
    if (!isPenActive) return 'text';
    if (penMode === 'eraser') return PEN_CURSORS.eraser;
    return PEN_CURSORS[penColor] || PEN_CURSORS.amber;
  }, [isPenActive, penMode, penColor]);

  return (
    <div
      style={{ height: '100%', width: '100%', minWidth: 0, overflowY: 'auto' }}
      className="relative h-full w-full min-w-0 bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 no-print" />

      <div className="relative z-10 w-full min-w-0 max-w-[1700px] mx-auto space-y-4 sm:space-y-6 pb-16">
        {/* Navigation Bar & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 pb-5 select-none no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 hover:border-amber-400 text-amber-300 font-semibold text-xs sm:text-sm transition shadow-lg group active:scale-95"
            >
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              <span>الرجوع إلى الأحاديث</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>{bookTitle}</span>
              <span>•</span>
              <span className="text-amber-400 font-mono">حديث #{hadith.idInBook || hadith.id}</span>
            </div>
          </div>

          {/* Action Bar (Pen Writer Toggle, Font size controls, Favorite, Print, Copy) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pen Writer Activation Button */}
            <button
              onClick={() => setIsPenActive((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition shadow-lg ${
                isPenActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 font-bold shadow-amber-500/20'
                  : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
              }`}
              title="تفعيل قلم التمييز لتظليل أي موضع في نص الحديث"
            >
              <Highlighter className={`w-4 h-4 ${isPenActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isPenActive ? 'القلم مُفعل' : 'قلم التظليل'}</span>
              {highlights.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isPenActive ? 'bg-slate-900 text-amber-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {highlights.length}
                </span>
              )}
            </button>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-emerald-900/50 shadow-inner">
              <span className="px-2 text-xs text-slate-400 hidden md:inline">الخط:</span>
              {fontSizes.map((fs, idx) => (
                <button
                  key={idx}
                  onClick={() => setFontSizeIndex(idx)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                    fontSizeIndex === idx
                      ? 'bg-amber-500 text-slate-950 shadow font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-emerald-950/60'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition shadow ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
              }`}
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'في المفضلة' : 'المفضلة'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm text-slate-200 hover:text-amber-300 transition shadow"
              title="طباعة نص الحديث الشريف"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة</span>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyHadith}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm text-slate-200 hover:text-amber-300 transition shadow"
              title="نسخ نص الحديث مع التخريج"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
              <span>{copied ? 'تم النسخ' : 'نسخ الحديث'}</span>
            </button>
          </div>
        </div>

        {/* PEN WRITER TOOLBAR (Expands when Pen is Active) */}
        <AnimatePresence>
          {isPenActive && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden no-print"
            >
              <div className="rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-amber-500/40 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Left: Mode switch & Color swatches */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-emerald-900/60 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setPenMode('highlight')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                        penMode === 'highlight'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                      <span>تظليل النص</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPenMode('eraser')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                        penMode === 'eraser'
                          ? 'bg-rose-500 text-white font-bold shadow'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="انقر على أي نص مظلل لمسحه"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>ممحاة</span>
                    </button>
                  </div>

                  {/* Color Swatches (Enabled in highlight mode) */}
                  {penMode === 'highlight' && (
                    <div className="flex items-center gap-2 pr-2 border-r border-emerald-900/60">
                      <span className="text-slate-400 text-[11px] hidden sm:inline">لون القلم:</span>
                      {Object.values(HIGHLIGHT_COLOR_CONFIG).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPenColor(c.id)}
                          className={`w-6 h-6 rounded-full ${c.swatch} transition transform hover:scale-110 shadow flex items-center justify-center ${
                            penColor === c.id ? `ring-2 ring-white scale-110 shadow-lg ${c.ring}` : 'opacity-80'
                          }`}
                          title={c.label}
                        >
                          {penColor === c.id && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Tip & Clear All button */}
                <div className="flex items-center gap-3 mr-auto sm:mr-0">
                  <div className="text-[11px] text-emerald-300/90 hidden lg:flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>حدد أي جملة بالفأرة وسيتم تظليلها وحفظها على القرص فوراً</span>
                  </div>

                  {highlights.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHighlights}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white transition shadow text-xs font-semibold"
                      title="مسح جميع التظليلات المحفوظة لهذا الحديث"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح الكل ({highlights.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Save / Status Toast Notification */}
        <AnimatePresence>
          {saveStatusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2.5 px-4 rounded-2xl bg-emerald-950/90 border border-amber-500/60 text-amber-300 font-semibold text-xs shadow-xl flex items-center justify-center gap-2 max-w-sm mx-auto no-print backdrop-blur-md"
            >
              <Save className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{saveStatusMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grand Hadith Presentation Card */}
        <motion.div
          key={hadith.idInBook || hadith.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full min-w-0 rounded-3xl p-5 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-emerald-950/40 border border-amber-500/30 shadow-2xl backdrop-blur-xl overflow-hidden select-text text-right"
        >
          {/* Top Gold Border Glow */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent no-print" />

          {/* Metadata Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-emerald-900/50 select-none">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center font-mono font-bold text-sm sm:text-base shadow-lg">
                #{hadith.idInBook || hadith.id}
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-amber-300 font-serif">
                  {bookTitle}
                </h1>
                {bookAuthor && (
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {bookAuthor}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {highlights.length > 0 && (
                <div
                  className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                  title="المواضع المظللة والمحفوظة في هذا الحديث"
                >
                  <Highlighter className="w-3.5 h-3.5 text-amber-400" />
                  <span>{highlights.length} موضع مظلل</span>
                </div>
              )}

              {chapterName && (
                <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-xs text-amber-300 font-serif">
                  {chapterName}
                </div>
              )}
            </div>
          </div>

          {/* Full Arabic Hadith Body (Interactive Pen Highlighter & Selectable) */}
          <div
            className="my-6 sm:my-8 select-text transition-all w-full min-w-0"
            style={{ cursor: activeCursor }}
          >
            <div
              className={`font-serif text-slate-100 text-justify tracking-wide select-text selection:bg-amber-400/40 selection:text-amber-100 leading-loose break-words [overflow-wrap:anywhere] ${fontSizes[fontSizeIndex].className}`}
            >
              <span className="text-amber-400 font-serif text-2xl sm:text-3xl font-bold inline-block ml-1 select-none">
                «
              </span>

              {/* Text Area Container for precise selection calculation */}
              <span
                ref={hadithTextContainerRef}
                onMouseUp={handleMouseUpText}
                className="select-text"
                style={{ cursor: activeCursor }}
              >
                {renderSlices.map((slice, sIdx) => {
                  if (slice.isHighlight) {
                    const colorCfg =
                      HIGHLIGHT_COLOR_CONFIG[slice.color] || HIGHLIGHT_COLOR_CONFIG.amber;
                    return (
                      <mark
                        key={`hl-${slice.highlightId}-${sIdx}`}
                        onClick={(e) => handleHighlightClick(slice.highlightId, e)}
                        title={
                          isPenActive
                            ? penMode === 'eraser'
                              ? 'انقر لمسح هذا التظليل'
                              : 'انقر لإزالة التظليل'
                            : 'نص مظلل ومحفوظ على القرص'
                        }
                        className={`${colorCfg.bg} ${colorCfg.border} ${colorCfg.text} px-0.5 py-0.5 rounded transition-all duration-150 inline ${
                          isPenActive ? 'hover:opacity-75 hover:line-through cursor-pointer' : ''
                        }`}
                      >
                        {slice.text}
                      </mark>
                    );
                  }
                  return <span key={`plain-${sIdx}`}>{slice.text}</span>;
                })}
              </span>

              <span className="text-amber-400 font-serif text-2xl sm:text-3xl font-bold inline-block mr-1 select-none">
                »
              </span>
            </div>
          </div>

          {/* Footer Attribution Chips */}
          <div className="pt-6 border-t border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 select-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-emerald-400">
                ديوان: {bookTitle}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-slate-300 font-mono">
                رقم الحديث في الديوان: #{hadith.idInBook || hadith.id}
              </span>
              {chapterName && (
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-amber-300">
                  {chapterName}
                </span>
              )}
            </div>

            <div className="text-[11px] text-emerald-500/90 font-medium no-print">
              موسوعة الحديث الشريف • نِصاب
            </div>
          </div>

          {/* Print Document Verification Footer */}
          <div className="hidden print:block text-center pt-5 mt-6 border-t border-slate-300 text-xs text-slate-600">
            طُبع من تطبيق نِصاب للمسلمين • {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Previous & Next Hadith Navigation Controls */}
        {hadithsList.length > 0 && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 select-none pt-2 no-print w-full">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>الحديث السابق ({currentIndex > 0 ? `#${hadithsList[currentIndex - 1].idInBook || hadithsList[currentIndex - 1].id}` : ''})</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {currentIndex + 1} من {hadithsList.length}
            </span>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
            >
              <span>الحديث التالي ({hasNext ? `#${hadithsList[currentIndex + 1].idInBook || hadithsList[currentIndex + 1].id}` : ''})</span>
              <ChevronLeft className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        )}
      </div>

      {/* Live Interactive Print Preview Screen */}
      {showPrintPreview && (
        <PrintPreview
          hadith={hadith}
          bookTitle={bookTitle}
          bookAuthor={bookAuthor}
          chapterName={chapterName}
          highlights={highlights}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
}
