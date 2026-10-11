import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  MapPin,
  Bell,
  Volume2,
  VolumeX,
  Check,
  Save,
  Compass,
  Radio,
  Clock,
  Sparkles,
  Power
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import SwitchToggle from '../components/SwitchToggle';
import { notificationManager } from '../services/NotificationManager';

// AlAdhan API Calculation Method IDs Mapping
// https://aladhan.com/prayer-times-api#tag/daily-prayer-times/GET/timings/{date}
export const ALADHAN_METHOD_MAP = {
  Egyptian: 5,           // Egyptian General Authority of Survey
  UmmAlQura: 4,          // Umm Al-Qura University, Makkah
  MuslimWorldLeague: 3,  // Muslim World League
  Dubai: 16,             // Dubai
  Kuwait: 9,             // Kuwait
  Qatar: 10              // Qatar
};

export const CALCULATION_METHODS = [
  { id: 'Egyptian', name: 'الهيئة المصرية العامة للمساحة (مصر، إفريقيا، الشام)' },
  { id: 'UmmAlQura', name: 'جامعة أم القرى (مكة المكرمة والمملكة العربية السعودية)' },
  { id: 'MuslimWorldLeague', name: 'رابطة العالم الإسلامي (أوروبا ومعظم الدول)' },
  { id: 'Dubai', name: 'دائرة الشؤون الإسلامية بدبي (الإمارات)' },
  { id: 'Kuwait', name: 'وزارة الأوقاف بالكويت' },
  { id: 'Qatar', name: 'وزارة الأوقاف بقطر' },
];

export default function SettingsScreen() {
  const [countries, setCountries] = useState([]);
  const [reciters, setReciters] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State initialized from localStorage if available
  const [selectedCountry, setSelectedCountry] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.country || 'Egypt';
      }
    } catch (e) {}
    return 'Egypt';
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.city || 'Cairo';
      }
    } catch (e) {}
    return 'Cairo';
  });
  const [selectedReciter, setSelectedReciter] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.reciterId || '1';
      }
    } catch (e) {}
    return '1';
  });
  const [calcMethod, setCalcMethod] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.calcMethod || 'Egyptian';
      }
    } catch (e) {}
    return 'Egyptian';
  });
  const [enableNotification, setEnableNotification] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.enableNotification !== undefined ? p.enableNotification : true;
      }
    } catch (e) {}
    return true;
  });
  const [enableAdhanSound, setEnableAdhanSound] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.enableAdhanSound !== undefined ? p.enableAdhanSound : true;
      }
    } catch (e) {}
    return true;
  });
  const [enableReminder, setEnableReminder] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.enableReminder !== undefined ? p.enableReminder : true;
      }
    } catch (e) {}
    return true;
  });
  const [reminderMinutes, setReminderMinutes] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.reminderMinutes ? Number(p.reminderMinutes) : 15;
      }
    } catch (e) {}
    return 15;
  });
  const [enableStartup, setEnableStartup] = useState(() => {
    try {
      const s = localStorage.getItem('nisab_user_settings');
      if (s) {
        const p = JSON.parse(s);
        return p.enableStartup !== undefined ? Boolean(p.enableStartup) : false;
      }
    } catch (e) {}
    return false;
  });

  // Audio preview element
  const [audioElement] = useState(() => new Audio());
  const [previewingAudio, setPreviewingAudio] = useState(null);

  useEffect(() => {
    async function loadConfigData() {
      try {
        const countryList = await window.nisabAPI.readJson('countries.json');
        if (Array.isArray(countryList)) {
          const sorted = [...countryList].sort((a, b) =>
            (a.arabic_name || '').localeCompare(b.arabic_name || '', 'ar')
          );
          setCountries(sorted);
        }
        const recList = await window.nisabAPI.getReciters();
        if (recList) {
          setReciters(recList);
        }
        if (window.nisabAPI.getAutoStart) {
          const auto = await window.nisabAPI.getAutoStart();
          setEnableStartup(Boolean(auto));
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    }

    if (window.nisabAPI) {
      loadConfigData();
    }
  }, []);

  // Keep settings state synced when modified elsewhere (e.g. from QuranScreen)
  useEffect(() => {
    const handleSettingsChanged = () => {
      try {
        const s = localStorage.getItem('nisab_user_settings');
        if (s) {
          const p = JSON.parse(s);
          if (p.reciterId && p.reciterId !== selectedReciter) {
            setSelectedReciter(p.reciterId);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('nisab-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('nisab-settings-changed', handleSettingsChanged);
    };
  }, [selectedReciter]);

  // Sort countries alphabetically by Arabic name in ascending order (أ -> ي)
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) =>
      (a.arabic_name || '').localeCompare(b.arabic_name || '', 'ar')
    );
  }, [countries]);

  const handleTestAudio = async (soundName) => {
    if (previewingAudio === soundName) {
      audioElement.pause();
      setPreviewingAudio(null);
    } else {
      try {
        const soundUri = await window.nisabAPI.getOfflineAudio(soundName);
        audioElement.src = soundUri;
        audioElement.play();
        setPreviewingAudio(soundName);
        audioElement.onended = () => setPreviewingAudio(null);
      } catch (err) {
        console.error('Failed to preview audio:', err);
      }
    }
  };

  const handleSaveSettings = () => {
    const matchedCountry = countries.find(
      (c) => c.english_name === selectedCountry || c.arabic_name === selectedCountry
    );
    const countryArabicName = matchedCountry ? matchedCountry.arabic_name : (selectedCountry === 'Egypt' ? 'مصر' : selectedCountry);

    let existingLat = 30.0444;
    let existingLng = 31.2357;
    try {
      const existing = localStorage.getItem('nisab_user_settings');
      if (existing) {
        const p = JSON.parse(existing);
        if (p.latitude) existingLat = p.latitude;
        if (p.longitude) existingLng = p.longitude;
      }
    } catch (e) {}

    const config = {
      country: selectedCountry,
      countryArabic: countryArabicName,
      city: selectedCity,
      latitude: existingLat,
      longitude: existingLng,
      reciterId: selectedReciter,
      calcMethod,
      enableNotification,
      enableAdhanSound,
      enableReminder,
      reminderMinutes,
      enableStartup,
      adhanSound: enableAdhanSound ? 'azan.mp3' : 'reminder.mp3'
    };
    localStorage.setItem('nisab_user_settings', JSON.stringify(config));
    if (window.nisabAPI?.setAutoStart) {
      window.nisabAPI.setAutoStart(enableStartup).catch(console.error);
    }
    window.dispatchEvent(new Event('nisab-settings-changed'));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    // Show modern popup notification if notifications are enabled
    if (enableNotification) {
      notificationManager.show({
        type: 'success',
        icon: 'check',
        title: 'تم حفظ التغييرات بنجاح',
        message: 'تم تحديث بيانات الموقع ومواقيت الصلاة والتنبيهات وإعدادات بدء التشغيل بنجاح.',
        duration: 4500
      });
    }
  };

  return (
    <div
      style={{ height: '100%', overflowY: 'auto' }}
      className="relative h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-8 select-none overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800"
      dir="rtl"
    >
      <ArabesquePattern className="opacity-10 text-emerald-500" />

      <div className="relative z-10 w-full max-w-[1500px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 flex items-center gap-2.5 sm:gap-3">
              <SettingsIcon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              <span>إعدادات التطبيق والموقع</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              تخصيص مواقيت الصلاة، التنبيهات الصوتية، والقارئ الافتراضي
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg self-start sm:self-auto"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'تم الحفظ بنجاح' : 'حفظ التغييرات'}</span>
          </button>
        </div>

        {/* Section 1: Default Quran Reciter (At the Top) */}
        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Radio className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg">القارئ الافتراضي لتلاوة القرآن الكريم</h2>
            </div>
            {reciters[selectedReciter] && (
              <span className="text-xs text-amber-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 font-medium self-start sm:self-auto">
                القارئ المختار: {reciters[selectedReciter].reciter}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            اختر القارئ المفضل للاستماع إلى تلاوة الآيات الكريمة بصوته العذب في شاشة المصحف الشريف والبحث.
          </p>

          {/* Interactive Reciter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(reciters).map(([id, item]) => {
              const isSelected = selectedReciter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedReciter(id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-900/70 border-amber-400/80 text-amber-300 shadow-lg shadow-emerald-950/60 ring-1 ring-amber-400/50'
                      : 'bg-slate-950/80 border-emerald-900/40 text-slate-300 hover:border-emerald-700/60 hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-sm truncate font-serif">{item.reciter}</div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">{item.name_en}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Section 2: Location & Prayer Calculation Method */}
        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <MapPin className="w-5 h-5" />
              <h2 className="text-base sm:text-lg">تحديد الموقع وحساب الأذان</h2>
            </div>
            <span className="text-xs text-amber-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 font-medium self-start sm:self-auto">
              المنطقة المحددة: {selectedCity}، {countries.find((c) => c.english_name === selectedCountry || c.arabic_name === selectedCountry)?.arabic_name || selectedCountry}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                الدولة:
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {sortedCountries.map((c) => (
                  <option key={c.alpha2_code} value={c.english_name}>
                    {c.arabic_name} ({c.english_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                المدينة:
              </label>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                placeholder="اسم المدينة..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              طريقة حساب المواقيت الفلكية:
            </label>
            <select
              value={calcMethod}
              onChange={(e) => setCalcMethod(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            >
              <option value="Egyptian">الهيئة المصرية العامة للمساحة (مصر، إفريقيا، الشام)</option>
              <option value="UmmAlQura">جامعة أم القرى (مكة المكرمة والمملكة العربية السعودية)</option>
              <option value="MuslimWorldLeague">رابطة العالم الإسلامي (أوروبا ومعظم الدول)</option>
              <option value="Dubai">دائرة الشؤون الإسلامية بدبي (الإمارات)</option>
              <option value="Kuwait">وزارة الأوقاف بالكويت</option>
              <option value="Qatar">وزارة الأوقاف بقطر</option>
            </select>
          </div>
        </div>

        {/* Section 2: Notifications & Adhan Alerts */}
        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Bell className="w-5 h-5" />
              <h2 className="text-base sm:text-lg">تنبيهات الأذان والإشعارات المنبثقة</h2>
            </div>
            <span className="text-xs text-amber-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 font-medium self-start sm:self-auto">
              تنبيهات ذكية ومحلية
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* 1. Switch Toggle: Enable Popup Notifications */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 hover:border-emerald-800/60 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-100">
                      تفعيل الإشعارات
                    </span>
                    {enableNotification && (
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50 font-medium">
                        مفعل
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    إظهار إشعارات نظام الويندوز (Windows Notifications) على سطح المكتب خارج التطبيق عند حلول أوقات الصلاة والتذكيرات.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => notificationManager.testNotification()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-xs text-amber-300 border border-amber-500/40 font-semibold transition shadow-sm"
                    title="تجربة إشعار الويندوز على سطح المكتب الآن"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>تجربة الإشعار</span>
                  </button>

                  <SwitchToggle
                    id="toggle-notifications"
                    checked={enableNotification}
                    onChange={setEnableNotification}
                    ariaLabel="تفعيل الإشعارات المنبثقة"
                  />
                </div>
              </div>
            </div>

            {/* 2. Switch Toggle: Enable Adhan Sound */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 hover:border-emerald-800/60 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-100">
                      تفعيل صوت الأذان
                    </span>
                    {enableAdhanSound && (
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50 font-medium">
                        مفعل
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    تشغيل صوت الأذان كاملاً عند دخول وقت الفريضة (الفجر، الظهر، العصر، المغرب، العشاء).
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTestAudio('azan.mp3')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      previewingAudio === 'azan.mp3'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-amber-300 border-emerald-800/80'
                    }`}
                  >
                    {previewingAudio === 'azan.mp3' ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>{previewingAudio === 'azan.mp3' ? 'إيقاف الأذان' : 'تجربة الأذان'}</span>
                  </button>

                  <SwitchToggle
                    id="toggle-adhan-sound"
                    checked={enableAdhanSound}
                    onChange={setEnableAdhanSound}
                    ariaLabel="تفعيل صوت الأذان"
                  />
                </div>
              </div>
            </div>

            {/* 3. Switch Toggle: Enable Reminder Before Adhan + Dynamic Minutes Dropdown */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 hover:border-emerald-800/60 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-100">
                      تفعيل التذكير قبل موعد الأذان
                    </span>
                    {enableReminder && (
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50 font-medium">
                        مفعل ({reminderMinutes} دقيقة)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    إرسال تنبيه مسبق هادئ قبل حلول وقت الصلاة للاستعداد والوضوء والتوجه للمسجد.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTestAudio('reminder.mp3')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      previewingAudio === 'reminder.mp3'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-amber-300 border-emerald-800/80'
                    }`}
                  >
                    {previewingAudio === 'reminder.mp3' ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>{previewingAudio === 'reminder.mp3' ? 'إيقاف التنبيه' : 'تجربة صوت التذكير'}</span>
                  </button>

                  <SwitchToggle
                    id="toggle-reminder"
                    checked={enableReminder}
                    onChange={setEnableReminder}
                    ariaLabel="تفعيل التذكير قبل موعد الأذان"
                  />
                </div>
              </div>

              {/* Dynamic Minutes Dropdown (opened if enabled) */}
              <AnimatePresence>
                {enableReminder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-emerald-900/40 pt-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/40 p-3 sm:p-4 rounded-xl border border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <label className="text-xs sm:text-sm font-semibold text-slate-200 block">
                            تحديد وقت التذكير قبل موعد الأذان:
                          </label>
                          <span className="text-[11px] text-slate-400">
                            سيتم تنبيهك قبل وقت الصلاة بـ {reminderMinutes} دقيقة
                          </span>
                        </div>
                      </div>

                      <select
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(Number(e.target.value))}
                        className="bg-slate-950 border border-emerald-700/80 rounded-xl px-4 py-2 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                      >
                        <option value={5}>5 دقائق قبل الأذان</option>
                        <option value={10}>10 دقائق قبل الأذان</option>
                        <option value={15}>15 دقيقة قبل الأذان (افتراضي)</option>
                        <option value={20}>20 دقيقة قبل الأذان</option>
                        <option value={30}>30 دقيقة قبل الأذان</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 4: System & Auto-Startup Settings */}
        <div className="bg-slate-900/80 border border-emerald-900/50 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-md space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Power className="w-5 h-5" />
              <h2 className="text-base sm:text-lg">إعدادات النظام والتشغيل التلقائي</h2>
            </div>
            <span className="text-xs text-amber-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 font-medium self-start sm:self-auto">
              إقلاع النظام (Windows Startup)
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-900/40 hover:border-emerald-800/60 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-100">
                    تشغيل التطبيق تلقائياً عند بدء تشغيل الجهاز (Startup)
                  </span>
                  {enableStartup && (
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50 font-medium">
                      مفعل مع بدء التشغيل
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تشغيل تطبيق نصاب تلقائياً مع إقلاع نظام التشغيل لضمان استمرار متابعة مواقيت الصلاة، الأذكار، والتنبيهات بالخلفية دون الحاجة لفتح البرنامج يدوياً.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                <SwitchToggle
                  id="toggle-startup"
                  checked={enableStartup}
                  onChange={async (checked) => {
                    setEnableStartup(checked);
                    if (window.nisabAPI?.setAutoStart) {
                      try {
                        await window.nisabAPI.setAutoStart(checked);
                      } catch (err) {
                        console.error('Failed to set auto-start:', err);
                      }
                    }
                  }}
                  ariaLabel="تشغيل التطبيق تلقائياً عند بدء تشغيل الجهاز"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
