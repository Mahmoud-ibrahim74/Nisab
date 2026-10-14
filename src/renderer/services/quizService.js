import { normalizeArabic } from '../../utils/arabicNormalizer';

// In-memory cache for fast access across components
let cachedQuizzesData = null;
let loadPromise = null;
let flattenedQuestionsCache = null;

// Categories Visual Theme & Metadata
export const CATEGORY_THEMES = {
  1: {
    id: 1,
    name: 'التفسير',
    slug: 'tafseer',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-600/30 via-emerald-950/60 to-slate-900',
    borderHover: 'hover:border-emerald-500/60',
    accentText: 'text-emerald-400',
    description: 'فهم معاني القرآن العظيم وتدبر آياته ومقاصده السامية'
  },
  2: {
    id: 2,
    name: 'العقيدة',
    slug: 'akida',
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    gradient: 'from-amber-600/30 via-amber-950/60 to-slate-900',
    borderHover: 'hover:border-amber-500/60',
    accentText: 'text-amber-400',
    description: 'أصول الإيمان، التوحيد، وأركان العقيدة الإسلامية الصافية'
  },
  3: {
    id: 3,
    name: 'الحديث',
    slug: 'hadith',
    color: 'teal',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    gradient: 'from-teal-600/30 via-teal-950/60 to-slate-900',
    borderHover: 'hover:border-teal-500/60',
    accentText: 'text-teal-400',
    description: 'سنة النبي المصطفى ﷺ، أصول الرواية، وشروح الأحاديث'
  },
  4: {
    id: 4,
    name: 'الفقه',
    slug: 'figh',
    color: 'violet',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    gradient: 'from-violet-600/30 via-violet-950/60 to-slate-900',
    borderHover: 'hover:border-violet-500/60',
    accentText: 'text-violet-400',
    description: 'أحكام العبادات والمعاملات، الحلال والحرام، والفرائض'
  },
  5: {
    id: 5,
    name: 'التاريخ والسيرة',
    slug: 'history',
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    gradient: 'from-rose-600/30 via-rose-950/60 to-slate-900',
    borderHover: 'hover:border-rose-500/60',
    accentText: 'text-rose-400',
    description: 'السيرة النبوية العطرة، العصر الراشدي، وتاريخ الأمة المجيد'
  },
  6: {
    id: 6,
    name: 'اللغة العربية',
    slug: 'arabia',
    color: 'sky',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    gradient: 'from-sky-600/30 via-sky-950/60 to-slate-900',
    borderHover: 'hover:border-sky-500/60',
    accentText: 'text-sky-400',
    description: 'لغة القرآن الكريم، الإعراب، البلاغة، ومفردات البيان'
  }
};

export const LEVEL_METADATA = {
  level1: {
    key: 'level1',
    name: 'المستوى الأول',
    subName: 'مبتدئ / تأسيسي',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    points: 10
  },
  level2: {
    key: 'level2',
    name: 'المستوى الثاني',
    subName: 'متوسط / متمرس',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    points: 20
  },
  level3: {
    key: 'level3',
    name: 'المستوى الثالث',
    subName: 'متقدم / متعمق',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    points: 30
  }
};

/**
 * Loads and caches Islamic-Quizzes.json via Electron safe JSON reader
 */
export async function loadQuizzesData() {
  if (cachedQuizzesData) {
    return cachedQuizzesData;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      if (window.nisabAPI?.readJson) {
        const data = await window.nisabAPI.readJson('Islamic-Quizzes.json');
        cachedQuizzesData = data;
        return data;
      }
      throw new Error('nisabAPI.readJson unavailable');
    } catch (err) {
      console.error('Failed to load Islamic-Quizzes.json:', err);
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Gets a completely random question from the dataset
 * Optionally filtered by categoryId or levelKey
 */
export async function getRandomQuestion(filter = {}) {
  const data = await loadQuizzesData();
  if (!data?.mainCategories?.length) return null;

  let categories = data.mainCategories;
  if (filter.categoryId) {
    categories = categories.filter((c) => c.id === Number(filter.categoryId));
  }
  if (!categories.length) categories = data.mainCategories;

  // Pick random category
  const category = categories[Math.floor(Math.random() * categories.length)];
  if (!category?.topics?.length) return null;

  // Pick random topic
  const topic = category.topics[Math.floor(Math.random() * category.topics.length)];
  if (!topic?.levelsData) return null;

  // Pick level
  const availableLevels = Object.keys(topic.levelsData).filter(
    (lvl) => topic.levelsData[lvl]?.length > 0
  );
  if (!availableLevels.length) return null;

  let selectedLevelKey = filter.levelKey;
  if (!selectedLevelKey || !availableLevels.includes(selectedLevelKey)) {
    selectedLevelKey = availableLevels[Math.floor(Math.random() * availableLevels.length)];
  }

  const questions = topic.levelsData[selectedLevelKey];
  if (!questions?.length) return null;

  const rawQuestion = questions[Math.floor(Math.random() * questions.length)];

  // Shuffle answers while retaining original t flag
  const shuffledAnswers = shuffleArray(rawQuestion.answers || []);

  return {
    ...rawQuestion,
    uid: `${category.id}-${topic.slug}-${selectedLevelKey}-${rawQuestion.id}`,
    categoryId: category.id,
    categoryName: category.arabicName,
    categorySlug: category.englishName,
    topicName: topic.name,
    topicSlug: topic.slug,
    levelKey: selectedLevelKey,
    levelName: LEVEL_METADATA[selectedLevelKey]?.name || selectedLevelKey,
    shuffledAnswers
  };
}

/**
 * Retrieves a customized set of questions for a quiz session
 */
export async function getQuizSessionQuestions({
  categoryId = null,
  topicSlug = null,
  levelKey = null,
  count = 10
}) {
  const data = await loadQuizzesData();
  if (!data?.mainCategories?.length) return [];

  let pool = [];

  for (const cat of data.mainCategories) {
    if (categoryId && cat.id !== Number(categoryId)) continue;

    for (const top of cat.topics || []) {
      if (topicSlug && top.slug !== topicSlug) continue;

      if (!top.levelsData) continue;

      for (const [lvlKey, qList] of Object.entries(top.levelsData)) {
        if (levelKey && lvlKey !== levelKey) continue;

        for (const q of qList) {
          pool.push({
            ...q,
            uid: `${cat.id}-${top.slug}-${lvlKey}-${q.id}`,
            categoryId: cat.id,
            categoryName: cat.arabicName,
            categorySlug: cat.englishName,
            topicName: top.name,
            topicSlug: top.slug,
            levelKey: lvlKey,
            levelName: LEVEL_METADATA[lvlKey]?.name || lvlKey,
            shuffledAnswers: shuffleArray(q.answers || [])
          });
        }
      }
    }
  }

  if (pool.length === 0) return [];

  // Shuffle and pick desired count
  const shuffledPool = shuffleArray(pool);
  return shuffledPool.slice(0, Math.min(count, shuffledPool.length));
}

/**
 * Returns flattened array of all 5,820 questions for global search
 */
export async function getAllQuestionsFlattened() {
  if (flattenedQuestionsCache) {
    return flattenedQuestionsCache;
  }

  const data = await loadQuizzesData();
  if (!data?.mainCategories?.length) return [];

  const list = [];
  for (const cat of data.mainCategories) {
    for (const top of cat.topics || []) {
      if (!top.levelsData) continue;
      for (const [lvlKey, qList] of Object.entries(top.levelsData)) {
        for (const q of qList) {
          const correctAnswer = q.answers?.find((a) => a.t === 1)?.answer || '';
          list.push({
            uid: `${cat.id}-${top.slug}-${lvlKey}-${q.id}`,
            id: q.id,
            q: q.q,
            link: q.link,
            answers: q.answers,
            correctAnswer,
            categoryId: cat.id,
            categoryName: cat.arabicName,
            topicName: top.name,
            topicSlug: top.slug,
            levelKey: lvlKey,
            levelName: LEVEL_METADATA[lvlKey]?.name || lvlKey,
            normalizedQ: normalizeArabic(q.q),
            normalizedAnswers: normalizeArabic(q.answers.map((a) => a.answer).join(' '))
          });
        }
      }
    }
  }

  flattenedQuestionsCache = list;
  return list;
}

/**
 * Opens Dorar.net or external URL safely
 */
export function openExternalUrl(url) {
  if (!url) return;
  if (window.nisabAPI?.openExternal) {
    window.nisabAPI.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ================= LocalStorage Stats & Bookmarks =================

const STATS_KEY = 'nisab_islamic_quizzes_stats';
const BOOKMARKS_KEY = 'nisab_islamic_quizzes_bookmarks';

export function getQuizStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    quizzesCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    categoryScores: {}
  };
}

export function recordQuizAnswer(isCorrect, categoryId) {
  try {
    const stats = getQuizStats();
    stats.totalAnswered += 1;
    if (isCorrect) {
      stats.totalCorrect += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > (stats.bestStreak || 0)) {
        stats.bestStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }

    if (categoryId) {
      const catKey = String(categoryId);
      if (!stats.categoryScores[catKey]) {
        stats.categoryScores[catKey] = { answered: 0, correct: 0 };
      }
      stats.categoryScores[catKey].answered += 1;
      if (isCorrect) {
        stats.categoryScores[catKey].correct += 1;
      }
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (e) {
    return null;
  }
}

export function recordQuizSessionFinish() {
  try {
    const stats = getQuizStats();
    stats.quizzesCompleted += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (e) {
    return null;
  }
}

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleBookmark(question) {
  try {
    const list = getBookmarks();
    const index = list.findIndex((item) => item.uid === question.uid);
    let updated;
    if (index >= 0) {
      updated = list.filter((item) => item.uid !== question.uid);
    } else {
      updated = [
        {
          uid: question.uid,
          q: question.q,
          categoryId: question.categoryId,
          categoryName: question.categoryName,
          topicName: question.topicName,
          levelKey: question.levelKey,
          levelName: question.levelName,
          link: question.link,
          answers: question.answers,
          savedAt: new Date().toISOString()
        },
        ...list
      ];
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function isBookmarked(uid) {
  const list = getBookmarks();
  return list.some((item) => item.uid === uid);
}
