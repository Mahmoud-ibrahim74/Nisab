/**
 * Web Audio API Sound Effects Synthesizer for "Fanoos Al-Noor"
 * Zero external MP3/audio files required - 100% procedural sound synthesis.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(mute) {
    this.muted = mute;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Soft UI Pop for clicks / selections
  playPop() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Pleasant bell chime when picking a right answer or getting a star
  playChime() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {}
  }

  // Gentle water splash effect for the kindness fountain
  playSplash() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Frequency modulation for bubbling water
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Cute kitten meow / purr tone
  playPurr() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {}
  }

  // Star tile turn click
  playRotate() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.07);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // Warm fanfare for completing a quest station
  playFanfare() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 440.0, d: 0.12 }, // A4
        { f: 554.37, d: 0.12 }, // C#5
        { f: 659.25, d: 0.15 }, // E5
        { f: 880.0, d: 0.45 }  // A5
      ];
      let t = this.ctx.currentTime;

      notes.forEach(({ f, d }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + d);

        t += d * 0.85;
      });
    } catch (e) {}
  }

  // Grand celebratory melody when all 4 stars are gathered and village lights up
  playCelebration() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.18 }, // C5
        { f: 587.33, d: 0.18 }, // D5
        { f: 659.25, d: 0.22 }, // E5
        { f: 783.99, d: 0.25 }, // G5
        { f: 659.25, d: 0.18 }, // E5
        { f: 1046.5, d: 0.6 }   // C6
      ];
      let t = this.ctx.currentTime;

      melody.forEach(({ f, d }) => {
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        sub.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        sub.frequency.setValueAtTime(f / 2, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        sub.start(t);
        osc.stop(t + d);
        sub.stop(t + d);

        t += d * 0.85;
      });
    } catch (e) {}
  }

  // Gentle reminder buzz when selecting an incorrect match
  playGentleTryAgain() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(250, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }
}

export const soundFx = new SoundSynthesizer();
