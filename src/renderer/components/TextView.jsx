import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Gauge,
  Sparkles,
  Scroll,
  Printer,
  Star,
  Highlighter,
  Eraser,
  Trash2,
  Save,
  Maximize2,
  Minimize2,
  ArrowUp,
  LayoutList,
  BookOpen,
  Layers
} from 'lucide-react';
import ArabesquePattern from './ArabesquePattern';
import PrintPreview from '../screens/PrintPreview';
import WarningAlert from './WarningAlert';
import SwitchToggle from './SwitchToggle';
import IntroPillToast from './IntroPillToast';
import { findArabicMatches } from '../../utils/arabicNormalizer';

// Pre-configured Auto Scroll Speeds
const SCROLL_SPEEDS = [
  { value: 0.1, label: '0.1x', pixelsPerSecond: 10 },
  { value: 0.25, label: '0.25x', pixelsPerSecond: 20 },
  { value: 0.5, label: '0.5x', pixelsPerSecond: 30 },
  { value: 0.75, label: '0.75x', pixelsPerSecond: 50 },
  { value: 1, label: '1x', pixelsPerSecond: 80 },
  { value: 1.5, label: '1.5x', pixelsPerSecond: 130 },
  { value: 2, label: '2x', pixelsPerSecond: 200 },
  { value: 3, label: '3x', pixelsPerSecond: 320 },
];

// Pen Cursor Data URIs
const PEN_CURSORS = {
  amber: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23f59e0b' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='M15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  emerald: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%2310b981' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='M15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  cyan: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%2306b6d4' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='M15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
  rose: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%23f43f5e' stroke='%230f172a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m18 2 4 4-12 12H6v-4L18 2z'/><path d='M15 5 4 4'/><path d='M2 22h20'/></svg>") 2 24, crosshair`,
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
 * Accurately highlights Arabic search matches using normalizer ranges
 */
function HighlightedArabicText({ text, query }) {
  if (!text) return null;
  const q = query ? query.trim() : '';
  if (!q) return <>{text}</>;

  const cleanQuery = q.startsWith('#') ? q.slice(1).trim() : q;
  if (!cleanQuery) return <>{text}</>;

  const ranges = findArabicMatches(text, cleanQuery);
  if (!ranges || ranges.length === 0) return <>{text}</>;

  const parts = [];
  let lastIndex = 0;

  ranges.forEach((range, idx) => {
    if (range.start > lastIndex) {
      parts.push(
        <span key={`txt-${idx}`}>{text.slice(lastIndex, range.start)}</span>
      );
    }
    const matchedSegment = text.slice(range.start, range.end);
    parts.push(
      <mark
        key={`match-${idx}`}
        className="bg-amber-400/35 text-amber-200 font-bold px-1 py-0.5 rounded-lg border-b-2 border-amber-400/90 inline-block align-baseline mx-0.5 select-text shadow-sm"
      >
        {matchedSegment}
      </mark>
    );
    lastIndex = range.end;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="txt-end">{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

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
    element.contains(range.startContainer) &&
    element.contains(range.endContainer);
  if (!isInside) return null;

  let charCount = 0;
  let start = -1;
  let end = -1;

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

  if (start === -1) {
    start = 0;
  }
  if (end === -1) {
    end = charCount;
  }

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

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

  const maxLen = fullText ? fullText.length : charCount;
  start = Math.max(0, Math.min(start, maxLen));
  end = Math.max(start, Math.min(end, maxLen));

  if (start >= end) return null;

  let resolvedText = fullText ? fullText.slice(start, end) : rawSelectedText;
  if (!resolvedText || !resolvedText.trim()) return null;

  // Trim whitespace boundaries so highlight wraps words tightly
  if (fullText) {
    const trimmed = resolvedText.trim();
    const leadingSpaces = resolvedText.indexOf(trimmed[0]);
    if (leadingSpaces > 0) {
      start += leadingSpaces;
    }
    const trailingSpaces = resolvedText.length - leadingSpaces - trimmed.length;
    if (trailingSpaces > 0) {
      end -= trailingSpaces;
    }
    resolvedText = trimmed;
  }

  if (start >= end || !resolvedText) return null;

  return { start, end, text: resolvedText };
}

/**
 * TextView - Universal Global Component for displaying, highlighting, copying,
 * printing, and reading any text resource (Hadith, Athar, Tafsir, Articles, Quotes, etc.).
 *
 * Can be reused in HadithScreen, QuranScreen, BooksScreen, or any other section.
 */
export default function TextView({
  // Generic Props:
  text: propText,
  title: propTitle,
  author: propAuthor,
  subtitle: propSubtitle,
  id: propId,
  itemsList: propItemsList,
  storageKey: propStorageKey,
  onBack,
  backButtonText,
  emptyMessage = 'لم يتم اختيار أي نص',
  footerLabel = 'موسوعة النصوص الشريفة • نِصاب',
  enablePen = true,
  enablePrint = true,
  enableCopy = true,
  enableFavorite = true,
  enableFontResize = true,
  enableNavigation = true,
  enableAutoScroll = true,
  enableFullscreen = true,
  lazyLoad = false,
  partitionSize = 20,
  headerExtra = null,
  searchQuery = '',
  className = '',

  // Backward-compatibility props for HadithInfoScreen:
  hadithData,
  hadith: directHadith,
  bookTitle: directBookTitle,
  bookAuthor: directBookAuthor,
  chapterName: directChapterName,
}) {
  const currentItem = directHadith || hadithData?.hadith || null;
  const currentBookData = hadithData?.currentBookData || null;

  const [activeItem, setActiveItem] = useState(currentItem);

  // Update when props change
  useEffect(() => {
    if (directHadith) {
      setActiveItem(directHadith);
    } else if (hadithData?.hadith) {
      setActiveItem(hadithData.hadith);
    } else if (propItemsList) {
      if (propItemsList.length === 0) {
        setActiveItem(null);
      } else {
        setActiveItem((prev) => {
          if (!prev) return propItemsList[0];
          const exists = propItemsList.some(
            (it) => (it.idInBook || it.id) === (prev.idInBook || prev.id)
          );
          return exists ? prev : propItemsList[0];
        });
      }
    }
  }, [directHadith, hadithData, propItemsList]);

  // Derived Title, Author, Subtitle, ID
  const displayTitle =
    (activeItem?.title && propTitle ? `${propTitle} • ${activeItem.title}` : null) ||
    activeItem?.title ||
    propTitle ||
    directBookTitle ||
    hadithData?.bookTitle ||
    currentBookData?.metadata?.arabic?.title ||
    '';

  const displayAuthor =
    propAuthor ||
    directBookAuthor ||
    hadithData?.bookAuthor ||
    currentBookData?.metadata?.arabic?.author ||
    '';

  const chapter = currentBookData?.chapters?.find(
    (c) => c.id === activeItem?.chapterId
  );
  const displaySubtitle =
    propSubtitle ||
    directChapterName ||
    (chapter ? chapter.arabic : null);

  const displayId =
    propId !== undefined
      ? propId
      : (activeItem?.idInBook || activeItem?.id || '');

  // Active text content to display
  const activeText = useMemo(() => {
    if (propText) return propText;
    if (activeItem) return activeItem.arabic || activeItem.text || '';
    return '';
  }, [propText, activeItem]);

  const resolvedBackButtonText =
    backButtonText || (hadithData ? 'الرجوع إلى الأحاديث' : 'الرجوع');

  // Navigation List (Previous/Next)
  const navigationList =
    propItemsList ||
    hadithData?.hadithsList ||
    currentBookData?.hadiths ||
    [];

  const currentIndex = navigationList.findIndex(
    (item) => (item.idInBook || item.id) === (activeItem?.idInBook || activeItem?.id)
  );
  const hasPrev = enableNavigation && currentIndex > 0;
  const hasNext = enableNavigation && currentIndex >= 0 && currentIndex < navigationList.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setIsAutoScroll(false);
      setActiveItem(navigationList[currentIndex - 1]);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setIsAutoScroll(false);
      setActiveItem(navigationList[currentIndex + 1]);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }
  };

  // State Management
  const [copied, setCopied] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);

  // Pen Writer States
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('amber'); // 'amber' | 'emerald' | 'cyan' | 'rose'
  const [penMode, setPenMode] = useState('highlight'); // 'highlight' | 'eraser'
  const [highlights, setHighlights] = useState([]);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [clearAlertState, setClearAlertState] = useState(null);

  // Auto Scroll States & Container Ref
  const scrollContainerRef = useRef(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [isSpeedDropdownOpen, setIsSpeedDropdownOpen] = useState(false);
  const speedDropdownRef = useRef(null);
  const [showNoScrollToast, setShowNoScrollToast] = useState(false);
  const noScrollTimerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lazy Partition Scrolling States
  const [visiblePartitionCount, setVisiblePartitionCount] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Reset partition count on itemsList change (e.g. search / era filter)
  useEffect(() => {
    setVisiblePartitionCount(1);
  }, [propItemsList]);

  // Sliced partition items for lazy scrolling
  const displayedItems = useMemo(() => {
    if (!lazyLoad) return [];
    const list = propItemsList || [];
    return list.slice(0, visiblePartitionCount * partitionSize);
  }, [lazyLoad, propItemsList, visiblePartitionCount, partitionSize]);

  const textContainerRef = useRef(null);

  const fontSizes = [
    { label: 'صغير', className: 'text-base sm:text-lg leading-loose sm:leading-[2.4]' },
    { label: 'متوسط', className: 'text-lg sm:text-2xl leading-loose sm:leading-[2.6]' },
    { label: 'كبير', className: 'text-xl sm:text-3xl leading-loose sm:leading-[2.8]' },
    { label: 'كبير جداً', className: 'text-2xl sm:text-4xl leading-loose sm:leading-[3]' },
  ];

  // Storage key for highlight persistence & favorites
  const resolvedStorageKey = useMemo(() => {
    if (propStorageKey) return propStorageKey;
    if (activeItem) {
      return `${activeItem.bookFile || hadithData?.selectedBookFile || 'text'}:${activeItem.idInBook || activeItem.id || '1'}`;
    }
    if (displayTitle || displayId) {
      return `nisab_text_${displayTitle}_${displayId}`;
    }
    return '';
  }, [propStorageKey, activeItem, hadithData, displayTitle, displayId]);

  // Load highlights from localStorage and Disk IPC
  useEffect(() => {
    if (!resolvedStorageKey) return;

    try {
      const cached = localStorage.getItem(`nisab_hl_${resolvedStorageKey}`);
      if (cached) {
        setHighlights(JSON.parse(cached));
      } else {
        setHighlights([]);
      }
    } catch (e) {
      setHighlights([]);
    }

    if (window.nisabAPI?.getHadithHighlights) {
      window.nisabAPI.getHadithHighlights(resolvedStorageKey).then((diskData) => {
        if (Array.isArray(diskData) && diskData.length > 0) {
          setHighlights(diskData);
          try {
            localStorage.setItem(`nisab_hl_${resolvedStorageKey}`, JSON.stringify(diskData));
          } catch (e) {}
        }
      }).catch((err) => {
        console.warn('Failed to read highlights from disk:', err);
      });
    }
  }, [resolvedStorageKey]);

  // Persist highlights to localStorage and Disk
  const saveHighlightsToDiskAndStorage = useCallback(
    async (newHighlights, message = 'تم حفظ التظليل على القرص 💾') => {
      setHighlights(newHighlights);
      if (!resolvedStorageKey) return;

      try {
        localStorage.setItem(`nisab_hl_${resolvedStorageKey}`, JSON.stringify(newHighlights));
      } catch (e) {}

      try {
        if (window.nisabAPI?.saveHadithHighlights) {
          await window.nisabAPI.saveHadithHighlights(resolvedStorageKey, newHighlights);
        }
      } catch (err) {
        console.error('Failed to save highlights to disk:', err);
      }
    },
    [resolvedStorageKey]
  );

  // Unified MouseUp Selection Handler on Text (supports single item & continuous lazy-loaded documents)
  const handleMouseUpSelection = useCallback(() => {
    if (!isPenActive || penMode === 'eraser') return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer || range.startContainer;
    const targetEl = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest(
      '[data-text-container="true"]'
    );

    if (!targetEl) return;

    const targetItemId = targetEl.getAttribute('data-item-id');
    const field = targetEl.getAttribute('data-field') || 'text';

    let targetText = '';
    let targetItem = null;

    if (lazyLoad) {
      if (!targetItemId) return;
      targetItem =
        displayedItems.find((it) => String(it.idInBook || it.id) === String(targetItemId)) ||
        (propItemsList || []).find((it) => String(it.idInBook || it.id) === String(targetItemId));
      if (!targetItem) return;
      targetText =
        field === 'title'
          ? (targetItem.title || '')
          : (targetItem.text || targetItem.arabic || '');
    } else {
      targetText = activeText;
      targetItem = activeItem;
    }

    if (!targetText) return;

    const offsets = getSelectionOffsetsWithin(targetEl, targetText);
    if (!offsets || offsets.start >= offsets.end || !offsets.text) return;

    const newHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: lazyLoad ? String(targetItemId) : undefined,
      field: field,
      start: offsets.start,
      end: offsets.end,
      color: penColor,
      text: offsets.text
    };

    const filtered = highlights.filter((h) => {
      if (lazyLoad && String(h.itemId) !== String(newHighlight.itemId)) return true;
      if (h.field && h.field !== newHighlight.field) return true;
      return !(h.start >= newHighlight.start && h.end <= newHighlight.end);
    });

    const updated = [...filtered, newHighlight].sort((a, b) => {
      if (a.itemId && b.itemId && a.itemId !== b.itemId) {
        return String(a.itemId).localeCompare(String(b.itemId), undefined, { numeric: true });
      }
      return a.start - b.start;
    });

    if (selection) selection.removeAllRanges();

    saveHighlightsToDiskAndStorage(updated, 'تم حفظ المقطع المظلل على القرص 💾');
  }, [
    isPenActive,
    penMode,
    lazyLoad,
    displayedItems,
    propItemsList,
    activeText,
    activeItem,
    penColor,
    highlights,
    saveHighlightsToDiskAndStorage
  ]);

  // Global document mouseup listener
  useEffect(() => {
    if (!isPenActive || penMode === 'eraser') return;

    const onDocMouseUp = () => {
      setTimeout(() => {
        handleMouseUpSelection();
      }, 20);
    };

    document.addEventListener('mouseup', onDocMouseUp);
    return () => {
      document.removeEventListener('mouseup', onDocMouseUp);
    };
  }, [isPenActive, penMode, handleMouseUpSelection]);

  const handleHighlightClick = (highlightId, e) => {
    if (!isPenActive) return;
    e.stopPropagation();

    const updated = highlights.filter((h) => h.id !== highlightId);
    saveHighlightsToDiskAndStorage(updated, 'تمت إزالة التظليل 🗑️');
  };

  const handleClearAllHighlights = () => {
    if (highlights.length === 0) return;
    setClearAlertState('confirm');
  };

  const handleConfirmClearAllHighlights = () => {
    saveHighlightsToDiskAndStorage([], 'تم مسح كافة التظليلات 🗑️');
    setClearAlertState('success');
  };

  // Copy with Source Attribution
  const handleCopyText = () => {
    const lines = [
      `« ${activeText} »`,
      '',
      displayTitle ? `[المصدر: ${displayTitle}${displayAuthor ? ` - ${displayAuthor}` : ''}]` : null,
      displayId ? `[الرقم: ${displayId}]` : null,
      displaySubtitle ? `[الباب: ${displaySubtitle}]` : null,
      'تطبيق نِصاب'
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Favorites
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

  const isFavorite = favorites.some((f) => f.key === resolvedStorageKey);

  const handleToggleFavorite = () => {
    if (!activeText && !activeItem) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.key === resolvedStorageKey);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.key !== resolvedStorageKey);
      } else {
        const newFav = {
          key: resolvedStorageKey,
          id: activeItem?.id || displayId,
          idInBook: activeItem?.idInBook || displayId,
          bookFile: activeItem?.bookFile || hadithData?.selectedBookFile || 'text',
          bookTitle: displayTitle,
          bookAuthor: displayAuthor,
          arabic: activeText,
          chapterId: activeItem?.chapterId
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

  // Copy individual item from partition feed
  const handleCopyItem = useCallback((item) => {
    const lines = [
      `« ${item.text || item.arabic} »`,
      '',
      item.title ? `[الحدث: ${item.title}]` : null,
      item.id ? `[الرقم: #${item.id}]` : null,
      Array.isArray(item.date) ? `[التاريخ: ${item.date.join(' - ')}]` : (item.date ? `[التاريخ: ${item.date}]` : null),
      displayTitle ? `[المصدر: ${displayTitle}]` : null,
      'تطبيق نِصاب'
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayTitle]);

  // Toggle favorite for an individual item in partition feed
  const handleToggleItemFavorite = useCallback((item, itemKey) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.key === itemKey || f.id === item.id);
      let updated;
      if (exists) {
        updated = prev.filter((f) => f.key !== itemKey && f.id !== item.id);
      } else {
        const newFav = {
          key: itemKey,
          id: item.id,
          idInBook: item.idInBook || item.id,
          bookTitle: displayTitle || 'التاريخ الإسلامي',
          title: item.title,
          arabic: item.text || item.arabic,
          date: item.date
        };
        updated = [newFav, ...prev];
      }
      try {
        localStorage.setItem('nisab_favorite_hadiths', JSON.stringify(updated));
        window.dispatchEvent(new Event('nisab-favorites-changed'));
      } catch (err) {}
      return updated;
    });
  }, [displayTitle]);

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const renderSlices = useMemo(() => {
    return getRenderSlices(activeText, highlights);
  }, [activeText, highlights]);

  // Group highlights by itemId for lazyLoad mode
  const highlightsByItemId = useMemo(() => {
    const map = {};
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i];
      const key = h.itemId ? String(h.itemId) : 'single';
      if (!map[key]) map[key] = [];
      map[key].push(h);
    }
    return map;
  }, [highlights]);

  const activeCursor = useMemo(() => {
    if (!isPenActive) return 'text';
    if (penMode === 'eraser') return PEN_CURSORS.eraser;
    return PEN_CURSORS[penColor] || PEN_CURSORS.amber;
  }, [isPenActive, penMode, penColor]);

  // Dedicated toggle handler: activates immediately and checks scrollability
  const handleToggleAutoScroll = useCallback(() => {
    if (isAutoScroll) {
      setIsAutoScroll(false);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Check whether content extends beyond the visible container or viewport
    const maxScroll = Math.max(
      container.scrollHeight - container.clientHeight,
      (document.documentElement?.scrollHeight || 0) - window.innerHeight
    );

    if (maxScroll <= 5) {
      // Content fits completely on screen without scroll
      setShowNoScrollToast(true);
      if (noScrollTimerRef.current) clearTimeout(noScrollTimerRef.current);
      noScrollTimerRef.current = setTimeout(() => setShowNoScrollToast(false), 3200);
      setIsAutoScroll(false);
      return;
    }

    // If starting while already at or near the very bottom, rewind to top
    if (container.scrollTop >= maxScroll - 10) {
      container.scrollTop = 0;
    }

    setIsAutoScroll(true);
  }, [isAutoScroll]);

  // Fullscreen Mode Toggle Handler
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (scrollContainerRef.current?.requestFullscreen) {
          await scrollContainerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      // Graceful fallback to CSS full-window focus mode
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Sync fullscreen state with native browser/electron events and Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Close speed dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(e.target)) {
        setIsSpeedDropdownOpen(false);
      }
    };
    if (isSpeedDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSpeedDropdownOpen]);

  // When active text or item changes, reset auto-scroll and reset to top
  useEffect(() => {
    setIsAutoScroll(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeText, activeItem]);

  // Auto-scroll smooth animation engine
  useEffect(() => {
    if (!isAutoScroll) return;

    const container = scrollContainerRef.current;
    if (!container) {
      setIsAutoScroll(false);
      return;
    }

    let animationFrameId;
    let lastTime = performance.now();
    let accumulated = 0;

    const currentSpeedObj = SCROLL_SPEEDS.find((s) => s.value === selectedSpeed);
    const speedPxPerSec = currentSpeedObj ? currentSpeedObj.pixelsPerSecond : 80;

    const step = (currentTime) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 5) {
        accumulated += speedPxPerSec * delta;

        if (accumulated >= 1) {
          const stepPixels = Math.floor(accumulated);
          accumulated -= stepPixels;

          const prevScroll = container.scrollTop;
          container.scrollTop = prevScroll + stepPixels;

          // Fallback to window scroll if container isn't absorbing the scroll
          if (container.scrollTop === prevScroll && window.scrollY + window.innerHeight < document.documentElement.scrollHeight) {
            window.scrollBy(0, stepPixels);
          }

          // When auto-scrolling in lazyLoad mode, load next partition before reaching the bottom
          if (lazyLoad && propItemsList && displayedItems.length < propItemsList.length) {
            if (container.scrollTop + container.clientHeight >= maxScroll - 400) {
              setVisiblePartitionCount((prev) => prev + 1);
            }
          }

          // Stop if reached the very end
          if (container.scrollTop >= maxScroll - 2) {
            if (lazyLoad && propItemsList && displayedItems.length < propItemsList.length) {
              setVisiblePartitionCount((prev) => prev + 1);
            } else {
              setIsAutoScroll(false);
              return;
            }
          }
        }
      } else {
        setIsAutoScroll(false);
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAutoScroll, selectedSpeed, lazyLoad, propItemsList, displayedItems.length]);

  // Scroll listener on container to track canScrollDown, backToTop, and lazy partition loading
  const handleContainerScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
    const hasScroll = scrollHeight > clientHeight + 5;
    setCanScrollDown(hasScroll && scrollTop < scrollHeight - clientHeight - 10);
    setShowBackToTop(scrollTop > 600);

    // Lazy load next partition when approaching the bottom (within 600px)
    if (lazyLoad && propItemsList && propItemsList.length > 0) {
      if (scrollTop + clientHeight >= scrollHeight - 600) {
        setVisiblePartitionCount((prev) => {
          if (prev * partitionSize < propItemsList.length) {
            return prev + 1;
          }
          return prev;
        });
      }
    }
  }, [lazyLoad, propItemsList, partitionSize]);

  // Empty State (Full Screen only if no headerExtra is provided)
  const hasItems = propItemsList && propItemsList.length > 0;
  if (!activeText && !activeItem && !hasItems && !headerExtra) {
    return (
      <div className={`relative h-full w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 ${className}`} dir="rtl">
        <ArabesquePattern className="opacity-10 text-emerald-500" />
        <div className="relative z-10 text-center space-y-4">
          <Scroll className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-200">{emptyMessage}</h2>
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg hover:bg-amber-400 transition"
            >
              {resolvedBackButtonText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleContainerScroll}
      onWheel={() => {
        if (isAutoScroll) setIsAutoScroll(false);
      }}
      style={{ height: '100%', width: '100%', minWidth: 0, overflowY: 'auto' }}
      className={`relative h-full w-full min-w-0 bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-8 lg:p-12' : ''
      }`}
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 no-print" />

      {/* IntroPillToast notification when no scrolling is available */}
      <IntroPillToast
        show={showNoScrollToast}
        text="التمرير التلقائي غير متاح"
        subtitle="المحتوى معروض بالكامل في الشاشة"
        icon={ArrowDown}
      />

      <div className="relative z-10 w-full min-w-0 max-w-[1700px] mx-auto space-y-4 sm:space-y-6 pb-16">
        {/* Navigation Bar & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/40 pb-5 select-none no-print">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 hover:border-amber-400 text-amber-300 font-semibold text-xs sm:text-sm transition shadow-lg group active:scale-95"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                <span>{resolvedBackButtonText}</span>
              </button>
            )}

            {(displayTitle || displayId) && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                {displayTitle && <span>{displayTitle}</span>}
                {displayTitle && displayId && <span>•</span>}
                {displayId && <span className="text-amber-400 font-mono">#{displayId}</span>}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pen Writer Activation */}
            {enablePen && (
              <button
                onClick={() => setIsPenActive((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition shadow-lg ${
                  isPenActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 font-bold shadow-amber-500/20'
                    : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
                }`}
                title="تفعيل قلم التمييز لتظليل أي موضع في النص"
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
            )}

            {/* Font Size Selector */}
            {enableFontResize && (
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
            )}

            {/* Auto Scroll Toggle & Speed Dropdown Menu */}
            {enableAutoScroll && (
              <div className="flex items-center gap-1.5">
                {/* Auto Scroll Toggle Button */}
                <div
                  role="button"
                  tabIndex={0}
                  id="auto-scroll-toggle-btn"
                  onClick={handleToggleAutoScroll}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleAutoScroll();
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition shadow select-none cursor-pointer ${
                    isAutoScroll
                      ? 'bg-sky-950/80 border-sky-400 text-sky-200 ring-2 ring-sky-400/30 font-bold'
                      : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
                  }`}
                  title={isAutoScroll ? 'إيقاف التمرير التلقائي' : 'تشغيل التمرير التلقائي للنص'}
                >
                  <motion.span
                    animate={isAutoScroll ? { y: [0, 2, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-flex"
                  >
                    <ArrowDown
                      className={`w-3.5 h-3.5 ${
                        isAutoScroll ? 'text-sky-400' : 'text-amber-400'
                      }`}
                    />
                  </motion.span>
                  <span className="hidden sm:inline text-xs font-semibold">تمرير تلقائي</span>

                  <div className="pointer-events-none">
                    <SwitchToggle
                      id="text-view-auto-scroll-toggle"
                      checked={isAutoScroll}
                      disabled={false}
                      ariaLabel="تمرير تلقائي"
                    />
                  </div>
                </div>

                {/* Speed Dropdown Menu */}
                <div className="relative" ref={speedDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSpeedDropdownOpen((prev) => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl border text-xs font-semibold transition shadow ${
                      isSpeedDropdownOpen
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
                    }`}
                    title="اختيار سرعة حركة التمرير"
                  >
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-amber-300 font-bold text-xs">{selectedSpeed}x</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isSpeedDropdownOpen ? 'rotate-180 text-amber-300' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isSpeedDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-48 rounded-2xl bg-slate-950/95 border border-emerald-700/80 shadow-2xl backdrop-blur-xl p-1.5 z-50 space-y-1"
                        dir="rtl"
                      >
                        <div className="px-2.5 py-1 text-[10px] text-slate-400 font-bold border-b border-emerald-900/40 mb-1 flex items-center justify-between">
                          <span>سرعة حركة التمرير</span>
                          <span className="text-amber-400 font-mono">Speed</span>
                        </div>
                        {SCROLL_SPEEDS.map((sp) => (
                          <button
                            key={sp.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSpeed(sp.value);
                              setIsSpeedDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                              selectedSpeed === sp.value
                                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                : 'text-slate-200 hover:bg-emerald-950/80 hover:text-amber-300'
                            }`}
                          >
                            <span>{sp.label}</span>
                            {selectedSpeed === sp.value && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Favorite Button */}
            {enableFavorite && (
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
            )}

            {/* Print Button */}
            {enablePrint && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm text-slate-200 hover:text-amber-300 transition shadow"
                title="طباعة النص"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة</span>
              </button>
            )}

            {/* Copy Button */}
            {enableCopy && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-900 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm text-slate-200 hover:text-amber-300 transition shadow"
                title="نسخ النص"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-400" />
                )}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            )}

            {/* Fullscreen Mode Button */}
            {enableFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition shadow active:scale-95 ${
                  isFullscreen
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold ring-2 ring-amber-400/40 shadow-amber-500/20'
                    : 'bg-slate-900 border-emerald-800/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300'
                }`}
                title={isFullscreen ? 'الخروج من ملء الشاشة (Esc)' : 'ملء الشاشة للقراءة بتركيز'}
              >
                {isFullscreen ? (
                  <Minimize2 className={`w-4 h-4 ${isFullscreen ? 'text-slate-950' : 'text-amber-400'}`} />
                ) : (
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Header Extra (e.g. search bars, era filters, jump controls) */}
        {headerExtra && (
          <div className="w-full no-print">
            {headerExtra}
          </div>
        )}

        {/* PEN WRITER TOOLBAR */}
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
                {/* Mode Switch & Color Swatches */}
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

                {/* Clear All button & Tips */}
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
                      title="مسح جميع التظليلات المحفوظة لهذا النص"
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

        {/* Floating Save Toast */}
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

        {/* Main Content Area: Unified Grand Text Presentation Card */}
        {!activeItem && !activeText && (!lazyLoad || displayedItems.length === 0) ? (
          <div className="py-20 text-center space-y-4 select-none">
            <Scroll className="w-12 h-12 text-amber-400/80 mx-auto animate-pulse" />
            <h2 className="text-lg font-bold text-slate-300">{emptyMessage}</h2>
            <p className="text-xs text-slate-500">جرب البحث بكلمة أخرى أو برقم حدث مختلف</p>
          </div>
        ) : (
          <>
            {/* Grand Text Presentation Card (Single Unified Paper / Document) */}
            <motion.div
              key={lazyLoad ? 'lazy_continuous_stream' : (displayId || activeText.slice(0, 30))}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full min-w-0 rounded-3xl p-5 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-emerald-950/40 border border-amber-500/30 shadow-2xl backdrop-blur-xl overflow-hidden select-text text-right"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent no-print" />

              {/* Metadata Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-emerald-900/50 select-none">
                <div className="flex items-center gap-3">
                  {!lazyLoad && displayId && (
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center font-mono font-bold text-sm sm:text-base shadow-lg">
                      #{displayId}
                    </span>
                  )}
                  {lazyLoad && (
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-950 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                      <Scroll className="w-5 h-5 text-amber-400" />
                    </span>
                  )}
                  <div>
                    {displayTitle && (
                      <h1 className="text-lg sm:text-xl font-bold text-amber-300 font-serif">
                        <HighlightedArabicText text={displayTitle} query={searchQuery} />
                      </h1>
                    )}
                    {displayAuthor && (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        {displayAuthor}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lazyLoad && propItemsList && (
                    <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-xs text-amber-300 font-mono">
                      {displayedItems.length} من {propItemsList.length} حدث
                    </div>
                  )}

                  {highlights.length > 0 && (
                    <div
                      className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 select-none"
                      title="المواضع المظللة والمحفوظة"
                    >
                      <Highlighter className="w-3.5 h-3.5 text-amber-400" />
                      <span>{highlights.length} موضع مظلل</span>
                    </div>
                  )}

                  {!lazyLoad && Array.isArray(activeItem?.date) && activeItem.date.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeItem.date.map((dt, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-xs text-amber-300 font-mono"
                        >
                          {dt}
                        </span>
                      ))}
                    </div>
                  )}

                  {displaySubtitle && (
                    <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-xs text-amber-300 font-serif">
                      {displaySubtitle}
                    </div>
                  )}
                </div>
              </div>

              {/* Full Arabic Text Body: Either Continuous Flowing Stream OR Single Text */}
              <div
                className="my-6 sm:my-8 select-text transition-all w-full min-w-0"
                style={{ cursor: activeCursor }}
              >
                {lazyLoad ? (
                  /* Continuous Unified Text Flow with Lazy Loading */
                  <div className="space-y-8 select-text">
                    {displayedItems.map((item, idx) => {
                      const itemId = String(item.idInBook || item.id || idx + 1);
                      const itemTitle = item.title || '';
                      const itemText = item.text || item.arabic || '';
                      const itemDates = Array.isArray(item.date) ? item.date : (item.date ? [item.date] : []);

                      const itemHighlights = highlightsByItemId[itemId] || [];
                      const textHighlights = itemHighlights.filter((h) => !h.field || h.field === 'text');
                      const titleHighlights = itemHighlights.filter((h) => h.field === 'title');

                      const textSlices = getRenderSlices(itemText, textHighlights);
                      const titleSlices = getRenderSlices(itemTitle, titleHighlights);

                      return (
                        <div key={itemId} className="pt-6 first:pt-0 border-t border-emerald-900/30 first:border-t-0 text-right">
                          {/* Event Section Heading */}
                          <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-emerald-900/20 select-none">
                            <span className="text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-950 border border-amber-500/30 shadow-sm">
                              #{itemId}
                            </span>
                            {itemTitle && (
                              <h2
                                data-text-container="true"
                                data-item-id={itemId}
                                data-field="title"
                                onMouseUp={handleMouseUpSelection}
                                className="text-base sm:text-lg font-bold text-amber-200 font-serif inline-block select-text"
                                style={{ cursor: activeCursor }}
                              >
                                {titleSlices.map((slice, sIdx) => {
                                  if (slice.isHighlight) {
                                    const colorCfg =
                                      HIGHLIGHT_COLOR_CONFIG[slice.color] || HIGHLIGHT_COLOR_CONFIG.amber;
                                    return (
                                      <mark
                                        key={`hl-title-${slice.highlightId}-${sIdx}`}
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
                                        <HighlightedArabicText text={slice.text} query={searchQuery} />
                                      </mark>
                                    );
                                  }
                                  return (
                                    <span key={`plain-title-${sIdx}`}>
                                      <HighlightedArabicText text={slice.text} query={searchQuery} />
                                    </span>
                                  );
                                })}
                              </h2>
                            )}

                            {itemHighlights.length > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] sm:text-xs text-amber-300 font-semibold flex items-center gap-1 select-none"
                                title="يوجد تظليلات في هذا الحدث"
                              >
                                <Highlighter className="w-3 h-3 text-amber-400" />
                                <span>{itemHighlights.length} مظلل</span>
                              </span>
                            )}

                            {itemDates.length > 0 && (
                              <div className="flex items-center gap-1.5 mr-auto">
                                {itemDates.map((dt, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/50 text-[10px] sm:text-xs text-emerald-400 font-mono"
                                  >
                                    {dt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Event Narrative Body */}
                          <p
                            data-text-container="true"
                            data-item-id={itemId}
                            data-field="text"
                            onMouseUp={handleMouseUpSelection}
                            className={`font-serif text-slate-100 text-justify tracking-wide leading-loose select-text break-words [overflow-wrap:anywhere] ${fontSizes[fontSizeIndex].className}`}
                            style={{ cursor: activeCursor }}
                          >
                            {textSlices.map((slice, sIdx) => {
                              if (slice.isHighlight) {
                                const colorCfg =
                                  HIGHLIGHT_COLOR_CONFIG[slice.color] || HIGHLIGHT_COLOR_CONFIG.amber;
                                return (
                                  <mark
                                    key={`hl-text-${slice.highlightId}-${sIdx}`}
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
                                    <HighlightedArabicText text={slice.text} query={searchQuery} />
                                  </mark>
                                );
                              }
                              return (
                                <span key={`plain-text-${sIdx}`}>
                                  <HighlightedArabicText text={slice.text} query={searchQuery} />
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      );
                    })}

                    {/* Partition Loading Status at the bottom of the continuous text */}
                    <div className="pt-6 text-center select-none no-print border-t border-emerald-900/40">
                      {displayedItems.length < (propItemsList?.length || 0) ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 shadow">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>
                              عرض {displayedItems.length} من أصل {propItemsList.length} حدث تاريخي • مرر لأسفل لتحميل المزيد
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisiblePartitionCount((prev) => prev + 1)}
                            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-emerald-900 border border-emerald-700/60 hover:border-amber-400/80 text-amber-300 text-xs font-bold transition shadow-lg active:scale-95 flex items-center gap-2"
                          >
                            <span>تحميل الجزء التالي ({Math.min(partitionSize, propItemsList.length - displayedItems.length)} حدث آخر)</span>
                            <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>اكتمل عرض كافة الأحداث التاريخية ({propItemsList?.length || 0} حدث) ✨</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Single Text View (Hadith style) */
                  <div
                    className={`font-serif text-slate-100 text-justify tracking-wide select-text selection:bg-amber-400/40 selection:text-amber-100 leading-loose break-words [overflow-wrap:anywhere] ${fontSizes[fontSizeIndex].className}`}
                  >
                    <span className="text-amber-400 font-serif text-2xl sm:text-3xl font-bold inline-block ml-1 select-none">
                      «
                    </span>

                    <span
                      ref={textContainerRef}
                      data-text-container="true"
                      data-field="single"
                      onMouseUp={handleMouseUpSelection}
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
                              <HighlightedArabicText text={slice.text} query={searchQuery} />
                            </mark>
                          );
                        }
                        return (
                          <span key={`plain-${sIdx}`}>
                            <HighlightedArabicText text={slice.text} query={searchQuery} />
                          </span>
                        );
                      })}
                    </span>

                    <span className="text-amber-400 font-serif text-2xl sm:text-3xl font-bold inline-block mr-1 select-none">
                      »
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Attribution */}
              <div className="pt-6 border-t border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 select-none">
                <div className="flex flex-wrap items-center gap-2">
                  {displayTitle && (
                    <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-emerald-400">
                      {displayTitle}
                    </span>
                  )}
                  {!lazyLoad && displayId && (
                    <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-slate-300 font-mono">
                      #{displayId}
                    </span>
                  )}
                  {displaySubtitle && (
                    <span className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-900/50 text-amber-300">
                      {displaySubtitle}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-emerald-500/90 font-medium no-print">
                  {footerLabel}
                </div>
              </div>

              {/* Print Document Verification Footer */}
              <div className="hidden print:block text-center pt-5 mt-6 border-t border-slate-300 text-xs text-slate-600">
                طُبع من تطبيق نِصاب للمسلمين • {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </motion.div>

            {/* Previous & Next Navigation Controls (Disabled in lazyLoad mode) */}
            {!lazyLoad && navigationList.length > 0 && enableNavigation && (
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 select-none pt-2 no-print w-full">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <span>السابق ({currentIndex > 0 ? `#${navigationList[currentIndex - 1].idInBook || navigationList[currentIndex - 1].id}` : ''})</span>
                </button>

                <span className="text-xs text-slate-500 font-mono">
                  {currentIndex + 1} من {navigationList.length}
                </span>

                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-emerald-800/80 hover:border-amber-400/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
                >
                  <span>التالي ({hasNext ? `#${navigationList[currentIndex + 1].idInBook || navigationList[currentIndex + 1].id}` : ''})</span>
                  <ChevronLeft className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-emerald-950/90 border border-amber-500/60 text-amber-300 shadow-2xl backdrop-blur-md hover:bg-emerald-900 transition active:scale-95 no-print"
            title="الصعود لأعلى الصفحة"
          >
            <ArrowUp className="w-5 h-5 text-amber-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Live Interactive Print Preview Screen */}
      {showPrintPreview && (
        <PrintPreview
          hadith={{ ...activeItem, arabic: activeText }}
          itemsList={lazyLoad ? displayedItems : null}
          allItemsList={lazyLoad ? propItemsList : null}
          bookTitle={displayTitle}
          bookAuthor={displayAuthor}
          chapterName={displaySubtitle}
          highlights={highlights}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Reusable WarningAlert Component */}
      <WarningAlert
        isOpen={Boolean(clearAlertState)}
        state={clearAlertState}
        onClose={() => setClearAlertState(null)}
        onConfirm={handleConfirmClearAllHighlights}
        title="مسح جميع التظليلات"
        message={lazyLoad ? 'هل أنت متأكد من مسح جميع التظليلات المحفوظة لهذه الموسوعة من القرص؟' : 'هل أنت متأكد من مسح جميع التظليلات المحفوظة لهذا النص من القرص؟'}
        confirmText="نعم، مسح الكل"
        cancelText="إلغاء"
        confirmIcon={Trash2}
        successTitle="تم المسح بنجاح"
        successMessage={lazyLoad ? 'تم مسح كافة التظليلات لهذه الموسوعة بنجاح.' : 'تم مسح كافة التظليلات لهذا النص بنجاح.'}
        successButtonText="حسناً"
      />

      {/* Floating Auto-Scroll Status Indicator */}
      <AnimatePresence>
        {isAutoScroll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-sky-400/80 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs text-slate-100 no-print"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <span className="font-semibold text-sky-200">
              التمرير التلقائي قيد التشغيل ({selectedSpeed}x)
            </span>
            <button
              onClick={() => setIsAutoScroll(false)}
              className="px-2.5 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white transition font-bold text-[11px]"
            >
              إيقاف
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
