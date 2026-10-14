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
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Calendar,
  Radio,
  BookmarkCheck,
  Coins,
  Award,
  Library,
  Landmark,
  Info,
  Gamepad2,
  Tv
} from 'lucide-react';
import DashboardScreen from './screens/DashboardScreen';
import QuranScreen from './screens/QuranScreen';
import KhatmahTrackerScreen from './screens/KhatmahTrackerScreen';
import BooksScreen from './screens/BooksScreen';
import ZakatCalculatorScreen from './screens/ZakatCalculatorScreen';
import HadithScreen from './screens/HadithScreen';
import HadithInfoScreen from './screens/HadithInfoScreen';
import IslamicHistoryScreen from './screens/IslamicHistoryScreen';
import IslamicQuizzesScreen from './screens/IslamicQuizzesScreen';
import AzkarScreen from './screens/AzkarScreen';
import RoqiaScreen from './screens/RoqiaScreen';
import AsmaScreen from './screens/AsmaScreen';
import RadioScreen from './screens/RadioScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import AboutScreen from './screens/AboutScreen';
import FanoosAlNoorScreen from './screens/Kids/FanoosAlNoorScreen';
import Kids_tv from './screens/Kids/Kids_tv';
import { usePrayerNotifier } from './hooks/usePrayerNotifier';
import { useKhatmahNotifier } from './hooks/useKhatmahNotifier';
import appIcon from '../assets/icon.png';

const NAV_GROUPS = [
  {
    id: 'general',
    title: 'الرئيسية',
    items: [
      { id: 'dashboard', label: 'الرئيسية', icon: Home },
    ]
  },
  {
    id: 'quran_section',
    title: 'القرآن وعلومه',
    items: [
      { id: 'quran', label: 'المصحف الشريف', icon: BookOpen },
      { id: 'khatmah', label: 'متابعة الختمة', icon: BookmarkCheck },
      { id: 'radio', label: 'إذاعة القرآن', icon: Radio, badge: 'Live' },
    ]
  },
  {
    id: 'knowledge_section',
    title: 'العلوم والمعارف',
    items: [
      { id: 'hadith', label: 'الحديث الشريف', icon: Scroll },
      { id: 'books', label: 'المكتبة الإسلامية', icon: Library },
      { id: 'history', label: 'التاريخ الإسلامي', icon: Landmark },
      { id: 'quizzes', label: 'المسابقات الإسلامية', icon: Award },
    ]
  },
  {
    id: 'worship_section',
    title: 'العبادات والأذكار',
    items: [
      { id: 'zakat', label: 'حاسبة الزكاة', icon: Coins },
      { id: 'azkar', label: 'الأذكار', icon: Heart },
      { id: 'roqia', label: 'الرقية الشرعية', icon: ShieldCheck },
      { id: 'asma', label: 'أسماء الله الحسنى', icon: Sparkles },
      { id: 'calendar', label: 'التقويم الهجري', icon: Calendar, badge: 'Soon' },
    ]
  },
  {
    id: 'kids_section',
    title: 'واحة الأطفال',
    items: [
      { id: 'kids_fanoos', label: 'فانوس النور (لعبة)', icon: Gamepad2},
      { id: 'kids_tv', label: 'تلفزيون الأطفال', icon: Tv },
    ]
  },
  {
    id: 'system_section',
    title: 'النظام',
    items: [
      { id: 'settings', label: 'الإعدادات', icon: Settings },
      { id: 'about', label: 'عن التطبيق', icon: Info },
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hadithInfoData, setHadithInfoData] = useState(null);
  const [quranNavTarget, setQuranNavTarget] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);

  // Collapsed state for each navigation group (saved in localStorage)
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('nisab_sidebar_collapsed_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('nisab_sidebar_collapsed_groups', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Automatically expand group containing active tab
  useEffect(() => {
    const parentGroup = NAV_GROUPS.find((group) =>
      group.items.some(
        (item) => item.id === activeTab || (item.id === 'hadith' && activeTab === 'hadith-info')
      )
    );
    if (parentGroup && collapsedGroups[parentGroup.id]) {
      setCollapsedGroups((prev) => {
        const updated = { ...prev, [parentGroup.id]: false };
        try {
          localStorage.setItem('nisab_sidebar_collapsed_groups', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [activeTab]);

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

  const renderNavButton = (tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id || (tab.id === 'hadith' && activeTab === 'hadith-info');

    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        title={tab.label}
        className={`w-full relative flex items-center rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
          isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
        } ${
          isActive
            ? 'bg-emerald-900/80 text-amber-300 border border-amber-500/30 shadow-lg shadow-emerald-950/50'
            : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/40 border border-transparent'
        }`}
      >
        <Icon className={`w-5 h-5 min-w-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-between w-full min-w-0">
            <span className="whitespace-nowrap truncate">{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono tracking-wider shadow-sm shrink-0">
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
  };

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
        className="h-full border-l border-emerald-900/50 bg-slate-950/95 backdrop-blur-xl flex flex-col z-30 select-none shadow-2xl relative shrink-0 overflow-hidden"
      >
        {/* Brand / Logo + Collapse Toggle */}
        <div className="shrink-0 p-3 sm:p-4 pb-3 border-b border-emerald-900/40">
          <div className="flex items-center justify-between">
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-emerald-950/60 transition cursor-pointer"
                title="طي القائمة الجانبية"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-emerald-950/60 transition cursor-pointer"
                title="توسيع القائمة الجانبية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-3 scrollbar-thin scrollbar-thumb-emerald-800">
          {NAV_GROUPS.map((group, idx) => {
            if (isSidebarCollapsed) {
              return (
                <div key={group.id} className="space-y-1.5">
                  {idx > 0 && <div className="border-t border-emerald-900/40 my-2 mx-1" />}
                  {group.items.map((tab) => renderNavButton(tab))}
                </div>
              );
            }

            const isCollapsed = !!collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-amber-300 rounded-xl hover:bg-emerald-950/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 group-hover:bg-amber-400 transition-colors" />
                    <span className="text-[11px] font-bold tracking-wider">{group.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.2 rounded-md bg-slate-900/80 border border-slate-800">
                      {group.items.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key={`content-${group.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="space-y-1 overflow-hidden pt-0.5"
                    >
                      {group.items.map((tab) => renderNavButton(tab))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-emerald-900/40 bg-slate-950/60">
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

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <IslamicHistoryScreen onBack={() => setActiveTab('dashboard')} />
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

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <AboutScreen />
            </motion.div>
          )}

          {activeTab === 'kids_fanoos' && (
            <motion.div
              key="kids_fanoos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <FanoosAlNoorScreen />
            </motion.div>
          )}

          {activeTab === 'kids_tv' && (
            <motion.div
              key="kids_tv"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', height: '100%', minWidth: 0 }}
              className="h-full w-full min-w-0"
            >
              <Kids_tv />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
