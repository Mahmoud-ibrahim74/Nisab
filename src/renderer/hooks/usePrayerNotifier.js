import { useEffect, useRef } from 'react';
import { getPrayerSchedule } from '../../utils/prayerTimes';
import { notificationManager } from '../services/NotificationManager';

const PRAYER_NAMES = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء'
};

/**
 * Background hook that monitors Islamic prayer times and fires
 * reminder and Adhan notifications/audio in background on schedule.
 */
export function usePrayerNotifier() {
  const alertedPrayersRef = useRef(new Set());

  useEffect(() => {
    // Restore already alerted prayers for today from localStorage
    const nowInit = new Date();
    const todayKeyInit = nowInit.toISOString().split('T')[0];
    try {
      const savedAlerts = localStorage.getItem(`nisab_alerted_${todayKeyInit}`);
      if (savedAlerts) {
        JSON.parse(savedAlerts).forEach((key) => alertedPrayersRef.current.add(key));
      }
    } catch (e) {}

    const markAlerted = (key, todayKey) => {
      alertedPrayersRef.current.add(key);
      try {
        const arr = Array.from(alertedPrayersRef.current);
        localStorage.setItem(`nisab_alerted_${todayKey}`, JSON.stringify(arr));
      } catch (e) {}
    };

    const checkPrayerTimes = () => {
      try {
        const settings = notificationManager.getSettings();
        // If neither notifications nor Adhan sound nor reminder are enabled, skip
        if (!settings.enableNotification && !settings.enableAdhanSound && !settings.enableReminder) {
          return;
        }

        const now = new Date();
        const todayKey = now.toISOString().split('T')[0];

        // 1. Try reading today's cached exact prayer timestamps from Dashboard / AlAdhan
        let prayerTimestamps = null;
        try {
          const cached = localStorage.getItem('nisab_today_prayer_times');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.date === todayKey && parsed.times) {
              prayerTimestamps = parsed.times;
            }
          }
        } catch (e) {}

        // 2. Fallback: Offline astronomical calculation via Adhan library
        if (!prayerTimestamps) {
          let latitude = 30.0444; // Cairo default
          let longitude = 31.2357;
          let calcMethod = 'Egyptian';

          try {
            const s = localStorage.getItem('nisab_user_settings');
            if (s) {
              const parsed = JSON.parse(s);
              if (parsed.latitude) latitude = parsed.latitude;
              if (parsed.longitude) longitude = parsed.longitude;
              if (parsed.calcMethod) calcMethod = parsed.calcMethod;
            }
          } catch (e) {}

          const schedule = getPrayerSchedule(latitude, longitude, now, calcMethod);
          if (schedule?.times) {
            prayerTimestamps = {
              fajr: schedule.times.fajr ? schedule.times.fajr.getTime() : null,
              dhuhr: schedule.times.dhuhr ? schedule.times.dhuhr.getTime() : null,
              asr: schedule.times.asr ? schedule.times.asr.getTime() : null,
              maghrib: schedule.times.maghrib ? schedule.times.maghrib.getTime() : null,
              isha: schedule.times.isha ? schedule.times.isha.getTime() : null,
            };
          }
        }

        if (!prayerTimestamps) return;

        const reminderLeadMs = (settings.reminderMinutes || 15) * 60 * 1000;

        // 3. Check time left for each prayer
        Object.entries(PRAYER_NAMES).forEach(([prayerKey, arabicName]) => {
          const pTimestamp = prayerTimestamps[prayerKey];
          if (!pTimestamp) return;

          const diffMs = pTimestamp - now.getTime();

          // A. Pre-Adhan Reminder (e.g. 15 minutes before Adhan)
          if (settings.enableReminder) {
            const reminderKey = `reminder_${prayerKey}_${todayKey}`;
            // If time left is positive and within reminder threshold (within 45s window)
            if (diffMs > 0 && diffMs <= reminderLeadMs && diffMs >= (reminderLeadMs - 45000)) {
              if (!alertedPrayersRef.current.has(reminderKey)) {
                markAlerted(reminderKey, todayKey);
                notificationManager.notifyReminder(arabicName, settings.reminderMinutes || 15);
              }
            }
          }

          // B. Exact Adhan Time (countdown is 0 / finished):
          // diffMs <= 0 means time has arrived! Check window up to 2.5 minutes after start.
          const adhanKey = `adhan_${prayerKey}_${todayKey}`;
          if (diffMs <= 0 && diffMs >= -150000) {
            if (!alertedPrayersRef.current.has(adhanKey)) {
              markAlerted(adhanKey, todayKey);
              // Trigger Adhan notification & audio playback from user settings
              notificationManager.notifyAdhan(arabicName);
            }
          }
        });
      } catch (err) {
        console.warn('Error checking background prayer notifications schedule:', err);
      }
    };

    // Immediate initial check
    checkPrayerTimes();

    // High precision background interval: check every 5 seconds
    const interval = setInterval(checkPrayerTimes, 5000);

    // Listen to immediate settings changes or prayer update events
    const handleSettingsUpdate = () => checkPrayerTimes();
    window.addEventListener('nisab-settings-changed', handleSettingsUpdate);
    window.addEventListener('nisab-prayers-updated', handleSettingsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('nisab-settings-changed', handleSettingsUpdate);
      window.removeEventListener('nisab-prayers-updated', handleSettingsUpdate);
    };
  }, []);
}
