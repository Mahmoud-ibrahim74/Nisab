import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Star,
  Check,
  Copy,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRightLeft,
  Info,
  Clock,
  X,
  Compass,
  Search
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';

// Arabic translations for common Islamic holiday names returned by AlAdhan API
const HOLIDAY_TRANSLATIONS = {
  'Beginning of Ramadan': 'بداية شهر رمضان المبارك',
  'Eid ul-Fitr': 'عيد الفطر المبارك',
  'Eid-ul-Fitr': 'عيد الفطر المبارك',
  'Eid ul-Adha': 'عيد الأضحى المبارك',
  'Eid-ul-Adha': 'عيد الأضحى المبارك',
  'Ashura': 'يوم عاشوراء',
  'Tasu\'a': 'يوم تاسوعاء',
  'Day of Arafah': 'يوم عرفة',
  'Arafat': 'يوم عرفة',
  'Lailat al-Qadr': 'ليلة القدر المباركة',
  'Laylat al-Qadr': 'ليلة القدر المباركة',
  'Islamic New Year': 'رأس السنة الهجرية',
  'Mawlid al-Nabi': 'المولد النبوي الشريف',
  'Isra and Mi\'raj': 'ذكرى الإسراء والمعراج',
  'Beginning of the holy months': 'بداية الأشهر الحُرُم',
  'Nisf Sha\'ban': 'ليلة النصف من شعبان'
};

function formatHolidayName(holiday) {
  if (!holiday) return '';
  for (const [key, val] of Object.entries(HOLIDAY_TRANSLATIONS)) {
    if (holiday.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return holiday;
}

// Fallback Islamic Months mapping
const FALLBACK_ISLAMIC_MONTHS = {
  1: { number: 1, en: 'Muḥarram', ar: 'مُحَرَّم' },
  2: { number: 2, en: 'Ṣafar', ar: 'صَفَر' },
  3: { number: 3, en: 'Rabīʿ al-awwal', ar: 'رَبيع الأوّل' },
  4: { number: 4, en: 'Rabīʿ al-thānī', ar: 'رَبيع الثاني' },
  5: { number: 5, en: 'Jumādá al-ūlá', ar: 'جُمادى الأولى' },
  6: { number: 6, en: 'Jumādá al-ākhirah', ar: 'جُمادى الآخرة' },
  7: { number: 7, en: 'Rajab', ar: 'رَجَب' },
  8: { number: 8, en: 'Shaʿbān', ar: 'شَعْبان' },
  9: { number: 9, en: 'Ramaḍān', ar: 'رَمَضان' },
  10: { number: 10, en: 'Shawwāl', ar: 'شَوّال' },
  11: { number: 11, en: 'Dhū al-Qaʿdah', ar: 'ذوالقعدة' },
  12: { number: 12, en: 'Dhū al-Ḥijjah', ar: 'ذوالحجة' }
};

const GREGORIAN_MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Weekday columns starting from Sunday (الأحد)
const WEEKDAYS = [
  { key: 'Sunday', ar: 'الأحد', short: 'أحد' },
  { key: 'Monday', ar: 'الإثنين', short: 'إثنين' },
  { key: 'Tuesday', ar: 'الثلاثاء', short: 'ثلاثاء' },
  { key: 'Wednesday', ar: 'الأربعاء', short: 'أربعاء' },
  { key: 'Thursday', ar: 'الخميس', short: 'خميس' },
  { key: 'Friday', ar: 'الجمعة', short: 'جمعة' },
  { key: 'Saturday', ar: 'السبت', short: 'سبت' },
];

export default function CalendarScreen() {
  // Navigation Sub-tab: 'calendar' | 'holidays' | 'converter'
  const [activeSubTab, setActiveSubTab] = useState('calendar');

  // Calendar display mode: 'hijri' (show Hijri months via hToGCalendar) or 'gregorian' (show Gregorian months via gToHCalendar)
  const [calendarMode, setCalendarMode] = useState('hijri');

  // Network and Loading states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Current system date
  const now = useMemo(() => new Date(), []);
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  // Islamic Reference Data from API
  const [islamicMonths, setIslamicMonths] = useState(FALLBACK_ISLAMIC_MONTHS);
  const [currentHijriYear, setCurrentHijriYear] = useState(1448);
  const [nextHoliday, setNextHoliday] = useState(null);

  // Selected Hijri Month & Year
  const [selectedHijriMonth, setSelectedHijriMonth] = useState(5); // default fallback
  const [selectedHijriYear, setSelectedHijriYear] = useState(1448);

  // Selected Gregorian Month & Year
  const [selectedGregMonth, setSelectedGregMonth] = useState(todayMonth);
  const [selectedGregYear, setSelectedGregYear] = useState(todayYear);

  // Month days returned from AlAdhan API
  const [monthDays, setMonthDays] = useState([]);

  // Yearly Holidays Data (Option 8)
  const [yearlyHolidays, setYearlyHolidays] = useState([]);
  const [loadingYearlyHolidays, setLoadingYearlyHolidays] = useState(false);

  // Selected Day for modal details
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [copiedDayText, setCopiedDayText] = useState(false);

  // Date Converter Tool State
  const [converterMode, setConverterMode] = useState('gToH'); // 'gToH' | 'hToG'
  const [convDay, setConvDay] = useState(todayDay);
  const [convMonth, setConvMonth] = useState(todayMonth);
  const [convYear, setConvYear] = useState(todayYear);
  const [convResult, setConvResult] = useState(null);
  const [convLoading, setConvLoading] = useState(false);
  const [convCopied, setConvCopied] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setErrorMsg(null);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Initial Load: Fetch Islamic Months (API #7), Current Hijri Year (API #6), Next Holiday (API #5)
  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        // Fetch Islamic Months (API #7)
        try {
          const resMonths = await fetch('https://api.aladhan.com/v1/islamicMonths');
          if (resMonths.ok) {
            const dataMonths = await resMonths.json();
            if (dataMonths?.data && isMounted) {
              setIslamicMonths(dataMonths.data);
            }
          }
        } catch (e) {
          console.warn('Could not fetch islamicMonths:', e);
        }

        // Fetch Current Hijri Year (API #6)
        try {
          const resYear = await fetch('https://api.aladhan.com/v1/currentIslamicYear');
          if (resYear.ok) {
            const dataYear = await resYear.json();
            if (dataYear?.data && isMounted) {
              const y = Number(dataYear.data);
              setCurrentHijriYear(y);
              setSelectedHijriYear(y);
            }
          }
        } catch (e) {
          console.warn('Could not fetch currentIslamicYear:', e);
        }

        // Fetch Next Islamic Holiday (API #5)
        try {
          const resHol = await fetch('https://api.aladhan.com/v1/nextHijriHoliday?calendarMethod=UAQ');
          if (resHol.ok) {
            const dataHol = await resHol.json();
            if (dataHol?.data && isMounted) {
              setNextHoliday(dataHol.data);
            }
          }
        } catch (e) {
          console.warn('Could not fetch nextHijriHoliday:', e);
        }

        // Fetch today's Hijri month to set default selectedHijriMonth (API #3)
        try {
          const todayStr = `${String(todayDay).padStart(2, '0')}-${String(todayMonth).padStart(2, '0')}-${todayYear}`;
          const resToday = await fetch(`https://api.aladhan.com/v1/gToH/${todayStr}?calendarMethod=UAQ`);
          if (resToday.ok) {
            const dataToday = await resToday.json();
            if (dataToday?.data?.hijri && isMounted) {
              const hMonth = Number(dataToday.data.hijri.month.number);
              const hYear = Number(dataToday.data.hijri.year);
              setSelectedHijriMonth(hMonth);
              setSelectedHijriYear(hYear);
            }
          }
        } catch (e) {
          console.warn('Could not fetch today gToH:', e);
        }
      } catch (err) {
        console.error('Initial Meta Load Failed:', err);
      }
    }

    loadMeta();
    return () => { isMounted = false; };
  }, [todayDay, todayMonth, todayYear]);

  // 2. Fetch Month Calendar Days (API #1 or API #2 depending on calendarMode)
  const loadCalendarMonth = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const cacheKey = calendarMode === 'hijri'
      ? `nisab_cal_h_${selectedHijriMonth}_${selectedHijriYear}`
      : `nisab_cal_g_${selectedGregMonth}_${selectedGregYear}`;

    try {
      const url = calendarMode === 'hijri'
        ? `https://api.aladhan.com/v1/hToGCalendar/${selectedHijriMonth}/${selectedHijriYear}?calendarMethod=UAQ`
        : `https://api.aladhan.com/v1/gToHCalendar/${selectedGregMonth}/${selectedGregYear}?calendarMethod=UAQ`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`تعذر استرجاع بيانات التقويم (رمز الخطأ: ${res.status})`);
      }

      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        setMonthDays(json.data);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(json.data));
        } catch (e) {}
      } else {
        throw new Error('البيانات المستلمة غير صالحة');
      }
    } catch (err) {
      console.error('Error loading calendar days:', err);
      // Attempt cache recovery
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setMonthDays(JSON.parse(cached));
          setErrorMsg('أنت غير متصل بالإنترنت، يتم عرض البيانات المخزنة محلياً لهذا الشهر.');
          return;
        }
      } catch (e) {}
      setErrorMsg('تتطلب شاشة التقويم اتصالاً بالإنترنت لتحميل الشهور بدقة وفق تقويم أم القرى.');
    } finally {
      setLoading(false);
    }
  }, [calendarMode, selectedHijriMonth, selectedHijriYear, selectedGregMonth, selectedGregYear]);

  useEffect(() => {
    loadCalendarMonth();
  }, [loadCalendarMonth]);

  // 3. Fetch Yearly Holidays (API #8)
  const loadYearlyHolidays = useCallback(async (year) => {
    setLoadingYearlyHolidays(true);
    const targetYear = year || selectedHijriYear;
    try {
      const res = await fetch(`https://api.aladhan.com/v1/islamicHolidaysByHijriYear/${targetYear}?calendarMethod=UAQ`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data)) {
          setYearlyHolidays(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load yearly holidays:', err);
    } finally {
      setLoadingYearlyHolidays(false);
    }
  }, [selectedHijriYear]);

  useEffect(() => {
    if (activeSubTab === 'holidays') {
      loadYearlyHolidays(selectedHijriYear);
    }
  }, [activeSubTab, selectedHijriYear, loadYearlyHolidays]);

  // 4. Date Converter Handler (APIs #3 & #4)
  const handleConvertDate = async () => {
    setConvLoading(true);
    setConvResult(null);
    try {
      const formattedDate = `${String(convDay).padStart(2, '0')}-${String(convMonth).padStart(2, '0')}-${convYear}`;
      const url = converterMode === 'gToH'
        ? `https://api.aladhan.com/v1/gToH/${formattedDate}?calendarMethod=UAQ`
        : `https://api.aladhan.com/v1/hToG/${formattedDate}?calendarMethod=UAQ`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setConvResult(json.data);
        }
      } else {
        alert('حدث خطأ أثناء تحويل التاريخ، تأكد من صحة اليوم والشهر.');
      }
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('تعذر التحويل. يرجى التحقق من الاتصال بالإنترنت.');
    } finally {
      setConvLoading(false);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (calendarMode === 'hijri') {
      if (selectedHijriMonth === 1) {
        setSelectedHijriMonth(12);
        setSelectedHijriYear((y) => y - 1);
      } else {
        setSelectedHijriMonth((m) => m - 1);
      }
    } else {
      if (selectedGregMonth === 1) {
        setSelectedGregMonth(12);
        setSelectedGregYear((y) => y - 1);
      } else {
        setSelectedGregMonth((m) => m - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (calendarMode === 'hijri') {
      if (selectedHijriMonth === 12) {
        setSelectedHijriMonth(1);
        setSelectedHijriYear((y) => y + 1);
      } else {
        setSelectedHijriMonth((m) => m + 1);
      }
    } else {
      if (selectedGregMonth === 12) {
        setSelectedGregMonth(1);
        setSelectedGregYear((y) => y + 1);
      } else {
        setSelectedGregMonth((m) => m + 1);
      }
    }
  };

  const handleJumpToToday = async () => {
    setSelectedGregMonth(todayMonth);
    setSelectedGregYear(todayYear);
    try {
      const todayStr = `${String(todayDay).padStart(2, '0')}-${String(todayMonth).padStart(2, '0')}-${todayYear}`;
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${todayStr}?calendarMethod=UAQ`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.hijri) {
          setSelectedHijriMonth(Number(json.data.hijri.month.number));
          setSelectedHijriYear(Number(json.data.hijri.year));
        }
      }
    } catch (e) {}
  };

  // Align days in 7-column calendar grid (Sunday = 0, Monday = 1, etc.)
  const calendarGrid = useMemo(() => {
    if (!monthDays || monthDays.length === 0) return [];

    const firstDay = monthDays[0];
    const firstWeekdayEn = firstDay.gregorian?.weekday?.en || '';
    const weekdayIndex = WEEKDAYS.findIndex((w) => w.key.toLowerCase() === firstWeekdayEn.toLowerCase());
    const offset = weekdayIndex >= 0 ? weekdayIndex : 0;

    const slots = [];
    // Blank padding slots before Day 1
    for (let i = 0; i < offset; i++) {
      slots.push({ isPadding: true, id: `pad-start-${i}` });
    }

    // Days of current month
    monthDays.forEach((dayData) => {
      const hijriDayNum = Number(dayData.hijri?.day);
      const gregDayNum = Number(dayData.gregorian?.day);
      const gregMonthNum = Number(dayData.gregorian?.month?.number);
      const gregYearNum = Number(dayData.gregorian?.year);

      const isToday =
        gregDayNum === todayDay &&
        gregMonthNum === todayMonth &&
        gregYearNum === todayYear;

      const isWhiteDay = hijriDayNum === 13 || hijriDayNum === 14 || hijriDayNum === 15;
      const isFriday = dayData.gregorian?.weekday?.en?.toLowerCase() === 'friday';
      const isSunnahFastingDay =
        dayData.gregorian?.weekday?.en?.toLowerCase() === 'monday' ||
        dayData.gregorian?.weekday?.en?.toLowerCase() === 'thursday';

      const hasHolidays = Array.isArray(dayData.hijri?.holidays) && dayData.hijri.holidays.length > 0;

      slots.push({
        isPadding: false,
        id: dayData.hijri?.date || dayData.gregorian?.date,
        dayData,
        hijriDayNum,
        gregDayNum,
        isToday,
        isWhiteDay,
        isFriday,
        isSunnahFastingDay,
        hasHolidays
      });
    });

    return slots;
  }, [monthDays, todayDay, todayMonth, todayYear]);

  // Current month header title
  const currentMonthTitle = useMemo(() => {
    if (calendarMode === 'hijri') {
      const mObj = islamicMonths[selectedHijriMonth] || FALLBACK_ISLAMIC_MONTHS[selectedHijriMonth];
      return `${mObj?.ar || 'شهر هجري'} ${selectedHijriYear} هـ`;
    } else {
      const gName = GREGORIAN_MONTH_NAMES_AR[selectedGregMonth - 1] || 'شهر ميلادي';
      return `${gName} ${selectedGregYear} م`;
    }
  }, [calendarMode, selectedHijriMonth, selectedHijriYear, selectedGregMonth, selectedGregYear, islamicMonths]);

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-5 sm:space-y-6">
        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-amber-300 border border-amber-400/30 shadow-lg">
              <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 font-serif">
                  التقويم الهجري والميلادي
                </h1>
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-sans font-normal">
                  تقويم أم القرى (UAQ)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                مزامنة دقيقة للمواقيت، الشهور الهجرية، الأيام البيض، والمناسبات الدينية الكبرى
              </p>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs border shadow ${
                isOnline
                  ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800/60 text-rose-300'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isOnline ? 'متصل بالشبكة' : 'غير متصل'}</span>
            </div>
          </div>
        </div>

        {/* Next Islamic Holiday Highlight Banner (API #5) */}
        {nextHoliday && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/50 border border-amber-500/30 text-slate-200 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </span>
              <div>
                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>المناسبة الإسلامية القادمة:</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-100 font-serif">
                  {formatHolidayName(nextHoliday.hijri?.holidays?.[0] || 'مناسبة إسلامية')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  تاريخها: <strong className="text-emerald-400">{nextHoliday.hijri?.day} {nextHoliday.hijri?.month?.ar} {nextHoliday.hijri?.year} هـ</strong>
                  {' — '}
                  الموافق: <strong className="text-slate-300">{nextHoliday.gregorian?.date} ({nextHoliday.gregorian?.weekday?.en})</strong>
                </div>
              </div>
            </div>

            <div className="self-start md:self-auto flex items-center gap-2">
              <span className="text-xs px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-semibold font-mono">
                {nextHoliday.hijri?.weekday?.ar}
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Banner when offline / request failure */}
        {errorMsg && (
          <div className="rounded-2xl p-4 bg-rose-950/60 border border-rose-800/60 text-xs sm:text-sm text-rose-200 flex items-center justify-between gap-3 shadow">
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={loadCalendarMonth}
              className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* SUB-VIEW 1: CALENDAR VIEW */}
        {activeSubTab === 'calendar' && (
          <div className="space-y-4">
            {/* Calendar Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/85 p-3 sm:p-4 rounded-3xl border border-emerald-900/50 backdrop-blur-md shadow-lg">
              {/* Prev / Next & Month Title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-amber-300 border border-emerald-900/50 transition"
                  title="الشهر التالي"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="text-base sm:text-xl font-bold text-amber-300 font-serif min-w-[180px] sm:min-w-[220px] text-center">
                  {currentMonthTitle}
                </div>

                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-amber-300 border border-emerald-900/50 transition"
                  title="الشهر السابق"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/60 text-xs font-semibold text-emerald-300 transition shadow"
                  title="الانتقال إلى شهر اليوم"
                >
                  اليوم
                </button>
              </div>

              {/* View Mode Switcher (Hijri Month vs Gregorian Month) & Month Picker */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-emerald-900/50 shadow-inner text-xs">
                  <button
                    type="button"
                    onClick={() => setCalendarMode('hijri')}
                    className={`px-3 py-1 rounded-lg transition ${
                      calendarMode === 'hijri'
                        ? 'bg-emerald-800 text-amber-300 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    عرض هجري (أم القرى)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMode('gregorian')}
                    className={`px-3 py-1 rounded-lg transition ${
                      calendarMode === 'gregorian'
                        ? 'bg-emerald-800 text-amber-300 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    عرض ميلادي
                  </button>
                </div>

                {/* Dropdown Quick Selector */}
                {calendarMode === 'hijri' ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedHijriMonth}
                      onChange={(e) => setSelectedHijriMonth(Number(e.target.value))}
                      className="bg-slate-950 border border-emerald-900/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      {Object.values(islamicMonths).map((m) => (
                        <option key={m.number} value={m.number}>
                          {m.number} - {m.ar}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={selectedHijriYear}
                      onChange={(e) => setSelectedHijriYear(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-emerald-900/60 rounded-xl px-2 py-1.5 text-xs text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                      title="السنة الهجرية"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedGregMonth}
                      onChange={(e) => setSelectedGregMonth(Number(e.target.value))}
                      className="bg-slate-950 border border-emerald-900/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      {GREGORIAN_MONTH_NAMES_AR.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {idx + 1} - {name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={selectedGregYear}
                      onChange={(e) => setSelectedGregYear(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-emerald-900/60 rounded-xl px-2 py-1.5 text-xs text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                      title="السنة الميلادية"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Legend / Guides */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 px-2 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/30"></span>
                <span>اليوم الحالي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                <span>الأيام البيض (13، 14، 15)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>سيد الأيام (يوم الجمعة)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                <span>مناسبة إسلامية / عيد</span>
              </div>
            </div>

            {/* Calendar Grid Container */}
            {loading ? (
              <div className="py-28 text-center text-emerald-400 bg-slate-900/40 rounded-3xl border border-emerald-900/30">
                <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                جاري جلب أيام التقويم والمناسبات من خادم AlAdhan...
              </div>
            ) : (
              <div className="bg-slate-900/70 border border-emerald-900/50 rounded-3xl p-3 sm:p-5 backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
                  {WEEKDAYS.map((w, idx) => {
                    const isFriday = w.key === 'Friday';
                    return (
                      <div
                        key={idx}
                        className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold ${
                          isFriday
                            ? 'bg-emerald-900/60 text-amber-300 border border-emerald-700/60'
                            : 'bg-slate-950/70 text-slate-300 border border-emerald-900/30'
                        }`}
                      >
                        <span className="hidden sm:inline">{w.ar}</span>
                        <span className="sm:hidden">{w.short}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {calendarGrid.map((cell) => {
                    if (cell.isPadding) {
                      return (
                        <div
                          key={cell.id}
                          className="min-h-[85px] sm:min-h-[105px] rounded-2xl bg-slate-950/20 border border-transparent"
                        />
                      );
                    }

                    const { dayData, isToday, isWhiteDay, isFriday, hasHolidays, isSunnahFastingDay } = cell;
                    const hDay = dayData.hijri?.day;
                    const gDay = dayData.gregorian?.day;
                    const gMonthName = GREGORIAN_MONTH_NAMES_AR[Number(dayData.gregorian?.month?.number) - 1] || '';
                    const holidayTitle = hasHolidays ? formatHolidayName(dayData.hijri.holidays[0]) : null;

                    return (
                      <motion.div
                        key={cell.id}
                        whileHover={{ scale: 1.015 }}
                        onClick={() => setSelectedDayDetail(dayData)}
                        className={`relative min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none shadow-md ${
                          isToday
                            ? 'bg-gradient-to-br from-amber-500/25 via-emerald-950/80 to-slate-900 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10'
                            : hasHolidays
                            ? 'bg-gradient-to-br from-amber-950/40 to-slate-900/80 border-amber-600/70 hover:border-amber-400'
                            : isFriday
                            ? 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/80'
                            : 'bg-slate-950/65 border-emerald-950/80 hover:border-emerald-700/60'
                        }`}
                      >
                        {/* Day Cell Top: Hijri Day & Badges */}
                        <div className="flex items-start justify-between gap-1">
                          {/* Large Hijri Number */}
                          <span
                            className={`text-base sm:text-2xl font-bold font-serif leading-none ${
                              isToday
                                ? 'text-amber-300'
                                : hasHolidays
                                ? 'text-amber-400'
                                : isFriday
                                ? 'text-emerald-300'
                                : 'text-slate-100'
                            }`}
                          >
                            {hDay}
                          </span>

                          {/* Indicators / Badges */}
                          <div className="flex flex-col items-end gap-1">
                            {isToday && (
                              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                                اليوم
                              </span>
                            )}
                            {hasHolidays && (
                              <span
                                className="p-0.5 sm:p-1 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50"
                                title={holidayTitle || 'مناسبة إسلامية'}
                              >
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                              </span>
                            )}
                            {isWhiteDay && (
                              <span
                                className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"
                                title="من الأيام البيض - يُسن صيامها"
                              />
                            )}
                            {isSunnahFastingDay && !isWhiteDay && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"
                                title="يوم صيام سُنّة"
                              />
                            )}
                          </div>
                        </div>

                        {/* Holiday Tag if present */}
                        {holidayTitle && (
                          <div className="my-1 line-clamp-1 text-[9px] sm:text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-700/50">
                            {holidayTitle}
                          </div>
                        )}

                        {/* Day Cell Bottom: Gregorian counterpart */}
                        <div className="mt-auto flex items-center justify-between text-[10px] sm:text-xs text-slate-400 pt-1 border-t border-emerald-950/60 font-sans">
                          <span className="font-mono">{gDay}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400/80 truncate max-w-[50px] sm:max-w-none">
                            {gMonthName}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 2: YEARLY HOLIDAYS (API #8) */}
        {activeSubTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-3xl border border-emerald-900/50">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-amber-300 font-serif flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>المناسبات والأعياد الإسلامية لعام {selectedHijriYear} هـ</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  وفق معايير تقويم أم القرى (المملكة العربية السعودية)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = selectedHijriYear - 1;
                    setSelectedHijriYear(next);
                    loadYearlyHolidays(next);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                >
                  العام السابق ({selectedHijriYear - 1} هـ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = selectedHijriYear + 1;
                    setSelectedHijriYear(next);
                    loadYearlyHolidays(next);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-xs font-semibold text-amber-300 transition"
                >
                  العام التالي ({selectedHijriYear + 1} هـ)
                </button>
              </div>
            </div>

            {loadingYearlyHolidays ? (
              <div className="py-24 text-center text-emerald-400 bg-slate-900/40 rounded-3xl border border-emerald-900/30">
                <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                جاري استرداد مناسبات العام الهجري...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearlyHolidays.map((item, idx) => {
                  const holName = formatHolidayName(item.hijri?.holidays?.[0] || 'مناسبة دينية');
                  const hDate = `${item.hijri?.day} ${item.hijri?.month?.ar} ${item.hijri?.year} هـ`;
                  const gDate = `${item.gregorian?.date} م`;

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedDayDetail(item)}
                      className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/50 hover:border-amber-400/50 shadow-xl backdrop-blur-md flex flex-col justify-between cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                            {item.hijri?.month?.ar}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {item.hijri?.weekday?.ar}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-amber-300 font-serif leading-snug">
                          {holName}
                        </h3>
                        {item.hijri?.holidays?.[0] && item.hijri?.holidays?.[0] !== holName && (
                          <div className="text-[11px] text-slate-400/90 mt-0.5">
                            {item.hijri.holidays[0]}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-emerald-950 text-xs flex items-center justify-between text-slate-300">
                        <div>
                          هجري: <strong className="text-emerald-300 font-mono">{hDate}</strong>
                        </div>
                        <div>
                          ميلادي: <strong className="text-slate-400 font-mono">{gDate}</strong>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {yearlyHolidays.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    لا توجد بيانات مناسبات متوفرة لهذا العام حالياً.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 3: DATE CONVERTER TOOL (APIs #3 & #4) */}
        {activeSubTab === 'converter' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900/85 border border-emerald-900/50 rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-300 font-serif flex items-center justify-center gap-2">
                  <ArrowRightLeft className="w-6 h-6 text-amber-400" />
                  <span>محول التاريخ الهجري والميلادي</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  تحويل فوري ودقيق لأي تاريخ بالاعتماد على خوارزمية تقويم أم القرى
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-emerald-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setConverterMode('gToH');
                    setConvResult(null);
                  }}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    converterMode === 'gToH'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  من ميلادي إلى هجري (gToH)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConverterMode('hToG');
                    setConvResult(null);
                  }}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                    converterMode === 'hToG'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  من هجري إلى ميلادي (hToG)
                </button>
              </div>

              {/* Date Input Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">اليوم (1 - 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={convDay}
                    onChange={(e) => setConvDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-center focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">الشهر (1 - 12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={convMonth}
                    onChange={(e) => setConvMonth(Math.min(12, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono text-center focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    السنة ({converterMode === 'gToH' ? 'ميلادي' : 'هجري'})
                  </label>
                  <input
                    type="number"
                    value={convYear}
                    onChange={(e) => setConvYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Convert Action Button */}
              <button
                type="button"
                onClick={handleConvertDate}
                disabled={convLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                {convLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>جاري التحويل...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>تحويل التاريخ الآن</span>
                  </>
                )}
              </button>

              {/* Conversion Result Card */}
              {convResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/70 to-slate-950 border border-amber-500/40 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
                    <div className="text-xs text-emerald-400 font-semibold">نتيجة التحويل المعتمدة:</div>
                    <button
                      type="button"
                      onClick={() => {
                        const copyText = `التاريخ الهجري: ${convResult.hijri?.date} (${convResult.hijri?.day} ${convResult.hijri?.month?.ar} ${convResult.hijri?.year} هـ)\nالتاريخ الميلادي: ${convResult.gregorian?.date} م\nاليوم: ${convResult.hijri?.weekday?.ar}`;
                        navigator.clipboard.writeText(copyText);
                        setConvCopied(true);
                        setTimeout(() => setConvCopied(false), 2000);
                      }}
                      className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition"
                    >
                      {convCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{convCopied ? 'تم النسخ' : 'نسخ النتيجة'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-900/40">
                      <div className="text-xs text-slate-400 mb-1">التاريخ الهجري:</div>
                      <div className="text-lg font-bold text-amber-300 font-serif">
                        {convResult.hijri?.day} {convResult.hijri?.month?.ar} {convResult.hijri?.year} هـ
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {convResult.hijri?.date}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-900/40">
                      <div className="text-xs text-slate-400 mb-1">التاريخ الميلادي:</div>
                      <div className="text-lg font-bold text-slate-100 font-serif">
                        {convResult.gregorian?.day} {GREGORIAN_MONTH_NAMES_AR[Number(convResult.gregorian?.month?.number) - 1]} {convResult.gregorian?.year} م
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {convResult.gregorian?.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/30">
                    <div>
                      اليوم: <strong className="text-amber-300">{convResult.hijri?.weekday?.ar}</strong> ({convResult.gregorian?.weekday?.en})
                    </div>
                    {convResult.hijri?.holidays?.length > 0 && (
                      <div className="text-amber-400 font-bold">
                        ⭐ {formatHolidayName(convResult.hijri.holidays[0])}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DAY DETAIL MODAL */}
      <AnimatePresence>
        {selectedDayDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-5 sm:p-7 text-slate-100 shadow-2xl space-y-5"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="absolute left-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Moon className="w-6 h-6 text-amber-400" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-amber-300 font-serif">
                    تفاصيل اليوم
                  </h3>
                  <div className="text-xs text-emerald-400 font-sans">
                    {selectedDayDetail.hijri?.weekday?.ar} — {selectedDayDetail.gregorian?.weekday?.en}
                  </div>
                </div>
              </div>

              {/* Dates Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/50">
                  <div className="text-[11px] text-emerald-400 mb-0.5">التاريخ الهجري:</div>
                  <div className="text-lg font-bold text-amber-300 font-serif">
                    {selectedDayDetail.hijri?.day} {selectedDayDetail.hijri?.month?.ar}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    {selectedDayDetail.hijri?.year} هـ
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/50">
                  <div className="text-[11px] text-slate-400 mb-0.5">التاريخ الميلادي:</div>
                  <div className="text-lg font-bold text-slate-100 font-serif">
                    {selectedDayDetail.gregorian?.day} {GREGORIAN_MONTH_NAMES_AR[Number(selectedDayDetail.gregorian?.month?.number) - 1]}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {selectedDayDetail.gregorian?.year} م
                  </div>
                </div>
              </div>

              {/* Holidays & Sunnah Recommendations */}
              <div className="space-y-2.5 text-xs">
                {selectedDayDetail.hijri?.holidays?.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-600/50 text-amber-200">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>المناسبات الدينية المرتبطة بهذا اليوم:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pr-2">
                      {selectedDayDetail.hijri.holidays.map((h, i) => (
                        <li key={i}>{formatHolidayName(h)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* White days recommendation */}
                {(Number(selectedDayDetail.hijri?.day) === 13 ||
                  Number(selectedDayDetail.hijri?.day) === 14 ||
                  Number(selectedDayDetail.hijri?.day) === 15) && (
                  <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-800/50 text-cyan-200">
                    <strong className="text-cyan-300">⚪ الأيام البيض:</strong> يُستحب صيام الأيام الثالث عشر والرابع عشر والخامس عشر من كل شهر هجري اقتداءً بالسنة النبوية الشريفة.
                  </div>
                )}

                {/* Friday recommendation */}
                {selectedDayDetail.gregorian?.weekday?.en?.toLowerCase() === 'friday' && (
                  <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-200">
                    <strong className="text-amber-300">🕌 يوم الجمعة المبارك:</strong> قراءة سورة الكهف، الإكثار من الصلاة على النبي ﷺ، وتحري ساعة الإجابة.
                  </div>
                )}

                {/* Monday / Thursday recommendation */}
                {(selectedDayDetail.gregorian?.weekday?.en?.toLowerCase() === 'monday' ||
                  selectedDayDetail.gregorian?.weekday?.en?.toLowerCase() === 'thursday') && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-900/30 text-slate-300">
                    🌿 <strong>سُنّة الصيام:</strong> تُعرض الأعمال على الله تعالى يومي الإثنين والخميس، ويُستحب صيامهما.
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => {
                    const text = `${selectedDayDetail.hijri?.weekday?.ar}: ${selectedDayDetail.hijri?.day} ${selectedDayDetail.hijri?.month?.ar} ${selectedDayDetail.hijri?.year} هـ الموافق ${selectedDayDetail.gregorian?.date} م`;
                    navigator.clipboard.writeText(text);
                    setCopiedDayText(true);
                    setTimeout(() => setCopiedDayText(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-xs font-semibold text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5 transition"
                >
                  {copiedDayText ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDayText ? 'تم نسخ التاريخ' : 'نسخ التاريخ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDayDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
