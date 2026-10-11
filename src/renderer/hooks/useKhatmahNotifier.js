import { useEffect, useRef } from 'react';
import { notificationManager } from '../services/NotificationManager';

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
const INITIAL_DELAY_MS = 4000; // Wait 4 seconds on initial launch for smooth boot

/**
 * Background hook that monitors Khatmah status and triggers
 * native Windows desktop reminders if the user hasn't started
 * or completed today's Khatmah yet.
 */
export function useKhatmahNotifier() {
  const initialTimerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const triggerCheck = async () => {
      try {
        let khatmahData = null;
        if (window.nisabAPI?.getKhatmahData) {
          khatmahData = await window.nisabAPI.getKhatmahData();
        }
        notificationManager.checkAndAlertKhatmah(khatmahData);
      } catch (err) {
        console.warn('Error during Khatmah reminder check:', err);
        notificationManager.checkAndAlertKhatmah();
      }
    };

    // 1. Initial delayed check after app boot
    initialTimerRef.current = setTimeout(() => {
      triggerCheck();
    }, INITIAL_DELAY_MS);

    // 2. Periodic background check every 30 minutes
    intervalRef.current = setInterval(() => {
      triggerCheck();
    }, CHECK_INTERVAL_MS);

    // 3. Listen for changes in Khatmah state (e.g. user marked today's werd or created plan)
    const handleKhatmahUpdated = () => {
      // Re-check state if updated
      triggerCheck();
    };

    // 4. Listen for changes in user notification settings
    const handleSettingsChanged = () => {
      triggerCheck();
    };

    window.addEventListener('nisab-khatmah-updated', handleKhatmahUpdated);
    window.addEventListener('nisab-settings-changed', handleSettingsChanged);

    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('nisab-khatmah-updated', handleKhatmahUpdated);
      window.removeEventListener('nisab-settings-changed', handleSettingsChanged);
    };
  }, []);
}

export default useKhatmahNotifier;
