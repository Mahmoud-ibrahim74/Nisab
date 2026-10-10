/**
 * RadioManager - Singleton audio stream manager for Holy Quran Radio (إذاعة القرآن الكريم)
 * Supports live streaming, background playback across tabs, volume control, and network stream teardown.
 */

const STREAM_URL = 'https://stream.radiojar.com/8s5u5tpdtwzuv';

class RadioManager {
  constructor() {
    this.streamUrl = STREAM_URL;
    this.audio = new Audio();
    this.audio.preload = 'none';

    // State
    this.isPlaying = false;
    this.isLoading = false;
    this.isPaused = false;
    this.isStopped = true;
    this.error = null;

    // Load persisted settings
    this.volume = (() => {
      try {
        const v = localStorage.getItem('nisab_radio_volume');
        return v !== null ? Math.max(0, Math.min(1, parseFloat(v))) : 0.85;
      } catch (e) {
        return 0.85;
      }
    })();
    this.audio.volume = this.volume;

    this.isMuted = false;

    this.runInBackground = (() => {
      try {
        const bg = localStorage.getItem('nisab_radio_run_background');
        return bg !== null ? bg === 'true' : true; // Default: true for Quran radio
      } catch (e) {
        return true;
      }
    })();

    this.listeners = new Set();
    this._setupAudioListeners();
  }

  _setupAudioListeners() {
    this.audio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.isPaused = false;
      this.isStopped = false;
      this.error = null;
      this._notify();
    });

    this.audio.addEventListener('waiting', () => {
      if (this.isPlaying) {
        this.isLoading = true;
        this._notify();
      }
    });

    this.audio.addEventListener('canplay', () => {
      this.isLoading = false;
      this._notify();
    });

    this.audio.addEventListener('pause', () => {
      if (!this.isStopped) {
        this.isPlaying = false;
        this.isPaused = true;
        this.isLoading = false;
        this._notify();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Radio stream error:', e);
      this.isPlaying = false;
      this.isLoading = false;
      this.error = 'تعذر الاتصال بالبث المباشر. يرجى التحقق من اتصال الإنترنت.';
      this._notify();
    });
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      volume: this.volume,
      isMuted: this.isMuted,
      runInBackground: this.runInBackground,
      error: this.error,
      streamUrl: this.streamUrl
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  _notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch (e) {
        console.error('Radio listener error:', e);
      }
    });
  }

  async play() {
    this.error = null;
    this.isLoading = true;
    this.isStopped = false;
    this.isPaused = false;
    this._notify();

    try {
      // Re-attach live stream source URL if empty or stopped
      if (!this.audio.src || this.audio.src === '' || this.audio.src.endsWith('/')) {
        this.audio.src = this.streamUrl;
      }
      await this.audio.play();
    } catch (err) {
      console.warn('Play error:', err);
      this.isLoading = false;
      this.isPlaying = false;
      this.error = 'تعذر بدء التشغيل. تحقق من الاتصال بالإنترنت.';
      this._notify();
    }
  }

  pause() {
    try {
      this.audio.pause();
      this.isPlaying = false;
      this.isPaused = true;
      this.isLoading = false;
      this._notify();
    } catch (err) {
      console.warn('Pause error:', err);
    }
  }

  stop() {
    try {
      this.audio.pause();
      // Reset stream source to stop downloading data in background when fully stopped
      this.audio.removeAttribute('src');
      this.audio.load();
      this.isPlaying = false;
      this.isPaused = false;
      this.isStopped = true;
      this.isLoading = false;
      this.error = null;
      this._notify();
    } catch (err) {
      console.warn('Stop error:', err);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    this.audio.volume = this.isMuted ? 0 : clamped;
    try {
      localStorage.setItem('nisab_radio_volume', String(clamped));
    } catch (e) {}
    this._notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this._notify();
  }

  setRunInBackground(value) {
    this.runInBackground = Boolean(value);
    try {
      localStorage.setItem('nisab_radio_run_background', String(this.runInBackground));
    } catch (e) {}
    this._notify();
  }

  handleScreenLeave() {
    // If user left the Radio screen and background playback is disabled: pause audio
    if (!this.runInBackground && this.isPlaying) {
      this.pause();
    }
  }
}

export const radioManager = new RadioManager();
