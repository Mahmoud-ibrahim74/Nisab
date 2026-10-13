import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Star,
  Play,
  ArrowRight,
  Trophy,
  Dices,
  Flame,
  Check,
  X,
  Layers,
  GraduationCap,
  Bookmark,
  Share2,
  Copy
} from 'lucide-react';
import ArabesquePattern from '../components/ArabesquePattern';
import Loader from '../components/Loader';
import {
  loadQuizzesData,
  getRandomQuestion,
  getQuizSessionQuestions,
  getAllQuestionsFlattened,
  openExternalUrl,
  CATEGORY_THEMES,
  LEVEL_METADATA,
  getQuizStats,
  recordQuizAnswer,
  recordQuizSessionFinish,
  getBookmarks,
  toggleBookmark,
  isBookmarked
} from '../services/quizService';
import { normalizeArabic } from '../../utils/arabicNormalizer';

// Category Icons Mapping
const CATEGORY_ICONS = {
  1: BookOpen,
  2: Sparkles,
  3: Award,
  4: GraduationCap,
  5: Trophy,
  6: Layers
};

export default function IslamicQuizzesScreen({ onNavigate }) {
  // Global Data State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getQuizStats());
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  // Screen Tabs: 'categories' | 'challenge' | 'search' | 'bookmarks' | 'activeQuiz' | 'quizFinished'
  const [activeTab, setActiveTab] = useState('categories');

  // Browse Category Hierarchy State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');

  // Quick Challenge Config State
  const [challengeCategory, setChallengeCategory] = useState('all');
  const [challengeLevel, setChallengeLevel] = useState('all');
  const [challengeCount, setChallengeCount] = useState(10);

  // Active Quiz Playing State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]); // Array of { question, selectedIdx, isCorrect }
  const [quizSessionMeta, setQuizSessionMeta] = useState({ title: '', categoryName: '' });

  // Question Bank & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState('all');
  const [searchLevelFilter, setSearchLevelFilter] = useState('all');
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [copiedLinkUid, setCopiedLinkUid] = useState(null);

  // Load Data on Mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const quizData = await loadQuizzesData();
        setData(quizData);
      } catch (err) {
        console.error('Error loading quiz data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Sync Stats & Bookmarks helper
  const refreshStatsAndBookmarks = () => {
    setStats(getQuizStats());
    setBookmarks(getBookmarks());
  };

  // Start a Quiz from selected Topic and Level
  const startTopicLevelQuiz = async (category, topic, levelKey) => {
    setLoading(true);
    try {
      const questions = await getQuizSessionQuestions({
        categoryId: category.id,
        topicSlug: topic.slug,
        levelKey: levelKey,
        count: 20
      });

      if (questions.length > 0) {
        setQuizQuestions(questions);
        setCurrentQIndex(0);
        setSelectedAnswerIndex(null);
        setHasAnswered(false);
        setSessionAnswers([]);
        setQuizSessionMeta({
          title: `${topic.name} - ${LEVEL_METADATA[levelKey]?.name || levelKey}`,
          categoryName: category.arabicName,
          categoryId: category.id
        });
        setActiveTab('activeQuiz');
      }
    } catch (e) {
      console.error('Error starting quiz:', e);
    } finally {
      setLoading(false);
    }
  };

  // Start Quick Challenge Quiz
  const startQuickChallenge = async () => {
    setLoading(true);
    try {
      const questions = await getQuizSessionQuestions({
        categoryId: challengeCategory === 'all' ? null : Number(challengeCategory),
        levelKey: challengeLevel === 'all' ? null : challengeLevel,
        count: challengeCount
      });

      if (questions.length > 0) {
        setQuizQuestions(questions);
        setCurrentQIndex(0);
        setSelectedAnswerIndex(null);
        setHasAnswered(false);
        setSessionAnswers([]);
        setQuizSessionMeta({
          title: `تحدي المعرفة السريع (${questions.length} سؤالاً)`,
          categoryName: challengeCategory === 'all' ? 'جميع الأقسام' : CATEGORY_THEMES[challengeCategory]?.name,
          categoryId: challengeCategory === 'all' ? null : Number(challengeCategory)
        });
        setActiveTab('activeQuiz');
      }
    } catch (e) {
      console.error('Error starting challenge:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle Answer Selection in Active Quiz
  const handleSelectAnswer = (index) => {
    if (hasAnswered) return;

    const currentQuestion = quizQuestions[currentQIndex];
    if (!currentQuestion) return;

    const chosenOption = currentQuestion.shuffledAnswers[index];
    const isCorrect = chosenOption?.t === 1;

    setSelectedAnswerIndex(index);
    setHasAnswered(true);

    // Save to session history
    const record = {
      question: currentQuestion,
      selectedAnswerIndex: index,
      isCorrect,
      correctAnswerText: currentQuestion.shuffledAnswers.find((a) => a.t === 1)?.answer || ''
    };
    setSessionAnswers((prev) => [...prev, record]);

    // Record to global persistence
    recordQuizAnswer(isCorrect, currentQuestion.categoryId);
    refreshStatsAndBookmarks();
  };

  // Move to Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (currentQIndex + 1 < quizQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setHasAnswered(false);
    } else {
      // Quiz Finished
      recordQuizSessionFinish();
      refreshStatsAndBookmarks();
      setActiveTab('quizFinished');
    }
  };

  // Bookmarking handler
  const handleToggleBookmark = (question) => {
    const updated = toggleBookmark(question);
    setBookmarks(updated);
  };

  // Lazily load flattened questions when user enters Search tab
  useEffect(() => {
    if (activeTab === 'search' && flattenedQuestions.length === 0) {
      setSearchLoading(true);
      getAllQuestionsFlattened()
        .then((list) => {
          setFlattenedQuestions(list);
        })
        .finally(() => setSearchLoading(false));
    }
  }, [activeTab, flattenedQuestions.length]);

  // Filtered search results
  const filteredSearchResults = useMemo(() => {
    if (activeTab !== 'search') return [];
    if (!searchQuery && searchCategoryFilter === 'all' && searchLevelFilter === 'all') {
      return flattenedQuestions.slice(0, 30); // Show first 30 as samples
    }

    const normalizedQuery = normalizeArabic(searchQuery.trim());

    return flattenedQuestions.filter((item) => {
      // Category filter
      if (searchCategoryFilter !== 'all' && item.categoryId !== Number(searchCategoryFilter)) {
        return false;
      }
      // Level filter
      if (searchLevelFilter !== 'all' && item.levelKey !== searchLevelFilter) {
        return false;
      }
      // Text query match
      if (normalizedQuery) {
        const matchesQ = item.normalizedQ.includes(normalizedQuery);
        const matchesAns = item.normalizedAnswers.includes(normalizedQuery);
        if (!matchesQ && !matchesAns) return false;
      }
      return true;
    }).slice(0, 100); // Cap at 100 for snappy performance
  }, [activeTab, flattenedQuestions, searchQuery, searchCategoryFilter, searchLevelFilter]);

  // Filtered topics within selected category
  const filteredTopics = useMemo(() => {
    if (!selectedCategory?.topics) return [];
    if (!topicSearchQuery.trim()) return selectedCategory.topics;

    const normQuery = normalizeArabic(topicSearchQuery.trim());
    return selectedCategory.topics.filter((t) =>
      normalizeArabic(t.name).includes(normQuery)
    );
  }, [selectedCategory, topicSearchQuery]);

  // Copy Dorar link helper
  const handleCopyLink = (uid, link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLinkUid(uid);
    setTimeout(() => setCopiedLinkUid(null), 2000);
  };

  if (loading && !data) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950 text-emerald-400">
        <Loader text="جاري تحميل بنك المسابقات والأسئلة الإسلامية..." />
      </div>
    );
  }

  // Calculate session results
  const totalInSession = sessionAnswers.length;
  const correctInSession = sessionAnswers.filter((a) => a.isCorrect).length;
  const scorePercent = totalInSession > 0 ? Math.round((correctInSession / totalInSession) * 100) : 0;

  return (
    <div
      style={{ width: '100%', height: '100%', overflowY: 'auto' }}
      className="relative flex flex-col h-full w-full bg-slate-950 text-slate-100 select-none overflow-x-hidden font-sans"
      dir="rtl"
    >
      <ArabesquePattern />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6">

        {/* 1. Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-950 text-amber-400 border border-amber-500/40 shadow-lg">
                <Award className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-300 font-serif tracking-wide flex items-center gap-2">
                  <span>المسابقات والأسئلة الإسلامية</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    5,820 سؤال
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  تقويم وتطوير حصيلتك في العلوم الشرعية مع توثيق الإجابات من موقع «الدرر السنية»
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-900/60 text-slate-300">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>المجابة:</span>
              <span className="font-mono font-bold text-amber-300">{stats.totalAnswered}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-900/60 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>الصحيحة:</span>
              <span className="font-mono font-bold text-emerald-300">{stats.totalCorrect}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-900/60 text-slate-300">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>التتابع:</span>
              <span className="font-mono font-bold text-amber-400">{stats.currentStreak} 🔥</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-900/60 text-slate-300">
              <Bookmark className="w-4 h-4 text-sky-400" />
              <span>المحفوظة:</span>
              <span className="font-mono font-bold text-sky-300">{bookmarks.length}</span>
            </div>
          </div>
        </header>

        {/* 2. Top Navigation Tabs (Hidden during Active Quiz to maintain focus) */}
        {activeTab !== 'activeQuiz' && activeTab !== 'quizFinished' && (
          <nav className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-emerald-900/50 backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('categories');
                setSelectedTopic(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الأبواب والمستويات</span>
            </button>

            <button
              onClick={() => setActiveTab('challenge')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'challenge'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>التحدي السريع</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>بنك الأسئلة والبحث</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>الأسئلة المحفوظة ({bookmarks.length})</span>
            </button>
          </nav>
        )}

        {/* 3. TAB CONTENT: CATEGORIES & TOPICS HIERARCHY */}
        {activeTab === 'categories' && (
          <div className="flex flex-col gap-6">
            {/* If NO category selected: Show 6 Main Categories */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {data?.mainCategories?.map((cat) => {
                  const theme = CATEGORY_THEMES[cat.id] || CATEGORY_THEMES[1];
                  const IconComp = CATEGORY_ICONS[cat.id] || BookOpen;
                  const totalQuestions = (cat.topics?.length || 0) * 60; // 3 levels * 20 questions = 60 per topic

                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedTopic(null);
                        setTopicSearchQuery('');
                      }}
                      className={`cursor-pointer rounded-3xl p-5 sm:p-6 bg-gradient-to-b ${theme.gradient} border border-emerald-900/50 ${theme.borderHover} transition-all shadow-xl flex flex-col justify-between group`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-slate-900/80 border border-emerald-900/50 ${theme.accentText} group-hover:scale-110 transition-transform shadow-md`}>
                            <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${theme.badgeClass}`}>
                            {cat.topics?.length || 0} موضوعاً
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                          {cat.arabicName}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-300/80 mt-2 line-clamp-2 leading-relaxed">
                          {cat.description || theme.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-emerald-900/40 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-emerald-400">~ {totalQuestions.toLocaleString('ar-EG')} سؤالاً</span>
                        <span className="flex items-center gap-1 font-semibold text-amber-300 group-hover:-translate-x-1 transition-transform">
                          <span>استعراض المواضيع</span>
                          <ChevronLeft className="w-4 h-4" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : !selectedTopic ? (
              /* Category Selected: Show its Topics */
              <div className="flex flex-col gap-4">
                {/* Back button + Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                      title="الرجوع لجميع الأقسام"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
                        <span>قسم {selectedCategory.arabicName}</span>
                        <span className="text-xs font-mono text-emerald-400">({selectedCategory.topics?.length} موضوعاً)</span>
                      </h2>
                      <p className="text-xs text-slate-400">{selectedCategory.description}</p>
                    </div>
                  </div>

                  {/* Search within topics */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={topicSearchQuery}
                      onChange={(e) => setTopicSearchQuery(e.target.value)}
                      placeholder="بحث في مواضيع القسم..."
                      className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-emerald-900/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredTopics.map((topic) => (
                    <motion.div
                      key={topic.slug}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTopic(topic)}
                      className="cursor-pointer p-4 rounded-2xl bg-slate-900/80 border border-emerald-900/50 hover:border-amber-400/60 transition-all text-right shadow-lg flex flex-col justify-between group"
                    >
                      <div>
                        <div className="text-sm font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                          {topic.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          3 مستويات • 60 سؤالاً
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-emerald-400 pt-2 border-t border-emerald-900/30">
                        <span>اختر المستوى</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              /* Topic Selected: Choose Level to Start Quiz */
              <div className="flex flex-col gap-5">
                {/* Topic Header & Breadcrumb */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                    title="الرجوع لمواضيع القسم"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="text-xs text-slate-400">
                      {selectedCategory.arabicName} » {selectedTopic.name}
                    </div>
                    <h2 className="text-xl font-bold text-amber-300 mt-0.5">
                      اختر مستوى الاختبار في: {selectedTopic.name}
                    </h2>
                  </div>
                </div>

                {/* 3 Level Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {['level1', 'level2', 'level3'].map((lvlKey) => {
                    const lvlMeta = LEVEL_METADATA[lvlKey];
                    const qCount = selectedTopic.levelsData?.[lvlKey]?.length || 0;

                    return (
                      <motion.div
                        key={lvlKey}
                        whileHover={{ scale: 1.03 }}
                        className="rounded-3xl p-6 bg-gradient-to-b from-slate-900 to-emerald-950/40 border border-emerald-900/60 hover:border-amber-400 transition-all shadow-xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${lvlMeta.badgeClass}`}>
                              {lvlMeta.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{qCount} سؤالاً</span>
                          </div>

                          <h3 className="text-lg font-bold text-amber-200 mt-2">{lvlMeta.subName}</h3>
                          <p className="text-xs text-slate-300 mt-1">
                            اختبار علمي متكامل يتألف من {qCount} سؤالاً مع توثيق الإجابة من الدرر السنية.
                          </p>
                        </div>

                        <button
                          onClick={() => startTopicLevelQuiz(selectedCategory, selectedTopic, lvlKey)}
                          className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-amber-200 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                        >
                          <Play className="w-4 h-4 fill-amber-200" />
                          <span>بدء الاختبار الآن</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB CONTENT: QUICK CHALLENGE */}
        {activeTab === 'challenge' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 via-emerald-950/50 to-slate-900 border border-emerald-800/60 shadow-2xl">
              <div className="text-center pb-6 border-b border-emerald-900/40">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg">
                  <Dices className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-amber-300 font-serif">التحدي السريع في العلوم الشرعية</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  اختر معايير الاختبار وسيقوم التطبيق بسحب أسئلة عشوائية من بنك الأسئلة الشامل
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                {/* 1. Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-2">1. اختر القسم:</label>
                  <select
                    value={challengeCategory}
                    onChange={(e) => setChallengeCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-emerald-900/80 text-slate-200 text-sm focus:outline-none focus:border-amber-400 transition"
                  >
                    <option value="all">جميع الأقسام الشرعية (شامل)</option>
                    {data?.mainCategories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.arabicName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Level Selection */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-2">2. مستوى الصعوبة:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'all', label: 'جميع المستويات' },
                      { key: 'level1', label: 'المستوى الأول' },
                      { key: 'level2', label: 'المستوى الثاني' },
                      { key: 'level3', label: 'المستوى الثالث' }
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setChallengeLevel(lvl.key)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition border ${
                          challengeLevel === lvl.key
                            ? 'bg-emerald-800 text-amber-300 border-amber-400 shadow'
                            : 'bg-slate-950 text-slate-400 border-emerald-950 hover:bg-slate-900'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Number of Questions */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-2">3. عدد الأسئلة:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setChallengeCount(num)}
                        className={`p-2.5 rounded-xl text-xs font-bold font-mono transition border ${
                          challengeCount === num
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow'
                            : 'bg-slate-950 text-slate-400 border-emerald-950 hover:bg-slate-900'
                        }`}
                      >
                        {num} أسئلة
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Challenge Button */}
                <button
                  onClick={startQuickChallenge}
                  className="mt-4 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>بدء التحدي الآن</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. TAB CONTENT: SEARCH & QUESTION BANK */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-5">
            {/* Search Controls */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-900/60 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في نص السؤال أو الإجابة (مثال: الفاتحة، صلاة، سجود، نبي...)"
                  className="w-full pr-11 pl-4 py-3 rounded-xl bg-slate-950 border border-emerald-900/60 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={searchCategoryFilter}
                  onChange={(e) => setSearchCategoryFilter(e.target.value)}
                  className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="all">كل الأقسام</option>
                  {data?.mainCategories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.arabicName}
                    </option>
                  ))}
                </select>

                <select
                  value={searchLevelFilter}
                  onChange={(e) => setSearchLevelFilter(e.target.value)}
                  className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="all">كل المستويات</option>
                  <option value="level1">المستوى الأول</option>
                  <option value="level2">المستوى الثاني</option>
                  <option value="level3">المستوى الثالث</option>
                </select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="text-xs text-slate-400 flex items-center justify-between px-1">
              <span>نتائج البحث: <span className="text-amber-300 font-mono font-bold">{filteredSearchResults.length}</span> سؤال</span>
              <span>مصدر التوثيق: الدرر السنية</span>
            </div>

            {/* Questions List */}
            {searchLoading ? (
              <div className="py-12 text-center text-emerald-400">
                <Loader text="جاري تجهيز فهرس البحث الشامل..." />
              </div>
            ) : filteredSearchResults.length === 0 ? (
              <div className="py-16 text-center text-slate-500 rounded-3xl bg-slate-900/40 border border-emerald-900/30">
                <Search className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p>لم يتم العثور على أسئلة مطابقة للبحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSearchResults.map((item) => (
                  <div
                    key={item.uid}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/50 hover:border-emerald-700/60 transition shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Tags */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                            {item.categoryName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {item.topicName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300/80">
                            {item.levelName}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleBookmark(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition"
                          title="حفظ السؤال"
                        >
                          <Star className={`w-4 h-4 ${isBookmarked(item.uid) ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm font-bold text-amber-200 mt-2 leading-relaxed">
                        {item.q}
                      </p>

                      {/* Options */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {item.answers?.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                              ans.t === 1
                                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-slate-950/60 border border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span>{ans.answer}</span>
                            {ans.t === 1 && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer with Dorar Link */}
                    {item.link && (
                      <div className="mt-3 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-xs">
                        <button
                          onClick={() => openExternalUrl(item.link)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>عرض التوثيق في الدرر السنية</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(item.uid, item.link)}
                          className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                        >
                          {copiedLinkUid === item.uid ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ الرابط</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. TAB CONTENT: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>الأسئلة المحفوظة للمراجعة ({bookmarks.length})</span>
              </h2>
              {bookmarks.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('nisab_islamic_quizzes_bookmarks');
                    setBookmarks([]);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  مسح كل المحفوظات
                </button>
              )}
            </div>

            {bookmarks.length === 0 ? (
              <div className="py-16 text-center text-slate-500 rounded-3xl bg-slate-900/40 border border-emerald-900/30">
                <Bookmark className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p>لا توجد أسئلة محفوظة حتى الآن</p>
                <p className="text-xs text-slate-600 mt-1">
                  يمكنك حفظ أي سؤال أثناء الاختبارات أو من بنك الأسئلة بالضغط على أيقونة النجمة ⭐
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.map((item) => (
                  <div
                    key={item.uid}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/50 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-semibold">
                          {item.categoryName} • {item.topicName}
                        </span>
                        <button
                          onClick={() => handleToggleBookmark(item)}
                          className="text-amber-400 hover:text-rose-400 transition"
                          title="إزالة من المحفوظات"
                        >
                          <Star className="w-4 h-4 fill-amber-400" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-amber-200 mt-2">{item.q}</p>

                      <div className="mt-3 flex flex-col gap-1.5">
                        {item.answers?.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                              ans.t === 1
                                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-slate-950/60 border border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span>{ans.answer}</span>
                            {ans.t === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.link && (
                      <div className="mt-3 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-xs">
                        <button
                          onClick={() => openExternalUrl(item.link)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>التوثيق في الدرر السنية</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. TAB CONTENT: ACTIVE QUIZ PLAYER */}
        {activeTab === 'activeQuiz' && quizQuestions.length > 0 && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
            {/* Quiz Top Navigation Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/60 flex items-center justify-between">
              <button
                onClick={() => {
                  if (window.confirm('هل تريد إنهاء الاختبار والعودة للقائمة الرئيسية؟')) {
                    setActiveTab('categories');
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>إنهاء الاختبار</span>
              </button>

              <div className="text-center">
                <div className="text-xs font-bold text-amber-300">{quizSessionMeta.title}</div>
                <div className="text-[11px] text-slate-400">
                  السؤال <span className="font-mono text-emerald-400 font-bold">{currentQIndex + 1}</span> من{' '}
                  <span className="font-mono font-bold">{quizQuestions.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sessionAnswers.filter((a) => a.isCorrect).length} صحيح</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-emerald-900/40">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            {/* Main Question Card */}
            {(() => {
              const currentQ = quizQuestions[currentQIndex];
              if (!currentQ) return null;

              return (
                <motion.div
                  key={currentQ.uid || currentQIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-800/60 shadow-2xl relative"
                >
                  {/* Category / Topic Pills + Bookmark button */}
                  <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        {currentQ.categoryName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {currentQ.topicName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentQ.levelName}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(currentQ)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                      title="حفظ السؤال في المفضلة"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isBookmarked(currentQ.uid) ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Question Title */}
                  <div className="my-6">
                    <span className="text-xs text-amber-400/80 font-mono">سؤال رقم {currentQIndex + 1}:</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-amber-200 font-serif leading-relaxed mt-2">
                      « {currentQ.q} »
                    </h2>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="flex flex-col gap-3 my-6">
                    {currentQ.shuffledAnswers.map((opt, idx) => {
                      const isSelected = selectedAnswerIndex === idx;
                      const isCorrect = opt.t === 1;

                      let btnStyle = 'bg-slate-900/90 border-emerald-900/60 text-slate-200 hover:border-amber-400/80 hover:bg-slate-800/80';
                      let letterStyle = 'bg-slate-800 text-slate-400';

                      if (hasAnswered) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-900/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50 shadow-lg';
                          letterStyle = 'bg-emerald-500 text-slate-950 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/50';
                          letterStyle = 'bg-rose-500 text-white font-bold';
                        } else {
                          btnStyle = 'opacity-50 bg-slate-950/60 border-slate-900 text-slate-400';
                        }
                      }

                      const arabicLetters = ['أ', 'ب', 'ج', 'د'];

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => handleSelectAnswer(idx)}
                          className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between text-sm sm:text-base font-medium ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${letterStyle}`}>
                              {arabicLetters[idx] || idx + 1}
                            </span>
                            <span>{opt.answer}</span>
                          </div>

                          {hasAnswered && (
                            <div>
                              {isCorrect && <Check className="w-5 h-5 text-emerald-400" />}
                              {isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Banner and Next Question Button */}
                  <AnimatePresence>
                    {hasAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-4 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Source Reference Link */}
                        <div>
                          {currentQ.link ? (
                            <button
                              onClick={() => openExternalUrl(currentQ.link)}
                              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>توثيق الإجابة في الدرر السنية</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400">إجابة معتمدة</span>
                          )}
                        </div>

                        {/* Next Question / Finish Button */}
                        <button
                          onClick={handleNextQuestion}
                          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                        >
                          <span>{currentQIndex + 1 < quizQuestions.length ? 'السؤال التالي' : 'عرض النتيجة النهائية'}</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* 8. TAB CONTENT: QUIZ COMPLETED SCREEN */}
        {activeTab === 'quizFinished' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-800/60 shadow-2xl text-center"
            >
              {/* Trophy Icon */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-xl ring-4 ring-amber-400/20">
                <Trophy className="w-10 h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-serif">
                اكتمل الاختبار بحمد الله!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-2">
                {scorePercent >= 90
                  ? 'ما شاء الله تبارك الله! إتقان متميز وحصيلة علمية رفيعة 🌟'
                  : scorePercent >= 70
                  ? 'أحسنت! إجابات طيبة ومستوى مبارك، واصل التعلم 👏'
                  : scorePercent >= 50
                  ? 'محاولة جيدة! بالاستمرار والمراجعة يزداد العلم رسوخاً 📖'
                  : 'محاولة مباركة! العلم بالتعلم، راجع الإجابات من مصادر الدرر السنية 🌱'}
              </p>

              {/* Score Percentage Dial */}
              <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-emerald-900/60 inline-flex flex-col items-center justify-center min-w-[160px]">
                <span className="text-4xl sm:text-5xl font-extrabold text-amber-300 font-mono">
                  {scorePercent}%
                </span>
                <span className="text-xs text-emerald-400 font-bold mt-1">
                  {correctInSession} من أصل {totalInSession} إجابة صحيحة
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => {
                    // Retake same session with fresh shuffled answers
                    setQuizQuestions(quizQuestions.map((q) => ({ ...q, shuffledAnswers: [...q.shuffledAnswers].sort(() => Math.random() - 0.5) })));
                    setCurrentQIndex(0);
                    setSelectedAnswerIndex(null);
                    setHasAnswered(false);
                    setSessionAnswers([]);
                    setActiveTab('activeQuiz');
                  }}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة نفس الاختبار</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setSelectedTopic(null);
                  }}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Layers className="w-4 h-4" />
                  <span>اختيار موضوع آخر</span>
                </button>
              </div>
            </motion.div>

            {/* Session Answers Review List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-amber-300 px-1">مراجعة أسئلة هذا الاختبار:</h3>
              {sessionAnswers.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-sm ${
                    item.isCorrect
                      ? 'bg-slate-900/80 border-emerald-900/60'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="text-amber-400 font-bold">سؤال {idx + 1}:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {item.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200">{item.question.q}</p>

                  <div className="mt-2 text-xs flex flex-col gap-1">
                    <div className="text-emerald-400">
                      ✓ الإجابة الصحيحة: <span className="font-bold text-slate-100">{item.correctAnswerText}</span>
                    </div>
                    {item.question.link && (
                      <button
                        onClick={() => openExternalUrl(item.question.link)}
                        className="text-amber-400/90 hover:text-amber-300 flex items-center gap-1 mt-1 w-fit"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>توثيق الدرر السنية</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
