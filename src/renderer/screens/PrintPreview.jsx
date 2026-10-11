import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Printer,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  Layers,
  Settings,
  X,
  Type
} from 'lucide-react';
import MiniLoader from '../components/MiniLoader';
import SwitchToggle from '../components/SwitchToggle';
import ArabesquePattern from '../components/ArabesquePattern';

// Available Highlighter Color Styles for Print
const HIGHLIGHT_PRINT_COLORS = {
  amber: 'bg-amber-300/40 text-amber-950 border-b border-amber-500',
  emerald: 'bg-emerald-300/40 text-emerald-950 border-b border-emerald-500',
  cyan: 'bg-cyan-300/40 text-cyan-950 border-b border-cyan-500',
  rose: 'bg-rose-300/40 text-rose-950 border-b border-rose-500'
};

/**
 * Computes non-overlapping render slices from text and highlights
 */
function getPrintSlices(fullText, highlights, includeHighlights) {
  if (!includeHighlights || !highlights || highlights.length === 0 || !fullText) {
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

    const matchingHl = [...highlights].reverse().find(
      (h) => h.start <= segStart && h.end >= segEnd
    );

    if (matchingHl) {
      slices.push({
        isHighlight: true,
        color: matchingHl.color || 'amber',
        text: segText
      });
    } else {
      slices.push({
        isHighlight: false,
        text: segText
      });
    }
  }

  return slices;
}

export default function PrintPreview({
  hadith,
  bookTitle = 'ديوان الحديث الشريف',
  bookAuthor = '',
  chapterName = '',
  highlights = [],
  onClose
}) {
  // Print Customization State
  const [zoomLevel, setZoomLevel] = useState(100); // 80, 100, 120
  const [printFontSize, setPrintFontSize] = useState('medium'); // 'small' (16px), 'medium' (20px), 'large' (24px)
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [paperStyle, setPaperStyle] = useState('white'); // 'white' | 'parchment'
  const [includeIslamicHeader, setIncludeIslamicHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);

  // Printing Lifecycle Status: 'ready' | 'printing' | 'completed'
  const [printStatus, setPrintStatus] = useState('ready');

  // Format today's Arabic Gregorian date
  const printDateStr = useMemo(() => {
    try {
      const now = new Date();
      return now.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }, []);

  // Compute text slices with highlights
  const slices = useMemo(() => {
    return getPrintSlices(hadith?.arabic || '', highlights, includeHighlights);
  }, [hadith?.arabic, highlights, includeHighlights]);

  // Font size mapping for preview and print
  const fontSizeStyle = useMemo(() => {
    switch (printFontSize) {
      case 'small':
        return { fontSize: '16px', lineHeight: '2.1' };
      case 'large':
        return { fontSize: '24px', lineHeight: '2.4' };
      case 'medium':
      default:
        return { fontSize: '20px', lineHeight: '2.25' };
    }
  }, [printFontSize]);

  // Handle Trigger System Print
  const handleExecutePrint = async () => {
    setPrintStatus('printing');

    setTimeout(async () => {
      try {
        if (window.nisabAPI?.print) {
          await window.nisabAPI.print();
        } else {
          window.print();
        }
        setPrintStatus('completed');
        setTimeout(() => setPrintStatus('ready'), 3500);
      } catch (err) {
        console.error('Print execution failed:', err);
        setPrintStatus('ready');
      }
    }, 200);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      id="nisab-print-portal"
      dir="rtl"
      className="print-modal-container fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500 pointer-events-none no-print" />

      {/* Top Navbar / Header Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-slate-900/95 border-b border-emerald-900/60 shadow-xl backdrop-blur-xl no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs sm:text-sm font-semibold"
            title="إغلاق المعاينة والرجوع إلى الحديث الشريف"
          >
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>رجوع للحديث</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-100 font-serif">
              معاينة الطباعة • {bookTitle} (#{hadith?.idInBook || hadith?.id})
            </h2>
          </div>
        </div>

        {/* Right Status Badge & Primary Print Button */}
        <div className="flex items-center gap-3 mr-auto sm:mr-0">
          {/* Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              printStatus === 'printing'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : printStatus === 'completed'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
            }`}
          >
            {printStatus === 'printing' ? (
              <>
                <MiniLoader size="xs" color="amber" />
                <span>جاري إرسال المستند للطابعة...</span>
              </>
            ) : printStatus === 'completed' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم إرسال أمر الطباعة بنجاح</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>جاهز للطباعة (Ready)</span>
              </>
            )}
          </div>

          {/* Print Now Button */}
          <button
            type="button"
            onClick={handleExecutePrint}
            disabled={printStatus === 'printing'}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
            title="فتح نافذة الطابعة وبدء الطباعة الفعلية"
          >
            {printStatus === 'printing' ? (
              <>
                <MiniLoader size="xs" color="current" />
                <span>جاري الطباعة...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-slate-950" />
                <span>طباعة الآن</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area: Left Settings Controls + Center Printable Sheet */}
      <div className="print-modal-wrapper relative z-10 flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Settings Sidebar (Controls) */}
        <aside className="w-full lg:w-80 shrink-0 p-4 sm:p-5 bg-slate-900/80 border-b lg:border-b-0 lg:border-l border-emerald-900/50 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 no-print space-y-5 text-xs select-none">
          {/* Printer Status Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                حالة الطابعة
              </span>
              <span className="font-mono text-emerald-400">A4 Portrait</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full ${printStatus === 'printing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-semibold">
                {printStatus === 'printing'
                  ? 'جاري التواصل مع الطابعة...'
                  : printStatus === 'completed'
                  ? 'تم إرسال المستند للطابعة بنجاح'
                  : 'جاهز لإخراج الورقة (Ready to Print)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تأكد من اختيار الطابعة المطلوبة من نافذة النظام، وتحديد حجم الورق A4.
            </p>
          </div>

          {/* Font Size Configuration */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>حجم الخط في الطباعة:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-emerald-900/60">
              {[
                { id: 'small', label: 'عادي (16)' },
                { id: 'medium', label: 'متوسط (20)' },
                { id: 'large', label: 'كبير (24)' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrintFontSize(item.id)}
                  className={`py-1.5 rounded-lg text-center font-semibold transition ${
                    printFontSize === item.id
                      ? 'bg-amber-500 text-slate-950 shadow font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paper Style */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>لون ورق المعاينة:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaperStyle('white')}
                className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                  paperStyle === 'white'
                    ? 'bg-white text-slate-950 border-amber-400 ring-2 ring-amber-400/40 font-bold'
                    : 'bg-slate-950 text-slate-300 border-emerald-900/60 hover:border-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                <span>أبيض ناصع</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperStyle('parchment')}
                className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                  paperStyle === 'parchment'
                    ? 'bg-[#fbf7ee] text-[#1c2e28] border-amber-500 ring-2 ring-amber-500/40 font-bold'
                    : 'bg-slate-950 text-slate-300 border-emerald-900/60 hover:border-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-[#fbf7ee] border border-amber-300" />
                <span>عاجي تراثي</span>
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-emerald-900/40">
            {highlights.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                <div>
                  <div className="font-semibold text-slate-200">تضمين التظليلات الملونة</div>
                  <div className="text-[10px] text-slate-400">طباعة النص مع علامات القلم ({highlights.length})</div>
                </div>
                <SwitchToggle
                  id="toggle-print-highlights"
                  checked={includeHighlights}
                  onChange={setIncludeHighlights}
                  ariaLabel="تضمين التظليلات الملونة في الطباعة"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-emerald-900/40">
              <div>
                <div className="font-semibold text-slate-200">الترويسة الإسلامية (البسملة)</div>
                <div className="text-[10px] text-slate-400">إضافة بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ أعلى الصفحة</div>
              </div>
              <SwitchToggle
                id="toggle-print-header"
                checked={includeIslamicHeader}
                onChange={setIncludeIslamicHeader}
                ariaLabel="إضافة الترويسة الإسلامية"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-emerald-900/40">
              <div>
                <div className="font-semibold text-slate-200">حاشية التوثيق والتاريخ</div>
                <div className="text-[10px] text-slate-400">إدراج التاريخ وتوثيق تطبيق نِصاب في أسفل الورقة</div>
              </div>
              <SwitchToggle
                id="toggle-print-footer"
                checked={includeFooter}
                onChange={setIncludeFooter}
                ariaLabel="إدراج حاشية التوثيق والتاريخ"
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
            <span className="text-slate-400 text-xs">تكبير المعاينة:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700"
                title="تصغير المعاينة"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs text-amber-300 w-10 text-center font-bold">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700"
                title="تكبير المعاينة"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700"
                title="إعادة ضبط الحجم الطبيعي"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Live Illuminated A4 Paper Sheet Preview */}
        <main className="print-modal-wrapper flex-1 min-w-0 h-full p-4 sm:p-6 lg:p-8 overflow-auto flex items-start justify-center bg-slate-950/80">
          <div
            style={zoomLevel !== 100 ? { transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' } : undefined}
            className="print-modal-wrapper w-full max-w-[850px] shrink-0"
          >
            {/* The Authentic A4 Printable Document Container */}
            <div
              className={`printable-hadith-card relative w-full rounded-2xl border-2 p-8 sm:p-12 shadow-2xl transition-colors min-h-[900px] ${
                paperStyle === 'parchment'
                  ? 'bg-[#fbf7ee] text-[#1c2e28] border-[#c59b27]/70'
                  : 'bg-white text-slate-950 border-emerald-900'
              }`}
            >
              {/* Islamic Decorative Top Header */}
              {includeIslamicHeader && (
                <div className="print-header-banner text-center pb-6 mb-6 border-b-2 border-emerald-800/80">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5 select-none">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <div className="text-xs sm:text-sm font-serif font-bold text-emerald-800 flex items-center justify-center gap-2 select-none">
                    <span>۞</span>
                    <span>موسوعة الحديث الشريف • نِصاب</span>
                    <span>۞</span>
                  </div>
                </div>
              )}

              {/* Document Metadata Banner */}
              <div className="print-header-banner flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-emerald-900/30 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                    #{hadith?.idInBook || hadith?.id}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                      {bookTitle}
                    </h3>
                    {bookAuthor && (
                      <p className="text-xs text-emerald-800 font-medium">{bookAuthor}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {chapterName && (
                    <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-700/40 text-emerald-900 font-serif font-bold text-xs">
                      {chapterName}
                    </div>
                  )}
                </div>
              </div>

              {/* Hadith Arabic Text Body */}
              <div className="print-text-body my-6">
                <div
                  style={fontSizeStyle}
                  className="font-serif text-slate-950 text-justify tracking-wide leading-loose break-words [overflow-wrap:anywhere]"
                >
                  <span className="text-emerald-900 font-serif text-2xl font-bold inline-block ml-1 select-none">
                    «
                  </span>

                  {slices.map((slice, sIdx) => {
                    if (slice.isHighlight) {
                      const colorClass = HIGHLIGHT_PRINT_COLORS[slice.color] || HIGHLIGHT_PRINT_COLORS.amber;
                      return (
                        <mark
                          key={`slice-print-${sIdx}`}
                          className={`${colorClass} px-1 py-0.5 rounded inline transition-none font-serif`}
                        >
                          {slice.text}
                        </mark>
                      );
                    }
                    return <span key={`slice-plain-${sIdx}`}>{slice.text}</span>;
                  })}

                  <span className="text-emerald-900 font-serif text-2xl font-bold inline-block mr-1 select-none">
                    »
                  </span>
                </div>
              </div>

              {/* Document Attribution and Footer */}
              {includeFooter && (
                <div className="print-footer-banner mt-12 pt-6 border-t border-emerald-900/30 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 font-sans select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900">المصدر:</span>
                    <span>{bookTitle} ({bookAuthor || 'الحديث الشريف'})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {printDateStr && <span>تاريخ الطباعة: {printDateStr}</span>}
                    <span>•</span>
                    <span className="font-bold text-emerald-900">تطبيق نِصاب (Nisab)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
}
