/**
 * Enhanced Arcade Synthesizer Sound & Music Engine
 * Zero external assets, 100% dynamic Web Audio API.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.musicMuted = false;
    this.isInitialized = false;

    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Arcade background synth rhythm
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicPlaying = false;

    // Load preferences
    const savedSfx = localStorage.getItem('lane_runner_sfx');
    if (savedSfx !== null) this.sfxMuted = savedSfx === 'muted';

    const savedMusic = localStorage.getItem('lane_runner_music');
    if (savedMusic !== null) this.musicMuted = savedMusic === 'muted';
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isInitialized = true;
      this.setupEngineSound();
      if (!this.musicMuted) {
        this.startArcadeMusic();
      }
    } catch (e) {
      console.warn('Web Audio API not initialized', e);
    }
  }

  toggleSfx() {
    this.sfxMuted = !this.sfxMuted;
    localStorage.setItem('lane_runner_sfx', this.sfxMuted ? 'muted' : 'active');
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.05, this.ctx.currentTime);
    }
    return this.sfxMuted;
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    localStorage.setItem('lane_runner_music', this.musicMuted ? 'muted' : 'active');
    if (this.musicMuted) {
      this.stopArcadeMusic();
    } else {
      this.startArcadeMusic();
    }
    return this.musicMuted;
  }

  setupEngineSound() {
    if (!this.ctx || this.engineOsc1) return;
    try {
      const now = this.ctx.currentTime;
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55, now);

      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(110, now);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(180, now);
      this.engineFilter.Q.setValueAtTime(4, now);

      this.engineGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.045, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    } catch (e) {}
  }

  updateEngine(speedKmH) {
    if (!this.ctx || !this.engineOsc1) return;
    try {
      const now = this.ctx.currentTime;
      const ratio = Math.max(0, Math.min(1, (speedKmH - 85) / 100));
      const freq1 = 55 + ratio * 70;
      const freq2 = freq1 * 2;
      const filterFreq = 180 + ratio * 340;

      this.engineOsc1.frequency.setTargetAtTime(freq1, now, 0.08);
      this.engineOsc2.frequency.setTargetAtTime(freq2, now, 0.08);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

      if (!this.sfxMuted && this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.045 + ratio * 0.02, now, 0.08);
      }
    } catch (e) {}
  }

  stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  resumeEngine() {
    if (this.engineGain && this.ctx && !this.sfxMuted) {
      this.engineGain.gain.setTargetAtTime(0.045, this.ctx.currentTime, 0.05);
    }
  }

  playLaneShift() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playJump() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(840, now + 0.32);

      osc2.frequency.setValueAtTime(184, now);
      osc2.frequency.exponentialRampToValueAtTime(860, now + 0.32);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch (e) {}
  }

  playDogBark() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(360, now);
      osc1.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(420, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.24);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.25);
    } catch (e) {}
  }

  playShopBuy() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.1, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    } catch (e) {}
  }

  // --- Subway Surfers Escalating Pitch Coin Collect ---
  playCoinCollect(streak = 0) {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const scale = [659.25, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51, 1567.98];
      const baseFreq = scale[streak % scale.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.33, now + 0.07);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // --- Cyan Energy Orb Power Charge Ding ---
  playOrbCollect() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch (e) {}
  }

  playWingPickup() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [349.23, 440.00, 523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.12, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.45);
      });
    } catch (e) {}
  }

  playFlightWarning() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playLanding() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playNearMiss(comboLevel = 1) {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const noteIdx = Math.min(notes.length - 1, comboLevel - 1);
      const baseFreq = notes[noteIdx];

      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(baseFreq * 2, now);
      oscHarmonic.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.12);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      oscHarmonic.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + 0.16);
      oscHarmonic.stop(now + 0.16);
    } catch (e) {}
  }

  playCrash() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.45);

      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(120, now);
      bass.frequency.exponentialRampToValueAtTime(18, now + 0.45);
      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.45);
    } catch (e) {}
  }

  startArcadeMusic() {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this.musicStep = 0;

    const bassline = [
      110, 110, 220, 110,  130.81, 130.81, 261.63, 130.81,
      98, 98, 196, 98,    123.47, 123.47, 246.94, 123.47
    ];

    const stepDuration = 0.125;

    const playStep = () => {
      if (!this.musicPlaying || this.musicMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const freq = bassline[this.musicStep % bassline.length];

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.09);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);

        this.musicStep++;
      } catch (e) {}
    };

    this.musicTimer = setInterval(playStep, stepDuration * 1000);
  }

  stopArcadeMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playClick() {
    if (this.sfxMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();
