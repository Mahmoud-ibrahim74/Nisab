import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Scroll,
  Heart,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  Radio,
  BookmarkCheck,
  Coins,
  Award,
  Library
} from 'lucide-react';
import DashboardScreen from './screens/DashboardScreen';
import QuranScreen from './screens/QuranScreen';
import KhatmahTrackerScreen from './screens/KhatmahTrackerScreen';
import BooksScreen from './screens/BooksScreen';
import ZakatCalculatorScreen from './screens/ZakatCalculatorScreen';
import HadithScreen from './screens/HadithScreen';
import HadithInfoScreen from './screens/HadithInfoScreen';
import IslamicQuizzesScreen from './screens/IslamicQuizzesScreen';
import AzkarScreen from './screens/AzkarScreen';
import RoqiaScreen from './screens/RoqiaScreen';
import AsmaScreen from './screens/AsmaScreen';
import RadioScreen from './screens/RadioScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import { usePrayerNotifier } from './hooks/usePrayerNotifier';
import { useKhatmahNotifier } from './hooks/useKhatmahNotifier';
import appIcon from '../assets/icon.png';

const TABS = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'quran', label: 'القرآن الكريم', icon: BookOpen },
  { id: 'khatmah', label: 'متابعة الختمة', icon: BookmarkCheck },
  { id: 'books', label: 'المكتبة الإسلامية', icon: Library, badge: 'جديد' },
  { id: 'zakat', label: 'حاسبة الزكاة', icon: Coins, badge: 'نِصاب' },
  { id: 'hadith', label: 'الحديث الشريف', icon: Scroll },
  { id: 'quizzes', label: 'المسابقات الإسلامية', icon: Award, badge: '5.8K' },
  { id: 'azkar', label: 'الأذكار', icon: Heart },
  { id: 'roqia', label: 'الرقية الشرعية', icon: ShieldCheck },
  { id: 'asma', label: 'أسماء الله الحسنى', icon: Sparkles },
  { id: 'radio', label: 'إذاعة القرآن', icon: Radio, badge: 'Live' },
  { id: 'calendar', label: 'التقويم الهجري', icon: Calendar, badge: 'Beta' },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hadithInfoData, setHadithInfoData] = useState(null);
  const [quranNavTarget, setQuranNavTarget] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);

  // Background prayer alert scheduling
  usePrayerNotifier();

  // Background Khatmah daily alert scheduling
  useKhatmahNotifier();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 880) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}
      className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans"
      dir="rtl"
    >
      {/* Modern Responsive Islamic Navigation Sidebar */}
      <aside
        style={{
          width: isSidebarCollapsed ? '76px' : '260px',
          minWidth: isSidebarCollapsed ? '76px' : '260px',
          maxWidth: isSidebarCollapsed ? '76px' : '260px',
          transition: 'width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease'
        }}
        className="border-l border-emerald-900/50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-4 z-30 select-none shadow-2xl relative shrink-0"
      >
        {/* Brand / Logo + Collapse Toggle */}
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-900/40">
            <div className={`flex items-center gap-2.5 overflow-hidden transition-all ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <img
                src={appIcon}
                alt="Nisab Icon"
                className="w-10 h-10 min-w-10 rounded-2xl shadow-lg border border-amber-500/40 object-cover"
              />
              {!isSidebarCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <div className="text-lg font-bold text-amber-300 font-serif tracking-wide">Nisab | نِصاب</div>
                  <div className="text-[10px] text-emerald-400">تطبيق المسلم المكتبي الشامل</div>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-emerald-950/60 transition"
                title="طي القائمة الجانبية"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-emerald-950/60 transition"
                title="توسيع القائمة الجانبية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id || (tab.id === 'hadith' && activeTab === 'hadith-info');

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`w-full relative flex items-center rounded-2xl text-sm font-semibold transition-all ${
                    isSidebarCollapsed
                      ? 'justify-center p-3'
                      : 'gap-3 px-3.5 py-3'
                  } ${
                    isActive
                      ? 'bg-emerald-900/80 text-amber-300 border border-amber-500/30 shadow-lg shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 min-w-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="whitespace-nowrap">{tab.label}</span>
                      {tab.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono tracking-wider shadow-sm">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isSidebarCollapsed && tab.badge && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950 shadow-sm"
                      title={tab.badge}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className={`rounded-2xl bg-emerald-950/40 border border-emerald-900/40 text-center transition-all ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="text-xs text-amber-300/80 font-serif">« أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ »</div>
              <div className="text-[10px] text-slate-500 mt-1">الإصدار 1.0.0 • Offline First</div>
            </>
          ) : (
            <div className="text-[10px] text-amber-400/80 font-mono">1.0</div>
          )}
        </div>
      </aside>

      {/* Main View Area */}
      <main
        style={{ flex: '1 1 0%', minWidth: 0, position: 'relative', overflow: 'hidden', height: '100vh', width: '100%' }}
        className="flex-1 min-w-0 w-full relative overflow-hidden bg-slate-950"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <DashboardScreen onNavigate={(screen) => setActiveTab(screen)} />
            </motion.div>
          )}

          {activeTab === 'quran' && (
            <motion.div
              key="quran"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <QuranScreen
                initialTarget={quranNavTarget}
                onClearTarget={() => setQuranNavTarget(null)}
              />
            </motion.div>
          )}

          {activeTab === 'khatmah' && (
            <motion.div
              key="khatmah"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <KhatmahTrackerScreen
                onNavigateToQuran={(target) => {
                  setQuranNavTarget(target);
                  setActiveTab('quran');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'zakat' && (
            <motion.div
              key="zakat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <ZakatCalculatorScreen />
            </motion.div>
          )}

          {activeTab === 'hadith' && (
            <motion.div
              key="hadith"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <HadithScreen
                onViewHadithInfo={(info) => {
                  setHadithInfoData(info);
                  setActiveTab('hadith-info');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'hadith-info' && (
            <motion.div
              key="hadith-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <HadithInfoScreen
                hadithData={hadithInfoData}
                onBack={() => setActiveTab('hadith')}
              />
            </motion.div>
          )}

          {activeTab === 'books' && (
            <motion.div
              key="books"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <BooksScreen onNavigate={(screen) => setActiveTab(screen)} />
            </motion.div>
          )}

          {activeTab === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <IslamicQuizzesScreen onNavigate={(screen) => setActiveTab(screen)} />
            </motion.div>
          )}

          {activeTab === 'azkar' && (
            <motion.div
              key="azkar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <AzkarScreen />
            </motion.div>
          )}

          {activeTab === 'roqia' && (
            <motion.div
              key="roqia"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <RoqiaScreen />
            </motion.div>
          )}

          {activeTab === 'asma' && (
            <motion.div
              key="asma"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <AsmaScreen />
            </motion.div>
          )}

          {activeTab === 'radio' && (
            <motion.div
              key="radio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <RadioScreen />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              {/* <CalendarScreen /> */}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <SettingsScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
