import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  QURAN_TOTAL_PAGES,
  calculateWerdTargets,
  getJuzForPage,
  getSurahForPage,
  getTodayWerdDetails,
  computeReadingStreak
} from '../utils/khatmahConstants';

const LOCAL_STORAGE_KEY = 'nisab_khatmah_data';
const SYNC_EVENT_NAME = 'nisab-khatmah-updated';

const DEFAULT_STATE = {
  hasActiveKhatmah: false,
  plan: null,
  currentPage: 1,
  currentSurahId: 1,
  currentAyahNumber: 1,
  completedDaysCount: 0,
  streak: 0,
  lastCompletedDate: null,
  history: []
};

/**
 * Custom Hook for Quran Khatmah Planning, Tracking, and Local Persistence
 */
export function useKhatmah() {
  const [khatmahState, setKhatmahState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_STATE;
  });

  const [loading, setLoading] = useState(true);

  // 1. Initial Load from Electron IPC (with localStorage fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        if (window.nisabAPI?.getKhatmahData) {
          const ipcData = await window.nisabAPI.getKhatmahData();
          if (ipcData && isMounted) {
            setKhatmahState(ipcData);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ipcData));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load Khatmah data from IPC, using localStorage fallback', err);
      }

      // Local storage fallback
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local && isMounted) {
          setKhatmahState(JSON.parse(local));
        }
      } catch (e) {}

      if (isMounted) setLoading(false);
    }

    loadData();

    // Listen to inter-screen broadcast events (e.g., when bookmark is saved from QuranScreen)
    const handleSync = (event) => {
      if (event.detail) {
        setKhatmahState(event.detail);
      } else {
        try {
          const updated = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (updated) setKhatmahState(JSON.parse(updated));
        } catch (e) {}
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
    };
  }, []);

  // Helper to persist state to IPC and LocalStorage + broadcast sync
  const saveState = useCallback(async (newState) => {
    setKhatmahState(newState);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {}

    try {
      if (window.nisabAPI?.saveKhatmahData) {
        await window.nisabAPI.saveKhatmahData(newState);
      }
    } catch (err) {
      console.warn('Failed saving Khatmah data to IPC:', err);
    }

    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: newState }));
  }, []);

  // 2. Start a New Khatmah Plan
  const startNewKhatmah = useCallback(
    async ({ targetDays = 30, startPage = 1, name = 'ختمتي المباركة' }) => {
      const pStart = Math.max(1, Math.min(604, Number(startPage) || 1));
      const targets = calculateWerdTargets({ targetDays, startPage: pStart, endPage: QURAN_TOTAL_PAGES });

      const startDate = new Date();
      const targetEndDate = new Date();
      targetEndDate.setDate(startDate.getDate() + targets.targetDays);

      const startSurah = getSurahForPage(pStart);

      const newPlan = {
        id: `khatmah_${Date.now()}`,
        name,
        targetDays: targets.targetDays,
        startPage: pStart,
        targetEndPage: QURAN_TOTAL_PAGES,
        startDate: startDate.toISOString(),
        targetEndDate: targetEndDate.toISOString(),
        dailyPages: targets.dailyPages,
        dailyJuz: targets.dailyJuz,
        dailyHizb: targets.dailyHizb,
        dailyAyahs: targets.dailyAyahs
      };

      const newState = {
        ...khatmahState,
        hasActiveKhatmah: true,
        plan: newPlan,
        currentPage: pStart,
        currentSurahId: startSurah.id,
        currentAyahNumber: 1,
        completedDaysCount: 0,
        streak: Math.max(1, khatmahState.streak || 1),
        lastCompletedDate: null
      };

      await saveState(newState);
      return newPlan;
    },
    [khatmahState, saveState]
  );

  // 3. Update Bookmark (reading position)
  const updateBookmark = useCallback(
    async ({ page, surahId = null, ayahNumber = 1 }) => {
      const validPage = Math.max(1, Math.min(604, Number(page) || 1));
      const surah = surahId ? { id: surahId } : getSurahForPage(validPage);

      const newState = {
        ...khatmahState,
        currentPage: validPage,
        currentSurahId: surah.id,
        currentAyahNumber: Number(ayahNumber) || 1
      };

      await saveState(newState);
    },
    [khatmahState, saveState]
  );

  // 4. Mark Today's Werd as Completed
  const completeTodayWerd = useCallback(async () => {
    if (!khatmahState.hasActiveKhatmah || !khatmahState.plan) return false;

    const dailyPages = khatmahState.plan.dailyPages || 20;
    const nextBookmarkPage = Math.min(604, khatmahState.currentPage + dailyPages);

    const nowStr = new Date().toISOString();
    const newStreak = computeReadingStreak(khatmahState.lastCompletedDate, khatmahState.streak);
    const surah = getSurahForPage(nextBookmarkPage);

    const newState = {
      ...khatmahState,
      currentPage: nextBookmarkPage,
      currentSurahId: surah.id,
      currentAyahNumber: 1,
      completedDaysCount: (khatmahState.completedDaysCount || 0) + 1,
      streak: newStreak,
      lastCompletedDate: nowStr
    };

    await saveState(newState);
    return true;
  }, [khatmahState, saveState]);

  // 5. Archive Completed Khatmah
  const archiveCurrentKhatmah = useCallback(async () => {
    if (!khatmahState.hasActiveKhatmah || !khatmahState.plan) return null;

    const completionDate = new Date().toISOString();
    const archiveRecord = {
      ...khatmahState.plan,
      completedAt: completionDate,
      daysTaken: khatmahState.completedDaysCount || khatmahState.plan.targetDays,
      finalStreak: khatmahState.streak
    };

    const newState = {
      ...khatmahState,
      hasActiveKhatmah: false,
      plan: null,
      currentPage: 1,
      currentSurahId: 1,
      currentAyahNumber: 1,
      completedDaysCount: 0,
      history: [archiveRecord, ...(khatmahState.history || [])]
    };

    await saveState(newState);
    return archiveRecord;
  }, [khatmahState, saveState]);

  // 6. Delete or cancel active Khatmah
  const deleteKhatmah = useCallback(async () => {
    const newState = {
      ...khatmahState,
      hasActiveKhatmah: false,
      plan: null,
      currentPage: 1,
      currentSurahId: 1,
      currentAyahNumber: 1,
      completedDaysCount: 0
    };
    await saveState(newState);
  }, [khatmahState, saveState]);

  const resetKhatmah = deleteKhatmah;

  // 7. Delete specific Khatmah from history log
  const deleteHistoryItem = useCallback(
    async (indexToDelete) => {
      const updatedHistory = (khatmahState.history || []).filter((_, i) => i !== indexToDelete);
      const newState = {
        ...khatmahState,
        history: updatedHistory
      };
      await saveState(newState);
    },
    [khatmahState, saveState]
  );

  // 8. Clear entire history log
  const clearHistory = useCallback(async () => {
    const newState = {
      ...khatmahState,
      history: []
    };
    await saveState(newState);
  }, [khatmahState, saveState]);

  // Computed Values & Detailed Metrics
  const metrics = useMemo(() => {
    const currentPage = Math.max(1, Math.min(604, khatmahState.currentPage || 1));
    const startPage = khatmahState.plan?.startPage || 1;
    const targetEndPage = khatmahState.plan?.targetEndPage || 604;
    const totalTarget = Math.max(1, targetEndPage - startPage + 1);

    const completedPages = Math.max(0, currentPage - startPage);
    const remainingPages = Math.max(0, targetEndPage - currentPage);

    // Precise progress percentage
    const rawPct = (completedPages / totalTarget) * 100;
    const completionPercentage = Math.min(100, Math.max(0, Math.round(rawPct * 10) / 10));
    const isCompleted = currentPage >= 604;

    // Remaining days calculation
    const dailyPages = khatmahState.plan?.dailyPages || 20;
    const remainingDays = Math.max(0, Math.ceil(remainingPages / dailyPages));

    // Days elapsed
    let daysElapsed = 0;
    if (khatmahState.plan?.startDate) {
      try {
        const start = new Date(khatmahState.plan.startDate);
        const now = new Date();
        daysElapsed = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
      } catch (e) {
        daysElapsed = 1;
      }
    }

    const currentJuz = getJuzForPage(currentPage);
    const currentSurah = getSurahForPage(currentPage);
    const todayWerd = getTodayWerdDetails(currentPage, dailyPages);

    return {
      completedPages,
      remainingPages,
      completionPercentage,
      isCompleted,
      daysElapsed,
      remainingDays,
      currentJuz,
      currentSurah,
      todayWerd
    };
  }, [khatmahState]);

  return {
    hasActiveKhatmah: khatmahState.hasActiveKhatmah,
    plan: khatmahState.plan,
    currentPage: khatmahState.currentPage,
    currentSurahId: khatmahState.currentSurahId,
    currentAyahNumber: khatmahState.currentAyahNumber,
    completedDaysCount: khatmahState.completedDaysCount,
    streak: khatmahState.streak || 0,
    lastCompletedDate: khatmahState.lastCompletedDate,
    history: khatmahState.history || [],
    loading,
    ...metrics,
    startNewKhatmah,
    updateBookmark,
    completeTodayWerd,
    archiveCurrentKhatmah,
    deleteKhatmah,
    resetKhatmah,
    deleteHistoryItem,
    clearHistory
  };
}
