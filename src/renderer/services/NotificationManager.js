import { getSurahForPage } from '../utils/khatmahConstants';

/**
 * NotificationManager Class for Nisab
 * Triggers native Windows desktop notifications (outside the app)
 * and manages Islamic audio alerts (Adhan & Prayer Reminders).
 */
export class NotificationManager {
  constructor() {
    this.listeners = new Set();
    this.audioElement = new Audio();
    this.currentPlayingSound = null;

    this.audioElement.onended = () => {
      this.currentPlayingSound = null;
    };

    this.audioElement.onerror = (e) => {
      console.warn('Audio playback error in NotificationManager:', e);
      this.currentPlayingSound = null;
    };
  }

  /**
   * Reads user notification and sound settings from localStorage
   */
  getSettings() {
    try {
      const saved = localStorage.getItem('nisab_user_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enableNotification: parsed.enableNotification !== undefined ? parsed.enableNotification : true,
          enableAdhanSound: parsed.enableAdhanSound !== undefined ? parsed.enableAdhanSound : true,
          enableReminder: parsed.enableReminder !== undefined ? parsed.enableReminder : true,
          enableKhatmahReminder: parsed.enableKhatmahReminder !== undefined ? parsed.enableKhatmahReminder : true,
          reminderMinutes: parsed.reminderMinutes || 15,
          adhanSound: parsed.adhanSound || 'azan.mp3'
        };
      }
    } catch (e) {
      console.error('Error reading settings in NotificationManager:', e);
    }
    return {
      enableNotification: true,
      enableAdhanSound: true,
      enableReminder: true,
      enableKhatmahReminder: true,
      reminderMinutes: 15,
      adhanSound: 'azan.mp3'
    };
  }

  /**
   * Subscribes a listener (backward compatibility)
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener([]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Displays a native Windows notification outside the app
   */
  show({
    title,
    message,
    type = 'info', // 'adhan' | 'reminder' | 'success' | 'warning' | 'info' | 'preview'
    sound = null,   // 'azan.mp3' | 'reminder.mp3' | null
    silent = false
  }) {
    const settings = this.getSettings();
    const effectiveSound = sound || (type === 'adhan' ? settings.adhanSound : null);
    const isAdhan = type === 'adhan' || effectiveSound === 'azan.mp3' || effectiveSound === settings.adhanSound;
    const isReminder = type === 'reminder' || effectiveSound === 'reminder.mp3';

    // Check if sound should be played
    let shouldPlaySound = false;
    if (isAdhan) {
      shouldPlaySound = type === 'preview' || settings.enableAdhanSound;
    } else if (isReminder) {
      shouldPlaySound = type === 'preview' || settings.enableReminder;
    } else if (effectiveSound) {
      shouldPlaySound = true;
    }

    // Play Adhan or reminder audio if enabled
    if (shouldPlaySound && effectiveSound) {
      this.playAudio(effectiveSound);
    }

    // If notifications are disabled and this is not a manual user preview test, skip visual alert
    if (!settings.enableNotification && type !== 'preview') {
      return null;
    }

    // If custom audio is playing, make Windows notification silent so it doesn't chime over the audio
    const isSilent = silent || shouldPlaySound;

    // Trigger Native Windows Toast Notification (outside the app window)
    if (window.nisabAPI?.showNativeNotification) {
      window.nisabAPI.showNativeNotification({
        title: title || 'Nisab | نِصاب',
        message: message || '',
        silent: isSilent
      });
    } else if (typeof window.Notification !== 'undefined') {
      try {
        new window.Notification(title || 'Nisab | نِصاب', {
          body: message || '',
          silent: isSilent
        });
      } catch (err) {
        console.warn('Fallback Web Notification failed:', err);
      }
    }

    return true;
  }

  /**
   * Dismiss notification (legacy stub)
   */
  dismiss() {}

  /**
   * Clear all notifications (legacy stub)
   */
  clearAll() {}

  /**
   * Safely plays offline audio file (azan.mp3, reminder.mp3)
   */
  async playAudio(soundName) {
    if (!soundName) return;

    try {
      this.stopAudio();
      let audioUri = null;
      if (window.nisabAPI?.getOfflineAudio) {
        try {
          audioUri = await window.nisabAPI.getOfflineAudio(soundName);
        } catch (e) {}
      }
      if (!audioUri && soundName === 'rattil.mp3') {
        audioUri = 'https://everyayah.com/data/Alafasy_128kbps/073004.mp3';
      }
      if (audioUri) {
        this.audioElement.src = audioUri;
        await this.audioElement.play();
        this.currentPlayingSound = soundName;
      }
    } catch (err) {
      console.warn(`Could not play offline audio [${soundName}]:`, err);
      this.currentPlayingSound = null;
    }
  }

  /**
   * Stops currently playing audio
   */
  stopAudio() {
    try {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      }
    } catch (e) {}
    this.currentPlayingSound = null;
  }

  /**
   * Triggers a test preview notification directly through Windows notification system
   */
  testNotification() {
    return this.show({
      type: 'preview',
      title: 'إشعار تجريبي • تطبيق نِصاب',
      message: 'تم تفعيل إشعارات نظام الويندوز بنجاح! ستظهر تنبيهات الصلاة على سطح المكتب خارج التطبيق.',
      sound: null,
      silent: false
    });
  }

  /**
   * Triggers an Adhan alert via Windows Notification and Azan audio
   */
  notifyAdhan(prayerArabicName) {
    const settings = this.getSettings();
    return this.show({
      type: 'adhan',
      title: `🕌 حان الآن موعد أذان ${prayerArabicName}`,
      message: `حيّ على الصلاة، حيّ على الفلاح • حان الآن وقت فريضة ${prayerArabicName}`,
      sound: settings.adhanSound || 'azan.mp3'
    });
  }

  /**
   * Triggers a reminder alert before Adhan via Windows Notification and reminder audio
   */
  notifyReminder(prayerArabicName, minutesLeft) {
    return this.show({
      type: 'reminder',
      title: `⏰ اقترب موعد صلاة ${prayerArabicName}`,
      message: `متبقي ${minutesLeft} دقيقة على موعد الأذان • استعد وتوضأ للصلاة`,
      sound: 'reminder.mp3'
    });
  }

  /**
   * Triggers a desktop notification to remind user to start or continue their Khatmah today
   */
  notifyKhatmahReminder({ hasActiveKhatmah = false, currentPage = 1, surahName = '', todayPages = 20 } = {}) {
    const settings = this.getSettings();
    if (!settings.enableNotification || settings.enableKhatmahReminder === false) {
      return null;
    }

    if (!hasActiveKhatmah) {
      return this.show({
        type: 'reminder',
        title: '📖 تذكير بختمة القرآن الكريم • نِصاب',
        message: 'لم تبدأ ختمة للقرآن الكريم بعد! ابدأ رحلتك المباركة اليوم وحدد خطتك لقراءة كتاب الله الكريم.',
        sound: 'rattil.mp3'
      });
    }

    const surahText = surahName ? ` سورة ${surahName}` : '';
    return this.show({
      type: 'reminder',
      title: '📖 تذكير بالورد القرآني اليومي • نِصاب',
      message: `لم تبدأ وردك القرآني اليوم بعد (${todayPages} صفحة تبدأ من ص ${currentPage}${surahText ? ' • ' + surahText : ''}). بادر بإتمام وردك المبارك اليوم! ✨`,
      sound: 'rattil.mp3'
    });
  }

  /**
   * Checks if user has started/completed today's Khatmah, and alerts them if not yet started.
   * Tracks alert status in localStorage so the user is only alerted once a day unless forced.
   */
  checkAndAlertKhatmah(khatmahData = null, force = false) {
    const settings = this.getSettings();
    if (!settings.enableNotification || settings.enableKhatmahReminder === false) {
      return false;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Determine khatmah state
    let state = khatmahData;
    if (!state) {
      try {
        const saved = localStorage.getItem('nisab_khatmah_data');
        if (saved) {
          state = JSON.parse(saved);
        }
      } catch (e) {}
    }

    const hasActive = Boolean(state?.hasActiveKhatmah && state?.plan);
    const lastDate = state?.lastCompletedDate
      ? new Date(state.lastCompletedDate).toISOString().split('T')[0]
      : null;
    const isCompletedToday = lastDate === todayStr;

    // If active khatmah is already finished for today, no need to alert
    if (hasActive && isCompletedToday) {
      return false;
    }

    // Check localStorage flag for today to ensure we only alert once a day
    const alertKey = hasActive
      ? `nisab_khatmah_werd_alerted_${todayStr}`
      : `nisab_khatmah_noplan_alerted_${todayStr}`;

    if (!force && localStorage.getItem(alertKey)) {
      return false; // Already alerted today
    }

    let surahName = '';
    const currentPage = state?.currentPage || 1;
    const todayPages = state?.plan?.dailyPages || 20;

    try {
      const surah = getSurahForPage(currentPage);
      if (surah) {
        surahName = surah.name;
      }
    } catch (e) {}

    const alerted = this.notifyKhatmahReminder({
      hasActiveKhatmah: hasActive,
      currentPage,
      surahName,
      todayPages
    });

    if (alerted) {
      try {
        localStorage.setItem(alertKey, new Date().toISOString());
      } catch (e) {}
    }

    return alerted;
  }
}

// Export singleton instance as default and named export
export const notificationManager = new NotificationManager();
export default NotificationManager;
