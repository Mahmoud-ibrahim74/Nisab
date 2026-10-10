/**
 * NotificationManager Class for Nisab
 * Encapsulates in-app modern popup notifications, desktop native notifications,
 * and audio management (Adhan, Prayer Reminders).
 */
export class NotificationManager {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.audioElement = new Audio();
    this.currentPlayingSound = null;

    this.audioElement.onended = () => {
      this.currentPlayingSound = null;
      this._updateAudioState(null);
    };

    this.audioElement.onerror = (e) => {
      console.warn('Audio playback error in NotificationManager:', e);
      this.currentPlayingSound = null;
      this._updateAudioState(null);
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
      reminderMinutes: 15,
      adhanSound: 'azan.mp3'
    };
  }

  /**
   * Subscribe a listener callback to notification updates
   * @param {Function} listener
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately emit current list
    listener([...this.notifications]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  _emit() {
    const list = [...this.notifications];
    this.listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('Error in notification listener:', err);
      }
    });
  }

  _updateAudioState(soundName) {
    this.notifications = this.notifications.map((n) => ({
      ...n,
      isPlayingAudio: Boolean(soundName && n.sound === soundName)
    }));
    this._emit();
  }

  /**
   * Displays a modern popup notification
   */
  show({
    id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title,
    message,
    type = 'info', // 'adhan' | 'reminder' | 'success' | 'warning' | 'info' | 'preview'
    icon = 'bell',
    duration = 7000, // 0 = sticky
    sound = null,    // 'azan.mp3' | 'reminder.mp3' | null
    customAction = null
  }) {
    const settings = this.getSettings();
    const effectiveSound = sound || (type === 'adhan' ? settings.adhanSound : null);
    const isAdhan = type === 'adhan' || effectiveSound === 'azan.mp3' || effectiveSound === settings.adhanSound;
    const isReminder = type === 'reminder' || effectiveSound === 'reminder.mp3';

    // If notifications are disabled and this is not an explicit user preview test, skip visual popup
    // BUT still play the Adhan sound or reminder if their toggle is enabled!
    if (!settings.enableNotification && type !== 'preview') {
      if (isAdhan && settings.enableAdhanSound) {
        this.playAudio(effectiveSound || 'azan.mp3');
      } else if (isReminder && settings.enableReminder) {
        this.playAudio('reminder.mp3');
      }
      return null;
    }

    let shouldPlaySound = false;
    if (isAdhan) {
      shouldPlaySound = type === 'preview' || settings.enableAdhanSound;
    } else if (isReminder) {
      shouldPlaySound = type === 'preview' || settings.enableReminder;
    } else if (effectiveSound) {
      shouldPlaySound = true;
    }

    const newNotification = {
      id,
      title,
      message,
      type,
      icon,
      duration,
      sound: shouldPlaySound ? sound : null,
      isPlayingAudio: shouldPlaySound,
      createdAt: Date.now(),
      customAction
    };

    // Keep max 4 concurrent notifications on screen
    this.notifications = [newNotification, ...this.notifications.slice(0, 3)];
    this._emit();

    // Trigger sound if applicable
    if (shouldPlaySound) {
      this.playAudio(sound);
    }

    // Trigger Desktop Overlay Notification (especially when app is minimized or in background)
    this.triggerDesktopOverlay(newNotification);

    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Triggers the desktop overlay window ONLY when the app is minimized or in background
   */
  async triggerDesktopOverlay(notification) {
    try {
      if (window.nisabAPI && window.nisabAPI.showOverlayNotification) {
        let isMinimized = false;
        if (window.nisabAPI.isAppMinimized) {
          isMinimized = await window.nisabAPI.isAppMinimized();
        }
        const isHiddenOrUnfocused = document.hidden || !document.hasFocus();

        // Only invoke desktop overlay if the app is minimized, in background, or explicitly forced
        if (isMinimized || isHiddenOrUnfocused || notification.forceOverlay) {
          window.nisabAPI.showOverlayNotification({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            duration: notification.duration || 8000
          });
        }
      }
    } catch (e) {
      console.warn('Desktop overlay notification trigger error:', e);
    }
  }

  /**
   * Closes a notification by id
   */
  dismiss(id) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this._emit();
  }

  /**
   * Clears all notifications
   */
  clearAll() {
    this.notifications = [];
    this._emit();
  }

  /**
   * Safely plays offline audio file (azan.mp3, reminder.mp3)
   */
  async playAudio(soundName) {
    if (!soundName || !window.nisabAPI?.getOfflineAudio) return;

    try {
      this.stopAudio();
      const audioUri = await window.nisabAPI.getOfflineAudio(soundName);
      this.audioElement.src = audioUri;
      await this.audioElement.play();
      this.currentPlayingSound = soundName;
      this._updateAudioState(soundName);
    } catch (err) {
      console.warn(`Could not play offline audio [${soundName}]:`, err);
      this.currentPlayingSound = null;
      this._updateAudioState(null);
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
    this._updateAudioState(null);
  }


  /**
   * Convenience method to trigger a test preview notification
   */
  testNotification() {
    return this.show({
      type: 'preview',
      icon: 'bell',
      title: 'إشعار تجريبي • تطبيق نِصاب',
      message: 'تم تفعيل نظام الإشعارات المنبثقة بنجاح! ستصلك تنبيهات الصلاة والتذكيرات في وقتها المحدد.',
      duration: 6000,
      sound: null
    });
  }

  /**
   * Triggers an Adhan alert
   */
  notifyAdhan(prayerArabicName) {
    const settings = this.getSettings();
    return this.show({
      type: 'adhan',
      icon: 'adhan',
      title: `🕌 حان الآن موعد أذان ${prayerArabicName}`,
      message: `حيّ على الصلاة، حيّ على الفلاح • حان الآن وقت فريضة ${prayerArabicName}`,
      duration: 30000,
      sound: settings.adhanSound || 'azan.mp3'
    });
  }

  /**
   * Triggers a reminder alert before Adhan
   */
  notifyReminder(prayerArabicName, minutesLeft) {
    return this.show({
      type: 'reminder',
      icon: 'reminder',
      title: `⏰ اقترب موعد صلاة ${prayerArabicName}`,
      message: `متبقي ${minutesLeft} دقيقة على موعد الأذان • استعد وتوضأ للصلاة`,
      duration: 10000,
      sound: 'reminder.mp3'
    });
  }
}

// Export singleton instance as default and named export
export const notificationManager = new NotificationManager();
export default NotificationManager;
