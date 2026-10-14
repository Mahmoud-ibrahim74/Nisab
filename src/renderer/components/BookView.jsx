import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Bookmark, BookOpen } from 'lucide-react';
import MiniLoader from './MiniLoader';

/**
 * BookView — A reusable open-book spread viewer with 3D page flip animations.
 *
 * Props:
 * @param {number}   totalPages       - Total number of pages in the book (e.g. 604 for Quran)
 * @param {number}   currentPage      - Currently active page (1-indexed)
 * @param {function} onPageChange     - Callback: (newPage, direction) => void
 * @param {function} renderPage       - Callback: (pageNum, side) => ReactNode — renders a single page's content
 * @param {boolean}  loading          - Whether data is still loading
 * @param {string}   loadingMessage   - Message to show while loading (default: 'جاري التحميل...')
 * @param {object}   theme            - Theme config object (see below for shape)
 * @param {number}   [bookmarkPage]   - Optional bookmark page number (renders silk ribbon)
 * @param {function} [onToggleBookmark] - Optional callback when bookmark ribbon is clicked
 * @param {string}   [aspectRatio]    - CSS aspect-ratio for the book (default: '1.41 / 1')
 * @param {string}   [maxWidth]       - Max width class/style for the book container (default: 'max-w-[1700px]')
 * @param {React.ReactNode} [header]  - Optional header content rendered above the book
 * @param {React.ReactNode} [footer]  - Optional footer content rendered below the book
 * @param {React.ReactNode} [overlay] - Optional overlay content rendered on top of the book area
 *
 * Theme shape:
 * {
 *   colorScheme: 'light' | 'dark',
 *   bookBorder: string (tailwind classes),
 *   spineGradient: string (tailwind gradient stops),
 * }
 */

// Pre-cached audio URI for zero-latency instant playback of authentic page-flip.mp3
let cachedPageFlipUri = null;

export const playRealPageFlipSound = async () => {
  try {
    if (!cachedPageFlipUri && typeof window !== 'undefined' && window.nisabAPI?.getOfflineAudio) {
      cachedPageFlipUri = await window.nisabAPI.getOfflineAudio('page-flip.mp3');
    }

    if (cachedPageFlipUri) {
      const audio = new Audio(cachedPageFlipUri);
      audio.volume = 0.85;
      audio.play().catch(() => {});
      return;
    }
  } catch (e) {}

  // Multi-stage realistic physical paper flip sound synthesizer fallback
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const duration = 0.32;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      const pink = b0 + b1 + b2 + white * 0.5362;

      let env = 0;
      if (t < 0.07) {
        env = t / 0.07;
      } else if (t < 0.17) {
        env = 1.0 - 0.25 * Math.sin((t - 0.07) * 40);
      } else {
        env = Math.exp(-(t - 0.17) / 0.045);
      }
      data[i] = pink * env * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(1100, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(450, now);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.09, now + 0.10);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now + 0.08);
    osc.stop(now + 0.25);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(highpass);
    highpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start(now);
  } catch (e) {}
};

// Pre-cache on module load
if (typeof window !== 'undefined' && window.nisabAPI?.getOfflineAudio) {
  window.nisabAPI.getOfflineAudio('page-flip.mp3').then((uri) => {
    cachedPageFlipUri = uri;
  }).catch(() => {});
}

export default function BookView({
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  renderPage,
  loading = false,
  loadingMessage = 'جاري التحميل...',
  theme = {},
  bookmarkPage = null,
  onToggleBookmark,
  aspectRatio = '1.41 / 1',
  maxWidth = 'max-w-[1700px]',
  header = null,
  footer = null,
  overlay = null,
  containerRef: externalContainerRef
}) {
  // Page Turn Direction for 3D Paper Flip ('next' | 'prev')
  const [turnDirection, setTurnDirection] = useState('next');
  const prevPageRef = useRef(currentPage);

  // Sync turn direction if currentPage changes from outside
  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      setTurnDirection(currentPage > prevPageRef.current ? 'next' : 'prev');
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

  // Container ref & dimensions for responsive scaling
  const internalContainerRef = useRef(null);
  const mainContainerRef = externalContainerRef || internalContainerRef;
  const [containerSize, setContainerSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth < 1024 ? 80 : 260) : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight - 90 : 700
  }));

  // Handle responsive dynamic scaling on window / container resize
  useEffect(() => {
    const updateSize = () => {
      if (mainContainerRef.current) {
        const rect = mainContainerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          setContainerSize({ width: rect.width, height: rect.height });
          return;
        }
      }
      setContainerSize({
        width: window.innerWidth - (window.innerWidth < 1024 ? 80 : 260),
        height: window.innerHeight - 90
      });
    };

    updateSize();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && mainContainerRef.current) {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 50 && height > 50) {
            setContainerSize({ width, height });
          }
        }
      });
      observer.observe(mainContainerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, []);



  // 3D Realistic Physical Page Turn Variants
  const rightPageVariants = {
    initial: (dir) => ({
      rotateY: dir === 'next' ? 30 : -45,
      opacity: 0.6,
      scale: 0.98,
      filter: 'brightness(0.92)'
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      transition: {
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: (dir) => ({
      rotateY: dir === 'next' ? -50 : 30,
      opacity: 0,
      scale: 0.98,
      filter: 'brightness(0.85)',
      transition: {
        duration: 0.42,
        ease: [0.4, 0, 0.7, 0.2]
      }
    })
  };

  const leftPageVariants = {
    initial: (dir) => ({
      rotateY: dir === 'next' ? -45 : 30,
      opacity: 0.6,
      scale: 0.98,
      filter: 'brightness(0.92)'
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      transition: {
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: (dir) => ({
      rotateY: dir === 'next' ? 30 : -50,
      opacity: 0,
      scale: 0.98,
      filter: 'brightness(0.85)',
      transition: {
        duration: 0.42,
        ease: [0.4, 0, 0.7, 0.2]
      }
    })
  };

  // Navigate to a specific page with realistic paper flip
  const jumpToPage = useCallback(
    (pageNum, direction = null) => {
      const valid = Math.max(1, Math.min(totalPages, pageNum));
      if (valid !== currentPage) {
        setTurnDirection(direction || (valid > currentPage ? 'next' : 'prev'));
        playRealPageFlipSound();
        if (onPageChange) onPageChange(valid, direction || (valid > currentPage ? 'next' : 'prev'));
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  // Open Book Spread: Right Page (Odd) & Left Page (Even)
  const { rightPageNum, leftPageNum } = useMemo(() => {
    if (currentPage % 2 !== 0) {
      return {
        rightPageNum: currentPage,
        leftPageNum: Math.min(totalPages, currentPage + 1)
      };
    } else {
      return {
        rightPageNum: Math.max(1, currentPage - 1),
        leftPageNum: currentPage
      };
    }
  }, [currentPage, totalPages]);

  // Navigation: Turn Spreads (In RTL, Next goes to higher page numbers)
  const handleNextSpread = useCallback(() => {
    if (leftPageNum < totalPages) {
      jumpToPage(leftPageNum + 1, 'next');
    }
  }, [leftPageNum, totalPages, jumpToPage]);

  const handlePrevSpread = useCallback(() => {
    if (rightPageNum > 1) {
      jumpToPage(rightPageNum - 2, 'prev');
    }
  }, [rightPageNum, jumpToPage]);

  // Keyboard navigation (ArrowLeft = Next spread, ArrowRight = Previous spread for RTL)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        handleNextSpread();
      } else if (e.key === 'ArrowRight') {
        handlePrevSpread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSpread, handlePrevSpread]);

  // Resolve theme with defaults
  const resolvedTheme = useMemo(() => ({
    bookBorder: theme.bookBorder || 'border-[#1b3d33] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(217,119,6,0.2)]',
    spineGradient: theme.spineGradient || 'from-black/35 via-black/10 to-black/35',
    ...theme
  }), [theme]);

  // Convert number to Eastern Arabic numerals
  const toEasternArabic = (num) => {
    if (num === null || num === undefined) return '';
    return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Expose containerSize and jumpToPage for parent components via ref-like pattern
  // Parents can also use the header/footer props for their own controls

  return (
    <>
      {/* Optional Header (toolbar, dropdowns, etc.) */}
      {header}

      {/* Main Book Reader Area */}
      <main
        ref={mainContainerRef}
        className={`relative flex-1 w-full ${maxWidth} mx-auto p-2 sm:p-4 flex items-center justify-center overflow-hidden`}
      >
        {loading ? (
          <div className="text-center py-24 text-amber-400">
            <Sparkles className="w-10 h-10 animate-spin mx-auto mb-3" />
            <div className="font-serif text-lg">{loadingMessage}</div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Previous Spread Turn Button (Right Side in RTL) */}
            <motion.button
              whileHover={{ scale: 1.15, x: 3 }}
              whileTap={{ scale: 0.9, x: -1 }}
              onClick={handlePrevSpread}
              disabled={rightPageNum <= 1}
              className="absolute right-0 sm:right-2 z-30 p-2.5 sm:p-3.5 rounded-full bg-slate-900/90 hover:bg-emerald-950 border border-amber-500/50 text-amber-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl backdrop-blur-md flex items-center justify-center group"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
            </motion.button>

            {/* The Realistic Open Book */}
            <div
              style={{
                aspectRatio,
                maxHeight: '100%',
                maxWidth: '100%',
                perspective: '2200px'
              }}
              className={`relative h-full flex rounded-3xl border-[6px] sm:border-[8px] ${resolvedTheme.bookBorder} overflow-hidden shadow-2xl transition-all mx-auto`}
            >
              {/* Right Page (Odd numbers) with 3D Page Turn */}
              <div className="flex-1 h-full relative overflow-hidden" style={{ perspective: '1800px' }}>
                <AnimatePresence mode="popLayout" custom={turnDirection}>
                  <motion.div
                    key={`page-right-${rightPageNum}`}
                    custom={turnDirection}
                    variants={rightPageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      width: '100%',
                      height: '100%',
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {renderPage(rightPageNum, 'right', containerSize)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Central Spine 3D Crease Shadow */}
              <div
                className={`w-3 sm:w-5 h-full shrink-0 bg-gradient-to-r ${resolvedTheme.spineGradient} shadow-inner pointer-events-none z-20`}
              />

              {/* Silk Ribbon Bookmark */}
              {bookmarkPage && (bookmarkPage === rightPageNum || bookmarkPage === leftPageNum) && (
                <div
                  style={{
                    background: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 15%, #dc2626 50%, #b91c1c 80%, #7f1d1d 100%)',
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% calc(100% - 12px), 0% 100%)',
                    filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.65)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
                  }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-7 sm:w-8 h-24 sm:h-28 flex flex-col items-center justify-between pt-1 pb-3 text-white font-bold select-none cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  title={`علامة القراءة المحفوظة (صفحة ${toEasternArabic(bookmarkPage)}) - انقر للإزالة`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleBookmark) onToggleBookmark();
                  }}
                >
                  {/* Top spine crease & gold stitch */}
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-1 bg-black/40" />
                    <div className="w-4/5 h-[1px] bg-amber-300/70 mt-0.5" />
                  </div>

                  {/* Middle Golden Medallion */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-4.5 h-4.5 rounded-full bg-black/25 border border-amber-300/75 flex items-center justify-center shadow-inner">
                      <Bookmark className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-serif font-bold text-amber-200 select-none">
                      ص {toEasternArabic(bookmarkPage)}
                    </span>
                  </div>

                  {/* Bottom Golden Stitch */}
                  <div className="w-3/5 h-[1px] bg-amber-300/70 rounded-full mb-0.5" />
                </div>
              )}

              {/* Left Page (Even numbers) with 3D Page Turn */}
              <div className="flex-1 h-full relative overflow-hidden" style={{ perspective: '1800px' }}>
                <AnimatePresence mode="popLayout" custom={turnDirection}>
                  <motion.div
                    key={`page-left-${leftPageNum}`}
                    custom={turnDirection}
                    variants={leftPageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                      width: '100%',
                      height: '100%',
                      transformOrigin: 'right center',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {renderPage(leftPageNum, 'left', containerSize)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Next Spread Turn Button (Left Side in RTL) */}
            <motion.button
              whileHover={{ scale: 1.15, x: -3 }}
              whileTap={{ scale: 0.9, x: 1 }}
              onClick={handleNextSpread}
              disabled={leftPageNum >= totalPages}
              className="absolute left-0 sm:left-2 z-30 p-2.5 sm:p-3.5 rounded-full bg-slate-900/90 hover:bg-emerald-950 border border-amber-500/50 text-amber-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl backdrop-blur-md flex items-center justify-center group"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
            </motion.button>
          </div>
        )}
      </main>

      {/* Optional Footer */}
      {footer}

      {/* Optional Overlay (floating action pills, modals, etc.) */}
      {overlay}
    </>
  );
}

// Export the containerSize calculation utility for consumers who need dynamic font sizing
BookView.useContainerSize = function useContainerSize(containerRef) {
  const [containerSize, setContainerSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth < 1024 ? 80 : 260) : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight - 90 : 700
  }));

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          setContainerSize({ width: rect.width, height: rect.height });
          return;
        }
      }
      setContainerSize({
        width: window.innerWidth - (window.innerWidth < 1024 ? 80 : 260),
        height: window.innerHeight - 90
      });
    };

    updateSize();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 50 && height > 50) {
            setContainerSize({ width, height });
          }
        }
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, [containerRef]);

  return containerSize;
};
