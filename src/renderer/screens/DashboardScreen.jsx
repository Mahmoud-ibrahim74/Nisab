import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  BookOpen,
  Scroll,
  Heart,
  ChevronLeft,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  Copy,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Coins,
  Award,
  Library,
  ExternalLink,
  X
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import { getPrayerSchedule } from '../../utils/prayerTimes';
import { ALADHAN_METHOD_MAP } from './SettingsScreen';
import { getRandomQuestion, openExternalUrl, recordQuizAnswer } from '../services/quizService';

// Arabic Prayer Display Names & Icons
const PRAYER_METADATA = {
  fajr: { name: 'الفجر', icon: Sunrise, color: 'from-amber-500/20 to-emerald-950/40' },
  sunrise: { name: 'الشروق', icon: Sun, color: 'from-amber-400/20 to-emerald-950/40' },
  dhuhr: { name: 'الظهر', icon: Sun, color: 'from-yellow-400/20 to-emerald-950/40' },
  asr: { name: 'العصر', icon: Sunset, color: 'from-amber-600/20 to-emerald-950/40' },
  maghrib: { name: 'المغرب', icon: Sunset, color: 'from-orange-600/20 to-emerald-950/40' },
  isha: { name: 'العشاء', icon: Moon, color: 'from-indigo-900/30 to-emerald-950/40' },
};

// Inspirational Islamic Quotes / Daily Reminders
const INSPIRATIONAL_QUOTES = [
  {
    text: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا",
    source: "سورة النساء : 103"
  },
  {
    text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    source: "صحيح مسلم"
  },
  {
    text: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    source: "صحيح البخاري"
  },
  {
    text: "أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    source: "سورة الرعد : 28"
  }
];

export default function DashboardScreen({ onNavigate }) {
  // Current time & countdown state
  const [now, setNow] = useState(new Date());
  const [prayerData, setPrayerData] = useState(null);
  const [countdownText, setCountdownText] = useState('');
  const [dailyQuote, setDailyQuote] = useState(INSPIRATIONAL_QUOTES[0]);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Random Islamic Question State (Fetched fresh on each app/screen open)
  const [randomQuestion, setRandomQuestion] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isRefreshingQuestion, setIsRefreshingQuestion] = useState(false);

  // Fetch a random question from Islamic-Quizzes.json
  const fetchRandomQuestion = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshingQuestion(true);
      else setQuestionLoading(true);

      const q = await getRandomQuestion();
      if (q) {
        setRandomQuestion(q);
        setSelectedAnswerIndex(null);
        setHasAnswered(false);
      }
    } catch (err) {
      console.error('Failed to load random question:', err);
    } finally {
      setQuestionLoading(false);
      setIsRefreshingQuestion(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const handleSelectQuizAnswer = (index) => {
    if (hasAnswered || !randomQuestion) return;
    setSelectedAnswerIndex(index);
    setHasAnswered(true);
    const chosen = randomQuestion.shuffledAnswers[index];
    const isCorrect = chosen?.t === 1;
    recordQuizAnswer(isCorrect, randomQuestion.categoryId);
  };

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataSource, setDataSource] = useState('offline'); // 'online' | 'offline'
  const [apiHijriDate, setApiHijriDate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Location settings (defaults to Cairo, Egypt or saved settings)
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_user_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          city: parsed.city || 'Cairo',
          country: parsed.country || 'Egypt',
          countryArabic: parsed.countryArabic || (parsed.country === 'Egypt' ? 'مصر' : (parsed.country || 'مصر')),
          latitude: parsed.latitude || 30.0444,
          longitude: parsed.longitude || 31.2357,
          calculationMethod: parsed.calcMethod || 'Egyptian'
        };
      }
    } catch (e) {
      // fallback
    }
    return {
      city: 'Cairo',
      country: 'Egypt',
      countryArabic: 'مصر',
      latitude: 30.0444,
      longitude: 31.2357,
      calculationMethod: 'Egyptian'
    };
  });

  // Helper to parse AlAdhan API "HH:MM" times into today's Date objects
  const parseApiTimings = (timings, currentDate) => {
    const parseTime = (str) => {
      if (!str) return null;
      const cleanStr = str.split(' ')[0]; // removes timezone note if present
      const [h, m] = cleanStr.split(':').map(Number);
      const d = new Date(currentDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const times = {
      fajr: parseTime(timings.Fajr),
      sunrise: parseTime(timings.Sunrise),
      dhuhr: parseTime(timings.Dhuhr),
      asr: parseTime(timings.Asr),
      maghrib: parseTime(timings.Maghrib),
      isha: parseTime(timings.Isha),
    };

    const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let nextPrayerName = null;
    let nextPrayerTime = null;

    for (const p of prayerOrder) {
      if (times[p] && times[p] > currentDate) {
        nextPrayerName = p;
        nextPrayerTime = times[p];
        break;
      }
    }

    // If all prayers for today have passed, next prayer is tomorrow's Fajr
    if (!nextPrayerName && times.fajr) {
      nextPrayerName = 'fajr';
      const tomorrowFajr = new Date(times.fajr);
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      nextPrayerTime = tomorrowFajr;
    }

    return {
      times,
      next: {
        prayer: nextPrayerName,
        time: nextPrayerTime
      }
    };
  };

  // Main loader: Check network -> Fetch from AlAdhan API if online -> Else fallback to offline Adhan
  const loadPrayerTimes = async (currentDate = new Date()) => {
    const onlineStatus = navigator.onLine;
    setIsOnline(onlineStatus);

    if (onlineStatus) {
      try {
        setIsRefreshing(true);
        // Formatted as DD-MM-YYYY required by AlAdhan API
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        const methodId = ALADHAN_METHOD_MAP[location.calculationMethod] || 5;

        // Fetch timings by city & country if available, or by coordinates
        const apiUrl = (location.city && location.country)
          ? `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=${methodId}`
          : `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${location.latitude}&longitude=${location.longitude}&method=${methodId}`;

        // AbortController with 4-second timeout to prevent UI hang
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          if (result && result.code === 200 && result.data?.timings) {
            const parsed = parseApiTimings(result.data.timings, currentDate);
            setPrayerData(parsed);
            setDataSource('online');

            // Cache today's exact prayer timestamps for background notifier
            try {
              const todayKey = currentDate.toISOString().split('T')[0];
              const timesMap = {};
              Object.entries(parsed.times).forEach(([k, d]) => {
                if (d instanceof Date) timesMap[k] = d.getTime();
              });
              localStorage.setItem('nisab_today_prayer_times', JSON.stringify({
                date: todayKey,
                times: timesMap
              }));
              window.dispatchEvent(new Event('nisab-prayers-updated'));
            } catch (e) {}

            // Save returned coordinates if available so offline fallback uses them too
            if (result.data.meta?.location?.latitude && result.data.meta?.location?.longitude) {
              const newLat = result.data.meta.location.latitude;
              const newLng = result.data.meta.location.longitude;
              setLocation((prev) => ({
                ...prev,
                latitude: newLat,
                longitude: newLng
              }));
              try {
                const saved = localStorage.getItem('nisab_user_settings');
                const parsedSettings = saved ? JSON.parse(saved) : {};
                parsedSettings.latitude = newLat;
                parsedSettings.longitude = newLng;
                localStorage.setItem('nisab_user_settings', JSON.stringify(parsedSettings));
              } catch (e) {}
            }

            // Set official Hijri date returned by API
            if (result.data.date?.hijri) {
              const h = result.data.date.hijri;
              setApiHijriDate(`${h.day} ${h.month?.ar || h.month?.en} ${h.year} هـ`);
            }
            setIsRefreshing(false);
            return;
          }
        }
      } catch (err) {
        console.warn('AlAdhan API fetch failed or timed out. Falling back to offline engine:', err.message);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Fallback: Offline Calculation using Adhan library
    try {
      const schedule = getPrayerSchedule(
        location.latitude,
        location.longitude,
        currentDate,
        location.calculationMethod
      );
      setPrayerData(schedule);
      setDataSource('offline');
      setApiHijriDate(null);

      // Cache offline calculation timestamps for background notifier
      try {
        const todayKey = currentDate.toISOString().split('T')[0];
        const timesMap = {};
        Object.entries(schedule.times).forEach(([k, d]) => {
          if (d instanceof Date) timesMap[k] = d.getTime();
        });
        localStorage.setItem('nisab_today_prayer_times', JSON.stringify({
          date: todayKey,
          times: timesMap
        }));
        window.dispatchEvent(new Event('nisab-prayers-updated'));
      } catch (e) {}
    } catch (err) {
      console.error('Offline prayer calculation failed:', err);
    }
  };

  // 1. Live Ticking Clock (every second)
  useEffect(() => {
    const dayIndex = new Date().getDate() % INSPIRATIONAL_QUOTES.length;
    setDailyQuote(INSPIRATIONAL_QUOTES[dayIndex]);

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Initial Fetch & Event Listeners for Online/Offline changes & Settings changes
  useEffect(() => {
    loadPrayerTimes(now);

    const handleOnline = () => loadPrayerTimes(new Date());
    const handleOffline = () => {
      setIsOnline(false);
      loadPrayerTimes(new Date());
    };

    const handleSettingsChanged = () => {
      try {
        const saved = localStorage.getItem('nisab_user_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLocation((prev) => ({
            ...prev,
            city: parsed.city || prev.city,
            country: parsed.country || prev.country,
            countryArabic: parsed.countryArabic || prev.countryArabic || (parsed.country === 'Egypt' ? 'مصر' : parsed.country),
            latitude: parsed.latitude || prev.latitude,
            longitude: parsed.longitude || prev.longitude,
            calculationMethod: parsed.calcMethod || prev.calculationMethod
          }));
        }
      } catch (e) {}
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('nisab-settings-changed', handleSettingsChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('nisab-settings-changed', handleSettingsChanged);
    };
  }, [location.city, location.country, location.calculationMethod]);

  // 3. Countdown Calculator (every tick of now)
  useEffect(() => {
    if (prayerData?.next?.time) {
      const diffMs = prayerData.next.time.getTime() - now.getTime();
      if (diffMs > 0) {
        const totalSec = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        setCountdownText(
          `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      } else {
        setCountdownText('حان وقت الصلاة');
      }
    }
  }, [now, prayerData]);

  // 4. Format Hijri & Gregorian Dates
  const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const fallbackHijriDate = hijriFormatter.format(now);
  const displayHijriDate = apiHijriDate || fallbackHijriDate;

  const gregorianFormatter = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const gregorianDateString = gregorianFormatter.format(now);

  // Format single prayer time (e.g. 04:30 ص)
  const formatPrayerTime = (dateObj) => {
    if (!dateObj) return '--:--';
    return dateObj.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${dailyQuote.text}" - [${dailyQuote.source}]`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const nextPrayerKey = prayerData?.next?.prayer;
  const nextPrayerName = nextPrayerKey && PRAYER_METADATA[nextPrayerKey]
    ? PRAYER_METADATA[nextPrayerKey].name
    : 'الصلاة القادمة';

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 select-none overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
        {/* Top Header: Location, Hijri & Gregorian Date + Network Status */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h1 className="text-2xl md:text-3xl font-bold text-amber-300 font-serif">
                نِصاب | مواقيت الصلاة والذكر
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Online / Offline Data Source Badge */}
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm transition-all ${
                  dataSource === 'online'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                }`}
                title={dataSource === 'online' ? 'تم جلب البيانات من  الشبكة' : 'تم الحساب محلياً بدون إنترنت'}
              >
                {dataSource === 'online' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مباشر</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>حساب فلكي محلي (Offline)</span>
                  </>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={() => loadPrayerTimes(new Date())}
                disabled={isRefreshing}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-emerald-950/80 border border-transparent hover:border-emerald-800/60 transition"
                title="تحديث المواقيت الآن"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Region Label Card & Date Card */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dedicated Current Region Label from Settings */}
            <div
              className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-amber-500/50 shadow-lg backdrop-blur-md group hover:border-amber-400 transition"
              title="المنطقة المحددة لمواقيت الصلاة في شاشة الإعدادات"
            >
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">المنطقة المحددة (من الإعدادات):</div>
                <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                  <span>{location.city}</span>
                  <span className="text-slate-500">،</span>
                  <span className="text-emerald-300">{location.countryArabic || location.country}</span>
                </div>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('settings')}
                  className="mr-2 px-2.5 sm:px-3 py-1 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-700/60 hover:border-amber-400/60 text-xs text-amber-300 font-bold transition hover:scale-105 active:scale-95 shadow"
                  title="تغيير الدولة والمدينة في شاشة الإعدادات"
                >
                  تعديل
                </button>
              )}
            </div>

            {/* Hijri & Gregorian Date Card */}
            <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 shadow-lg flex items-center gap-3 sm:gap-4">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div className="text-right">
                <div className="text-sm sm:text-base font-bold text-amber-200">{displayHijriDate}</div>
                <div className="text-[11px] text-slate-400">{gregorianDateString} م</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner: Next Prayer Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-5 sm:p-6 lg:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/40 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Countdown Display */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold">
                <Clock className="w-4 h-4" />
                <span>الوقت المتبقي حتى أذان {nextPrayerName}:</span>
              </div>
              <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-widest text-slate-100">
                {countdownText || '--:--:--'}
              </div>
              <p className="text-xs text-emerald-300">
                صلاة {nextPrayerName} الساعة {formatPrayerTime(prayerData?.next?.time)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 5 Daily Prayer Times Grid Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>مواقيت الصلوات اليومية بتوقيت ({location.city})</span>
            </h2>

            <span className="text-xs text-slate-400">
              المصدر: {dataSource === 'online' ? 'AlAdhan Timings API' : 'حساب فلكي محلي (Adhan Library)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {prayerData?.times &&
              Object.entries(PRAYER_METADATA).map(([key, meta]) => {
                const prayerDate = prayerData.times[key];
                const isNext = prayerData.next?.prayer === key;
                const IconComponent = meta.icon;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.03 }}
                    className={`relative rounded-2xl p-3.5 sm:p-4 lg:p-5 border transition-all text-center flex flex-col justify-between ${
                      isNext
                        ? 'bg-gradient-to-b from-emerald-800/80 to-emerald-950 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                        : 'bg-slate-900/70 border-emerald-900/40 hover:border-emerald-700/60'
                    }`}
                  >
                    {isNext && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                        القادمة
                      </span>
                    )}

                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className={`p-2.5 sm:p-3 rounded-2xl ${isNext ? 'bg-amber-400 text-slate-950' : 'bg-emerald-950 text-amber-400 border border-emerald-800/60'}`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>

                    <div className="text-sm sm:text-base font-bold text-slate-200 mb-1">{meta.name}</div>
                    <div className="text-base sm:text-lg font-mono font-bold text-amber-300">
                      {formatPrayerTime(prayerDate)}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Random Islamic Quiz Question Card (سؤال اليوم في المسابقات الإسلامية) */}
        {randomQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-emerald-950/90 border border-emerald-800/60 rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            {/* Top decorative header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold text-sm sm:text-base">سؤال اليوم في العلوم الشرعية</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      عشوائي
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-medium">{randomQuestion.categoryName}</span>
                    <span>•</span>
                    <span>{randomQuestion.topicName}</span>
                    <span>•</span>
                    <span className="text-amber-300/80">{randomQuestion.levelName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: New Random Question & Go to full Quizzes screen */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => fetchRandomQuestion(true)}
                  disabled={isRefreshingQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 hover:text-amber-300 border border-slate-700 transition"
                  title="سحب سؤال عشوائي جديد"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuestion ? 'animate-spin text-amber-400' : ''}`} />
                  <span>سؤال آخر</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('quizzes')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-xs text-amber-300 border border-emerald-700/60 transition shadow-sm font-semibold"
                  title="الانتقال إلى جميع المسابقات الإسلامية"
                >
                  <span>قسم المسابقات</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="my-4 sm:my-5">
              <p className="font-serif text-base sm:text-xl md:text-2xl text-amber-200 leading-relaxed">
                « {randomQuestion.q} »
              </p>
            </div>

            {/* Multiple Choice Answers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {randomQuestion.shuffledAnswers?.map((ans, idx) => {
                const isSelected = selectedAnswerIndex === idx;
                const isCorrect = ans.t === 1;

                let optClass = 'bg-slate-900/90 border-emerald-900/60 text-slate-200 hover:border-amber-400/80 hover:bg-slate-800/80';
                let badgeClass = 'bg-slate-800 text-slate-400';

                if (hasAnswered) {
                  if (isCorrect) {
                    optClass = 'bg-emerald-900/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/40 shadow-md';
                    badgeClass = 'bg-emerald-500 text-slate-950 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optClass = 'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/40';
                    badgeClass = 'bg-rose-500 text-white font-bold';
                  } else {
                    optClass = 'opacity-40 bg-slate-950/60 border-slate-900 text-slate-400';
                  }
                }

                const arabicLetters = ['أ', 'ب', 'ج'];

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelectQuizAnswer(idx)}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between text-xs sm:text-sm font-medium ${optClass}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${badgeClass}`}>
                        {arabicLetters[idx] || idx + 1}
                      </span>
                      <span className="leading-snug">{ans.answer}</span>
                    </div>

                    {hasAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />}
                    {hasAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400 shrink-0 mr-1" />}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Banner & Dorar Reference */}
            {hasAnswered && (
              <div className="mt-4 pt-3 border-t border-emerald-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {randomQuestion.shuffledAnswers[selectedAnswerIndex]?.t === 1 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>أحسنت! إجابة صحيحة بارك الله فيك ✨</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5 flex-wrap">
                      <X className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>إجابة خاطئة! الإجابة الصحيحة هي:</span>
                      <span className="text-emerald-300 font-bold">
                        « {randomQuestion.shuffledAnswers.find((a) => a.t === 1)?.answer} »
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {randomQuestion.link && (
                    <button
                      onClick={() => openExternalUrl(randomQuestion.link)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>توثيق الإجابة في الدرر السنية</span>
                    </button>
                  )}

                  <button
                    onClick={() => fetchRandomQuestion(true)}
                    className="text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1 underline font-medium"
                  >
                    <span>سؤال جديد</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Daily Islamic Quote Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border border-emerald-800/60 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>فائدة اليوم الإيمانية</span>
            </div>
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
            >
              {copiedQuote ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedQuote ? 'تم النسخ' : 'نسخ الفائدة'}
            </button>
          </div>

          <div className="my-4 sm:my-6 text-center">
            <p className="font-serif text-lg sm:text-2xl md:text-3xl text-amber-200 leading-relaxed px-2">
              « {dailyQuote.text} »
            </p>
            <span className="inline-block mt-3 text-xs text-emerald-400 font-mono bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-800/50">
              {dailyQuote.source}
            </span>
          </div>
        </motion.div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 sm:gap-5">
          <button
            onClick={() => onNavigate && onNavigate('books')}
            className="group p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-2.5 sm:p-3 w-fit rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-950 text-amber-400 border border-amber-500/40 mb-3 group-hover:scale-110 transition-transform">
                <Library className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">المكتبة الإسلامية</h3>
              <p className="text-xs text-slate-400 mt-1">مطالعة 19 كتاباً ورسالة دعوية نافعة</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('quizzes')}
            className="group p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-2.5 sm:p-3 w-fit rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-950 text-amber-400 border border-amber-500/40 mb-3 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">المسابقات الإسلامية</h3>
              <p className="text-xs text-slate-400 mt-1">5,820 سؤال في مختلف العلوم الشرعية</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('zakat')}
            className="group p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-2.5 sm:p-3 w-fit rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-950 text-amber-400 border border-amber-500/40 mb-3 group-hover:scale-110 transition-transform">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">حاسبة الزكاة (نِصاب)</h3>
              <p className="text-xs text-slate-400 mt-1">حساب زكاة المال، الذهب، والفطر</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('quran')}
            className="group p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-3 w-fit rounded-2xl bg-emerald-950 text-amber-400 border border-emerald-800/60 mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">القرآن الكريم</h3>
              <p className="text-xs text-slate-400 mt-1">تلاوة وتفسير الآيات دون إنترنت</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('hadith')}
            className="group p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-3 w-fit rounded-2xl bg-emerald-950 text-amber-400 border border-emerald-800/60 mb-3 group-hover:scale-110 transition-transform">
                <Scroll className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">الحديث الشريف</h3>
              <p className="text-xs text-slate-400 mt-1">صحيح البخاري ومسلم والسنن</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('azkar')}
            className="group p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-3 w-fit rounded-2xl bg-emerald-950 text-amber-400 border border-emerald-800/60 mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">الأذكار والتسبيح</h3>
              <p className="text-xs text-slate-400 mt-1">أذكار الصباح والمساء بعداد تفاعلي</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('asma')}
            className="group p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-900/60 hover:border-amber-400/60 transition-all text-right flex items-center justify-between shadow-xl"
          >
            <div>
              <div className="p-3 w-fit rounded-2xl bg-emerald-950 text-amber-400 border border-emerald-800/60 mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">أسماء الله الحسنى</h3>
              <p className="text-xs text-slate-400 mt-1">تأمل معاني الأسماء الـ 99 وتسبيح</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
