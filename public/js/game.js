/**
 * DLICOM ARENA: CYBER WARFARE
 * Full-Stack 3D Voxel FPS Client Engine
 * Features: Three.js Voxel World, Dual Modes (4v4 TDM & BR), Custom Room Lobby,
 * Smart Bots, Web Audio Procedural Sound Synthesis, Desktop & Mobile Touch Controls.
 */

// -------------------------------------------------------------
// 1. PROCEDURAL SOUND SYNTHESIZER (WEB AUDIO API)
// -------------------------------------------------------------
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterMuted = false;
    this.noiseBuffer = null;
    this.lobbySchedulerTimer = null;
    this.lobbyMasterGain = null;
    this.lobbyDelayNode = null;
    this.lobbyFeedbackGain = null;
    this.isLobbyMusicPlaying = false;
    this.lobbyStep = 0;
    this.nextLobbyStepTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
    if (this.ctx && !this.noiseBuffer) {
      this.initNoiseBuffer();
    }
  }

  initNoiseBuffer() {
    if (!this.ctx) return;
    const dur = 2.0;
    const size = Math.floor(this.ctx.sampleRate * dur);
    this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  playNoise(startTime, duration, gainVal, filterFreq = 1000) {
    if (!this.ctx || this.masterMuted) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  playGunshot(weaponType) {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;

    if (weaponType === 'shotgun') {
      // Low-frequency noise burst + deep bass thud (Pump Shotgun)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.22);
      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
      this.playNoise(t, 0.28, 0.38, 1100);
    } else if (weaponType === 'sniper') {
      // High-gain resonant crack with long sonic trail (AWM Railgun)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.42);
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
      this.playNoise(t, 0.42, 0.3, 2400);
    } else if (weaponType === 'smg') {
      // Fast high-pitched chirps (Neon SMG Vector)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.055);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
      this.playNoise(t, 0.045, 0.1, 2600);
    } else if (weaponType === 'pistol') {
      // Crisp short snap (Plasma Sidearm)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.075);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
      this.playNoise(t, 0.05, 0.15, 2000);
    } else {
      // Rapid square-wave laser pulses (Pulse Blaster AR)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.085);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.095);
      this.playNoise(t, 0.065, 0.14, 1800);
    }
  }

  playWeaponCock() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    // Metallic weapon latch & slide cocking sound
    [0.0, 0.07].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 800 : 1200, t + offset);
      osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 300 : 500, t + offset + 0.04);
      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.05);
    });
    this.playNoise(t + 0.04, 0.06, 0.12, 3500);
  }

  playShotgunPump() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [0.0, 0.08].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 550 : 750, t + offset);
      osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 220 : 350, t + offset + 0.05);
      gain.gain.setValueAtTime(0.16, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });
    this.playNoise(t + 0.02, 0.08, 0.12, 2800);
  }

  playHitmarker(isHeadshot) {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isHeadshot) {
      // Crisp metallic "ding" headshot sound (PUBG style)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.exponentialRampToValueAtTime(3200, t + 0.12);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(1450, t + 0.07);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + (isHeadshot ? 0.15 : 0.08));
  }

  playHeartbeat() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    // Low audible double thud (PUBG critical HP warning)
    [0.0, 0.18].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t + offset);
      osc.frequency.exponentialRampToValueAtTime(45, t + offset + 0.1);
      gain.gain.setValueAtTime(0.35, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.12);
    });
  }

  playMedicUse() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    // Medkit / Nanite applying hum
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playMedicSuccess() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    // Pleasant chime for health/shield restoration
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.25);
    });
  }

  playJumpBoost() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.3);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playDash() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    this.playNoise(t, 0.2, 0.25, 2400);
  }

  playLandingThud() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.16);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
    this.playNoise(t, 0.12, 0.2, 450);
  }

  playShieldDeflect() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.14);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playHealHologramChime() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [528, 660, 792].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  playReload() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [0.0, 0.18].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t + offset);
      osc.frequency.exponentialRampToValueAtTime(220, t + offset + 0.06);
      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });
  }

  playPowerUp() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [350, 520, 780].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.18, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.14);
    });
  }

  playStormAlarm() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.25);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playVictory() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.25, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }

  playDefeat() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [320, 290, 240, 180].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.14);
      gain.gain.setValueAtTime(0.2, t + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.14);
      osc.stop(t + idx * 0.14 + 0.35);
    });
  }

  playClick() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  playCountdownBeep() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playEliminatedSting() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [220, 164.81, 130.81, 98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.25, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }

  playVictoryRoyale() {
    if (!this.ctx || this.masterMuted) return;
    const t = this.ctx.currentTime;
    [277.18, 349.23, 415.30, 554.37, 698.46, 830.61].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);
      gain.gain.setValueAtTime(0.28, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.8);
    });
  }

  playLobbyMusic(smooth = true) {
    this.init();
    if (!this.ctx || this.masterMuted) return;
    if (this.isLobbyMusicPlaying && this.lobbyMasterGain) {
      if (smooth) {
        this.lobbyMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.lobbyMasterGain.gain.setValueAtTime(Math.max(0.0001, this.lobbyMasterGain.gain.value), this.ctx.currentTime);
        this.lobbyMasterGain.gain.exponentialRampToValueAtTime(0.26, this.ctx.currentTime + 0.8);
      } else {
        this.lobbyMasterGain.gain.setValueAtTime(0.26, this.ctx.currentTime);
      }
      return;
    }

    try {
      // 1. Master Output Gain for Lobby Soundtrack
      this.lobbyMasterGain = this.ctx.createGain();
      const initialVol = smooth ? 0.0001 : 0.26;
      this.lobbyMasterGain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
      if (smooth) {
        this.lobbyMasterGain.gain.exponentialRampToValueAtTime(0.26, this.ctx.currentTime + 0.8);
      }
      this.lobbyMasterGain.connect(this.ctx.destination);

      // 2. High-Tech Cyber Delay Node for arpeggios
      this.lobbyDelayNode = this.ctx.createDelay();
      this.lobbyDelayNode.delayTime.setValueAtTime(0.2174, this.ctx.currentTime); // 1/8 note at 138 BPM
      this.lobbyFeedbackGain = this.ctx.createGain();
      this.lobbyFeedbackGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      this.lobbyDelayNode.connect(this.lobbyFeedbackGain);
      this.lobbyFeedbackGain.connect(this.lobbyDelayNode);
      this.lobbyDelayNode.connect(this.lobbyMasterGain);

      // 3. Initialize Step Clock
      this.isLobbyMusicPlaying = true;
      this.lobbyStep = 0;
      this.nextLobbyStepTime = this.ctx.currentTime + 0.05;

      if (this.lobbySchedulerTimer) clearInterval(this.lobbySchedulerTimer);
      this.lobbySchedulerTimer = setInterval(() => {
        this.lobbySchedulerLoop();
      }, 25);
    } catch (err) {
      console.warn('Lobby music start failed:', err);
    }
  }

  stopLobbyMusic(smooth = true) {
    if (!this.isLobbyMusicPlaying && !this.lobbyMasterGain) return;
    this.isLobbyMusicPlaying = false;

    if (this.lobbySchedulerTimer) {
      clearInterval(this.lobbySchedulerTimer);
      this.lobbySchedulerTimer = null;
    }

    if (this.lobbyMasterGain && this.ctx) {
      try {
        if (smooth) {
          this.lobbyMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.lobbyMasterGain.gain.setValueAtTime(Math.max(0.0001, this.lobbyMasterGain.gain.value), this.ctx.currentTime);
          this.lobbyMasterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
          setTimeout(() => {
            try {
              if (this.lobbyMasterGain) this.lobbyMasterGain.disconnect();
              if (this.lobbyDelayNode) this.lobbyDelayNode.disconnect();
              if (this.lobbyFeedbackGain) this.lobbyFeedbackGain.disconnect();
            } catch (e) {}
            this.lobbyMasterGain = null;
            this.lobbyDelayNode = null;
            this.lobbyFeedbackGain = null;
          }, 550);
        } else {
          this.lobbyMasterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
          this.lobbyMasterGain.disconnect();
          this.lobbyMasterGain = null;
        }
      } catch (e) {
        this.lobbyMasterGain = null;
      }
    }
  }

  toggleLobbyMusic() {
    if (this.isLobbyMusicPlaying) {
      this.stopLobbyMusic(true);
      return false;
    } else {
      this.playLobbyMusic(true);
      return true;
    }
  }

  lobbySchedulerLoop() {
    if (!this.ctx || !this.isLobbyMusicPlaying) return;
    const stepDuration = 60 / (138 * 4); // 16th note at 138 BPM (~0.1087s)
    const scheduleAheadTime = 0.12;

    while (this.nextLobbyStepTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleLobbyStep(this.lobbyStep, this.nextLobbyStepTime);
      this.nextLobbyStepTime += stepDuration;
      this.lobbyStep = (this.lobbyStep + 1) % 64;
    }
  }

  scheduleLobbyStep(step, time) {
    if (!this.ctx || !this.lobbyMasterGain || this.masterMuted) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const isDownbeat = (step % 8 === 0); // Beats 1 and 3

    // 1. Bass / Kick Layer
    if (isDownbeat) {
      this.playSubKick(time);
    }

    // Eighth-note pulse bass
    if (step % 2 === 0) {
      let rootFreq = 55; // A1
      if (bar === 1) rootFreq = 43.65; // F1
      else if (bar === 2) rootFreq = 49.00; // G1
      else if (bar === 3) rootFreq = (stepInBar < 8) ? 36.71 : 55.00; // D1 -> A1
      this.playBassPulse(rootFreq * 2, time, 0.11);
    }

    // 2. Marching Snare / Hi-Hat Rhythms (16th-note militaristic cadence)
    // Hi-Hats: every 16th note
    const hatAccented = (step % 4 === 2);
    this.playHiHat(time, hatAccented);

    // Militaristic Snare:
    // Regular hits on beats 2 & 4 (steps 4, 12, 20, 28, 36, 44, 52)
    const isSnareBeat = (stepInBar === 4 || stepInBar === 12);
    // End-of-cycle militaristic roll on bar 3 (steps 58..63)
    const isMilitaristicRoll = (bar === 3 && stepInBar >= 10);

    if (isSnareBeat) {
      this.playSnare(time, false);
    } else if (isMilitaristicRoll) {
      this.playSnare(time, true);
    }

    // 3. Sawtooth Brass / Synth Lead (Signature Heroic Motif)
    const leadNotes = {
      // Bar 0: Am
      0: { f: 220.00, d: 0.32 }, // A3
      4: { f: 261.63, d: 0.32 }, // C4
      8: { f: 329.63, d: 0.58 }, // E4
      14: { f: 293.66, d: 0.20 }, // D4
      // Bar 1: F
      16: { f: 349.23, d: 0.40 }, // F4
      20: { f: 329.63, d: 0.40 }, // E4
      24: { f: 261.63, d: 0.40 }, // C4
      28: { f: 220.00, d: 0.40 }, // A3
      // Bar 2: G
      32: { f: 293.66, d: 0.32 }, // D4
      36: { f: 329.63, d: 0.32 }, // E4
      40: { f: 392.00, d: 0.58 }, // G4
      46: { f: 349.23, d: 0.20 }, // F4
      // Bar 3: Dm -> Am
      48: { f: 329.63, d: 0.40 }, // E4
      52: { f: 293.66, d: 0.40 }, // D4
      56: { f: 261.63, d: 0.40 }, // C4
      60: { f: 220.00, d: 0.40 }  // A3
    };

    if (leadNotes[step]) {
      const ln = leadNotes[step];
      this.playLeadNote(ln.f, time, ln.d);
    }

    // 4. Arpeggiated Cyber Pluck (High-register square wave cascade with delay)
    const arpChords = [
      // Bar 0: Am
      [440, 523.25, 659.25, 880, 659.25, 523.25, 440, 659.25, 440, 523.25, 659.25, 880, 523.25, 659.25, 783.99, 659.25],
      // Bar 1: F
      [349.23, 440, 523.25, 698.46, 523.25, 440, 349.23, 523.25, 349.23, 440, 523.25, 698.46, 440, 523.25, 659.25, 523.25],
      // Bar 2: G
      [392, 493.88, 587.33, 783.99, 587.33, 493.88, 392, 587.33, 392, 493.88, 587.33, 783.99, 493.88, 587.33, 698.46, 587.33],
      // Bar 3: Dm / Am
      [293.66, 349.23, 440, 587.33, 698.46, 587.33, 440, 349.23, 440, 523.25, 659.25, 880, 659.25, 523.25, 493.88, 392]
    ];

    const currentChordNotes = arpChords[bar] || arpChords[0];
    const arpFreq = currentChordNotes[stepInBar];
    if (arpFreq) {
      this.playArpPluck(arpFreq, time);
    }
  }

  playSubKick(startTime) {
    if (!this.ctx || !this.lobbyMasterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Deep resonant sub-bass drops on downbeats (150 Hz -> 40 Hz)
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.18);

    gain.gain.setValueAtTime(0.48, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

    osc.connect(gain);
    gain.connect(this.lobbyMasterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.22);
  }

  playBassPulse(freq, startTime, duration = 0.11) {
    if (!this.ctx || !this.lobbyMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, startTime);
    filter.Q.setValueAtTime(2.5, startTime);

    gain.gain.setValueAtTime(0.24, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.lobbyMasterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playSnare(startTime, isRoll = false) {
    if (!this.ctx || !this.lobbyMasterGain || !this.noiseBuffer) return;
    // Noise layer
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(1.8, startTime);

    const gain = this.ctx.createGain();
    const dur = isRoll ? 0.08 : 0.14;
    const vol = isRoll ? 0.22 : 0.35;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.lobbyMasterGain);

    noise.start(startTime);
    noise.stop(startTime + dur);

    // Body tone punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, startTime);
    osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.08);

    oscGain.gain.setValueAtTime(isRoll ? 0.12 : 0.22, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.lobbyMasterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.08);
  }

  playHiHat(startTime, accented = false) {
    if (!this.ctx || !this.lobbyMasterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, startTime);

    const gain = this.ctx.createGain();
    const dur = 0.038;
    gain.gain.setValueAtTime(accented ? 0.14 : 0.07, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.lobbyMasterGain);

    noise.start(startTime);
    noise.stop(startTime + dur);
  }

  playLeadNote(freq, startTime, duration) {
    if (!this.ctx || !this.lobbyMasterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // Detuning (+/- 8 cents) for thick heroic brass synth
    osc1.frequency.setValueAtTime(freq * 0.9954, startTime);
    osc2.frequency.setValueAtTime(freq * 1.0046, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(4.0, startTime);

    // Punchy brass envelope
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.025);
    gain.gain.setValueAtTime(0.16, startTime + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.lobbyMasterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  }

  playArpPluck(freq, startTime) {
    if (!this.ctx || !this.lobbyMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, startTime);
    filter.Q.setValueAtTime(2.0, startTime);

    const dur = 0.085;
    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(filter);
    filter.connect(gain);

    gain.connect(this.lobbyMasterGain);
    if (this.lobbyDelayNode) {
      gain.connect(this.lobbyDelayNode);
    }

    osc.start(startTime);
    osc.stop(startTime + dur);
  }
}

const sounds = new SoundEngine();

// -------------------------------------------------------------
// 2. MAIN CLIENT GAME CLASS
// -------------------------------------------------------------
class CyberWarfareClient {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.socket = null;
    this.isTouch = ('ontouchstart' in window) && (window.innerWidth <= 800 || (navigator.maxTouchPoints > 1 && !window.matchMedia('(pointer: fine)').matches));

    // Networking State
    this.selfId = null;
    this.currentRoom = null;
    this.gameMode = 'tdm'; // 'tdm' or 'br'
    this.inMatch = false;
    this.isSpectating = false;
    this.spectateTargetId = null;

    // Three.js Systems
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();

    // Map & Environment Systems (Modular 3-Map Engine)
    this.selectedMapId = 'warehouse'; // 'warehouse', 'vault', 'rooftops'
    this.selectedMode = 'tdm'; // 'tdm' or 'br'
    this.currentMapId = 'warehouse';
    this.arenaGroup = null;
    this.mapColliders = [];
    this.obstacleBoxes = [];
    this.jumpPadMeshes = [];
    this.jumpPadDefs = [];
    this.powerUpMeshes = new Map();
    this.lootCrateMeshes = new Map();
    this.groundLootMeshes = new Map();
    this.stormMesh = null;
    this.safeZoneMesh = null;
    this.safeZone = null;
    this.brState = 'LOBBY_WAITING';

    // 3D Animated PUBG-Style Lobby State
    this.lobbySceneGroup = null;
    this.lobbyMascot = null;
    this.lobbyMascotPivot = null;
    this.lobbyMascotYaw = 0;
    this.isDraggingMascot = false;
    this.dragStartX = 0;
    this.dragStartYaw = 0;
    this.lobbyBlinkTimer = 0;
    this.lobbyBillboards = [];
    this.lobbyPedestalRings = [];
    this.lobbyPedestalBeam = null;

    // Entities Map (id -> { mesh, targetPos, currentPos, targetYaw, health, team, isBot })
    this.remoteEntities = new Map();

    // First Person Player State
    this.player = {
      x: 0, y: 0.0, z: 0,
      yaw: 0, pitch: 0,
      vx: 0, vy: 0, vz: 0,
      isGrounded: true,
      health: 100, maxHealth: 100,
      armor: 0, maxArmor: 100,
      weapon: 'ar',
      ammo: {
        ar: { mag: 30, reserve: 120 },
        shotgun: { mag: 6, reserve: 36 },
        sniper: { mag: 5, reserve: 20 },
        smg: { mag: 35, reserve: 140 },
        pistol: { mag: 12, reserve: 60 }
      },
      medic: {
        bandage: 2,
        medkit: 1,
        shield_battery: 1
      },
      isHealing: false,
      healItem: null,
      healEnd: 0,
      isReloading: false,
      isADS: false,
      speedBoostUntil: 0,
      lastShotTime: 0,
      team: 'blue',
      isInvulnerable: false
    };

    // Viewmodel Weapon Mesh & Sway
    this.viewmodelGun = null;
    this.viewmodelMeshes = {};
    this.viewmodelBasePos = new THREE.Vector3(0.28, -0.22, -0.48);
    this.viewmodelAdsPos = new THREE.Vector3(0.0, -0.125, -0.32);
    this.viewmodelRecoilZ = 0;
    this.viewmodelRecoilPitch = 0;
    this.viewmodelTime = 0;
    this.walkCycle = 0;
    this.idleBobTimer = 0;
    this.walkBobTimer = 0;
    this.walkSwayAngle = 0;
    this.cameraLandingDip = 0;
    this.cameraSprintTilt = 0;
    this.isPaused = false;
    this.obstacleBoxes = [];
    this.obstacleMeshes = [];
    this.bulletDecals = [];

    // Weapon Swap Animation State
    this.weaponSwapState = {
      isSwapping: false,
      progress: 1.0,
      phase: 0, // 0 = none, 1 = lowering, 2 = raising
      pendingWeapon: null
    };
    this.pistolCanShoot = true;

    // Simulated 3D Physics Particle Systems & FX
    this.voxelDebris = [];
    this.hologramRingFX = [];
    this.jumpPadSparks = [];
    this.shieldSparks = [];
    this.thrusterParticles = [];

    // Deathcam & Respawn State
    this.deathCamActive = false;
    this.deathCamTimer = 0;
    this.deathCamPos = new THREE.Vector3();
    this.killerData = null;
    this.localShieldBubble = null;
    this.spawnShieldTimeRemaining = 0;

    // BR Sky Drop State
    this.isDroppingBR = false;
    this.brThrustersDeployed = false;

    // Loot Proximity
    this.nearestLootItem = null;

    // Input State
    this.keys = {};
    this.mouseButtons = { left: false, right: false };
    this.isPointerLocked = false;
    this.mouseSensitivity = 0.0022;
    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    this.touchJoystick = { x: 0, y: 0, active: false, isSprint: false };
    this.activeTouches = {
      joystick: null, // { id, startX, startY, currentX, currentY }
      look: null,     // { id, lastX, lastY }
      fire: null,     // { id, lastX, lastY }
      fireLeft: null  // { id }
    };

    // 5 Distinct Weapon Specifications
    this.weapons = {
      ar: { name: 'Pulse Blaster', damage: 22, fireRateMs: 100, magSize: 30, maxAmmo: 120, reloadMs: 1400, icon: '⚡', slot: 1, type: 'full-auto' },
      shotgun: { name: 'Voxel Shotgun', damage: 11, fireRateMs: 750, magSize: 6, maxAmmo: 36, reloadMs: 1800, icon: '💥', slot: 2, pellets: 8, type: 'pump' },
      sniper: { name: 'Cyber Sniper', damage: 90, fireRateMs: 1200, magSize: 5, maxAmmo: 20, reloadMs: 2200, icon: '🎯', slot: 3, type: 'bolt' },
      smg: { name: 'Neon SMG', damage: 14, fireRateMs: 63, magSize: 35, maxAmmo: 140, reloadMs: 1200, icon: '⚡', slot: 4, type: 'full-auto' },
      pistol: { name: 'Plasma Pistol', damage: 28, fireRateMs: 180, magSize: 12, maxAmmo: 60, reloadMs: 1100, icon: '🔫', slot: 5, type: 'semi-auto' }
    };

    this.init();
  }

  init() {
    this.initNetwork();
    this.initThree();
    this.buildLobbyScene();
    this.buildMap(this.selectedMapId);
    if (this.arenaGroup) this.arenaGroup.visible = false;
    this.initMascotAvatarCanvas();
    this.initUIEventListeners();
    this.initInputControls();
    this.initBootLoadingScreen();

    // Check URL Query Param for direct room join (e.g. ?room=CYB7)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      document.getElementById('join-room-code-input').value = roomParam.toUpperCase();
      setTimeout(() => {
        document.getElementById('btn-join-by-code')?.click();
      }, 500);
    }

    // Animation Loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  // --- RETRO CYBER BOOT LOADING SCREEN INITIALIZER ---
  initBootLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;

    const statusEl = document.getElementById('boot-status-text');
    const percentEl = document.getElementById('boot-percent-text');
    const fillEl = document.getElementById('boot-progress-bar');
    const enterBtn = document.getElementById('btn-enter-arena');

    const statusTexts = [
      "INITIALIZING VOXEL ENGINE...",
      "SYNCING DLICOM BLOCKCHAIN NODES...",
      "CALIBRATING RAYCAST BALLISTICS...",
      "ESTABLISHING 30Hz SOCKET MATRIX...",
      "SYSTEM READY - LAUNCHING LOBBY"
    ];

    const startTime = performance.now();
    const duration = 2500; // 2.5 seconds total boot loading ramp
    let isComplete = false;

    const updateLoading = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      // Percentage counter ramping 0% -> 100%
      const pct = Math.floor(progress * 100);
      if (percentEl) percentEl.textContent = `${pct}%`;
      if (fillEl) fillEl.style.width = `${pct}%`;

      // Cycle status text every 400ms
      const textIdx = Math.min(statusTexts.length - 1, Math.floor(elapsed / 400));
      if (statusEl) statusEl.textContent = statusTexts[textIdx];

      if (progress < 1.0) {
        requestAnimationFrame(updateLoading);
      } else {
        isComplete = true;
        if (percentEl) percentEl.textContent = '100%';
        if (fillEl) fillEl.style.width = '100%';
        if (statusEl) statusEl.textContent = "SYSTEM READY - LAUNCHING LOBBY";
        if (enterBtn) {
          enterBtn.classList.remove('hidden');
          enterBtn.style.opacity = '1';
        }
      }
    };

    requestAnimationFrame(updateLoading);

    let entered = false;
    const enterArena = () => {
      if (entered || !isComplete) return;
      entered = true;
      sounds.init();
      sounds.playLobbyMusic(true);
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 800);
    };

    if (enterBtn) {
      enterBtn.addEventListener('click', enterArena);
      enterBtn.addEventListener('touchend', enterArena);
    }

    // Keyboard support (Press Space or Enter to enter arena once 100%)
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && isComplete && !entered) {
        enterArena();
      }
    });
  }

  // -------------------------------------------------------------
  // 3. NETWORK ENGINE (SOCKET.IO)
  // -------------------------------------------------------------
  initNetwork() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.selfId = this.socket.id;
      this.refreshRoomsList();
    });

    this.socket.on('roomListUpdated', () => {
      this.refreshRoomsList();
    });

    this.socket.on('roomJoined', (data) => {
      if (data.success) {
        this.currentRoom = data.room;
        this.gameMode = data.room.mode;
        if (data.room.mode === 'br') {
          const lobbyScreen = document.getElementById('lobbyScreen');
          if (lobbyScreen) lobbyScreen.style.display = 'none';
          document.getElementById('lobby-hub')?.classList.add('hidden');
          document.getElementById('staging-screen')?.classList.add('hidden');

          const inGameHUD = document.getElementById('inGameHUD');
          if (inGameHUD) inGameHUD.style.display = 'block';
          const hudOverlay = document.getElementById('hud-overlay');
          if (hudOverlay) {
            hudOverlay.classList.remove('hidden');
            hudOverlay.style.display = 'block';
            hudOverlay.classList.add('hud-staging-mode');
          }

          const cdBanner = document.getElementById('br-countdown-banner');
          const cdText = document.getElementById('br-countdown-text');
          if (cdBanner && cdText) {
            cdBanner.classList.remove('hidden');
            cdBanner.style.display = 'block';
            cdText.textContent = 'PREPARING AIRDROP: 10s';
          }
        } else {
          this.showStagingScreen(data.room);
        }
      }
    });

    this.socket.on('stagingUpdated', (roomData) => {
      this.currentRoom = roomData;
      if (roomData.mapId) {
        this.selectedMapId = roomData.mapId;
      }
      if (roomData.players && Array.isArray(roomData.players)) {
        const me = roomData.players.find(p => p.id === this.socket.id);
        if (me && me.team) {
          this.player.team = me.team;
          this.updatePlayerTeamVisuals();
        }
      }
      this.renderStagingSlots(roomData);
    });

    this.socket.on('roomError', (err) => {
      alert(err.message || 'Room connection error.');
    });

    this.socket.on('matchStarted', (data) => {
      this.launchMatch(data);
    });

    this.socket.on('gameStateSnapshot', (snapshot) => {
      this.handleStateSnapshot(snapshot);
    });

    this.socket.on('playerShotFired', (data) => {
      this.handleRemoteShot(data);
    });

    this.socket.on('botShotFired', (data) => {
      this.handleRemoteShot(data);
    });

    this.socket.on('hitmarker', (data) => {
      this.showHitmarker(data.damage, data.isHeadshot);
    });

    this.socket.on('damageTaken', (data) => {
      this.handleDamageTaken(data);
    });

    this.socket.on('stormDamageTaken', (data) => {
      this.player.health = data.currentHealth;
      this.updateHudVitals();
      this.flashVignette('storm-vignette', 350);
      sounds.playStormAlarm();
    });

    this.socket.on('killFeedEvent', (event) => {
      this.addKillFeedEntry(event);
    });

    this.socket.on('powerUpCollected', (data) => {
      const mesh = this.powerUpMeshes.get(data.id);
      if (mesh) mesh.visible = false;
    });

    this.socket.on('powerUpRespawned', (data) => {
      const mesh = this.powerUpMeshes.get(data.id);
      if (mesh) mesh.visible = true;
    });

    this.socket.on('powerUpGranted', (data) => {
      if (data.type === 'health') {
        this.player.health = data.health;
        this.showToast('✚ +40 HEALTH RESTORED', 'green');
        this.flashVignette('heal-vignette', 500);
      } else if (data.type === 'armor') {
        this.player.armor = data.armor;
        this.showToast('🛡️ +50 CYBER SHIELD EQUIPPED', 'cyan');
        this.flashVignette('heal-vignette', 500);
      } else if (data.type === 'ammo') {
        this.player.ammo = data.ammo;
        this.showToast('📦 AMMO CACHE REFILLED', 'amber');
      } else if (data.type === 'speed') {
        this.player.speedBoostUntil = Date.now() + data.durationMs;
        this.showToast('⚡ QUANTUM OVERDRIVE ACTIVATED', 'cyan');
      }
      this.updateHudVitals();
      this.updateHudAmmo();
      sounds.playPowerUp();
    });

    this.socket.on('lootCrateSpawned', (crate) => {
      this.spawnLootCrateMesh(crate);
    });

    this.socket.on('lootCrateRemoved', (data) => {
      this.removeLootCrateMesh(data.id);
    });

    this.socket.on('lootCrateCollected', (data) => {
      this.player.health = data.health;
      this.player.armor = data.armor;
      this.player.ammo = data.ammo;
      if (data.medic) {
        this.player.medic = data.medic;
      }
      this.updateHudVitals();
      this.updateHudAmmo();
      this.showToast('🎁 SUPPLY CRATE LOOTED (+50 HP/AP, AMMO & MEDKITS)', 'green');
      sounds.playPowerUp();
    });

    // Healing Lifecycle Events
    this.socket.on('healStarted', (data) => {
      this.player.isHealing = true;
      this.player.healItem = data.item;
      this.player.healEnd = Date.now() + data.durationMs;
      if (data.medic) this.player.medic = data.medic;
      this.updateHudVitals();
      this.startHealingChannelUI(data.itemName, data.durationMs);
      sounds.playMedicUse();
    });

    this.socket.on('healCancelled', (data) => {
      this.player.isHealing = false;
      this.player.healItem = null;
      this.cancelHealingChannelUI();
      this.showToast(`⚠️ HEALING CANCELLED: ${data.reason}`, 'amber');
    });

    this.socket.on('healFailed', (data) => {
      this.showToast(`⚠️ CANNOT USE: ${data.reason}`, 'amber');
    });

    this.socket.on('healCompleted', (data) => {
      this.player.isHealing = false;
      this.player.healItem = null;
      this.player.health = data.health;
      this.player.armor = data.armor;
      if (data.medic) this.player.medic = data.medic;
      this.cancelHealingChannelUI();
      this.updateHudVitals();
      this.flashVignette('heal-vignette', 600);
      sounds.playMedicSuccess();
      this.spawnGreenHologramRing(new THREE.Vector3(this.player.x, this.player.y, this.player.z));
      if (data.healedHp > 0) this.showToast(`✚ RESTORED +${data.healedHp} HEALTH`, 'green');
      if (data.addedShield > 0) this.showToast(`🛡️ CHARGED +${data.addedShield} SHIELD AP`, 'cyan');
    });

    this.socket.on('jumpPadTriggered', (data) => {
      if (data.entityId === this.selfId) {
        if (this.player.vy <= 2.0) {
          this.player.vy = data.boostY;
          this.player.vx += data.boostX;
          this.player.vz += data.boostZ;
          this.player.isGrounded = false;
          sounds.playJumpBoost();
          this.spawnJumpPadSparks(new THREE.Vector3(this.player.x, 0.35, this.player.z));
        }
      }
    });

    this.socket.on('playerEliminated', (data) => {
      // Find victim location to shatter glowing voxel cubes
      if (data.victimId === this.selfId) {
        this.player.isHealing = false;
        this.player.healItem = null;
        this.cancelHealingChannelUI();

        // 1. Shatter dead player into 8-12 glowing voxel cubes
        const deathPos = new THREE.Vector3(this.player.x, this.player.y, this.player.z);
        this.spawnDeathVoxelDebris(deathPos, this.player.team === 'red' ? 0xff0055 : 0x00f6ff);

        // 2. Disconnect camera and tilt upward at 45 degrees into 3s deathcam
        this.deathCamActive = true;
        this.deathCamTimer = 3.0;
        this.deathCamPos.copy(deathPos);

        if (data.permadeath) {
          // Permadeath in BR
          this.isSpectating = true;
          document.getElementById('spectator-overlay')?.classList.remove('hidden');
        } else {
          // 3-second death killcam showing killer's name and weapon in TDM
          this.showRespawnCountdown(data.respawnSec || 3, data.killerName, data.killerWeapon, data.killerTeam);
        }
      } else {
        // Remote entity eliminated
        const ent = this.remoteEntities.get(data.victimId);
        if (ent && ent.mesh) {
          this.spawnDeathVoxelDebris(ent.mesh.position, ent.team === 'red' ? 0xff0055 : 0x00f6ff);
          ent.mesh.visible = false;
        }
      }
    });

    this.socket.on('playerRespawned', (data) => {
      if (data.id === this.selfId) {
        this.deathCamActive = false;
        this.player.x = data.x;
        this.player.y = data.y;
        this.player.z = data.z;
        this.player.health = 100;
        this.player.armor = 0;
        this.player.isInvulnerable = true;
        this.player.isHealing = false;
        this.player.healItem = null;
        this.cancelHealingChannelUI();

        // Activate 3-second spawn shield banner & translucent bubble
        this.spawnShieldTimeRemaining = 3.0;
        const shieldBanner = document.getElementById('spawn-shield-banner');
        const shieldTimerVal = document.getElementById('spawn-shield-timer-val');
        if (shieldBanner) shieldBanner.classList.remove('hidden');
        if (shieldTimerVal) shieldTimerVal.textContent = '3';

        this.createOrShowLocalShieldBubble();

        setTimeout(() => {
          this.player.isInvulnerable = false;
          if (shieldBanner) shieldBanner.classList.add('hidden');
          if (this.localShieldBubble) this.localShieldBubble.visible = false;
        }, 3000);

        document.getElementById('respawn-modal')?.classList.add('hidden');
        this.updateHudVitals();
        this.updateHudAmmo();
      } else {
        // Remote combatant respawned
        const ent = this.remoteEntities.get(data.id);
        if (ent && ent.mesh) {
          ent.mesh.position.set(data.x, data.y, data.z);
          ent.targetPos.set(data.x, data.y, data.z);
          ent.mesh.visible = true;
          if (ent.mesh.userData.shieldBubble) {
            ent.mesh.userData.shieldBubble.visible = true;
            setTimeout(() => {
              if (ent.mesh && ent.mesh.userData.shieldBubble) {
                ent.mesh.userData.shieldBubble.visible = false;
              }
            }, 3000);
          }
        }
      }
    });

    this.socket.on('brCountdown', (data) => {
      const zoneInd = document.getElementById('hud-storm-status');
      if (zoneInd) zoneInd.textContent = `DROPPING IN: 00:${data.seconds.toString().padStart(2, '0')}`;
      const stagingMsg = document.getElementById('staging-status-msg');
      if (stagingMsg) {
        stagingMsg.textContent = `AUTO-LAUNCHING IN ${data.seconds}s... (OR CLICK LAUNCH MATCH NOW)`;
      }
      const cdBanner = document.getElementById('br-countdown-banner');
      const cdText = document.getElementById('br-countdown-text');
      const hudOverlay = document.getElementById('hud-overlay');
      if (cdBanner && cdText) {
        if (data.seconds > 0) {
          hudOverlay?.classList.add('hud-staging-mode');
          cdBanner.classList.remove('hidden');
          cdBanner.style.display = 'block';
          cdText.textContent = `PREPARING AIRDROP: ${data.seconds}s`;
          sounds.playCountdownBeep();
        } else {
          cdBanner.classList.add('hidden');
          cdBanner.style.display = 'none';
        }
      }
    });

    this.socket.on('brCountdownStart', (data) => {
      this.showToast(`🚀 BATTLE ROYALE COMMENCING IN ${data.seconds}s`, 'cyan');
      const zoneInd = document.getElementById('hud-storm-status');
      if (zoneInd) zoneInd.textContent = `DROPPING IN: 00:${data.seconds.toString().padStart(2, '0')}`;
      const cdBanner = document.getElementById('br-countdown-banner');
      const cdText = document.getElementById('br-countdown-text');
      const hudOverlay = document.getElementById('hud-overlay');
      if (cdBanner && cdText) {
        hudOverlay?.classList.add('hud-staging-mode');
        cdBanner.classList.remove('hidden');
        cdBanner.style.display = 'block';
        cdText.textContent = `PREPARING AIRDROP: ${data.seconds}s`;
        sounds.playCountdownBeep();
      }
    });

    this.socket.on('brCountdownTick', (data) => {
      const zoneInd = document.getElementById('hud-storm-status');
      if (zoneInd) zoneInd.textContent = `DROPPING IN: 00:${data.seconds.toString().padStart(2, '0')}`;
      const stagingMsg = document.getElementById('staging-status-msg');
      if (stagingMsg) {
        stagingMsg.textContent = `AUTO-LAUNCHING IN ${data.seconds}s... (OR CLICK LAUNCH MATCH NOW)`;
      }
      const cdBanner = document.getElementById('br-countdown-banner');
      const cdText = document.getElementById('br-countdown-text');
      const hudOverlay = document.getElementById('hud-overlay');
      if (cdBanner && cdText) {
        if (data.seconds > 0) {
          hudOverlay?.classList.add('hud-staging-mode');
          cdBanner.classList.remove('hidden');
          cdBanner.style.display = 'block';
          cdText.textContent = `PREPARING AIRDROP: ${data.seconds}s`;
          sounds.playCountdownBeep();
        } else {
          cdBanner.classList.add('hidden');
          cdBanner.style.display = 'none';
        }
      }
    });

    this.socket.on('brStateChanged', (data) => {
      this.brState = data.state;
      if (data.state === 'BR_SPAWNING' || data.state === 'AIRDROP_DROP') {
        this.isDroppingBR = true;
        this.brThrustersDeployed = false;
        document.getElementById('br-countdown-banner')?.classList.add('hidden');
        this.showToast('🪂 AIRDROP INITIATED! PREPARE FOR IMPACT', 'amber');
      } else if (data.state === 'BR_ACTIVE' || data.state === 'ACTIVE_COMBAT') {
        this.isDroppingBR = false;
        this.brThrustersDeployed = false;
        document.getElementById('br-countdown-banner')?.classList.add('hidden');
        const gh = this.getGroundHeight(this.player.x, this.player.z, this.player.y);
        if (this.player.y > gh) {
          this.player.y = gh;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
        this.showToast('⚔️ PERMADEATH ACTIVE! SECURE LOOT & SURVIVE', 'red');
      }
    });

    this.socket.on('brZoneUpdate', (data) => {
      if (data) {
        this.safeZone = data;
        const statusEl = document.getElementById('hud-storm-status');
        const radiusEl = document.getElementById('hud-storm-radius');
        if (statusEl) {
          if (data.isShrinking) {
            statusEl.textContent = 'ZONE COLLAPSING! RETREAT TO SAFE AREA';
            statusEl.style.color = 'var(--crimson)';
          } else {
            statusEl.textContent = `ZONE STABLE // NEXT COLLAPSE SOON`;
            statusEl.style.color = 'var(--amber)';
          }
        }
        if (radiusEl) {
          radiusEl.textContent = `PHASE ${data.phase || 1} • RADIUS: ${Math.round(data.radius || 90)}m • DPS: ${data.dps || 5}`;
        }
      }
    });

    this.socket.on('brPlayerEliminated', (data) => {
      const aliveEl = document.getElementById('hud-br-alive');
      if (aliveEl && data.aliveCount !== undefined) {
        aliveEl.textContent = `${data.aliveCount} / 10`;
      }

      if (data.victim && data.victim.id === this.selfId) {
        if (document.exitPointerLock) document.exitPointerLock();
        this.isPointerLocked = false;

        const deathScreen = document.getElementById('deathScreen');
        if (deathScreen) {
          deathScreen.style.display = 'flex';
          deathScreen.classList.remove('hidden');
        }
        const rankEl = document.getElementById('death-rank-val');
        if (rankEl) rankEl.textContent = `RANK #${data.rank || 2} / 10`;
        const killerEl = document.getElementById('death-killer-info');
        if (killerEl) {
          killerEl.textContent = data.killer ? `KILLED BY ${data.killer.name}` : 'ELIMINATED BY GLITCH STORM';
        }
        sounds.playEliminatedSting();
      } else if (data.killer && data.killer.id === this.selfId) {
        this.player.kills = (this.player.kills || 0) + 1;
        const killsEl = document.getElementById('hud-br-kills');
        if (killsEl) killsEl.textContent = `${this.player.kills}`;
        this.showToast(`🎯 ELIMINATED ${data.victim?.name || 'COMBATANT'}!`, 'green');
      }
    });

    this.socket.on('brGameOver', (data) => {
      if (document.exitPointerLock) document.exitPointerLock();
      this.isPointerLocked = false;
      const isWinner = data.winner && data.winner.id === this.selfId;

      if (isWinner) {
        const victoryScreen = document.getElementById('victoryScreen') || document.getElementById('match-end-modal');
        if (victoryScreen) {
          victoryScreen.style.display = 'flex';
          victoryScreen.classList.remove('hidden');
        }
        const banner = document.getElementById('end-victory-banner');
        if (banner) {
          banner.textContent = 'VICTORY ROYALE #1';
          banner.classList.add('victory-royale-banner');
        }
        const sub = document.getElementById('end-sub-banner');
        if (sub) sub.textContent = 'CHAMPION OF CYBER ARENA';

        document.getElementById('end-stat-kills').textContent = `${this.player.kills || 0}`;
        document.getElementById('end-stat-damage').textContent = `${this.player.damageDealt || 0}`;
        const dur = data.stats?.duration || Math.round((Date.now() - (this.matchStartTime || Date.now())) / 1000);
        const m = Math.floor(dur / 60);
        const s = dur % 60;
        document.getElementById('end-stat-time').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        this.launchVictoryConfetti();
        sounds.playVictoryRoyale();
      }
    });

    this.socket.on('groundLootRemoved', (data) => {
      this.removeGroundLootMesh(data.id);
    });

    this.socket.on('lootItemCollected', (data) => {
      if (data.type === 'weapon') {
        this.player.weapon = data.weapon;
        if (this.player.ammo[data.weapon]) {
          this.player.ammo[data.weapon].reserve += (data.ammo || 30);
        }
        this.switchWeapon(data.weapon);
        this.showToast(`🔫 ACQUIRED ${this.weapons[data.weapon]?.name || data.weapon.toUpperCase()}`, 'cyan');
      } else if (data.type === 'ammo') {
        for (const w in this.player.ammo) {
          this.player.ammo[w].reserve += 60;
        }
        this.showToast('📦 +60 UNIVERSAL AMMO ACQUIRED', 'amber');
      } else if (data.type === 'medkit') {
        this.player.health = Math.min(100, this.player.health + 100);
        this.player.medic.medkit = (this.player.medic.medkit || 0) + 1;
        this.showToast('✚ CYBER MEDKIT COLLECTED (+100 HP)', 'green');
        this.flashVignette('heal-vignette', 500);
      } else if (data.type === 'armor') {
        this.player.armor = Math.min(100, (this.player.armor || 0) + 50);
        this.showToast('🛡️ BLUE ARMOR VEST EQUIPPED (+50 AP)', 'cyan');
        this.flashVignette('heal-vignette', 500);
      }
      this.updateHudVitals();
      this.updateHudAmmo();
      this.updateBRInventoryHUD();
      sounds.playPowerUp();
    });

    this.socket.on('enterSpectatorMode', (data) => {
      this.isSpectating = true;
      this.spectateTargetId = data.spectatingId;
      const nameEl = document.getElementById('spec-target-name');
      if (nameEl) nameEl.textContent = data.spectatingName || 'Surviving Combatant';
      const rankEl = document.getElementById('spec-elim-rank');
      if (rankEl && data.rank) {
        rankEl.textContent = `ELIMINATED - RANK #${data.rank} / ${data.totalPlayers || 10}`;
      }
      document.getElementById('spectator-overlay')?.classList.remove('hidden');
    });

    this.socket.on('matchEnded', (data) => {
      this.handleMatchEnded(data);
    });

    this.socket.on('leftRoom', () => {
      this.leaveMatchToLobby();
    });
  }

  // -------------------------------------------------------------
  // 4. THREE.JS ENGINE SETUP
  // -------------------------------------------------------------
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x070d1e, 0.015);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 1.8, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient baseline lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambientLight);

    // Dedicated Map Atmospheric Lighting Container (cleared & rebuilt per map)
    this.mapLightsGroup = new THREE.Group();
    this.scene.add(this.mapLightsGroup);

    // Viewmodel weapon camera setup
    this.buildFirstPersonWeapon();

    window.addEventListener('resize', () => this.handleWindowResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleWindowResize(), 150);
    });
  }

  handleWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (this.inMatch && (this.isTouch || window.innerWidth <= 1024)) {
      document.getElementById('mobile-touch-hud')?.classList.remove('hidden');
    }
    this.checkOrientationNotice();
  }

  checkOrientationNotice() {
    const overlay = document.getElementById('orientation-overlay');
    if (!overlay) return;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (this.inMatch && isPortrait) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  resetTouchState() {
    this.activeTouches = {
      joystick: null,
      look: null,
      fire: null,
      fireLeft: null
    };
    this.touchJoystick = { x: 0, y: 0, active: false, isSprint: false };
    const jBase = document.getElementById('joystick-base');
    const jThumb = document.getElementById('joystick-thumb');
    if (jBase) {
      jBase.style.left = '';
      jBase.style.top = '';
      jBase.style.bottom = '';
      jBase.style.opacity = '0.35';
    }
    if (jThumb) {
      jThumb.style.transform = 'translate(0px, 0px)';
    }
  }

  // -------------------------------------------------------------
  // 5. 3D ANIMATED PUBG-STYLE LOBBY & MODULAR MAP ENGINE
  // -------------------------------------------------------------

  // --- 5A. 3D ANIMATED PUBG-STYLE LOBBY SCENE ---
  buildLobbyScene() {
    this.lobbySceneGroup = new THREE.Group();

    // Set Atmospheric Depth & Fog
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    // 1. Dark reflective cyber showroom floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      metalness: 0.90,
      roughness: 0.22
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.lobbySceneGroup.add(floor);

    // 2. Animated Neon-Cyan Hexagon Wireframes Sliding along Z-axis
    this.lobbyHexGrid = new THREE.Group();
    const hexLineMat = new THREE.LineBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0.40
    });
    const R = 1.25;
    const dx = 1.5 * R;
    const dz = Math.sqrt(3) * R; // ~2.165

    for (let col = -9; col <= 9; col++) {
      for (let row = -10; row <= 10; row++) {
        const cx = col * dx;
        const cz = row * dz + (Math.abs(col) % 2 === 1 ? dz * 0.5 : 0);
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const a = (k * Math.PI) / 3;
          pts.push(new THREE.Vector3(cx + Math.cos(a) * (R * 0.92), 0.015, cz + Math.sin(a) * (R * 0.92)));
        }
        const hexGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const hexLine = new THREE.Line(hexGeo, hexLineMat);
        this.lobbyHexGrid.add(hexLine);
      }
    }
    this.lobbySceneGroup.add(this.lobbyHexGrid);

    // 3. Floating Ambient Cyber Dust Particles Drifting Upward
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    this.lobbyDustSpeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 22;
      dustPositions[i * 3 + 1] = 0.2 + Math.random() * 7.5;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      this.lobbyDustSpeeds[i] = 0.22 + Math.random() * 0.48;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x00f6ff,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.lobbyDustMesh = new THREE.Points(dustGeo, dustMat);
    this.lobbySceneGroup.add(this.lobbyDustMesh);

    // 4. Elevated circular holographic pedestal with pulsing cyan/electric-blue rings
    const pedGroup = new THREE.Group();
    pedGroup.position.set(0, 0, 0);

    // Dark metallic pedestal base
    const pedBaseGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.35, 32);
    const pedBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      metalness: 0.9,
      roughness: 0.2
    });
    const pedBase = new THREE.Mesh(pedBaseGeo, pedBaseMat);
    pedBase.position.y = 0.175;
    pedBase.receiveShadow = true;
    pedGroup.add(pedBase);

    // Top surface disc
    const pedTopGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.05, 32);
    const pedTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f2244,
      metalness: 0.7,
      roughness: 0.3
    });
    const pedTop = new THREE.Mesh(pedTopGeo, pedTopMat);
    pedTop.position.y = 0.36;
    pedGroup.add(pedTop);

    // Pulsing outer neon cyan ring
    const ringGroup1 = new THREE.Group();
    ringGroup1.position.set(0, 0.36, 0);
    const ringGeo1 = new THREE.TorusGeometry(2.32, 0.035, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f6ff });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ringGroup1.add(ring1);
    pedGroup.add(ringGroup1);

    // Inner electric-blue ring
    const ringGroup2 = new THREE.Group();
    ringGroup2.position.set(0, 0.37, 0);
    const ringGeo2 = new THREE.TorusGeometry(1.6, 0.025, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ringGroup2.add(ring2);
    pedGroup.add(ringGroup2);

    // Translucent vertical holographic light beam
    const beamGeo = new THREE.CylinderGeometry(2.1, 2.1, 5.0, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.86;
    pedGroup.add(beam);

    this.lobbyPedestalRings = [ringGroup1, ringGroup2];
    this.lobbyPedestalBeam = beam;
    this.lobbySceneGroup.add(pedGroup);

    // 5. Mascot Pivot for 360-degree drag rotation
    this.lobbyMascotPivot = new THREE.Group();
    this.lobbyMascotPivot.position.set(0, 0.38, 0);

    this.lobbyMascot = this.createMascotMesh({
      id: 'lobby_mascot',
      name: 'DLICOM PILOT',
      team: 'blue',
      isBot: false,
      isLobby: true
    });
    this.lobbyMascot.position.set(0, 0, 0);
    this.lobbyMascotPivot.add(this.lobbyMascot);
    this.lobbySceneGroup.add(this.lobbyMascotPivot);

    // 6. Floating Holographic Brand Pillars (Speech-bubble, Dlicom Token & Data Core)
    this.lobbyBrandPillars = [];

    // Pillar A: Dlicom Speech-Bubble Geometry Monolith (Left)
    const bubblePillar = this.createSpeechBubbleHologram();
    bubblePillar.position.set(-3.8, 2.5, -2.4);
    bubblePillar.userData.baseY = 2.5;
    bubblePillar.userData.rotSpeed = 0.0009;
    this.lobbyBrandPillars.push(bubblePillar);
    this.lobbySceneGroup.add(bubblePillar);

    // Pillar B: Dlicom Cyber Token Monolith (Center-Back)
    const tokenPillar = this.createTokenHologram();
    tokenPillar.position.set(0, 3.6, -3.8);
    tokenPillar.userData.baseY = 3.6;
    tokenPillar.userData.rotSpeed = 0.0012;
    this.lobbyBrandPillars.push(tokenPillar);
    this.lobbySceneGroup.add(tokenPillar);

    // Pillar C: Holographic Encrypted Data Core (Right)
    const crystalPillar = this.createDataCrystalHologram();
    crystalPillar.position.set(3.8, 2.5, -2.4);
    crystalPillar.userData.baseY = 2.5;
    crystalPillar.userData.rotSpeed = -0.0008;
    this.lobbyBrandPillars.push(crystalPillar);
    this.lobbySceneGroup.add(crystalPillar);

    // 7. Floating Holographic Brand Billboards
    this.lobbyBillboards = [];
    const billboardDefs = [
      {
        title: 'DLICLIPS',
        sub: 'AI Short-Form SocialFi',
        badge: 'POPULAR #CYBERVOXEL',
        accent: '#00f6ff',
        pos: new THREE.Vector3(-3.4, 2.5, -2.0),
        rotY: 0.36
      },
      {
        title: 'DLICOM CORE',
        sub: 'Decentralized AI Node Matrix',
        badge: '99.98% CONSENSUS',
        accent: '#10b981',
        pos: new THREE.Vector3(0, 3.4, -3.0),
        rotY: 0
      },
      {
        title: 'ENCRYPTED VAULT',
        sub: 'Zero-Knowledge Proof Ledger',
        badge: 'AIRDROP: 50,000 $DLI',
        accent: '#bf00ff',
        pos: new THREE.Vector3(3.4, 2.5, -2.0),
        rotY: -0.36
      }
    ];

    billboardDefs.forEach((def, idx) => {
      const bbMesh = this.createLobbyHoloBillboard(def);
      bbMesh.position.copy(def.pos);
      bbMesh.rotation.y = def.rotY;
      bbMesh.userData.baseY = def.pos.y;
      bbMesh.userData.phase = idx * 1.8;
      this.lobbyBillboards.push(bbMesh);
      this.lobbySceneGroup.add(bbMesh);
    });

    // 8. Dynamic Spot & Fill Lighting
    const spotLight = new THREE.SpotLight(0x00f6ff, 3.8, 20, Math.PI / 4, 0.35);
    spotLight.position.set(0, 7.5, 0);
    spotLight.target = this.lobbyMascotPivot;
    this.lobbySceneGroup.add(spotLight);

    const fillLight = new THREE.PointLight(0x3b82f6, 2.2, 14);
    fillLight.position.set(2.5, 4, 3.5);
    this.lobbySceneGroup.add(fillLight);

    const purpleBacklight = new THREE.PointLight(0xbf00ff, 2.0, 12);
    purpleBacklight.position.set(-3.0, 3.5, -3.0);
    this.lobbySceneGroup.add(purpleBacklight);

    this.scene.add(this.lobbySceneGroup);
  }

  // --- HOLOGRAPHIC BRAND PILLAR BUILDERS ---
  createSpeechBubbleHologram() {
    const group = new THREE.Group();
    // Rounded Speech Bubble Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00f6ff,
      emissive: 0x00a3cc,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.85,
      wireframe: true
    });
    const bodyGeo = new THREE.BoxGeometry(1.6, 1.1, 0.22);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Triangular Chat Tail
    const tailGeo = new THREE.ConeGeometry(0.3, 0.45, 3);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(-0.55, -0.65, 0);
    tail.rotation.z = Math.PI / 1.25;
    group.add(tail);

    // Glowing Inner Glyph
    const innerGeo = new THREE.PlaneGeometry(0.8, 0.2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.z = 0.12;
    group.add(inner);

    return group;
  }

  createTokenHologram() {
    const group = new THREE.Group();
    // Faceted Holographic Coin Cylinder
    const coinGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.22, 28);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0x00f6ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    // Embossed 'D' Voxel Shape inside token
    const glyphGeo = new THREE.TorusGeometry(0.52, 0.12, 12, 24, Math.PI);
    const glyphMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const glyph = new THREE.Mesh(glyphGeo, glyphMat);
    glyph.rotation.z = -Math.PI / 2;
    glyph.position.set(-0.1, 0, 0.12);
    group.add(glyph);

    const stemGeo = new THREE.BoxGeometry(0.18, 1.04, 0.08);
    const stem = new THREE.Mesh(stemGeo, glyphMat);
    stem.position.set(-0.1, 0, 0.12);
    group.add(stem);

    // Concentric orbiting rings
    const ringGeo = new THREE.TorusGeometry(1.65, 0.02, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
    group.userData.outerRing = ring;

    return group;
  }

  createDataCrystalHologram() {
    const group = new THREE.Group();
    // Octahedral Core
    const octGeo = new THREE.OctahedronGeometry(0.95, 0);
    const octMat = new THREE.MeshStandardMaterial({
      color: 0xbf00ff,
      emissive: 0x9333ea,
      emissiveIntensity: 0.45,
      wireframe: true
    });
    const oct = new THREE.Mesh(octGeo, octMat);
    group.add(oct);

    // Dual orbiting data rings
    const r1Geo = new THREE.TorusGeometry(1.35, 0.02, 16, 48);
    const r1Mat = new THREE.MeshBasicMaterial({ color: 0xbf00ff, transparent: true, opacity: 0.65 });
    const r1 = new THREE.Mesh(r1Geo, r1Mat);
    r1.rotation.x = Math.PI / 3;
    group.add(r1);

    const r2 = r1.clone();
    r2.rotation.x = -Math.PI / 3;
    r2.material = new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 0.65 });
    group.add(r2);

    group.userData.r1 = r1;
    group.userData.r2 = r2;

    return group;
  }

  createLobbyHoloBillboard(def) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, 'rgba(8, 15, 35, 0.90)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.94)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Glowing border
    ctx.strokeStyle = def.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);

    // Corner tech notches
    ctx.fillStyle = def.accent;
    ctx.fillRect(6, 6, 24, 6);
    ctx.fillRect(6, 6, 6, 24);
    ctx.fillRect(482, 6, 24, 6);
    ctx.fillRect(500, 6, 6, 24);
    ctx.fillRect(6, 238, 24, 6);
    ctx.fillRect(6, 220, 6, 24);
    ctx.fillRect(482, 244, 24, 6);
    ctx.fillRect(500, 226, 6, 24);

    // Category Badge
    ctx.fillStyle = 'rgba(0, 246, 255, 0.15)';
    ctx.fillRect(30, 26, 240, 36);
    ctx.strokeStyle = def.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 26, 240, 36);

    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.fillStyle = def.accent;
    ctx.fillText(def.badge, 42, 50);

    // Main Title
    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(def.title, 30, 115);

    // Subtitle
    ctx.font = '19px Orbitron, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(def.sub, 30, 158);

    // Scan lines
    ctx.fillStyle = 'rgba(0, 246, 255, 0.05)';
    for (let y = 0; y < 256; y += 8) {
      ctx.fillRect(0, y, 512, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(2.8, 1.4);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { canvas, ctx, texture };
    return mesh;
  }

  updateLobbyScene(dt, time) {
    const timeSec = time * 0.001;

    // 1. Cinematic Orbit Camera: Gentle Figure-8 / subtle orbital sweep (±5°)
    if (this.camera.fov !== 75) {
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
    }
    this.camera.rotation.order = 'XYZ';

    // Figure-8 orbital sweep (~0.087 rad = 5 deg)
    const orbitAngle = Math.sin(timeSec * 0.45) * 0.087;
    const camDist = 4.95;
    const camX = Math.sin(orbitAngle) * camDist;
    const camY = 1.95 + Math.sin(timeSec * 0.6) * 0.06;
    const camZ = Math.cos(orbitAngle) * camDist;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 1.25, 0);

    // 2. Hide in-game first-person viewmodel gun in lobby
    if (this.viewmodelGun) this.viewmodelGun.visible = false;

    // 3. Sliding Neon-Cyan Hexagon Grid along Z-axis
    if (this.lobbyHexGrid) {
      const hexSpacingZ = 2.165;
      this.lobbyHexGrid.position.z = (timeSec * 0.75) % hexSpacingZ;
    }

    // 4. Ambient Cyber Dust Particles Drifting Upward
    if (this.lobbyDustMesh && this.lobbyDustSpeeds) {
      const pos = this.lobbyDustMesh.geometry.attributes.position.array;
      for (let i = 0; i < this.lobbyDustSpeeds.length; i++) {
        pos[i * 3 + 1] += dt * this.lobbyDustSpeeds[i];
        if (pos[i * 3 + 1] > 7.5) {
          pos[i * 3 + 1] = 0.2;
          pos[i * 3] = (Math.random() - 0.5) * 22;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
      }
      this.lobbyDustMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 5. The Mascot Animated Stance: Breathing Bob, Visor Blinking & Weapon Inspection Sway
    if (this.lobbyMascot) {
      // Breathing bob: torso, helmet, and held weapon oscillate vertically
      const breath = Math.sin(timeSec * 2.2) * 0.015;
      this.lobbyMascot.position.y = breath;

      // Two-handed ready pose with weapon inspection idle sway
      const sway = Math.sin(timeSec * 1.6) * 0.035;
      const tilt = Math.cos(timeSec * 1.3) * 0.025;

      if (this.lobbyMascot.userData.armR) {
        this.lobbyMascot.userData.armR.rotation.x = -0.65 + sway;
        this.lobbyMascot.userData.armR.rotation.y = -0.18;
        this.lobbyMascot.userData.armR.rotation.z = -0.42 + tilt;
      }
      if (this.lobbyMascot.userData.armL) {
        this.lobbyMascot.userData.armL.rotation.x = -0.88 + sway;
        this.lobbyMascot.userData.armL.rotation.y = 0.28;
        this.lobbyMascot.userData.armL.rotation.z = 0.65 + tilt;
      }
      if (this.lobbyMascot.userData.weaponPivot) {
        this.lobbyMascot.userData.weaponPivot.position.y = 1.10 + breath;
        this.lobbyMascot.userData.weaponPivot.rotation.x = -0.15 + sway * 0.6;
        this.lobbyMascot.userData.weaponPivot.rotation.z = tilt * 0.8;
      }
    }

    // 6. Mascot horizontal drag-to-rotate interpolation (Manual 360-deg inspection)
    if (this.lobbyMascotPivot) {
      this.lobbyMascotPivot.rotation.y = THREE.MathUtils.lerp(
        this.lobbyMascotPivot.rotation.y,
        this.lobbyMascotYaw,
        dt * 12
      );
    }

    // 7. Animated Visor: Blinking between '> <' and happy '^ ^' every 4 seconds
    this.lobbyBlinkTimer = (this.lobbyBlinkTimer || 0) + dt;
    if (this.lobbyBlinkTimer >= 4.0) {
      this.setMascotEyesBlink(this.lobbyMascot, true);
      if (this.lobbyBlinkTimer >= 4.25) {
        this.setMascotEyesBlink(this.lobbyMascot, false);
        this.lobbyBlinkTimer = 0;
      }
    }

    // 8. Pulsing Pedestal Rings & Light Beam
    if (this.lobbyPedestalRings) {
      const pulse = 1.0 + Math.sin(timeSec * 3.0) * 0.035;
      this.lobbyPedestalRings.forEach((rg, idx) => {
        rg.scale.set(pulse, 1.0, pulse);
        rg.rotation.y += (idx === 0 ? 0.005 : -0.007);
      });
    }
    if (this.lobbyPedestalBeam) {
      this.lobbyPedestalBeam.material.opacity = 0.07 + Math.sin(timeSec * 4.0) * 0.03;
    }

    // 9. Floating Brand Pillars (Speech bubble, token & crystal bobbing and rotating)
    if (this.lobbyBrandPillars) {
      this.lobbyBrandPillars.forEach((pillar, idx) => {
        pillar.position.y = pillar.userData.baseY + Math.sin(timeSec * 1.8 + idx * 1.5) * 0.09;
        pillar.rotation.y += pillar.userData.rotSpeed || 0.001;
        if (pillar.userData.outerRing) {
          pillar.userData.outerRing.rotation.z += 0.015;
        }
        if (pillar.userData.r1) {
          pillar.userData.r1.rotation.z += 0.012;
          pillar.userData.r2.rotation.z -= 0.010;
        }
      });
    }

    // 10. Floating Billboards Bobbing
    if (this.lobbyBillboards) {
      this.lobbyBillboards.forEach((bb) => {
        const ph = bb.userData.phase || 0;
        bb.position.y = bb.userData.baseY + Math.sin(timeSec * 1.8 + ph) * 0.08;
      });
    }
  }

  setMascotEyesBlink(mascot, isBlinking) {
    if (!mascot || !mascot.userData.eyes) return;
    const { eyeL1, eyeL2, eyeR1, eyeR2 } = mascot.userData.eyes;
    if (!eyeL1 || !eyeL2 || !eyeR1 || !eyeR2) return;

    if (isBlinking) {
      // '^ ^' happy blinking eyes
      eyeL1.position.set(-0.165, 0.02, 0.42);
      eyeL1.rotation.z = Math.PI / 4;
      eyeL2.position.set(-0.115, 0.02, 0.42);
      eyeL2.rotation.z = -Math.PI / 4;

      eyeR1.position.set(0.115, 0.02, 0.42);
      eyeR1.rotation.z = Math.PI / 4;
      eyeR2.position.set(0.165, 0.02, 0.42);
      eyeR2.rotation.z = -Math.PI / 4;
    } else {
      // '> <' cute default cyber visor eyes
      eyeL1.position.set(-0.14, 0.025, 0.42);
      eyeL1.rotation.z = Math.PI / 4;
      eyeL2.position.set(-0.14, -0.025, 0.42);
      eyeL2.rotation.z = -Math.PI / 4;

      eyeR1.position.set(0.14, 0.025, 0.42);
      eyeR1.rotation.z = -Math.PI / 4;
      eyeR2.position.set(0.14, -0.025, 0.42);
      eyeR2.rotation.z = Math.PI / 4;
    }
  }

  updateLobbyHeldWeapon(weaponKey) {
    if (!this.lobbyMascot || !this.lobbyMascot.userData.heldWeapon) return;
    const hw = this.lobbyMascot.userData.heldWeapon;
    // Highlight weapon with pulse
    hw.scale.set(1.15, 1.15, 1.15);
    setTimeout(() => {
      hw.scale.set(1.0, 1.0, 1.0);
    }, 180);

    const colors = { ar: 0x00f6ff, shotgun: 0xff0055, sniper: 0xbf00ff };
    const col = colors[weaponKey] || 0x00f6ff;
    hw.traverse((c) => {
      if (c.material && c.material.color) {
        if (c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y === 0) {
          c.material.color.setHex(col);
        }
      }
    });
  }

  // --- 5B. MODULAR 3-MAP ENGINE & PROPER TEARDOWN ---

  clearCurrentMap() {
    // 1. Remove all meshes in the current map group from the scene
    const group = this.mapGroup || this.arenaGroup;
    if (group) {
      group.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m && m.dispose && m.dispose());
          } else if (child.material && child.material.dispose) {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(group);
    }

    // Clean up dedicated map lighting
    if (this.mapLightsGroup) {
      this.scene.remove(this.mapLightsGroup);
      this.mapLightsGroup = null;
    }

    // 2. Reset collision and raycast target arrays
    this.obstacleMeshes = [];
    this.obstacleBoxes = [];
    this.mapColliders = [];
    this.jumpPads = [];
    this.jumpPadMeshes = [];
    this.jumpPadDefs = [];
    this.spawnPoints = { blue: [], red: [] };
    if (this.powerUpMeshes) this.powerUpMeshes.clear();
    if (this.lootCrateMeshes) this.lootCrateMeshes.clear();
    if (this.groundLootMeshes) this.groundLootMeshes.clear();
    if (this.safeZoneMesh) {
      if (this.safeZoneMesh.geometry) this.safeZoneMesh.geometry.dispose();
      if (this.safeZoneMesh.material) this.safeZoneMesh.material.dispose();
      this.safeZoneMesh = null;
    }

    // 3. Create fresh container group
    this.mapGroup = new THREE.Group();
    this.arenaGroup = this.mapGroup;
    this.scene.add(this.mapGroup);

    this.mapLightsGroup = new THREE.Group();
    this.scene.add(this.mapLightsGroup);
  }

  buildMap(mapId = 'warehouse') {
    this.currentMapId = mapId;
    this.selectedMapId = mapId;

    // 1. Proper map teardown & cleanup
    this.clearCurrentMap();

    // Expose global cleanup helper for direct invocation
    window.clearCurrentMap = () => this.clearCurrentMap();

    // 2. Configure environment lighting, atmosphere and geometry per map
    if (mapId === 'vault') {
      // Atmospheric visuals: Deep subterranean Matrix vault
      this.scene.background = new THREE.Color(0x010d07);
      this.scene.fog = new THREE.FogExp2(0x02190f, 0.016);

      // Dedicated Vault Lighting (Matrix Emerald Theme)
      const hemi = new THREE.HemisphereLight(0x10b981, 0x01140a, 0.8);
      this.mapLightsGroup.add(hemi);

      const dir = new THREE.DirectionalLight(0x34d399, 1.15);
      dir.position.set(25, 45, 15);
      dir.castShadow = true;
      dir.shadow.mapSize.width = 1024;
      dir.shadow.mapSize.height = 1024;
      this.mapLightsGroup.add(dir);

      const coreLight = new THREE.PointLight(0x10b981, 2.8, 35, 1.5);
      coreLight.position.set(0, 7.0, 0);
      this.mapLightsGroup.add(coreLight);

      const fill = new THREE.PointLight(0x059669, 1.2, 25);
      fill.position.set(0, 2.2, 0);
      this.mapLightsGroup.add(fill);

      this.buildVaultMap(this.mapGroup);
    } else if (mapId === 'rooftops') {
      // Atmospheric visuals: Open-air synthwave skyline at dusk
      this.scene.background = new THREE.Color(0x0c0418);
      this.scene.fog = new THREE.FogExp2(0x180528, 0.014);

      // Dedicated Rooftops Lighting (Synthwave Magenta & Electric Cyan Rim)
      const hemi = new THREE.HemisphereLight(0xff007f, 0x1b0b2e, 0.8);
      this.mapLightsGroup.add(hemi);

      // Warm pink key light
      const dir = new THREE.DirectionalLight(0xf43f5e, 1.15);
      dir.position.set(35, 55, 25);
      dir.castShadow = true;
      dir.shadow.mapSize.width = 1024;
      dir.shadow.mapSize.height = 1024;
      this.mapLightsGroup.add(dir);

      // Electric cyan rim light for striking 80s synthwave contrast
      const rim = new THREE.DirectionalLight(0x00f6ff, 0.65);
      rim.position.set(-30, 30, -30);
      this.mapLightsGroup.add(rim);

      // Helipad center glow
      const padLight = new THREE.PointLight(0xff00aa, 2.0, 30);
      padLight.position.set(0, 3.5, 0);
      this.mapLightsGroup.add(padLight);

      this.buildRooftopsMap(this.mapGroup);
    } else {
      // Atmospheric visuals: Industrial factory warehouse
      this.scene.background = new THREE.Color(0x030712);
      this.scene.fog = new THREE.FogExp2(0x070d1e, 0.015);

      // Dedicated Warehouse Lighting (Cyan & Steel Blue Theme)
      const hemi = new THREE.HemisphereLight(0x00f6ff, 0x080f1e, 0.7);
      this.mapLightsGroup.add(hemi);

      const dir = new THREE.DirectionalLight(0xffffff, 0.95);
      dir.position.set(30, 50, 20);
      dir.castShadow = true;
      dir.shadow.mapSize.width = 1024;
      dir.shadow.mapSize.height = 1024;
      this.mapLightsGroup.add(dir);

      const catwalkLight = new THREE.PointLight(0x00f6ff, 1.5, 25);
      catwalkLight.position.set(0, 5.0, 0);
      this.mapLightsGroup.add(catwalkLight);

      this.buildWarehouseMap(this.mapGroup);
    }

    // Setup BR Storm Cylinder
    const stormGeo = new THREE.CylinderGeometry(54, 54, 40, 48, 1, true);
    const stormMat = new THREE.MeshBasicMaterial({
      color: (mapId === 'vault' ? 0x10b981 : (mapId === 'rooftops' ? 0xff007f : 0xbf00ff)),
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      wireframe: true
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.set(0, 20, 0);
    this.stormMesh.visible = (this.gameMode === 'br' && this.inMatch);
    this.mapGroup.add(this.stormMesh);

    // Sync jump pads array alias
    this.jumpPads = this.jumpPadDefs;

    // Collect all solid meshes for distance-sorted raycast occlusion (prevents wall penetration)
    this.obstacleMeshes = [];
    this.mapGroup.traverse((child) => {
      if (child.isMesh && child !== this.stormMesh && !child.userData.isNonCollidable) {
        this.obstacleMeshes.push(child);
      }
    });

    // If currently in lobby staging, preserve visibility state
    if (!this.inMatch && this.lobbySceneGroup && this.lobbySceneGroup.visible) {
      this.mapGroup.visible = false;
      if (this.mapLightsGroup) this.mapLightsGroup.visible = false;
    }
  }

  // MAP 1: CYBER WAREHOUSE (Factory Vibe, Symmetrical 4v4 TDM)
  buildWarehouseMap(arenaGroup) {
    // 1. Grid Floor
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a1224, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaGroup.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0x00f6ff, 0x1e293b);
    grid.position.y = 0.02;
    arenaGroup.add(grid);

    // 2. Perimeter Boundary Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const wallGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff, wireframe: true });

    const wallDefs = [
      { x: 0, y: 5, z: -40, w: 80, h: 10, d: 2 },
      { x: 0, y: 5, z: 40, w: 80, h: 10, d: 2 },
      { x: -40, y: 5, z: 0, w: 2, h: 10, d: 80 },
      { x: 40, y: 5, z: 0, w: 2, h: 10, d: 80 }
    ];

    wallDefs.forEach((w) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMat);
      mesh.position.set(w.x, w.y, w.z);
      arenaGroup.add(mesh);
      const b3 = new THREE.Box3().setFromObject(mesh);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const strip = new THREE.Mesh(new THREE.BoxGeometry(w.w, 0.4, w.d), wallGlowMat);
      strip.position.set(w.x, w.y + w.h / 2, w.z);
      arenaGroup.add(strip);
    });

    // 3. Central Catwalk (Height: 3.5m, surface 4.0m)
    const catwalkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(32, 1, 14), catwalkMat);
    catwalk.position.set(0, 3.5, 0);
    catwalk.castShadow = true;
    catwalk.receiveShadow = true;
    arenaGroup.add(catwalk);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(catwalk), isPlatform: true });

    // Catwalk Access Ramps
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const rampNorth = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 12), rampMat);
    rampNorth.position.set(0, 1.75, 11);
    rampNorth.rotation.x = -Math.PI / 7;
    arenaGroup.add(rampNorth);

    const rampSouth = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 12), rampMat);
    rampSouth.position.set(0, 1.75, -11);
    rampSouth.rotation.x = Math.PI / 7;
    arenaGroup.add(rampSouth);

    // 4. Shipping Containers (Voxel Style)
    const containerDefs = [
      { x: -18, y: 2, z: -14, col: 0x00f6ff },
      { x: 18, y: 2, z: 14, col: 0xff0055 },
      { x: -22, y: 2, z: 16, col: 0xf59e0b },
      { x: 22, y: 2, z: -16, col: 0xbf00ff }
    ];

    containerDefs.forEach((c) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 12),
        new THREE.MeshStandardMaterial({ color: c.col, metalness: 0.5, roughness: 0.4 })
      );
      box.position.set(c.x, c.y, c.z);
      box.castShadow = true;
      box.receiveShadow = true;
      arenaGroup.add(box);
      const b3 = new THREE.Box3().setFromObject(box);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });
    });

    // 5. Server Towers (Pulsing Neon Accents)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const towerCoords = [
      { x: -28, z: -28 }, { x: 28, z: -28 },
      { x: -28, z: 28 }, { x: 28, z: 28 }
    ];

    towerCoords.forEach((t) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), towerMat);
      tower.position.set(t.x, 6, t.z);
      arenaGroup.add(tower);
      const b3 = new THREE.Box3().setFromObject(tower);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(4.1, 10, 0.8),
        new THREE.MeshBasicMaterial({ color: 0x00f6ff })
      );
      rack.position.set(t.x, 6, t.z);
      arenaGroup.add(rack);
    });

    // 6. Elevated Sniper Rafters
    const rafterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
    [-32, 32].forEach((rx) => {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 24), rafterMat);
      rafter.position.set(rx, 5.0, 0);
      arenaGroup.add(rafter);
      const b3 = new THREE.Box3().setFromObject(rafter);
      this.obstacleBoxes.push(b3);
    });

    // 7. Cardinal Jump-Pads
    this.jumpPadDefs = [
      { x: 0, z: 24, boostX: 0, boostZ: -16, boostY: 18 },
      { x: 0, z: -24, boostX: 0, boostZ: 16, boostY: 18 },
      { x: 24, z: 0, boostX: -16, boostZ: 0, boostY: 18 },
      { x: -24, z: 0, boostX: 16, boostZ: 0, boostY: 18 }
    ];

    this.jumpPadDefs.forEach((jp) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.8, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.2 })
      );
      base.position.set(jp.x, 0.25, jp.z);
      arenaGroup.add(base);

      const padCore = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0x00f6ff })
      );
      padCore.position.set(jp.x, 0.35, jp.z);
      arenaGroup.add(padCore);
      this.jumpPadMeshes.push(padCore);
    });

    // 8. Spawn Points (Blue & Red Base camps)
    this.spawnPoints = {
      blue: [
        { x: -26, y: 0.0, z: 24 }, { x: -22, y: 0.0, z: 26 },
        { x: -30, y: 0.0, z: 20 }, { x: -24, y: 0.0, z: 30 }
      ],
      red: [
        { x: 26, y: 0.0, z: -24 }, { x: 22, y: 0.0, z: -26 },
        { x: 30, y: 0.0, z: -20 }, { x: 24, y: 0.0, z: -30 }
      ]
    };

    // 9. Power-Up Stations
    this.setupStandardPowerUps(arenaGroup, 0x00f6ff);
  }

  // MAP 2: DLICOM NODE: DATA VAULT (Octagonal Cyber Sanctuary, Obsidian Circuits)
  buildVaultMap(arenaGroup) {
    // 1. Obsidian Floor with Emerald Green Grid & Circuit Traces
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x021008, roughness: 0.85, metalness: 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaGroup.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0x10b981, 0x052e1e);
    grid.position.y = 0.02;
    arenaGroup.add(grid);

    // Decorative Glowing Circuit Bus Rings on Floor
    [14, 28].forEach((r) => {
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.2, r + 0.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.03;
      ringMesh.userData.isNonCollidable = true;
      arenaGroup.add(ringMesh);
    });

    // 2. Axis-Aligned Perimeter Walls with Circuit Conduits
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x051a10, roughness: 0.5, metalness: 0.3 });
    const wallGlowMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });

    // 4 cardinal perimeter walls (80x80 clean boundary)
    const wallDefs = [
      { x: 0, y: 6, z: -40, w: 80, h: 12, d: 2 },
      { x: 0, y: 6, z: 40, w: 80, h: 12, d: 2 },
      { x: -40, y: 6, z: 0, w: 2, h: 12, d: 80 },
      { x: 40, y: 6, z: 0, w: 2, h: 12, d: 80 }
    ];

    wallDefs.forEach((w) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMat);
      mesh.position.set(w.x, w.y, w.z);
      arenaGroup.add(mesh);
      const b3 = new THREE.Box3().setFromObject(mesh);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const strip = new THREE.Mesh(new THREE.BoxGeometry(w.w, 0.4, w.d), wallGlowMat);
      strip.position.set(w.x, w.y + w.h / 2, w.z);
      arenaGroup.add(strip);
    });

    // 4 Corner Architectural Columns (Clean axis-aligned columns at perimeter corners)
    [
      { x: -36, z: -36 }, { x: 36, z: -36 },
      { x: -36, z: 36 }, { x: 36, z: 36 }
    ].forEach((cp) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), wallMat);
      col.position.set(cp.x, 6, cp.z);
      arenaGroup.add(col);
      const b3 = new THREE.Box3().setFromObject(col);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const cGlow = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 4.2), wallGlowMat);
      cGlow.position.set(cp.x, 11, cp.z);
      arenaGroup.add(cGlow);
    });

    // 3. Central Quantum Reactor Core Dais (Octagonal Podium at y = 1.0m, surface 2.5m)
    const daisMat = new THREE.MeshStandardMaterial({ color: 0x042416, metalness: 0.75, roughness: 0.25 });
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 2.0, 8), daisMat);
    dais.position.set(0, 1.0, 0);
    arenaGroup.add(dais);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(dais), isPlatform: true });

    // Towering 12m Glowing Hexagonal Quantum Reactor Core
    const coreOuterGeo = new THREE.CylinderGeometry(4.2, 4.2, 12.0, 6, 1, true);
    const coreOuterMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const coreOuter = new THREE.Mesh(coreOuterGeo, coreOuterMat);
    coreOuter.position.set(0, 8.0, 0);
    arenaGroup.add(coreOuter);

    const coreInnerGeo = new THREE.CylinderGeometry(2.2, 2.2, 10.0, 6, 1);
    const coreInnerMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
    const coreInner = new THREE.Mesh(coreInnerGeo, coreInnerMat);
    coreInner.position.set(0, 7.0, 0);
    arenaGroup.add(coreInner);

    // 4 Corner Energy Containment Towers on the Dais
    const pMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.8, roughness: 0.2 });
    const pCoords = [
      { x: -7, z: -7 }, { x: 7, z: -7 },
      { x: -7, z: 7 }, { x: 7, z: 7 }
    ];
    pCoords.forEach((p) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 8.0, 1.8), pMat);
      pillar.position.set(p.x, 5.0, p.z);
      arenaGroup.add(pillar);
      const b3 = new THREE.Box3().setFromObject(pillar);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const coil = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 3.0, 8),
        new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true })
      );
      coil.position.set(p.x, 5.5, p.z);
      arenaGroup.add(coil);
    });

    // Orbiting Data Matrix Nodes
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.85, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.9 })
      );
      cube.position.set(Math.cos(ang) * 5.6, 6.0 + (i % 2) * 2.0, Math.sin(ang) * 5.6);
      arenaGroup.add(cube);
    }

    // 4. Eight Axis-Aligned Server Monolith Banks (Arranged around perimeter & core with tactical cover)
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x0a281a, metalness: 0.65, roughness: 0.3 });
    const bankCoords = [
      { x: -18, z: -18, w: 4.5, h: 5.5, d: 8.5 },
      { x: 18, z: 18, w: 4.5, h: 5.5, d: 8.5 },
      { x: -18, z: 18, w: 4.5, h: 5.5, d: 8.5 },
      { x: 18, z: -18, w: 4.5, h: 5.5, d: 8.5 },
      { x: -28, z: 0, w: 4.5, h: 5.0, d: 10 },
      { x: 28, z: 0, w: 4.5, h: 5.0, d: 10 },
      { x: 0, z: -28, w: 10, h: 5.0, d: 4.5 },
      { x: 0, z: 28, w: 10, h: 5.0, d: 4.5 }
    ];

    bankCoords.forEach((b) => {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), serverMat);
      bank.position.set(b.x, b.h / 2, b.z);
      arenaGroup.add(bank);
      const b3 = new THREE.Box3().setFromObject(bank);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      // Glowing Emerald Green Server Slit
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.9, 0.3, b.d + 0.1),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      slit.position.set(b.x, b.h * 0.7, b.z);
      arenaGroup.add(slit);
    });

    // 5. High Cantilevered Quantum Walkways at y = 5.5m
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.8, roughness: 0.2 });
    const bridgeGeo = new THREE.BoxGeometry(52, 0.6, 4.5);
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 5.5, 0);
    arenaGroup.add(bridge);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(bridge), isPlatform: true });

    // Glass Railing on bridge
    const railMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.45 });
    [-2.2, 2.2].forEach((rz) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(52, 1.0, 0.1), railMat);
      rail.position.set(0, 6.3, rz);
      arenaGroup.add(rail);
    });

    // 6. Low-Gravity Quantum Boost Pads (+22 m/s Vertical Lift to upper bridge)
    this.jumpPadDefs = [
      { x: 0, z: 20, boostX: 0, boostZ: -12, boostY: 22 },
      { x: 0, z: -20, boostX: 0, boostZ: 12, boostY: 22 },
      { x: 20, z: 0, boostX: -12, boostZ: 0, boostY: 22 },
      { x: -20, z: 0, boostX: 12, boostZ: 0, boostY: 22 }
    ];

    this.jumpPadDefs.forEach((jp) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.8, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.8, roughness: 0.2 })
      );
      base.position.set(jp.x, 0.25, jp.z);
      arenaGroup.add(base);

      const padCore = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      padCore.position.set(jp.x, 0.35, jp.z);
      arenaGroup.add(padCore);
      this.jumpPadMeshes.push(padCore);
    });

    // 7. Spawn Points
    this.spawnPoints = {
      blue: [
        { x: -26, y: 0.0, z: 24 }, { x: -22, y: 0.0, z: 26 },
        { x: -30, y: 0.0, z: 20 }, { x: -24, y: 0.0, z: 30 }
      ],
      red: [
        { x: 26, y: 0.0, z: -24 }, { x: 22, y: 0.0, z: -26 },
        { x: 30, y: 0.0, z: -20 }, { x: 24, y: 0.0, z: -30 }
      ]
    };

    // 8. Power-Up Stations (Matrix Emerald Theme)
    this.setupStandardPowerUps(arenaGroup, 0x10b981);
  }

  // MAP 3: NEON ROOFTOPS (Synthwave Skyline, Multi-Tier Verticality & Open-Air Perimeters)
  buildRooftopsMap(arenaGroup) {
    // 1. Dark Industrial Rooftop Floor with Synthwave Purple Grid
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0d0618, roughness: 0.85, metalness: 0.25 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    arenaGroup.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0xbf00ff, 0x2e0e44);
    grid.position.y = 0.02;
    arenaGroup.add(grid);

    // Hazard Stripes on Edge Borders
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    [-39, 39].forEach((hx) => {
      const hStrip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 78), hazardMat);
      hStrip.position.set(hx, 0.03, 0);
      hStrip.userData.isNonCollidable = true;
      arenaGroup.add(hStrip);
    });
    [-39, 39].forEach((hz) => {
      const hStrip = new THREE.Mesh(new THREE.BoxGeometry(78, 0.04, 0.6), hazardMat);
      hStrip.position.set(0, 0.03, hz);
      hStrip.userData.isNonCollidable = true;
      arenaGroup.add(hStrip);
    });

    // 2. Open-Air Low Safety Parapet Walls with Hot Magenta Railings (Vertigo feel)
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x1c0b33, roughness: 0.5 });
    const railMat = new THREE.MeshBasicMaterial({ color: 0xff007f });

    const parapetDefs = [
      { x: 0, y: 1.0, z: -40, w: 80, h: 2.0, d: 2 },
      { x: 0, y: 1.0, z: 40, w: 80, h: 2.0, d: 2 },
      { x: -40, y: 1.0, z: 0, w: 2, h: 2.0, d: 80 },
      { x: 40, y: 1.0, z: 0, w: 2, h: 2.0, d: 80 }
    ];

    parapetDefs.forEach((w) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), parapetMat);
      mesh.position.set(w.x, w.y, w.z);
      arenaGroup.add(mesh);
      const b3 = new THREE.Box3().setFromObject(mesh);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      const rail = new THREE.Mesh(new THREE.BoxGeometry(w.w, 0.3, w.d), railMat);
      rail.position.set(w.x, w.y + w.h / 2 + 0.15, w.z);
      arenaGroup.add(rail);
    });

    // Distant Cyber Skyline Silhouette Skyscraper Towers (Outside arena for atmospheric depth)
    const distantMat = new THREE.MeshStandardMaterial({ color: 0x070310, roughness: 0.9 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff });
    const distantCoords = [
      { x: -75, z: -70, w: 24, h: 65, d: 24 },
      { x: 70, z: -80, w: 28, h: 80, d: 22 },
      { x: -80, z: 65, w: 22, h: 55, d: 26 },
      { x: 75, z: 75, w: 26, h: 70, d: 24 },
      { x: 0, z: -90, w: 34, h: 90, d: 24 },
      { x: -95, z: 0, w: 26, h: 75, d: 30 },
      { x: 95, z: 0, w: 28, h: 85, d: 28 }
    ];
    distantCoords.forEach((d) => {
      const distTower = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), distantMat);
      distTower.position.set(d.x, d.h / 2 - 25, d.z);
      distTower.userData.isNonCollidable = true;
      arenaGroup.add(distTower);

      // Glowing antenna beacon
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 6), windowMat);
      ant.position.set(d.x, d.h - 25 + 6, d.z);
      ant.userData.isNonCollidable = true;
      arenaGroup.add(ant);
    });

    // 3. Central Elevated Helipad Platform (y: 2.6m, surface at y: 3.2m, size: 24x24)
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x1b112c, roughness: 0.6, metalness: 0.4 });
    const helipad = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 24), heliMat);
    helipad.position.set(0, 2.6, 0);
    arenaGroup.add(helipad);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(helipad), isPlatform: true });

    // Helipad Access Ramps (East and West)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x241142, roughness: 0.5 });
    const rampEast = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 6.4), rampMat);
    rampEast.position.set(14.5, 1.6, 0);
    rampEast.rotation.z = -Math.PI / 8;
    arenaGroup.add(rampEast);

    const rampWest = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 6.4), rampMat);
    rampWest.position.set(-14.5, 1.6, 0);
    rampWest.rotation.z = Math.PI / 8;
    arenaGroup.add(rampWest);

    // Glowing Neon 'H' Symbol & Circular Landing Ring
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 10.0), new THREE.MeshBasicMaterial({ color: 0xff00aa }));
    hBar1.position.set(-3.6, 3.26, 0);
    arenaGroup.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 10.0), new THREE.MeshBasicMaterial({ color: 0xff00aa }));
    hBar2.position.set(3.6, 3.26, 0);
    arenaGroup.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 1.4), new THREE.MeshBasicMaterial({ color: 0xff00aa }));
    hCross.position.set(0, 3.26, 0);
    arenaGroup.add(hCross);

    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(8.5, 8.8, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f6ff, side: THREE.DoubleSide })
    );
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(0, 3.25, 0);
    heliRing.userData.isNonCollidable = true;
    arenaGroup.add(heliRing);

    // 4. Twin High-Rise Penthouse Sniper Towers (North & South ends at y = 6.5m)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x150928, roughness: 0.4, metalness: 0.5 });
    const towers = [
      { x: 0, z: -28, w: 16, h: 7.0, d: 12 },
      { x: 0, z: 28, w: 16, h: 7.0, d: 12 }
    ];
    towers.forEach((t) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), towerMat);
      tower.position.set(t.x, t.h / 2, t.z);
      arenaGroup.add(tower);
      const b3 = new THREE.Box3().setFromObject(tower);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3, isPlatform: true });

      // Roof Beacon Strobe
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0055 })
      );
      beacon.position.set(t.x, t.h + 0.5, t.z);
      arenaGroup.add(beacon);
    });

    // 5. Suspended Cross Skybridges Connecting Rooftops at y = 5.2m
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x241142, metalness: 0.7, roughness: 0.3 });
    const bridgeNS = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 40), bridgeMat);
    bridgeNS.position.set(0, 5.2, 0);
    arenaGroup.add(bridgeNS);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(bridgeNS), isPlatform: true });

    const bridgeEW = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 4.5), bridgeMat);
    bridgeEW.position.set(0, 5.2, 0);
    arenaGroup.add(bridgeEW);
    this.mapColliders.push({ box: new THREE.Box3().setFromObject(bridgeEW), isPlatform: true });

    // 6. Industrial HVAC Chiller Units & Air Ducts for CQB Cover
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x3b1d5a, roughness: 0.5, metalness: 0.3 });
    const ductCoords = [
      { x: -16, z: -12, w: 5, h: 2.8, d: 7 },
      { x: 16, z: 12, w: 5, h: 2.8, d: 7 },
      { x: -16, z: 12, w: 7, h: 2.8, d: 5 },
      { x: 16, z: -12, w: 7, h: 2.8, d: 5 },
      { x: -24, z: 0, w: 6, h: 3.2, d: 4 },
      { x: 24, z: 0, w: 6, h: 3.2, d: 4 }
    ];

    ductCoords.forEach((d) => {
      const duct = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), ductMat);
      duct.position.set(d.x, d.h / 2, d.z);
      arenaGroup.add(duct);
      const b3 = new THREE.Box3().setFromObject(duct);
      this.obstacleBoxes.push(b3);
      this.mapColliders.push({ box: b3 });

      // Chiller Fan Grille on top
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.1, 12),
        new THREE.MeshBasicMaterial({ color: 0x00f6ff, wireframe: true })
      );
      fan.position.set(d.x, d.h + 0.05, d.z);
      arenaGroup.add(fan);
    });

    // Yellow Industrial Construction Crane Perch
    const craneMast = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 15, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 })
    );
    craneMast.position.set(-24, 7.5, -24);
    arenaGroup.add(craneMast);
    const cb = new THREE.Box3().setFromObject(craneMast);
    this.obstacleBoxes.push(cb);
    this.mapColliders.push({ box: cb });

    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1.8, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 })
    );
    craneArm.position.set(-18, 14.5, -24);
    arenaGroup.add(craneArm);

    // 7. Cardinal Skyline Jump-Pads (Hot Magenta glow)
    this.jumpPadDefs = [
      { x: 0, z: 20, boostX: 0, boostZ: -14, boostY: 19 },
      { x: 0, z: -20, boostX: 0, boostZ: 14, boostY: 19 },
      { x: 20, z: 0, boostX: -14, boostZ: 0, boostY: 19 },
      { x: -20, z: 0, boostX: 14, boostZ: 0, boostY: 19 }
    ];

    this.jumpPadDefs.forEach((jp) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.8, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x241142, metalness: 0.8, roughness: 0.2 })
      );
      base.position.set(jp.x, 0.25, jp.z);
      arenaGroup.add(base);

      const padCore = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0xff00aa })
      );
      padCore.position.set(jp.x, 0.35, jp.z);
      arenaGroup.add(padCore);
      this.jumpPadMeshes.push(padCore);
    });

    // 8. Spawn Points
    this.spawnPoints = {
      blue: [
        { x: -26, y: 0.0, z: 24 }, { x: -22, y: 0.0, z: 26 },
        { x: -28, y: 0.0, z: 18 }, { x: -18, y: 0.0, z: 28 }
      ],
      red: [
        { x: 26, y: 0.0, z: -24 }, { x: 22, y: 0.0, z: -26 },
        { x: 28, y: 0.0, z: -18 }, { x: 18, y: 0.0, z: -28 }
      ]
    };

    // 9. Power-Up Stations (Synthwave Magenta theme)
    this.setupStandardPowerUps(arenaGroup, 0xff00aa);
  }

  setupStandardPowerUps(arenaGroup, themeColor = 0x00f6ff) {
    const powerUps = [
      { id: 'hp_center', type: 'health', x: 0, y: 4.5, z: 0 },
      { id: 'hp_south', type: 'health', x: 0, y: 1.5, z: -32 },
      { id: 'ammo_east', type: 'ammo', x: 26, y: 1.5, z: 0 },
      { id: 'ammo_west', type: 'ammo', x: -26, y: 1.5, z: 0 },
      { id: 'speed_ne', type: 'speed', x: 22, y: 1.5, z: 22 },
      { id: 'speed_sw', type: 'speed', x: -22, y: 1.5, z: -22 }
    ];

    powerUps.forEach((pu) => {
      const puGroup = new THREE.Group();
      puGroup.position.set(pu.x, pu.y, pu.z);

      let color = 0x10b981;
      let geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      if (pu.type === 'ammo') {
        color = 0xf59e0b;
        geo = new THREE.BoxGeometry(0.9, 0.6, 0.6);
      } else if (pu.type === 'speed') {
        color = themeColor;
        geo = new THREE.OctahedronGeometry(0.7);
      }

      const puMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.6, roughness: 0.2
      }));
      puGroup.add(puMesh);
      arenaGroup.add(puGroup);
      this.powerUpMeshes.set(pu.id, puGroup);
    });
  }

  getGroundHeight(x, z, currentY = 0) {
    let groundY = 0.0;
    if (this.currentMapId === 'vault') {
      // Central core platform bounds: x in [-11.0, 11.0], z in [-11.0, 11.0] at y = 2.5
      if (Math.abs(x) <= 11.0 && Math.abs(z) <= 11.0) {
        if (currentY >= 1.8) groundY = 2.5;
      }
      // High quantum bridge at y = 5.5
      if (Math.abs(z) <= 3.0 && Math.abs(x) <= 26) {
        if (currentY >= 4.5) groundY = 5.5;
      }
    } else if (this.currentMapId === 'rooftops') {
      // Helipad bounds: x in [-12.0, 12.0], z in [-12.0, 12.0] at y = 3.2
      if (Math.abs(x) <= 12.0 && Math.abs(z) <= 12.0) {
        if (currentY >= 2.0) groundY = 3.2;
      }
      // Helipad East Ramp
      if (z >= -3.2 && z <= 3.2 && x >= 11.0 && x <= 18.0) {
        const rampY = ((18.0 - x) / 7.0) * 3.2;
        groundY = Math.max(groundY, rampY);
      }
      // Helipad West Ramp
      if (z >= -3.2 && z <= 3.2 && x >= -18.0 && x <= -11.0) {
        const rampY = ((x - (-18.0)) / 7.0) * 3.2;
        groundY = Math.max(groundY, rampY);
      }
      // Skybridge bounds at y = 5.2
      if ((Math.abs(x) <= 2.6 && Math.abs(z) <= 20) || (Math.abs(z) <= 2.6 && Math.abs(x) <= 20)) {
        if (currentY >= 4.0) groundY = 5.2;
      }
      // Penthouse Sniper Towers at y = 7.0
      if (Math.abs(x) <= 8.0 && Math.abs(z) >= 22.0 && Math.abs(z) <= 34.0) {
        if (currentY >= 5.0) groundY = 7.0;
      }
    } else {
      // Warehouse: Central Catwalk Platform bounds & access ramps
      if (Math.abs(x) <= 16.2 && Math.abs(z) <= 7.2) {
        if (currentY >= 2.8) groundY = 4.0;
      }
      if (Math.abs(x) <= 3.2 && z >= 5.5 && z <= 16.5) {
        const t = (16.5 - z) / 11.0;
        groundY = Math.max(groundY, t * 4.0);
      }
      if (Math.abs(x) <= 3.2 && z >= -16.5 && z <= -5.5) {
        const t = (z - (-16.5)) / 11.0;
        groundY = Math.max(groundY, t * 4.0);
      }
    }
    return groundY;
  }

  // -------------------------------------------------------------
  // 6. FIRST-PERSON VIEWMODEL WEAPON ARSENAL (5 DISTINCT VOXEL MODELS)
  // -------------------------------------------------------------
  buildFirstPersonWeapon() {
    this.viewmodelGun = new THREE.Group();
    this.viewmodelMeshes = {};

    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.85 });
    const midMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
    const lightMetal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.9 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

    // 1. AR: PULSE BLASTER (Default Assault Rifle)
    const arGroup = new THREE.Group();
    const arBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.65), darkMetal);
    arGroup.add(arBody);
    const arStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff });
    const arStripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.55), arStripeMat);
    arStripe.position.y = 0.06;
    arGroup.add(arStripe);
    const arBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.32, 8), lightMetal);
    arBarrel.rotation.x = Math.PI / 2;
    arBarrel.position.set(0, 0.02, -0.44);
    arGroup.add(arBarrel);
    const arMag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.14), midMetal);
    arMag.position.set(0, -0.16, -0.05);
    arMag.rotation.x = 0.16;
    arGroup.add(arMag);

    // Open Holographic Reflex Sight with Unobstructed Aperture & Glowing Reticle
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.12), darkMetal);
    sightBase.position.set(0, 0.088, -0.10);
    arGroup.add(sightBase);

    // Left & Right Thin Upright Posts (leaves center 100% open for ADS view)
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.065, 0.035), darkMetal);
    postL.position.set(-0.038, 0.125, -0.10);
    arGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.065, 0.035), darkMetal);
    postR.position.set(0.038, 0.125, -0.10);
    arGroup.add(postR);

    // Top Hood
    const sightHood = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.012, 0.035), darkMetal);
    sightHood.position.set(0, 0.158, -0.10);
    arGroup.add(sightHood);

    // Transparent Holographic Glass Lens
    const glassLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.064, 0.055, 0.004),
      new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    glassLens.position.set(0, 0.125, -0.10);
    arGroup.add(glassLens);

    // Glowing Holographic Center Reticle Ring & Dot (Thin & Centered)
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const reticleRing = new THREE.Mesh(new THREE.RingGeometry(0.007, 0.011, 16), reticleMat);
    reticleRing.position.set(0, 0.125, -0.098);
    arGroup.add(reticleRing);

    const reticleDot = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 8), reticleMat);
    reticleDot.position.set(0, 0.125, -0.097);
    arGroup.add(reticleDot);

    const arStock = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.24), midMetal);
    arStock.position.set(0, -0.02, 0.32);
    arGroup.add(arStock);
    arGroup.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.62);
    this.viewmodelMeshes.ar = arGroup;
    this.viewmodelGun.add(arGroup);

    // Track dynamic viewmodel team color materials
    this.viewmodelStripes = [arStripeMat, reticleMat];

    // 2. SHOTGUN: VOXEL SHOTGUN (Close-Quarters Pump)
    const sgGroup = new THREE.Group();
    const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.62), darkMetal);
    sgGroup.add(sgBody);
    // Twin Heavy Barrels
    [-0.035, 0.035].forEach((bx) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.40, 8), lightMetal);
      b.rotation.x = Math.PI / 2;
      b.position.set(bx, 0.04, -0.42);
      sgGroup.add(b);
    });
    // Orange Pump Slide
    const sgPump = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.20), orangeMat);
    sgPump.position.set(0, -0.05, -0.22);
    sgGroup.userData.pumpSlide = sgPump;
    sgGroup.add(sgPump);
    // Heavy Stock & Ejection Port
    const sgStock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.30), midMetal);
    sgStock.position.set(0, -0.03, 0.32);
    sgGroup.add(sgStock);
    const sgEject = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    sgEject.position.set(0.08, 0.03, -0.02);
    sgGroup.add(sgEject);
    sgGroup.userData.muzzleOffset = new THREE.Vector3(0, 0.04, -0.64);
    sgGroup.visible = false;
    this.viewmodelMeshes.shotgun = sgGroup;
    this.viewmodelGun.add(sgGroup);

    // 3. SNIPER: CYBER SNIPER (Bolt-Action Heavy Railgun)
    const snGroup = new THREE.Group();
    const snBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.82), darkMetal);
    snGroup.add(snBody);
    // Ultra-long barrel with neon purple accents
    const snBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.65, 8), lightMetal);
    snBarrel.rotation.x = Math.PI / 2;
    snBarrel.position.set(0, 0.02, -0.62);
    snGroup.add(snBarrel);
    const snStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.70), new THREE.MeshBasicMaterial({ color: 0xbf00ff }));
    snStripe.position.set(0, 0.06, -0.15);
    snGroup.add(snStripe);
    const snMuzzle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.10), midMetal);
    snMuzzle.position.set(0, 0.02, -0.96);
    snGroup.add(snMuzzle);
    // High-Magnification Scope (open-ended hollow tube so sight picture is never blocked)
    const snScope = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.32, 16, 1, true), darkMetal);
    snScope.rotation.x = Math.PI / 2;
    snScope.position.set(0, 0.13, -0.12);
    snGroup.add(snScope);
    const snLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.044, 16),
      new THREE.MeshBasicMaterial({ color: 0xbf00ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    snLens.position.set(0, 0.13, -0.27);
    snGroup.add(snLens);
    // Folded Bipod
    [-0.05, 0.05].forEach((bx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.02), midMetal);
      leg.position.set(bx, -0.09, -0.52);
      leg.rotation.z = (bx < 0 ? 0.25 : -0.25);
      snGroup.add(leg);
    });
    snGroup.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -1.02);
    snGroup.visible = false;
    this.viewmodelMeshes.sniper = snGroup;
    this.viewmodelGun.add(snGroup);

    // 4. SMG: NEON SMG (Rapid Vector Bullpup)
    const smgGroup = new THREE.Group();
    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.46), darkMetal);
    smgGroup.add(smgBody);
    const smgStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.40), new THREE.MeshBasicMaterial({ color: 0xeab308 }));
    smgStripe.position.set(0, 0.05, 0.0);
    smgGroup.add(smgStripe);
    const smgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.065), midMetal);
    smgGrip.position.set(0, -0.14, -0.15);
    smgGroup.add(smgGrip);
    const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.075), midMetal);
    smgMag.position.set(0, -0.18, 0.10);
    smgMag.rotation.x = -0.12;
    smgGroup.add(smgMag);
    const smgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.20, 8), lightMetal);
    smgBarrel.rotation.x = Math.PI / 2;
    smgBarrel.position.set(0, 0.02, -0.32);
    smgGroup.add(smgBarrel);
    smgGroup.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.43);
    smgGroup.visible = false;
    this.viewmodelMeshes.smg = smgGroup;
    this.viewmodelGun.add(smgGroup);

    // 5. PISTOL: PLASMA PISTOL (Sidearm)
    const pstGroup = new THREE.Group();
    const pstBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.32), darkMetal);
    pstGroup.add(pstBody);
    const pstGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.20, 0.09), midMetal);
    pstGrip.position.set(0, -0.14, 0.07);
    pstGrip.rotation.x = -0.22;
    pstGroup.add(pstGrip);
    // Glowing Cyan Plasma Battery
    const pstBattery = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: 0x00f6ff }));
    pstBattery.position.set(0, 0.01, -0.04);
    pstGroup.add(pstBattery);
    const pstSlide = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.05, 0.30), lightMetal);
    pstSlide.position.set(0, 0.08, -0.06);
    pstGroup.add(pstSlide);
    const pstBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.10, 8), lightMetal);
    pstBarrel.rotation.x = Math.PI / 2;
    pstBarrel.position.set(0, 0.04, -0.20);
    pstGroup.add(pstBarrel);
    pstGroup.userData.muzzleOffset = new THREE.Vector3(0, 0.04, -0.26);
    pstGroup.visible = false;
    this.viewmodelMeshes.pistol = pstGroup;
    this.viewmodelGun.add(pstGroup);

    // Dynamic Muzzle Light & Flash Mesh (attached to active muzzle position)
    this.muzzleLight = new THREE.PointLight(0x00f6ff, 0, 12);
    this.muzzleLight.position.set(0, 0.02, -0.65);
    this.viewmodelGun.add(this.muzzleLight);

    const flashGeo = new THREE.OctahedronGeometry(0.12, 0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.02, -0.68);
    this.viewmodelGun.add(this.muzzleFlashMesh);

    this.viewmodelGun.position.copy(this.viewmodelBasePos);
    this.camera.add(this.viewmodelGun);
    this.scene.add(this.camera);
  }

  // -------------------------------------------------------------
  // 7. PROCEDURAL 3D VOXEL MASCOT MODEL (FOR OTHER COMBATANTS)
  // -------------------------------------------------------------
  createMascotMesh(entity) {
    const mascot = new THREE.Group();

    // Team or FFA Color
    let suitColor = 0x2563eb;
    if (this.gameMode === 'tdm') {
      suitColor = entity.team === 'red' ? 0xff0055 : 0x00f6ff;
    } else {
      suitColor = entity.isBot ? 0xf59e0b : 0x00f6ff;
    }

    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.4, metalness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    // 1. Torso (bodyMesh)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.5), suitMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    mascot.add(torso);

    // 2. Head Group (Helmet + Glass Visor + Cute '> <' Eyes)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.8, 0);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), suitMat);
    headGroup.add(helmet);

    const eyeColor = (entity.team === 'red') ? 0xff0055 : 0x00f6ff;
    const visorMat = new THREE.MeshStandardMaterial({
      color: eyeColor,
      emissive: eyeColor,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9
    });
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI), visorMat);
    visor.position.set(0, 0, 0.2);
    visor.rotation.y = -Math.PI / 2;
    headGroup.add(visor);

    // Glowing Neon '> <' Cyber Visor Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    // Left eye '>'
    const eyeL1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), eyeMat);
    eyeL1.position.set(-0.14, 0.025, 0.42);
    eyeL1.rotation.z = Math.PI / 4;
    headGroup.add(eyeL1);

    const eyeL2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), eyeMat);
    eyeL2.position.set(-0.14, -0.025, 0.42);
    eyeL2.rotation.z = -Math.PI / 4;
    headGroup.add(eyeL2);

    // Right eye '<'
    const eyeR1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), eyeMat);
    eyeR1.position.set(0.14, 0.025, 0.42);
    eyeR1.rotation.z = -Math.PI / 4;
    headGroup.add(eyeR1);

    const eyeR2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), eyeMat);
    eyeR2.position.set(0.14, -0.025, 0.42);
    eyeR2.rotation.z = Math.PI / 4;
    headGroup.add(eyeR2);

    mascot.userData.eyes = { eyeL1, eyeL2, eyeR1, eyeR2 };
    mascot.add(headGroup);

    // 3. Legs (Hip-Pivoted at y = 0.8)
    const legGeo = new THREE.BoxGeometry(0.28, 0.8, 0.28);

    const legGroupL = new THREE.Group();
    legGroupL.position.set(-0.25, 0.8, 0);
    const legMeshL = new THREE.Mesh(legGeo, darkMat);
    legMeshL.position.set(0, -0.4, 0);
    legGroupL.add(legMeshL);
    mascot.add(legGroupL);

    const legGroupR = new THREE.Group();
    legGroupR.position.set(0.25, 0.8, 0);
    const legMeshR = new THREE.Mesh(legGeo, darkMat);
    legMeshR.position.set(0, -0.4, 0);
    legGroupR.add(legMeshR);
    mascot.add(legGroupR);

    // 4. Arms with Cyber Voxel Gloves (Shoulder-Pivoted at y = 1.35)
    const armGroupL = new THREE.Group();
    armGroupL.position.set(-0.48, 1.35, 0);
    const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.76, 0.22), suitMat);
    armMeshL.position.set(0, -0.38, 0);
    armGroupL.add(armMeshL);
    const handMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.23), darkMat);
    handMeshL.position.set(0, -0.68, 0);
    armGroupL.add(handMeshL);
    // Two-handed front support stance
    armGroupL.rotation.set(-0.88, 0.28, 0.65);
    mascot.add(armGroupL);

    const armGroupR = new THREE.Group();
    armGroupR.position.set(0.48, 1.35, 0);
    const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), suitMat);
    armMeshR.position.set(0, -0.36, 0);
    armGroupR.add(armMeshR);
    const handMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.23), darkMat);
    handMeshR.position.set(0, -0.64, 0);
    armGroupR.add(handMeshR);
    // Two-handed rear pistol grip stance
    armGroupR.rotation.set(-0.65, -0.18, -0.42);
    mascot.add(armGroupR);

    // 5. Upper Torso & Dynamic Aiming Weapon Pivot (heldWeapon)
    const weaponPivot = new THREE.Group();
    weaponPivot.position.set(0, 1.10, 0.05);
    mascot.add(weaponPivot);

    // Authentic Two-Handed Cyber Assault Rifle Model
    const rifleGroup = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.85 });
    const darkGunMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const accentMat = new THREE.MeshBasicMaterial({ color: suitColor });

    // Main Receiver
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.58), gunMat);
    rBody.position.set(0.18, 0.0, 0.28);
    rifleGroup.add(rBody);

    // Glowing Neon Accent Stripe
    const rStrip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.50), accentMat);
    rStrip.position.set(0.18, 0.07, 0.28);
    rifleGroup.add(rStrip);

    // Buttstock (resting near shoulder)
    const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.26), darkGunMat);
    rStock.position.set(0.20, 0.02, 0.0);
    rifleGroup.add(rStock);

    // Pistol Grip (grasped firmly by right hand)
    const rGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.20, 0.09), darkGunMat);
    rGrip.position.set(0.19, -0.14, 0.20);
    rGrip.rotation.x = -0.2;
    rifleGroup.add(rGrip);

    // Curved Ammo Magazine
    const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.10), darkGunMat);
    rMag.position.set(0.18, -0.18, 0.32);
    rMag.rotation.x = 0.15;
    rifleGroup.add(rMag);

    // Foregrip / Handguard (supported from below by left hand)
    const rHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.10, 0.26), darkGunMat);
    rHandguard.position.set(0.12, -0.02, 0.44);
    rifleGroup.add(rHandguard);

    // Fluted Barrel
    const rBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
    );
    rBarrel.rotation.x = Math.PI / 2;
    rBarrel.position.set(0.15, 0.0, 0.70);
    rifleGroup.add(rBarrel);

    // Muzzle Brake
    const rMuzzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.1 })
    );
    rMuzzle.rotation.x = Math.PI / 2;
    rMuzzle.position.set(0.15, 0.0, 0.88);
    rifleGroup.add(rMuzzle);

    // Holographic Reflex Sight
    const rSight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.14), gunMat);
    rSight.position.set(0.18, 0.11, 0.28);
    rifleGroup.add(rSight);
    const rReticle = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 0.85 })
    );
    rReticle.position.set(0.18, 0.11, 0.32);
    rifleGroup.add(rReticle);

    // 3D Muzzle Flash Starburst Mesh (flashes on remote fire)
    const remoteFlash = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 })
    );
    remoteFlash.position.set(0.15, 0.0, 0.94);
    rifleGroup.add(remoteFlash);

    weaponPivot.add(rifleGroup);

    // 6. Thruster Jetpack on back
    const jetpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), darkMat);
    jetpack.position.set(0, 1.1, -0.35);
    mascot.add(jetpack);

    // 7. Translucent Glowing Spherical Spawn Shield Bubble (3s Invulnerability)
    const shieldGeo = new THREE.SphereGeometry(1.35, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: suitColor,
      emissive: suitColor,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
      side: THREE.DoubleSide
    });
    const shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    shieldBubble.position.set(0, 1.1, 0);
    shieldBubble.visible = false;
    mascot.add(shieldBubble);

    if (!entity.isLobby) {
      // 8. Floating 3D Overhead Billboard (Canvas Name & Health Bar)
      const billboard = this.createOverheadBillboard(entity);
      billboard.position.set(0, 2.6, 0);
      mascot.add(billboard);
      mascot.userData.billboard = billboard;

      // 9. Dedicated Raycast HitBox for crisp, reliable hit registration (invisible but raycastable)
      const hitBoxGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.3, 8);
      const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
      hitBox.position.set(0, 1.15, 0);
      hitBox.userData.isHitBox = true;
      hitBox.userData.entityId = entity.id;
      mascot.add(hitBox);
      mascot.userData.hitBox = hitBox;

      this.scene.add(mascot);
    }

    mascot.userData.bodyMesh = torso;
    mascot.userData.headGroup = headGroup;
    mascot.userData.helmet = helmet;
    mascot.userData.visor = visor;
    mascot.userData.armL = armGroupL;
    mascot.userData.armR = armGroupR;
    mascot.userData.legL = legGroupL;
    mascot.userData.legR = legGroupR;
    mascot.userData.heldWeapon = rifleGroup;
    mascot.userData.weaponPivot = weaponPivot;
    mascot.userData.muzzleFlash = remoteFlash;
    mascot.userData.shieldBubble = shieldBubble;
    mascot.userData.suitMat = suitMat;
    mascot.userData.accentMat = accentMat;
    mascot.userData.visorMat = visorMat;
    mascot.userData.eyeMat = eyeMat;
    mascot.userData.entity = entity;

    return mascot;
  }

  createOverheadBillboard(entity) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    this.renderBillboardCanvas(ctx, entity);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1.0);
    sprite.userData = { canvas, ctx, texture };
    return sprite;
  }

  renderBillboardCanvas(ctx, entity) {
    ctx.clearRect(0, 0, 256, 64);

    // Tag text: [TEAM/BOT] Name
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 8, 236, 48);

    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'center';

    let tag = entity.isBot ? '[BOT] ' : '';
    let col = '#00f6ff';
    if (entity.team === 'red') col = '#ff0055';
    else if (entity.team === 'blue') col = '#00f6ff';
    else if (entity.isBot) col = '#f59e0b';

    ctx.fillStyle = col;
    ctx.fillText(`${tag}${entity.name || 'Combatant'}`, 128, 30);

    // Health Bar
    const hp = Math.max(0, entity.health || 100);
    const pct = hp / 100;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 38, 216, 12);

    ctx.fillStyle = pct > 0.4 ? '#10b981' : '#ff0055';
    ctx.fillRect(20, 38, 216 * pct, 12);
  }

  updateOverheadBillboard(billboard, entity) {
    if (!billboard || !billboard.userData) return;
    const { ctx, texture } = billboard.userData;
    this.renderBillboardCanvas(ctx, entity);
    texture.needsUpdate = true;
  }

  updateMascotTeamColor(mascot, team) {
    if (!mascot || !mascot.userData) return;
    const isRed = (team === 'red');
    const suitColor = isRed ? 0xff0055 : 0x00f6ff;
    const eyeColor = isRed ? 0xff0055 : 0x00f6ff;
    mascot.userData.team = team;

    if (mascot.userData.suitMat) {
      mascot.userData.suitMat.color.setHex(suitColor);
    }
    if (mascot.userData.accentMat) {
      mascot.userData.accentMat.color.setHex(suitColor);
    }
    if (mascot.userData.visorMat) {
      mascot.userData.visorMat.color.setHex(suitColor);
      mascot.userData.visorMat.emissive.setHex(suitColor);
    }
    if (mascot.userData.eyeMat) {
      mascot.userData.eyeMat.color.setHex(eyeColor);
    }
    if (mascot.userData.billboard) {
      this.updateOverheadBillboard(mascot.userData.billboard, {
        ...(mascot.userData.entity || {}),
        team
      });
    }
  }

  updatePlayerTeamVisuals() {
    const isRed = (this.player.team === 'red');
    const teamHex = isRed ? 0xff0055 : 0x00f6ff;
    const teamColorCss = isRed ? '#ff0055' : '#00f6ff';

    // 1. Update weapon viewmodel stripes and reticles
    if (this.viewmodelStripes && Array.isArray(this.viewmodelStripes)) {
      this.viewmodelStripes.forEach((mat) => {
        if (mat && mat.color) mat.color.setHex(teamHex);
      });
    }

    // 2. Update lobby mascot
    if (this.lobbyMascot) {
      this.updateMascotTeamColor(this.lobbyMascot, this.player.team);
    }

    // 3. Update HUD team accents if present
    const hudTeam = document.getElementById('hud-team-indicator');
    if (hudTeam) {
      hudTeam.textContent = isRed ? 'TEAM RED' : 'TEAM BLUE';
      hudTeam.style.color = teamColorCss;
    }
    this.renderMascotAvatar?.();
  }

  // -------------------------------------------------------------
  // 8. 2D CANVAS MASCOT AVATAR RADAR (LOBBY PREVIEW)
  // -------------------------------------------------------------
  initMascotAvatarCanvas() {
    const canvas = document.getElementById('mascot-avatar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
    bgGrad.addColorStop(0, '#0d1f40');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Halo Ring
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 2, 38, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glass astronaut bubble helmet
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 2, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 246, 255, 0.16)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f6ff';
    ctx.stroke();

    // Helmet shine reflection
    ctx.beginPath();
    ctx.arc(w / 2 - 14, h / 2 - 16, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // Mascot face: chat bubble shape
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    const bx = w / 2 - 18;
    const by = h / 2 - 15;
    const bw = 36;
    const bh = 25;
    ctx.roundRect(bx, by, bw, bh, 7);
    ctx.fill();

    // Chat bubble tail
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, by + bh);
    ctx.lineTo(w / 2 - 9, by + bh + 7);
    ctx.lineTo(w / 2 + 2, by + bh);
    ctx.fillStyle = '#2563eb';
    ctx.fill();

    // Eyes: Glowing cyan `> <` anime visor expression
    ctx.strokeStyle = '#00f6ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 6;

    // Left eye `>`
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h / 2 - 6);
    ctx.lineTo(w / 2 - 6, h / 2 - 2);
    ctx.lineTo(w / 2 - 12, h / 2 + 2);
    ctx.stroke();

    // Right eye `<`
    ctx.beginPath();
    ctx.moveTo(w / 2 + 12, h / 2 - 6);
    ctx.lineTo(w / 2 + 6, h / 2 - 2);
    ctx.lineTo(w / 2 + 12, h / 2 + 2);
    ctx.stroke();

    // Mouth
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 3, 4, 0, Math.PI);
    ctx.fillStyle = '#ff66aa';
    ctx.fill();
  }

  // -------------------------------------------------------------
  // 9. UI EVENT LISTENERS & MATCHMAKING INTERACTIONS
  // -------------------------------------------------------------
  initUIEventListeners() {
    const nickInput = document.getElementById('player-nickname');

    // Quick Play: TDM
    document.getElementById('btn-quick-tdm')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const name = nickInput?.value.trim() || 'CyberPilot';
      this.socket.emit('quickPlay', {
        mode: 'tdm',
        mapId: this.selectedMapId || 'warehouse',
        playerName: name
      });
    });

    // Quick Play: BR
    document.getElementById('btn-quick-br')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const name = nickInput?.value.trim() || 'CyberPilot';
      this.socket.emit('quickPlay', {
        mode: 'br',
        mapId: this.selectedMapId || 'warehouse',
        playerName: name
      });
    });

    // Open Create Room Modal
    document.getElementById('btn-open-create-room')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      document.getElementById('modal-create-room')?.classList.remove('hidden');
    });

    // Close Create Room Modal
    document.getElementById('btn-close-create-modal')?.addEventListener('click', () => {
      document.getElementById('modal-create-room')?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-create')?.addEventListener('click', () => {
      document.getElementById('modal-create-room')?.classList.add('hidden');
    });

    // Modal Mode Tab Switcher
    let selectedCreateMode = 'tdm';
    document.querySelectorAll('.mode-tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab-btn').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        selectedCreateMode = tab.dataset.mode;
        sounds.init();
        sounds.playClick();
      });
    });

    // Confirm Create Room
    document.getElementById('btn-confirm-create')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const name = nickInput?.value.trim() || 'CyberPilot';
      const rName = document.getElementById('room-name-input')?.value.trim() || 'Cyber Arena';
      const pass = document.getElementById('room-pass-input')?.value.trim() || '';
      const fillBots = document.getElementById('room-fill-bots')?.checked;
      const chosenMap = document.getElementById('room-map-select')?.value || this.selectedMapId || 'warehouse';

      this.socket.emit('createRoom', {
        name: rName,
        mode: selectedCreateMode,
        mapId: chosenMap,
        password: pass,
        fillBots,
        playerName: name
      });

      document.getElementById('modal-create-room')?.classList.add('hidden');
    });

    // Join by Room Code
    document.getElementById('btn-join-by-code')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const code = document.getElementById('join-room-code-input')?.value.trim();
      if (!code) return alert('Please enter a room code.');
      const name = nickInput?.value.trim() || 'CyberPilot';
      this.socket.emit('joinRoom', { roomId: code, playerName: name });
    });

    // Refresh Rooms List
    document.getElementById('btn-refresh-rooms')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.refreshRoomsList();
    });

    // Staging: Switch Team (Blue/Red)
    document.getElementById('btn-switch-blue')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.player.team = 'blue';
      this.updatePlayerTeamVisuals();
      this.socket.emit('switchTeam', { team: 'blue' });
    });

    document.getElementById('btn-switch-red')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.player.team = 'red';
      this.updatePlayerTeamVisuals();
      this.socket.emit('switchTeam', { team: 'red' });
    });

    // Staging: Copy Shareable Link
    document.getElementById('btn-copy-room-link')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      if (!this.currentRoom) return;
      const url = `${window.location.origin}${window.location.pathname}?room=${this.currentRoom.roomId}`;
      navigator.clipboard.writeText(url).then(() => {
        alert(`Room link copied to clipboard!\n${url}`);
      }).catch(() => {
        alert(`Room Code: ${this.currentRoom.roomId}`);
      });
    });

    // Staging: Launch Match (Host Only)
    const onLaunchMatch = (e) => {
      e?.preventDefault();
      sounds.init();
      sounds.playClick();
      const launchBtn = document.getElementById('btn-launch-match');
      if (launchBtn) {
        launchBtn.classList.add('loading');
        const textSpan = launchBtn.querySelector('.launch-text');
        if (textSpan) textSpan.textContent = 'LAUNCHING...';
      }
      this.socket.emit('startMatch');
    };
    const launchMatchBtn = document.getElementById('btn-launch-match');
    launchMatchBtn?.addEventListener('click', onLaunchMatch);
    launchMatchBtn?.addEventListener('touchend', onLaunchMatch);

    // Staging: Leave Room
    document.getElementById('btn-leave-staging')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.socket.emit('leaveRoom');
    });

    // Map Selection Modal Trigger & Logic
    const mapMeta = {
      warehouse: { title: 'CYBER WAREHOUSE', sub: 'Kirka Factory • Symmetrical 4v4 TDM' },
      vault: { title: 'DLICOM NODE: DATA VAULT', sub: 'Encrypted Core • Blockchain Processor' },
      rooftops: { title: 'NEON ROOFTOPS', sub: 'Synthwave Skyline • Skybridges & Cranes' }
    };

    const handleSelectMap = (mapId) => {
      if (!mapMeta[mapId]) return;
      this.selectedMapId = mapId;
      sounds.init();
      sounds.playClick();

      // Update badge in bottom-left anchor
      const titleEl = document.getElementById('lobby-selected-map-title');
      const subEl = document.getElementById('lobby-selected-map-sub');
      if (titleEl) titleEl.textContent = mapMeta[mapId].title;
      if (subEl) subEl.textContent = mapMeta[mapId].sub;

      // Update card visual active states in modal
      document.querySelectorAll('.map-big-card').forEach((c) => {
        c.classList.toggle('active', c.dataset.map === mapId);
      });

      // Synchronize create-room select
      const roomMapSelect = document.getElementById('room-map-select');
      if (roomMapSelect) roomMapSelect.value = mapId;

      // If host in staging room, broadcast update
      if (this.currentRoom && this.currentRoom.hostId === this.selfId) {
        this.socket.emit('selectMap', { mapId });
      }

      // Pre-build arena geometry in background
      if (!this.inMatch) {
        this.buildMap(mapId);
        if (this.arenaGroup) this.arenaGroup.visible = false;
      }

      document.getElementById('modal-map-select')?.classList.add('hidden');
    };

    document.getElementById('lobby-map-selector')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      document.getElementById('modal-map-select')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-map-modal')?.addEventListener('click', () => {
      document.getElementById('modal-map-select')?.classList.add('hidden');
    });

    document.querySelectorAll('.map-big-card').forEach((card) => {
      card.addEventListener('click', () => {
        handleSelectMap(card.dataset.map);
      });
    });

    document.querySelectorAll('.btn-choose-map').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectMap(btn.dataset.map);
      });
    });

    // Mode Selection Modal Trigger & Logic
    const handleSelectMode = (mode) => {
      this.selectedMode = (mode === 'br' ? 'br' : 'tdm');
      sounds.init();
      sounds.playClick();

      const badgeEl = document.getElementById('lobby-selected-mode-badge');
      const titleEl = document.getElementById('lobby-selected-mode-title');
      const subEl = document.getElementById('lobby-selected-mode-sub');

      if (this.selectedMode === 'br') {
        if (badgeEl) { badgeEl.textContent = '10-FFA'; badgeEl.className = 'mode-type-badge br'; }
        if (titleEl) titleEl.textContent = 'BATTLE ROYALE';
        if (subEl) subEl.textContent = '10-Player Survival • Shrinking Storm • Permadeath';
      } else {
        if (badgeEl) { badgeEl.textContent = '4v4 TDM'; badgeEl.className = 'mode-type-badge tdm'; }
        if (titleEl) titleEl.textContent = 'TEAM DEATHMATCH';
        if (subEl) subEl.textContent = 'Blue vs Red • 40 Kills • Fast Respawns';
      }

      document.querySelectorAll('.mode-big-card').forEach((c) => {
        c.classList.toggle('active', c.dataset.mode === this.selectedMode);
      });

      document.getElementById('modal-mode-select')?.classList.add('hidden');
    };

    document.getElementById('lobby-mode-selector')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      document.getElementById('modal-mode-select')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-mode-modal')?.addEventListener('click', () => {
      document.getElementById('modal-mode-select')?.classList.add('hidden');
    });

    document.querySelectorAll('.mode-big-card').forEach((card) => {
      card.addEventListener('click', () => {
        handleSelectMode(card.dataset.mode);
      });
    });

    document.querySelectorAll('.btn-choose-mode').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectMode(btn.dataset.mode);
      });
    });

    // Giant High-Contrast START GAME Button (PUBG / Free Fire CTA)
    document.getElementById('btn-giant-start')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const name = nickInput?.value.trim() || 'CyberPilot';

      if (this.selectedMode === 'br') {
        const lobbyScreen = document.getElementById('lobbyScreen');
        if (lobbyScreen) lobbyScreen.style.display = 'none';
        document.getElementById('lobby-hub')?.classList.add('hidden');
        document.getElementById('staging-screen')?.classList.add('hidden');

        const inGameHUD = document.getElementById('inGameHUD');
        if (inGameHUD) inGameHUD.style.display = 'block';
        const hudOverlay = document.getElementById('hud-overlay');
        if (hudOverlay) {
          hudOverlay.classList.remove('hidden');
          hudOverlay.style.display = 'block';
          hudOverlay.classList.add('hud-staging-mode');
        }

        const cdBanner = document.getElementById('br-countdown-banner');
        const cdText = document.getElementById('br-countdown-text');
        if (cdBanner && cdText) {
          cdBanner.classList.remove('hidden');
          cdBanner.style.display = 'block';
          cdText.textContent = 'PREPARING AIRDROP: 10s';
        }
        sounds.playCountdownBeep();
      }

      this.socket.emit('quickPlay', {
        mode: this.selectedMode || 'tdm',
        mapId: this.selectedMapId || 'warehouse',
        playerName: name
      });
    });

    // 360-Degree Interactive Horizontal Drag-to-Rotate Mascot
    const mascotVp = document.getElementById('lobby-mascot-viewport');
    if (mascotVp) {
      mascotVp.addEventListener('pointerdown', (e) => {
        this.isDraggingMascot = true;
        this.dragStartX = e.clientX;
        this.dragStartYaw = this.lobbyMascotYaw;
        mascotVp.classList.add('grabbing');
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isDraggingMascot) return;
        const dx = e.clientX - this.dragStartX;
        this.lobbyMascotYaw = this.dragStartYaw + dx * 0.012;
      });

      const endMascotDrag = () => {
        this.isDraggingMascot = false;
        mascotVp.classList.remove('grabbing');
      };
      window.addEventListener('pointerup', endMascotDrag);
      window.addEventListener('pointercancel', endMascotDrag);
    }

    // Weapon Selection in Lobby (Synchronizes 3D Mascot Held Weapon)
    document.querySelectorAll('.weapon-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.weapon-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const weaponKey = card.dataset.weapon;
        this.switchWeapon(weaponKey);
        this.updateLobbyHeldWeapon(weaponKey);
        this.updateWeaponTelemetry(weaponKey);
        sounds.init();
        sounds.playClick();
      });
    });

    // Random Callsign Generator
    const callsignList = [
      'CyberPhantom', 'VoxelSpectre', 'ApexTitan', 'VoltSniper', 'NeonViper',
      'NovaStrike', 'ZeroPulse', 'GlitchGhost', 'HyperBlade', 'QuantumDrift',
      'ShadowByte', 'ChronoRift', 'AeroPilot', 'VectorFury', 'HexEnforcer'
    ];
    document.getElementById('btn-random-name')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      if (nickInput) {
        nickInput.value = callsignList[Math.floor(Math.random() * callsignList.length)];
      }
    });

    // Controls Tabs Switcher
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tabKey = btn.dataset.tab;
        document.querySelectorAll('.controls-pane').forEach((p) => p.classList.remove('active'));
        document.getElementById(`controls-pane-${tabKey}`)?.classList.add('active');
        sounds.init();
        sounds.playClick();
      });
    });

    // Audio Mute Toggle
    const btnAudio = document.getElementById('btn-lobby-audio');
    btnAudio?.addEventListener('click', () => {
      sounds.init();
      sounds.masterMuted = !sounds.masterMuted;
      const lbl = btnAudio.querySelector('.btn-lbl');
      const icon = btnAudio.querySelector('.btn-icon');
      if (sounds.masterMuted) {
        if (lbl) lbl.textContent = 'AUDIO: MUTED';
        if (icon) icon.textContent = '🔇';
        btnAudio.style.borderColor = 'rgba(255, 0, 85, 0.4)';
        btnAudio.style.color = '#ff0055';
        sounds.stopLobbyMusic(true);
      } else {
        if (lbl) lbl.textContent = 'AUDIO: ON';
        if (icon) icon.textContent = '🔊';
        btnAudio.style.borderColor = 'rgba(0, 246, 255, 0.3)';
        btnAudio.style.color = '#94a3b8';
        sounds.playClick();
        if (!this.inMatch) {
          sounds.playLobbyMusic(true);
        }
      }
    });

    // Fullscreen Toggle
    document.getElementById('btn-lobby-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    });

    // Spectator Prev/Next Target
    document.getElementById('btn-spec-prev')?.addEventListener('click', () => {
      this.socket.emit('cycleSpectate');
    });
    document.getElementById('btn-spec-next')?.addEventListener('click', () => {
      this.socket.emit('cycleSpectate');
    });
    document.getElementById('btn-spec-leave')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.returnToLobby();
    });

    // Return to Lobby after Match End
    document.getElementById('btn-end-return-lobby')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.returnToLobby();
    });

    // Rematch / Play Again after Match End
    document.getElementById('btn-end-rematch')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.triggerRematch();
    });

    // Death / Elimination Screen Action Buttons (Phase 4)
    document.getElementById('btn-death-spectate')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      const deathScreen = document.getElementById('deathScreen');
      if (deathScreen) {
        deathScreen.style.display = 'none';
        deathScreen.classList.add('hidden');
      }
      this.isSpectating = true;
      document.getElementById('spectator-overlay')?.classList.remove('hidden');
      this.socket.emit('cycleSpectate');
    });

    document.getElementById('btn-death-return-lobby')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.returnToLobby();
    });

    document.getElementById('btn-death-rematch')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.triggerRematch();
    });

    // In-Game Medic Quick Slots Tray Click Listeners
    document.getElementById('btn-medic-bandage')?.addEventListener('click', () => {
      sounds.init();
      this.useMedicItem('bandage');
    });
    document.getElementById('btn-medic-medkit')?.addEventListener('click', () => {
      sounds.init();
      this.useMedicItem('medkit');
    });
    document.getElementById('btn-medic-battery')?.addEventListener('click', () => {
      sounds.init();
      this.useMedicItem('shield_battery');
    });
  }

  updateWeaponTelemetry(wKey) {
    const stats = {
      ar: { dmg: '24 DMG', dmgBar: '55%', rof: '600 RPM', rofBar: '85%', acc: 'HIGH ACCURACY', accBar: '75%', mag: '30 / 120', magBar: '70%' },
      shotgun: { dmg: '12x8 DMG', dmgBar: '85%', rof: '85 RPM', rofBar: '30%', acc: '8-PELLET CQB', accBar: '35%', mag: '8 / 32', magBar: '40%' },
      sniper: { dmg: '85 DMG', dmgBar: '98%', rof: '45 RPM', rofBar: '15%', acc: 'PINPOINT ZOOM', accBar: '98%', mag: '5 / 20', magBar: '25%' }
    };
    const s = stats[wKey];
    if (!s) return;
    document.getElementById('stat-dmg-val').textContent = s.dmg;
    document.getElementById('stat-dmg-bar').style.width = s.dmgBar;
    document.getElementById('stat-rof-val').textContent = s.rof;
    document.getElementById('stat-rof-bar').style.width = s.rofBar;
    document.getElementById('stat-acc-val').textContent = s.acc;
    document.getElementById('stat-acc-bar').style.width = s.accBar;
    document.getElementById('stat-mag-val').textContent = s.mag;
    document.getElementById('stat-mag-bar').style.width = s.magBar;
  }

  refreshRoomsList() {
    this.socket.emit('getRoomsList', (rooms) => {
      const container = document.getElementById('room-list-items');
      const emptyPlaceholder = document.getElementById('room-list-empty');
      if (!container) return;

      container.innerHTML = '';
      if (!rooms || rooms.length === 0) {
        if (emptyPlaceholder) emptyPlaceholder.style.display = 'flex';
        return;
      }

      if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';

      rooms.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'room-item-row';
        const modeClass = r.mode === 'br' ? 'br' : 'tdm';
        const modeLabel = r.mode === 'br' ? 'BATTLE ROYALE' : '4v4 TDM';

        row.innerHTML = `
          <div class="ri-left">
            <span class="ri-mode-pill ${modeClass}">${modeLabel}</span>
            <span class="ri-name">${r.name}</span>
            <span class="ri-code">[${r.id}]</span>
          </div>
          <div class="ri-right">
            <span class="ri-count">${r.playerCount} / ${r.maxPlayers} PLAYERS</span>
            <button type="button" class="btn-join-room-row" data-id="${r.id}">JOIN</button>
          </div>
        `;

        row.querySelector('.btn-join-room-row')?.addEventListener('click', () => {
          sounds.init();
          sounds.playClick();
          const name = document.getElementById('player-nickname')?.value.trim() || 'CyberPilot';
          this.socket.emit('joinRoom', { roomId: r.id, playerName: name });
        });

        container.appendChild(row);
      });
    });

    // In-Game Pause Menu Events
    document.getElementById('btn-resume-match')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.resumeMatch();
    });

    document.getElementById('btn-close-pause-modal')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.resumeMatch();
    });

    document.getElementById('btn-leave-match')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.leaveMatchToLobby();
    });

    document.getElementById('mbtn-pause')?.addEventListener('click', () => {
      sounds.init();
      sounds.playClick();
      this.openPauseMenu();
    });

    const btnPauseAudio = document.getElementById('btn-pause-audio-toggle');
    btnPauseAudio?.addEventListener('click', () => {
      sounds.init();
      sounds.masterMuted = !sounds.masterMuted;
      btnPauseAudio.textContent = sounds.masterMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
      btnPauseAudio.classList.toggle('off', sounds.masterMuted);
    });

    const pauseSensSlider = document.getElementById('pause-sensitivity-slider');
    const pauseSensVal = document.getElementById('pause-sensitivity-val');
    if (pauseSensSlider && pauseSensVal) {
      pauseSensSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        pauseSensVal.textContent = v.toFixed(1);
        this.mouseSensitivity = 0.00045 * v;
      });
    }
  }

  showStagingScreen(room) {
    document.getElementById('lobby-hub')?.classList.add('hidden');
    document.getElementById('modal-create-room')?.classList.add('hidden');
    document.getElementById('staging-screen')?.classList.remove('hidden');

    document.getElementById('staging-room-code').textContent = room.roomId;
    document.getElementById('staging-room-name').textContent = room.name;
    const mapNames = {
      warehouse: 'CYBER WAREHOUSE',
      vault: 'DATA VAULT',
      rooftops: 'NEON ROOFTOPS'
    };
    const mapName = mapNames[room.mapId] || 'CYBER WAREHOUSE';
    document.getElementById('staging-mode-pill').textContent = `${room.mode === 'br' ? 'BATTLE ROYALE (10 COMBATANTS)' : '4v4 TEAM DEATHMATCH'} • [${mapName}]`;

    // Show appropriate layout
    if (room.mode === 'br') {
      document.getElementById('staging-tdm-layout')?.classList.add('hidden');
      document.getElementById('staging-br-layout')?.classList.remove('hidden');
    } else {
      document.getElementById('staging-tdm-layout')?.classList.remove('hidden');
      document.getElementById('staging-br-layout')?.classList.add('hidden');
    }

    this.renderStagingSlots(room);
  }

  renderStagingSlots(room) {
    if (room.mapId) {
      this.selectedMapId = room.mapId;
      const mapNames = {
        warehouse: 'CYBER WAREHOUSE',
        vault: 'DATA VAULT',
        rooftops: 'NEON ROOFTOPS'
      };
      const mapName = mapNames[room.mapId] || 'CYBER WAREHOUSE';
      const pill = document.getElementById('staging-mode-pill');
      if (pill) {
        pill.textContent = `${room.mode === 'br' ? 'BATTLE ROYALE (10 COMBATANTS)' : '4v4 TEAM DEATHMATCH'} • [${mapName}]`;
      }
    }

    const myId = this.selfId || this.socket?.id;
    const isHost = (room.hostId === myId) || (!room.hostId) || (room.players && room.players.length === 1);
    const launchBtn = document.getElementById('btn-launch-match');
    const statusMsg = document.getElementById('staging-status-msg');

    if (launchBtn) {
      launchBtn.style.display = isHost ? 'flex' : 'none';
      launchBtn.classList.remove('loading');
      const textSpan = launchBtn.querySelector('.launch-text');
      if (textSpan) textSpan.textContent = 'LAUNCH MATCH NOW';
    }
    if (statusMsg) {
      statusMsg.textContent = isHost ? 'YOU ARE HOST: CLICK LAUNCH WHEN READY' : 'WAITING FOR HOST TO LAUNCH MATCH...';
    }

    if (room.mode === 'tdm') {
      const blueList = document.getElementById('slots-blue');
      const redList = document.getElementById('slots-red');
      if (blueList) blueList.innerHTML = '';
      if (redList) redList.innerHTML = '';

      let blueSlotIdx = 1;
      let redSlotIdx = 1;

      room.players.forEach((p) => {
        const isSelf = p.id === this.selfId;
        const slotEl = document.createElement('div');
        slotEl.className = `slot-item ${isSelf ? 'is-self' : ''}`;
        const hostTag = p.isHost ? '<span class="host-crown">👑 HOST</span>' : '';
        const botTag = p.isBot ? '<span class="bot-tag">[BOT]</span>' : '';

        if (p.team === 'red') {
          slotEl.innerHTML = `
            <div class="slot-player-meta">
              <span class="slot-num">#${redSlotIdx++}</span>
              <span class="slot-name">${p.name}</span>
              ${botTag}
              ${hostTag}
            </div>
            <span class="panel-badge status-ready">READY</span>
          `;
          redList?.appendChild(slotEl);
        } else {
          slotEl.innerHTML = `
            <div class="slot-player-meta">
              <span class="slot-num">#${blueSlotIdx++}</span>
              <span class="slot-name">${p.name}</span>
              ${botTag}
              ${hostTag}
            </div>
            <span class="panel-badge status-ready">READY</span>
          `;
          blueList?.appendChild(slotEl);
        }
      });
    } else {
      // BR 10-player list
      const brList = document.getElementById('slots-br');
      if (brList) brList.innerHTML = '';
      let idx = 1;

      room.players.forEach((p) => {
        const isSelf = p.id === this.selfId;
        const slotEl = document.createElement('div');
        slotEl.className = `slot-item ${isSelf ? 'is-self' : ''}`;
        const hostTag = p.isHost ? '<span class="host-crown">👑 HOST</span>' : '';
        const botTag = p.isBot ? '<span class="bot-tag">[BOT]</span>' : '';

        slotEl.innerHTML = `
          <div class="slot-player-meta">
            <span class="slot-num">#${idx++}</span>
            <span class="slot-name">${p.name}</span>
            ${botTag}
            ${hostTag}
          </div>
          <span class="panel-badge status-ready">ARMED</span>
        `;
        brList?.appendChild(slotEl);
      });
    }
  }

  launchMatch(data) {
    this.inMatch = true;
    this.isPaused = false;
    document.getElementById('in-game-pause-modal')?.classList.add('hidden');
    document.getElementById('hud-pointer-lock-prompt')?.classList.add('hidden');
    this.gameMode = data?.mode || 'tdm';
    const mapToLoad = data?.mapId || this.currentRoom?.mapId || this.selectedMapId || 'warehouse';
    this.selectedMapId = mapToLoad;

    // Crossfade/mute lobby music when entering live match
    sounds.stopLobbyMusic(true);

    if (this.lobbySceneGroup) this.lobbySceneGroup.visible = false;
    this.buildMap(mapToLoad);
    if (this.arenaGroup) this.arenaGroup.visible = true;
    if (this.mapLightsGroup) this.mapLightsGroup.visible = true;

    if (data && data.spawn) {
      this.player.x = data.spawn.x;
      this.player.y = data.spawn.y;
      this.player.z = data.spawn.z;
      if (data.spawn.team) this.player.team = data.spawn.team;
    }
    this.updatePlayerTeamVisuals();

    document.getElementById('staging-screen')?.classList.add('hidden');
    document.getElementById('lobby-hub')?.classList.add('hidden');
    document.getElementById('hud-overlay')?.classList.remove('hidden');

    // Staging mode finished: match is starting, reveal HUD gauges and hide countdown banner
    const hudOverlay = document.getElementById('hud-overlay');
    if (hudOverlay) {
      hudOverlay.classList.remove('hidden', 'hud-staging-mode');
      hudOverlay.style.display = 'block';
    }
    const inGameHUD = document.getElementById('inGameHUD');
    if (inGameHUD) inGameHUD.style.display = 'block';
    document.getElementById('br-countdown-banner')?.classList.add('hidden');

    // Configure HUD Mode & Spawning FX
    if (this.gameMode === 'br') {
      document.body.classList.add('mode-br');
      document.body.classList.remove('mode-tdm');

      this.isDroppingBR = true;
      this.player.y = 35.0;
      this.player.vy = -10.0;
      this.brThrustersDeployed = false;
      this.player.health = 100;
      this.player.armor = 0;
      this.player.kills = 0;
      this.player.damageDealt = 0;

      // Start with 100 HP and ONLY the Plasma Pistol (12 rounds)
      this.player.weapon = 'pistol';
      this.player.ammo = {
        ar: { mag: 0, reserve: 0 },
        shotgun: { mag: 0, reserve: 0 },
        sniper: { mag: 0, reserve: 0 },
        smg: { mag: 0, reserve: 0 },
        pistol: { mag: 12, reserve: 0 }
      };
      this.player.medic = { bandage: 0, medkit: 0, shield_battery: 0 };
      this.switchWeapon('pistol');

      // Strictly isolate BR bottom bar: hide 5-slot weapon strip, show 3-slot BR inventory
      document.getElementById('hud-weapon-strip')?.classList.add('hidden');
      document.getElementById('hud-br-inventory')?.classList.remove('hidden');

      document.getElementById('hud-tdm-bar')?.classList.add('hidden');
      document.getElementById('hud-br-bar')?.classList.remove('hidden');
      const aliveEl = document.getElementById('hud-br-alive');
      if (aliveEl) aliveEl.textContent = '10 / 10';
      const killsEl = document.getElementById('hud-br-kills');
      if (killsEl) killsEl.textContent = '0';
      document.getElementById('hud-compass-bar')?.classList.remove('hidden');

      if (data && data.groundLoot) {
        this.syncGroundLoot(data.groundLoot);
      }
      if (data && data.safeZone) {
        this.safeZone = data.safeZone;
      }
      this.updateBRInventoryHUD();
      if (this.stormMesh) this.stormMesh.visible = false;
    } else {
      document.body.classList.add('mode-tdm');
      document.body.classList.remove('mode-br');

      this.isDroppingBR = false;
      this.spawnShieldTimeRemaining = 3.0;
      const shieldBanner = document.getElementById('spawn-shield-banner');
      const shieldTimerVal = document.getElementById('spawn-shield-timer-val');
      if (shieldBanner) shieldBanner.classList.remove('hidden');
      if (shieldTimerVal) shieldTimerVal.textContent = '3';
      setTimeout(() => {
        if (shieldBanner) shieldBanner.classList.add('hidden');
      }, 3000);

      // Strictly isolate TDM bottom bar: show 5-slot weapon strip, hide BR inventory
      document.getElementById('hud-weapon-strip')?.classList.remove('hidden');
      document.getElementById('hud-br-inventory')?.classList.add('hidden');

      document.getElementById('hud-tdm-bar')?.classList.remove('hidden');
      document.getElementById('hud-br-bar')?.classList.add('hidden');
      document.getElementById('hud-compass-bar')?.classList.add('hidden');
      if (this.stormMesh) this.stormMesh.visible = false;
    }

    if (!this.isTouch) {
      try { this.canvas.requestPointerLock?.(); } catch (err) {}
    }

    if (this.isTouch || window.innerWidth <= 1024) {
      document.getElementById('mobile-touch-hud')?.classList.remove('hidden');
    }
    this.checkOrientationNotice();

    this.keys = {};
    this.mouseButtons = { left: false, right: false };
    this.updateHudVitals();
    this.updateHudAmmo();
    sounds.playVictory();
  }

  // -------------------------------------------------------------
  // IN-GAME PAUSE / RESUME / LEAVE MENU CONTROLLERS
  // -------------------------------------------------------------
  openPauseMenu() {
    if (!this.inMatch) return;
    this.isPaused = true;
    this.keys = {};
    this.mouseButtons = { left: false, right: false };
    this.resetTouchState();
    document.getElementById('in-game-pause-modal')?.classList.remove('hidden');
    document.getElementById('hud-pointer-lock-prompt')?.classList.add('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  resumeMatch() {
    this.isPaused = false;
    document.getElementById('in-game-pause-modal')?.classList.add('hidden');
    if (this.inMatch && !this.isTouch) {
      try {
        this.canvas.requestPointerLock?.();
      } catch (err) { }
    }
  }

  returnToLobby() {
    // 1. Release mouse lock and clear input states
    if (document.exitPointerLock) document.exitPointerLock();
    this.isPointerLocked = false;
    this.keys = {};
    this.mouseButtons = { left: false, right: false };
    this.resetTouchState();
    this.player.isShooting = false;
    this.player.isADS = false;
    document.getElementById('mbtn-ads')?.classList.remove('active-ads');
    this.player.isReloading = false;
    this.player.isHealing = false;
    if (this.reloadTimeout) clearTimeout(this.reloadTimeout);

    // 2. Hide In-Game HUD and End Game overlays
    document.body.classList.remove('mode-br', 'mode-tdm');
    const inGameHUD = document.getElementById('inGameHUD');
    if (inGameHUD) inGameHUD.style.display = 'none';
    const hudOverlay = document.getElementById('hud-overlay');
    if (hudOverlay) {
      hudOverlay.classList.add('hidden');
      hudOverlay.classList.remove('hud-staging-mode');
    }
    document.getElementById('staging-screen')?.classList.add('hidden');

    const victoryScreen = document.getElementById('victoryScreen');
    if (victoryScreen) victoryScreen.style.display = 'none';
    document.getElementById('match-end-modal')?.classList.add('hidden');

    const deathScreen = document.getElementById('deathScreen');
    if (deathScreen) deathScreen.style.display = 'none';

    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) pauseMenu.style.display = 'none';
    document.getElementById('in-game-pause-modal')?.classList.add('hidden');

    document.getElementById('spectator-overlay')?.classList.add('hidden');
    document.getElementById('hud-pointer-lock-prompt')?.classList.add('hidden');
    document.getElementById('cyber-sniper-scope')?.classList.add('hidden');
    document.getElementById('crosshair')?.classList.remove('hidden');
    document.getElementById('spawn-shield-banner')?.classList.add('hidden');
    document.getElementById('hud-circular-healing')?.classList.add('hidden');
    document.getElementById('loot-proximity-prompt')?.classList.add('hidden');
    document.getElementById('hud-reload-spinner')?.classList.add('hidden');
    document.getElementById('hud-reload-bar-wrap')?.classList.add('hidden');
    document.getElementById('mobile-touch-hud')?.classList.add('hidden');
    document.getElementById('orientation-overlay')?.classList.add('hidden');
    document.getElementById('respawn-modal')?.classList.add('hidden');
    document.getElementById('br-countdown-banner')?.classList.add('hidden');
    const stormVignette = document.getElementById('storm-vignette');
    if (stormVignette) stormVignette.style.opacity = '0';

    // 3. Destroy all Battle Royale temporary entities
    // Remove safe zone cylinder
    if (this.safeZoneMesh) {
      if (this.arenaGroup) this.arenaGroup.remove(this.safeZoneMesh);
      else this.scene.remove(this.safeZoneMesh);
      this.safeZoneMesh.geometry?.dispose();
      this.safeZoneMesh.material?.dispose();
      this.safeZoneMesh = null;
    }

    // Remove ground loot and death crates
    for (const [, item] of this.groundLootMeshes) {
      if (item && item.mesh) {
        if (item.mesh.parent) item.mesh.parent.remove(item.mesh);
        else this.scene.remove(item.mesh);
        item.mesh.traverse?.(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }
    this.groundLootMeshes.clear();

    for (const [, crateGroup] of this.lootCrateMeshes) {
      if (crateGroup) {
        if (crateGroup.parent) crateGroup.parent.remove(crateGroup);
        else this.scene.remove(crateGroup);
        crateGroup.traverse?.(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }
    this.lootCrateMeshes.clear();

    // Clean up debris particles and bullet decals
    for (const p of this.voxelDebris) {
      if (p.mesh) this.scene.remove(p.mesh);
    }
    this.voxelDebris = [];

    for (const d of this.bulletDecals) {
      this.scene.remove(d);
      if (d.geometry) d.geometry.dispose();
      if (d.material) d.material.dispose();
    }
    this.bulletDecals = [];

    // Remove all bots and remote player models from Three.js scene
    for (const [id, ent] of this.remoteEntities) {
      if (ent && ent.mesh) {
        if (ent.mesh.parent) ent.mesh.parent.remove(ent.mesh);
        else this.scene.remove(ent.mesh);
        ent.mesh.traverse?.(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
      this.remoteEntities.delete(id);
    }

    // 4. Notify Server
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveMatch');
      this.socket.emit('leaveRoom');
    }
    this.currentRoom = null;

    // 5. Restore Animated 3D Lobby Scene
    const lobbyScreen = document.getElementById('lobbyScreen');
    if (lobbyScreen) lobbyScreen.style.display = 'flex';
    document.getElementById('lobby-hub')?.classList.remove('hidden');

    this.inMatch = false;
    this.isPaused = false;
    this.isSpectating = false;
    this.deathCamActive = false;
    this.isDroppingBR = false;
    this.brState = 'LOBBY';
    this.gameState = 'LOBBY';

    this.setupLobbyScene();
    this.playLobbyMusic();
  }

  leaveMatchToLobby() {
    return this.returnToLobby();
  }

  triggerRematch() {
    const currentMode = this.gameMode || 'br';
    const currentMap = this.selectedMapId || 'warehouse';
    const nickInput = document.getElementById('player-nickname');
    const name = nickInput?.value.trim() || 'CyberPilot';

    this.returnToLobby();

    setTimeout(() => {
      if (currentMode === 'br') {
        const lobbyScreen = document.getElementById('lobbyScreen');
        if (lobbyScreen) lobbyScreen.style.display = 'none';
        document.getElementById('lobby-hub')?.classList.add('hidden');
        document.getElementById('staging-screen')?.classList.add('hidden');

        const inGameHUD = document.getElementById('inGameHUD');
        if (inGameHUD) inGameHUD.style.display = 'block';
        const hudOverlay = document.getElementById('hud-overlay');
        if (hudOverlay) {
          hudOverlay.classList.remove('hidden');
          hudOverlay.style.display = 'block';
          hudOverlay.classList.add('hud-staging-mode');
        }

        const cdBanner = document.getElementById('br-countdown-banner');
        const cdText = document.getElementById('br-countdown-text');
        if (cdBanner && cdText) {
          cdBanner.classList.remove('hidden');
          cdBanner.style.display = 'block';
          cdText.textContent = 'PREPARING AIRDROP: 10s';
        }
        sounds.playCountdownBeep();
      }

      this.socket.emit('quickPlay', {
        mode: currentMode,
        mapId: currentMap,
        playerName: name
      });
    }, 200);
  }

  setupLobbyScene() {
    this.camera.fov = 75;
    this.camera.rotation.order = 'XYZ';
    this.camera.position.set(0, 1.95, 4.95);
    this.camera.lookAt(0, 1.25, 0);
    this.camera.updateProjectionMatrix();

    if (this.lobbySceneGroup) this.lobbySceneGroup.visible = true;
    if (this.arenaGroup) this.arenaGroup.visible = false;
    if (this.mapLightsGroup) this.mapLightsGroup.visible = false;
    if (this.viewmodelGun) this.viewmodelGun.visible = false;

    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    this.player.team = 'blue';
    this.updatePlayerTeamVisuals();
  }

  playLobbyMusic() {
    sounds.playLobbyMusic?.(true);
  }

  // -------------------------------------------------------------
  // 10. INPUT CONTROLS ENGINE (DESKTOP & MOBILE)
  // -------------------------------------------------------------
  initInputControls() {
    // Desktop Pointer Lock - Click anywhere during match to request pointer lock
    window.addEventListener('click', (e) => {
      if (this.inMatch && !this.isPointerLocked && !this.isPaused) {
        if (e.target.closest('.modal-overlay') || e.target.closest('#staging-screen') || e.target.closest('#match-end-modal') || e.target.closest('#in-game-pause-modal')) return;
        sounds.init();
        try {
          this.canvas.requestPointerLock?.();
        } catch (err) { }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas);
      const lockPrompt = document.getElementById('hud-pointer-lock-prompt');
      if (lockPrompt) {
        if (this.inMatch && !this.isPointerLocked && !this.isTouch && !this.isPaused) {
          lockPrompt.classList.remove('hidden');
        } else {
          lockPrompt.classList.add('hidden');
        }
      }
    });

    document.getElementById('hud-pointer-lock-prompt')?.addEventListener('click', (e) => {
      e.stopPropagation();
      sounds.init();
      try { this.canvas.requestPointerLock?.(); } catch (err) {}
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.inMatch) return;
      if (e.code === 'Escape') {
        if (this.isPaused) {
          this.resumeMatch();
        } else {
          this.openPauseMenu();
        }
        return;
      }
      if (this.isPaused) return;

      this.keys[e.code] = true;

      // Weapon Hotkeys (1-5 for 5 Weapons)
      if (e.code === 'Digit1') this.switchWeapon('ar');
      if (e.code === 'Digit2') this.switchWeapon('shotgun');
      if (e.code === 'Digit3') this.switchWeapon('sniper');
      if (e.code === 'Digit4') this.switchWeapon('smg');
      if (e.code === 'Digit5') this.switchWeapon('pistol');

      // Medic Hotkeys (6-8 for Consumables)
      if (e.code === 'Digit6') this.useMedicItem('bandage');
      if (e.code === 'Digit7') this.useMedicItem('medkit');
      if (e.code === 'Digit8') this.useMedicItem('shield_battery');

      // Reload
      if (e.code === 'KeyR') this.reloadWeapon();

      // Loot Pickup (PUBG Style)
      if (e.code === 'KeyF') this.attemptLootPickup();

      // Dash Boost
      if (e.code === 'KeyQ' || e.code === 'KeyE') this.performDash();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Wheel Weapon Switching (Cycle weapons 1-5)
    window.addEventListener('wheel', (e) => {
      if (!this.inMatch || this.isPaused || this.deathCamActive) return;
      const weaponOrder = ['ar', 'shotgun', 'sniper', 'smg', 'pistol'];
      const currentIndex = weaponOrder.indexOf(this.player.weapon);
      let nextIndex = currentIndex;
      if (e.deltaY > 0) {
        nextIndex = (currentIndex + 1) % weaponOrder.length;
      } else if (e.deltaY < 0) {
        nextIndex = (currentIndex - 1 + weaponOrder.length) % weaponOrder.length;
      }
      if (nextIndex !== currentIndex && nextIndex >= 0) {
        this.switchWeapon(weaponOrder[nextIndex]);
      }
    }, { passive: true });

    // Interactive HUD Weapon Strip Click Listeners (Slots 1-5)
    document.querySelectorAll('.weapon-slot-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const wKey = pill.dataset.weapon;
        if (wKey) this.switchWeapon(wKey);
      });
    });

    // Mouse Aim & Fire: Seamlessly works with pointer lock OR cursor tracking
    let prevMouseX = null;
    let prevMouseY = null;

    window.addEventListener('mousemove', (e) => {
      if (!this.inMatch || this.isPaused) return;
      const baseSens = this.mouseSensitivity || 0.0024;
      const sensitivity = baseSens * (this.player.isADS ? 0.45 : 1.0);

      if (this.isPointerLocked) {
        this.player.yaw -= e.movementX * sensitivity;
        this.player.pitch -= e.movementY * sensitivity;
      } else {
        // Fallback smooth drag-to-aim when pointer lock is unengaged or unavailable in iframe
        if (prevMouseX !== null && prevMouseY !== null) {
          const dx = e.clientX - prevMouseX;
          const dy = e.clientY - prevMouseY;
          if (Math.abs(dx) < 150 && Math.abs(dy) < 150) {
            this.player.yaw -= dx * sensitivity;
            this.player.pitch -= dy * sensitivity;
          }
        }
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      this.player.pitch = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.player.pitch));
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.inMatch || this.isPaused) return;
      sounds.init();
      if (!this.isPointerLocked) {
        try {
          this.canvas.requestPointerLock?.();
        } catch (err) { }
      }
      if (e.button === 0) {
        this.mouseButtons.left = true;
        this.fireWeapon();
      }
      if (e.button === 2) {
        this.mouseButtons.right = true;
        this.player.isADS = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseButtons.left = false;
        this.pistolCanShoot = true;
      }
      if (e.button === 2) {
        this.mouseButtons.right = false;
        this.player.isADS = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mobile Virtual Touch Joystick & Look Area
    this.initMobileTouchControls();
  }

  initMobileTouchControls() {
    const jBase = document.getElementById('joystick-base');
    const jThumb = document.getElementById('joystick-thumb');
    const mAds = document.getElementById('mbtn-ads');

    // Global touchstart handler
    const handleTouchStart = (e) => {
      // Auto-detect mobile touch environment on first touch
      this.isTouch = true;

      // If not in match or game is paused, let standard UI events pass through
      if (!this.inMatch || this.isPaused) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = document.elementFromPoint(touch.clientX, touch.clientY) || touch.target;

        // Skip touches on modal overlays, staging screen, or pause dialog
        if (target && (target.closest('.modal-overlay') || target.closest('#in-game-pause-modal') || target.closest('#match-end-modal') || target.closest('#staging-screen') || target.closest('#respawn-modal'))) {
          continue;
        }

        // 1. Tactical Pause Button (Top-Right)
        if (target && target.closest('#mbtn-pause')) {
          e.preventDefault();
          this.openPauseMenu();
          continue;
        }

        // 2. Left-Hand Claw Fire Button (Top-Left)
        if (target && target.closest('#mbtn-fire-left')) {
          e.preventDefault();
          sounds.init();
          this.activeTouches.fireLeft = { id: touch.identifier };
          this.mouseButtons.left = true;
          this.fireWeapon();
          continue;
        }

        // 3. Right-Hand Primary Fire Button (Bottom-Right, allows simultaneous drag-to-aim)
        if (target && target.closest('#mbtn-fire')) {
          e.preventDefault();
          sounds.init();
          this.activeTouches.fire = {
            id: touch.identifier,
            lastX: touch.clientX,
            lastY: touch.clientY
          };
          this.mouseButtons.left = true;
          this.fireWeapon();
          continue;
        }

        // 4. ADS / Scope Toggle Button
        if (target && target.closest('#mbtn-ads')) {
          e.preventDefault();
          this.player.isADS = !this.player.isADS;
          mAds?.classList.toggle('active-ads', this.player.isADS);
          continue;
        }

        // 5. Jump Impulse Button
        if (target && target.closest('#mbtn-jump')) {
          e.preventDefault();
          sounds.init();
          if (this.player.isGrounded) {
            this.player.vy = 8.5; // Kirby/Kirka vertical jump impulse
            this.player.isGrounded = false;
            sounds.playJumpBoost();
          }
          continue;
        }

        // 6. Tactical Dash Boost Button
        if (target && target.closest('#mbtn-dash')) {
          e.preventDefault();
          this.performDash();
          continue;
        }

        // 7. Reload Weapon Button
        if (target && target.closest('#mbtn-reload')) {
          e.preventDefault();
          this.reloadWeapon();
          continue;
        }

        // 8. Quick Heal / Medkit Button
        if (target && target.closest('#mbtn-medic')) {
          e.preventDefault();
          if (this.player.health < 60 && (this.player.medic?.medkit || 0) > 0) {
            this.useMedicItem('medkit');
          } else if (this.player.health < 75 && (this.player.medic?.bandage || 0) > 0) {
            this.useMedicItem('bandage');
          } else if (this.player.health < 100 && (this.player.medic?.medkit || 0) > 0) {
            this.useMedicItem('medkit');
          } else if (this.player.armor < 100 && (this.player.medic?.shield_battery || 0) > 0) {
            this.useMedicItem('shield_battery');
          } else {
            this.useMedicItem('medkit');
          }
          continue;
        }

        // 9. Loot Pickup Button
        if (target && target.closest('#mbtn-pickup')) {
          e.preventDefault();
          this.attemptLootPickup();
          continue;
        }

        // 10. Horizontal Weapon Quick-Switch Tray
        const weaponTab = target ? target.closest('.m-weapon-tab') : null;
        if (weaponTab) {
          e.preventDefault();
          const wKey = weaponTab.dataset.weapon;
          if (wKey) this.switchWeapon(wKey);
          continue;
        }

        // Prevent unwanted actions if touching other touch action buttons
        if (target && target.closest('.touch-action-btn')) {
          e.preventDefault();
          continue;
        }

        // ---------------- DUAL-ZONE TOUCH SCREEN SPLIT ----------------
        e.preventDefault();
        sounds.init();

        const splitThreshold = window.innerWidth * 0.45;

        // ZONE A: LEFT 45% (DYNAMIC VIRTUAL JOYSTICK - MOVEMENT)
        if (touch.clientX <= splitThreshold) {
          if (!this.activeTouches.joystick) {
            this.activeTouches.joystick = {
              id: touch.identifier,
              startX: touch.clientX,
              startY: touch.clientY,
              currentX: touch.clientX,
              currentY: touch.clientY
            };
            this.touchJoystick.active = true;
            this.touchJoystick.x = 0;
            this.touchJoystick.y = 0;
            this.touchJoystick.isSprint = false;

            // Anchor joystick base directly centered under the user's thumb
            if (jBase) {
              jBase.style.left = `${touch.clientX}px`;
              jBase.style.top = `${touch.clientY}px`;
              jBase.style.bottom = 'auto';
              jBase.style.opacity = '0.9';
            }
            if (jThumb) {
              jThumb.style.transform = 'translate(0px, 0px)';
            }
          }
        } else {
          // ZONE B: RIGHT 55% (CAMERA LOOK & AIM DRAG)
          if (!this.activeTouches.look) {
            this.activeTouches.look = {
              id: touch.identifier,
              lastX: touch.clientX,
              lastY: touch.clientY
            };
          }
        }
      }
    };

    // Global touchmove handler
    const handleTouchMove = (e) => {
      if (!this.inMatch || this.isPaused) return;
      e.preventDefault();

      const maxRadius = 45;
      const baseSens = (this.mouseSensitivity || 0.0035) * 1.5;
      const sensitivity = baseSens * (this.player.isADS ? 0.45 : 1.0);
      const maxPitch = (75 * Math.PI) / 180; // PUBG Standard +/- 75 degrees clamp

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // 1. Dynamic Joystick Drag (Zone A)
        if (this.activeTouches.joystick && touch.identifier === this.activeTouches.joystick.id) {
          const dx = touch.clientX - this.activeTouches.joystick.startX;
          const dy = touch.clientY - this.activeTouches.joystick.startY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(maxRadius, dist);

          const tx = Math.cos(angle) * clampedDist;
          const ty = Math.sin(angle) * clampedDist;

          this.touchJoystick.x = tx / maxRadius;
          this.touchJoystick.y = ty / maxRadius;
          // Pushing all the way forward triggers sprint (PUBG standard)
          this.touchJoystick.isSprint = (dy < -0.85 * maxRadius);

          if (jThumb) {
            jThumb.style.transform = `translate(${tx}px, ${ty}px)`;
          }
        }

        // 2. Relative Delta Look & Aim Drag (Zone B)
        if (this.activeTouches.look && touch.identifier === this.activeTouches.look.id) {
          const deltaX = touch.clientX - this.activeTouches.look.lastX;
          const deltaY = touch.clientY - this.activeTouches.look.lastY;

          this.activeTouches.look.lastX = touch.clientX;
          this.activeTouches.look.lastY = touch.clientY;

          this.player.yaw -= deltaX * sensitivity;
          this.player.pitch -= deltaY * sensitivity;
          this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
        }

        // 3. Right Fire Button Drag-to-Aim while firing (PUBG Mobile Standard)
        if (this.activeTouches.fire && touch.identifier === this.activeTouches.fire.id) {
          const deltaX = touch.clientX - this.activeTouches.fire.lastX;
          const deltaY = touch.clientY - this.activeTouches.fire.lastY;

          this.activeTouches.fire.lastX = touch.clientX;
          this.activeTouches.fire.lastY = touch.clientY;

          this.player.yaw -= deltaX * sensitivity;
          this.player.pitch -= deltaY * sensitivity;
          this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
        }
      }
    };

    // Global touchend & touchcancel handler
    const handleTouchEnd = (e) => {
      if (!this.inMatch) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // 1. Release Dynamic Joystick
        if (this.activeTouches.joystick && touch.identifier === this.activeTouches.joystick.id) {
          this.activeTouches.joystick = null;
          this.touchJoystick.active = false;
          this.touchJoystick.x = 0;
          this.touchJoystick.y = 0;
          this.touchJoystick.isSprint = false;

          // Return joystick base to resting state
          if (jBase) {
            jBase.style.left = '';
            jBase.style.top = '';
            jBase.style.bottom = '';
            jBase.style.opacity = '0.35';
          }
          if (jThumb) {
            jThumb.style.transform = 'translate(0px, 0px)';
          }
        }

        // 2. Release Look Touch
        if (this.activeTouches.look && touch.identifier === this.activeTouches.look.id) {
          this.activeTouches.look = null;
        }

        // 3. Release Right Fire Button
        if (this.activeTouches.fire && touch.identifier === this.activeTouches.fire.id) {
          this.activeTouches.fire = null;
          if (!this.activeTouches.fireLeft) {
            this.mouseButtons.left = false;
            this.pistolCanShoot = true;
          }
        }

        // 4. Release Left Claw Fire Button
        if (this.activeTouches.fireLeft && touch.identifier === this.activeTouches.fireLeft.id) {
          this.activeTouches.fireLeft = null;
          if (!this.activeTouches.fire) {
            this.mouseButtons.left = false;
            this.pistolCanShoot = true;
          }
        }
      }
    };

    // Register strict native touch listeners with passive: false to prevent browser gesture interruptions
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Desktop click fallback for loot proximity prompt
    document.getElementById('loot-proximity-prompt')?.addEventListener('click', () => {
      this.attemptLootPickup();
    });
  }

  // -------------------------------------------------------------
  // 11. WEAPON FIRING & HITSCAN COMBAT
  // -------------------------------------------------------------
  switchWeapon(wKey) {
    if (!this.weapons[wKey]) return;
    if (this.player.weapon === wKey && !this.weaponSwapState.isSwapping) return;
    if (this.weaponSwapState.isSwapping && this.weaponSwapState.pendingWeapon === wKey) return;

    if (this.player.isReloading) {
      this.player.isReloading = false;
      if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
      document.getElementById('hud-reload-spinner')?.classList.add('hidden');
      const reloadBarWrap = document.getElementById('hud-reload-bar-wrap');
      const reloadBarFill = document.getElementById('hud-reload-bar-fill');
      if (reloadBarWrap) reloadBarWrap.classList.add('hidden');
      if (reloadBarFill) reloadBarFill.style.width = '0%';
    }

    if (!this.viewmodelGun) {
      this.player.weapon = wKey;
      this.updateHudAmmo();
      sounds.playWeaponCock();
      if (this.socket && this.inMatch) {
        this.socket.emit('switchWeapon', { weapon: wKey });
      }
      return;
    }

    this.weaponSwapState.isSwapping = true;
    this.weaponSwapState.phase = 1; // 1 = lowering
    this.weaponSwapState.progress = 0;
    this.weaponSwapState.pendingWeapon = wKey;
    sounds.playClick();
  }

  reloadWeapon() {
    if (this.player.isReloading) return;
    const w = this.weapons[this.player.weapon];
    const ammoData = this.player.ammo[this.player.weapon];
    if (ammoData.mag >= w.magSize || ammoData.reserve <= 0) return;

    this.player.isReloading = true;
    sounds.playReload();
    const spinner = document.getElementById('hud-reload-spinner');
    spinner?.classList.remove('hidden');

    const reloadBarWrap = document.getElementById('hud-reload-bar-wrap');
    const reloadBarFill = document.getElementById('hud-reload-bar-fill');
    if (reloadBarWrap) reloadBarWrap.classList.remove('hidden');
    if (reloadBarFill) {
      reloadBarFill.style.transition = 'none';
      reloadBarFill.style.width = '0%';
      void reloadBarFill.offsetWidth;
      reloadBarFill.style.transition = `width ${w.reloadMs}ms linear`;
      reloadBarFill.style.width = '100%';
    }

    if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
    this.reloadTimeout = setTimeout(() => {
      const needed = w.magSize - ammoData.mag;
      const loaded = Math.min(needed, ammoData.reserve);
      ammoData.mag += loaded;
      ammoData.reserve -= loaded;
      this.player.isReloading = false;
      spinner?.classList.add('hidden');
      if (reloadBarWrap) reloadBarWrap.classList.add('hidden');
      if (reloadBarFill) {
        reloadBarFill.style.transition = 'none';
        reloadBarFill.style.width = '0%';
      }
      sounds.playWeaponCock();
      this.updateHudAmmo();
    }, w.reloadMs);
  }

  performDash() {
    sounds.playDash();
    const forwardX = -Math.sin(this.player.yaw);
    const forwardZ = -Math.cos(this.player.yaw);
    this.player.vx += forwardX * 18.0;
    this.player.vz += forwardZ * 18.0;
  }

  fireWeapon() {
    if (!this.inMatch || this.isPaused || this.isSpectating || this.player.isReloading) return;
    if (this.weaponSwapState && this.weaponSwapState.isSwapping) return;
    const now = Date.now();
    const w = this.weapons[this.player.weapon];
    const ammoData = this.player.ammo[this.player.weapon];

    if (now - this.player.lastShotTime < w.fireRateMs) return;

    // Firing cancels ongoing healing application
    if (this.player.isHealing) {
      this.player.isHealing = false;
      this.player.healItem = null;
      this.socket.emit('cancelHealing');
      this.cancelHealingChannelUI();
    }

    if (ammoData.mag <= 0) {
      this.reloadWeapon();
      return;
    }

    this.player.lastShotTime = now;
    ammoData.mag--;
    this.updateHudAmmo();

    // Position muzzle flash at specific weapon barrel tip
    const activeMesh = this.viewmodelMeshes ? this.viewmodelMeshes[this.player.weapon] : null;
    if (this.muzzleFlashMesh && activeMesh && activeMesh.userData.muzzleOffset) {
      this.muzzleFlashMesh.position.copy(activeMesh.userData.muzzleOffset);
    }

    // Calculate world muzzle position
    const muzzlePos = new THREE.Vector3();
    if (this.muzzleFlashMesh) {
      this.muzzleFlashMesh.getWorldPosition(muzzlePos);
      this.muzzleFlashMesh.material.opacity = 1.0;
      this.muzzleFlashMesh.scale.set(1.8, 1.8, 2.4);
      this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI;
    } else {
      muzzlePos.copy(this.camera.position);
    }

    // Sound & Weapon Recoil Kick (50% reduced in ADS)
    sounds.playGunshot(this.player.weapon);
    const recoilMult = this.player.isADS ? 0.5 : 1.0;

    // Dynamic Recoil Kickback
    this.viewmodelRecoilZ = 0.08 * recoilMult;
    this.viewmodelRecoilPitch = 0.12 * recoilMult;
    this.player.pitch += 0.012 * recoilMult;

    if (this.muzzleLight) {
      this.muzzleLight.intensity = 4.5;
      setTimeout(() => { if (this.muzzleLight) this.muzzleLight.intensity = 0; }, 50);
    }

    // Reticle Bloom
    const reticle = document.getElementById('crosshair');
    if (reticle) {
      reticle.classList.add('firing');
      setTimeout(() => reticle.classList.remove('firing'), 85);
    }

    // Tracer Color by Weapon
    let tracerColor = '#00f6ff';
    if (this.player.weapon === 'shotgun') tracerColor = '#f59e0b';
    else if (this.player.weapon === 'sniper') tracerColor = '#ff0055';
    else if (this.player.weapon === 'smg') tracerColor = '#ffe600';
    else if (this.player.weapon === 'pistol') tracerColor = '#a855f7';

    // Camera Raycast Direction & Origin
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const rayDir = this.raycaster.ray.direction;
    const rayOrigin = this.camera.position.clone();

    // Hit Candidates: Enemy entities & Bot hitboxes
    const candidateHitboxes = [];
    const entityByMesh = new Map();
    const isHeadMap = new Map();

    for (const [id, ent] of this.remoteEntities) {
      if (ent.mesh && ent.health > 0) {
        if (ent.mesh.userData.hitBox) {
          candidateHitboxes.push(ent.mesh.userData.hitBox);
          entityByMesh.set(ent.mesh.userData.hitBox, id);
          if (ent.mesh.userData.headMesh) {
            candidateHitboxes.push(ent.mesh.userData.headMesh);
            entityByMesh.set(ent.mesh.userData.headMesh, id);
            isHeadMap.set(ent.mesh.userData.headMesh, true);
          }
        } else {
          ent.mesh.traverse((child) => {
            if (child.isMesh) {
              candidateHitboxes.push(child);
              entityByMesh.set(child, id);
            }
          });
        }
      }
    }

    const obstacles = this.obstacleMeshes || [];

    if (this.player.weapon === 'shotgun') {
      // -------------------------------------------------------------
      // SHOTGUN: 8-Pellet Cone Raycasting with Distance-Sorted Occlusion
      // -------------------------------------------------------------
      const pellets = w.pellets || 8;
      const pelletCounts = {};
      const pelletHeadshots = {};
      let firstTargetPoint = null;

      for (let i = 0; i < pellets; i++) {
        const spreadAngle = 0.055;
        const pDir = rayDir.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * spreadAngle,
          (Math.random() - 0.5) * spreadAngle,
          (Math.random() - 0.5) * spreadAngle
        )).normalize();

        const pRay = new THREE.Raycaster(rayOrigin, pDir, 0.1, 150);
        const pHits = pRay.intersectObjects([...obstacles, ...candidateHitboxes], false);
        pHits.sort((a, b) => a.distance - b.distance);

        if (pHits.length > 0) {
          const hit = pHits[0];
          if (!firstTargetPoint) firstTargetPoint = hit.point;
          this.spawnTracer(muzzlePos, hit.point, tracerColor);

          if (entityByMesh.has(hit.object)) {
            const hitEntId = entityByMesh.get(hit.object);
            const targetEnt = this.remoteEntities.get(hitEntId);
            if (targetEnt && targetEnt.isInvulnerable) {
              this.spawnShieldDeflectSparks(hit.point, '#00f6ff');
            } else {
              pelletCounts[hitEntId] = (pelletCounts[hitEntId] || 0) + 1;
              const mascotMesh = hit.object.parent;
              const baseY = mascotMesh ? mascotMesh.position.y : 0;
              if (isHeadMap.get(hit.object) || hit.point.y > baseY + 1.5) {
                pelletHeadshots[hitEntId] = true;
              }
            }
          } else {
            // Hit solid wall or obstacle - stopped by cover
            const normal = hit.face ? hit.face.normal.clone().applyQuaternion(hit.object.quaternion) : new THREE.Vector3(0, 1, 0);
            this.spawnWallSparks(hit.point, normal, tracerColor);
            if (Math.random() < 0.35) {
              this.spawnBulletDecal(hit.point, normal);
            }
          }
        } else {
          const pFar = rayOrigin.clone().add(pDir.clone().multiplyScalar(75));
          if (!firstTargetPoint) firstTargetPoint = pFar;
          this.spawnTracer(muzzlePos, pFar, tracerColor);
        }
      }

      this.shotgunPumpOffset = 0.08;
      setTimeout(() => sounds.playShotgunPump?.(), 220);

      // Emit Shotgun hits
      const hitEntries = Object.entries(pelletCounts);
      if (hitEntries.length > 0) {
        for (const [hitEntId, count] of hitEntries) {
          const isHead = !!pelletHeadshots[hitEntId];
          const dmg = Math.round(w.damage * count * (isHead ? 1.5 : 1.0));
          this.showHitmarker(dmg, isHead);
          this.socket.emit('fireWeapon', {
            weapon: 'shotgun',
            origin: { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
            direction: { x: rayDir.x, y: rayDir.y, z: rayDir.z },
            targetPoint: { x: firstTargetPoint.x, y: firstTargetPoint.y, z: firstTargetPoint.z },
            hitEntityId: hitEntId,
            pelletHits: count,
            isHeadshot: isHead
          });
        }
      } else {
        const fallbackTarget = firstTargetPoint || rayOrigin.clone().add(rayDir.clone().multiplyScalar(60));
        this.socket.emit('fireWeapon', {
          weapon: 'shotgun',
          origin: { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
          direction: { x: rayDir.x, y: rayDir.y, z: rayDir.z },
          targetPoint: { x: fallbackTarget.x, y: fallbackTarget.y, z: fallbackTarget.z },
          hitEntityId: null,
          pelletHits: 0,
          isHeadshot: false
        });
      }

    } else {
      // -------------------------------------------------------------
      // SINGLE-PROJECTILE WEAPONS (AR, SNIPER, SMG, PISTOL)
      // -------------------------------------------------------------
      const allHits = this.raycaster.intersectObjects([...obstacles, ...candidateHitboxes], false);
      allHits.sort((a, b) => a.distance - b.distance);

      let hitEntityId = null;
      let isHeadshot = false;
      let targetPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(100));

      if (allHits.length > 0) {
        const hit = allHits[0];
        targetPoint = hit.point;

        if (entityByMesh.has(hit.object)) {
          // Direct Line of Sight Hit on Player/Bot
          hitEntityId = entityByMesh.get(hit.object);
          const targetEnt = this.remoteEntities.get(hitEntityId);

          if (targetEnt && targetEnt.isInvulnerable) {
            this.spawnShieldDeflectSparks(targetPoint, '#00f6ff');
          } else {
            const mascotMesh = hit.object.parent;
            const baseY = mascotMesh ? mascotMesh.position.y : 0;
            if (isHeadMap.get(hit.object) || hit.point.y > baseY + 1.5) {
              isHeadshot = true;
            }
            const dmgMult = isHeadshot ? (this.player.weapon === 'sniper' ? 2.0 : 1.5) : 1.0;
            this.showHitmarker(Math.round(w.damage * dmgMult), isHeadshot);
          }
        } else {
          // Hit Solid Wall / Cover (Bullet is completely absorbed, does not penetrate)
          const normal = hit.face ? hit.face.normal.clone().applyQuaternion(hit.object.quaternion) : new THREE.Vector3(0, 1, 0);
          this.spawnWallSparks(targetPoint, normal, tracerColor);
          this.spawnBulletDecal(targetPoint, normal);
        }
      }

      this.socket.emit('fireWeapon', {
        weapon: this.player.weapon,
        origin: { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
        direction: { x: rayDir.x, y: rayDir.y, z: rayDir.z },
        targetPoint: { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z },
        hitEntityId,
        isHeadshot
      });

      this.spawnTracer(muzzlePos, targetPoint, tracerColor);
    }
  }

  spawnBulletDecal(point, normal) {
    if (!point || !normal) return;
    const decalGeom = new THREE.PlaneGeometry(0.18, 0.18);
    const decalMat = new THREE.MeshBasicMaterial({
      color: 0x111116,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const decal = new THREE.Mesh(decalGeom, decalMat);
    decal.position.copy(point).addScaledVector(normal, 0.015);
    const lookTarget = decal.position.clone().add(normal);
    decal.lookAt(lookTarget);

    this.scene.add(decal);
    this.bulletDecals.push(decal);

    if (this.bulletDecals.length > 40) {
      const old = this.bulletDecals.shift();
      this.scene.remove(old);
      old.geometry.dispose();
      old.material.dispose();
    }
  }

  spawnWallSparks(point, normal, colorHex = '#ffaa33') {
    const particleCount = 8;
    const group = new THREE.Group();
    group.position.copy(point);
    const partMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 1 });
    const partGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);

    const velocities = [];
    const norm = normal ? normal.clone().normalize() : new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(partGeo, partMat);
      group.add(p);
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      const vel = norm.clone().multiplyScalar(Math.random() * 3 + 2).add(spread);
      velocities.push(vel);
    }
    this.scene.add(group);

    const start = Date.now();
    const duration = 240;
    const anim = () => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.scene.remove(group);
        partGeo.dispose();
        partMat.dispose();
      } else {
        for (let i = 0; i < group.children.length; i++) {
          const child = group.children[i];
          const v = velocities[i];
          child.position.addScaledVector(v, 0.016);
          v.y -= 9.8 * 0.016;
        }
        partMat.opacity = 1 - progress;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  spawnTracer(from, to, colorHex = '#00f6ff') {
    const dist = from.distanceTo(to);
    if (dist < 0.2) return;

    // Glowing 3D Cylinder Laser Bolt
    const radius = 0.045;
    const geom = new THREE.CylinderGeometry(radius, radius, dist, 6, 1, true);
    geom.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.95
    });

    const beam = new THREE.Mesh(geom, mat);
    beam.position.copy(from).lerp(to, 0.5);
    beam.lookAt(to);
    this.scene.add(beam);

    // Inner bright white core
    const coreGeom = new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, dist, 6, 1, true);
    coreGeom.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    const core = new THREE.Mesh(coreGeom, coreMat);
    beam.add(core);

    // Spawn Impact Sparks
    this.spawnImpactParticles(to, colorHex);

    const startTime = Date.now();
    const duration = 130;
    const anim = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.scene.remove(beam);
        geom.dispose();
        coreGeom.dispose();
        mat.dispose();
        coreMat.dispose();
      } else {
        mat.opacity = (1 - progress) * 0.95;
        coreMat.opacity = (1 - progress);
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  spawnImpactParticles(pos, colorHex = '#00f6ff') {
    const particleCount = 8;
    const group = new THREE.Group();
    group.position.copy(pos);
    const partMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 1 });
    const partGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(partGeo, partMat);
      group.add(p);
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 3.5 + 1,
        (Math.random() - 0.5) * 5
      ));
    }
    this.scene.add(group);

    const start = Date.now();
    const duration = 220;
    const anim = () => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.scene.remove(group);
        partGeo.dispose();
        partMat.dispose();
      } else {
        for (let i = 0; i < group.children.length; i++) {
          const child = group.children[i];
          const v = velocities[i];
          child.position.addScaledVector(v, 0.016);
          v.y -= 9.8 * 0.016;
        }
        partMat.opacity = 1 - progress;
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  handleRemoteShot(data) {
    const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
    let target = data.targetPos ?
      new THREE.Vector3(data.targetPos.x, data.targetPos.y, data.targetPos.z) :
      new THREE.Vector3(data.targetPoint.x, data.targetPoint.y, data.targetPoint.z);

    // Occlude remote tracer against physical scene obstacle meshes (stops fire at wall surface)
    if (this.obstacleMeshes && this.obstacleMeshes.length > 0) {
      const dir = target.clone().sub(origin);
      const dist = dir.length();
      if (dist > 0.05) {
        dir.normalize();
        const ray = new THREE.Raycaster(origin, dir, 0.05, dist);
        const hits = ray.intersectObjects(this.obstacleMeshes, false);
        if (hits.length > 0) {
          target = hits[0].point;
          const normal = hits[0].face ? hits[0].face.normal.clone().applyQuaternion(hits[0].object.quaternion) : new THREE.Vector3(0, 1, 0);
          this.spawnWallSparks(target, normal, '#ff0055');
        }
      }
    }

    this.spawnTracer(origin, target, '#ff0055');
    sounds.playGunshot(data.weapon || 'ar');

    // Trigger visible 50ms muzzle flash mesh on remote model
    const shooterId = data.shooterId || data.botId;
    if (shooterId) {
      const ent = this.remoteEntities.get(shooterId);
      if (ent && ent.mesh && ent.mesh.userData.muzzleFlash) {
        const mf = ent.mesh.userData.muzzleFlash;
        mf.material.opacity = 1.0;
        mf.scale.set(1.6, 1.6, 2.2);
        mf.rotation.z = Math.random() * Math.PI;
        setTimeout(() => {
          if (mf && mf.material) mf.material.opacity = 0;
        }, 50);
      }
    }
  }

  spawnDeathVoxelDebris(pos, colorVal = 0x00f6ff) {
    const count = 10;
    const debrisGroup = new THREE.Group();
    debrisGroup.position.copy(pos);
    debrisGroup.position.y += 0.8;

    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const mat = new THREE.MeshStandardMaterial({
      color: colorVal,
      emissive: colorVal,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 1.0
    });

    const particles = [];
    for (let i = 0; i < count; i++) {
      const cube = new THREE.Mesh(geo, mat.clone());
      debrisGroup.add(cube);
      particles.push({
        mesh: cube,
        vx: (Math.random() - 0.5) * 8.0,
        vy: Math.random() * 5.5 + 3.0,
        vz: (Math.random() - 0.5) * 8.0,
        rotX: (Math.random() - 0.5) * 14,
        rotY: (Math.random() - 0.5) * 14,
        rotZ: (Math.random() - 0.5) * 14
      });
    }

    this.scene.add(debrisGroup);
    this.voxelDebris.push({
      group: debrisGroup,
      particles,
      createdAt: Date.now(),
      lifeMs: 2500
    });
  }

  spawnGreenHologramRing(pos) {
    const ringGeo = new THREE.TorusGeometry(1.0, 0.04, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos);
    ringMesh.position.y = 0.2;
    this.scene.add(ringMesh);

    this.hologramRingFX.push({
      mesh: ringMesh,
      createdAt: Date.now(),
      lifeMs: 1200
    });
    sounds.playHealHologramChime();
  }

  spawnJumpPadSparks(pos) {
    const sparkCount = 18;
    const sparkGroup = new THREE.Group();
    sparkGroup.position.copy(pos);
    sparkGroup.position.y = 0.45;

    const geo = new THREE.BoxGeometry(0.08, 0.16, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: 0xbf00ff, transparent: true, opacity: 1 });
    const sparks = [];

    for (let i = 0; i < sparkCount; i++) {
      const m = new THREE.Mesh(geo, mat.clone());
      sparkGroup.add(m);
      sparks.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 3.5,
        vy: Math.random() * 12.0 + 8.0,
        vz: (Math.random() - 0.5) * 3.5
      });
    }
    this.scene.add(sparkGroup);
    this.jumpPadSparks.push({
      group: sparkGroup,
      sparks,
      createdAt: Date.now(),
      lifeMs: 800
    });
  }

  spawnShieldDeflectSparks(pos, colorHex = '#00f6ff') {
    const count = 12;
    const group = new THREE.Group();
    group.position.copy(pos);

    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 1 });
    const sparks = [];

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat.clone());
      group.add(m);
      sparks.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 7.0,
        vy: (Math.random() - 0.5) * 7.0,
        vz: (Math.random() - 0.5) * 7.0
      });
    }
    this.scene.add(group);
    this.shieldSparks.push({
      group,
      sparks,
      createdAt: Date.now(),
      lifeMs: 400
    });
    sounds.playShieldDeflect();
  }

  createOrShowLocalShieldBubble() {
    // The local player plays in first-person; spawning a 3D emissive sphere around the camera
    // caused the entire viewport to flash solid red or blue. Spawn invulnerability is cleanly
    // communicated via the #spawn-shield-banner HUD element.
    if (this.localShieldBubble) {
      this.localShieldBubble.visible = false;
    }
  }

  attemptLootPickup() {
    if (!this.inMatch || this.isSpectating) return;
    if (this.nearestLootItem) {
      const item = this.nearestLootItem;
      if (item.isGroundLoot) {
        const itemData = item.itemData;
        if (itemData) {
          if (itemData.type === 'weapon' && itemData.weaponType) {
            this.player.weapon = itemData.weaponType;
            if (!this.player.ammo[itemData.weaponType]) {
              this.player.ammo[itemData.weaponType] = { mag: 30, reserve: 60 };
            } else if (this.player.ammo[itemData.weaponType].mag === 0) {
              this.player.ammo[itemData.weaponType].mag = 30;
              this.player.ammo[itemData.weaponType].reserve += 30;
            }
            this.switchWeapon(itemData.weaponType);
            this.showToast(`🔫 EQUIPPED ${itemData.name || itemData.weaponType.toUpperCase()}`, 'cyan');
          } else if (itemData.type === 'ammo') {
            for (const w in this.player.ammo) {
              this.player.ammo[w].reserve += 60;
            }
            this.showToast('📦 +60 AMMO ACQUIRED', 'amber');
          } else if (itemData.type === 'medkit') {
            this.player.health = 100;
            this.updateHudVitals();
            this.showToast('➕ MEDKIT APPLIED: 100 HP', 'green');
          } else if (itemData.type === 'armor') {
            this.player.armor = Math.min(100, this.player.armor + 50);
            this.updateHudVitals();
            this.showToast('🛡️ ARMOR VEST: +50 AP', 'cyan');
          }
        }
        // Despawn the mesh immediately
        this.removeGroundLootMesh(item.id);
        this.socket.emit('pickupGroundLoot', { id: item.id, lootId: item.id });
        this.socket.emit('pickupLoot', { id: item.id });
      } else {
        this.socket.emit('pickupPowerUp', { id: item.id });
        this.socket.emit('pickupLoot', { id: item.id });
      }
      sounds.playPowerUp();
      this.nearestLootItem = null;
      document.getElementById('loot-proximity-prompt')?.classList.add('hidden');
    }
  }

  showHitmarker(damage, isHeadshot) {
    sounds.playHitmarker(isHeadshot);
    const hm = document.getElementById('hitmarker');
    if (hm) {
      hm.className = `hitmarker-x active ${isHeadshot ? 'headshot' : ''}`;
      setTimeout(() => { hm.classList.remove('active'); }, 120);
    }
  }

  handleDamageTaken(data) {
    this.player.health = data.remainingHealth;
    this.player.armor = data.remainingArmor;
    this.updateHudVitals();
    this.flashVignette('damage-vignette', 300);

    // Directional damage indicator flash
    if (data.attackerPos) {
      this.showDirectionalDamageIndicator(data.attackerPos);
    }
  }

  showDirectionalDamageIndicator(attackerPos) {
    const indicatorOverlay = document.getElementById('directional-damage-indicator');
    const damageArrow = document.getElementById('damage-arrow');
    if (!indicatorOverlay || !damageArrow) return;

    // Calculate angle from player position and yaw to attacker position
    const dx = attackerPos.x - this.player.x;
    const dz = attackerPos.z - this.player.z;
    const worldAngle = Math.atan2(dx, dz); // angle in world coordinates
    const relAngle = worldAngle - this.player.yaw; // relative angle to player facing direction

    // Convert to CSS rotation degrees
    const deg = (relAngle * 180 / Math.PI) + 180;
    damageArrow.style.transform = `rotate(${deg}deg)`;
    damageArrow.style.opacity = '1';
    indicatorOverlay.classList.remove('hidden');

    clearTimeout(this.damageArrowTimer);
    this.damageArrowTimer = setTimeout(() => {
      damageArrow.style.opacity = '0';
      setTimeout(() => {
        indicatorOverlay.classList.add('hidden');
      }, 150);
    }, 450);
  }

  flashVignette(id, durationMs) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, durationMs);
  }

  showToast(msg, color) {
    const toast = document.getElementById('pickup-toast');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.style.borderColor = color === 'green' ? 'var(--green)' : 'var(--cyan)';
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 2200);
  }

  addKillFeedEntry(event) {
    const tray = document.getElementById('kill-feed');
    if (!tray) return;

    const row = document.createElement('div');
    row.className = 'kill-entry';
    row.innerHTML = `
      <span class="kf-killer ${event.killerTeam}">${event.killer}</span>
      <span class="kf-weapon">⚡ ${event.weapon}</span>
      <span class="kf-victim ${event.victimTeam}">${event.victim}</span>
    `;
    tray.appendChild(row);

    setTimeout(() => {
      row.remove();
    }, 4500);
  }

  showRespawnCountdown(sec, killerName, killerWeapon, killerTeam) {
    const modal = document.getElementById('respawn-modal');
    const timerSec = document.getElementById('respawn-timer-sec');
    const killerEl = document.getElementById('killcam-killer-name');
    const weaponEl = document.getElementById('killcam-killer-weapon');

    if (!modal || !timerSec) return;

    const teamPrefix = killerTeam ? (killerTeam === 'red' ? '[Red] ' : '[Blue] ') : '';
    if (killerEl && killerName) killerEl.textContent = `${teamPrefix}${killerName}`.toUpperCase();
    if (weaponEl && killerWeapon) weaponEl.textContent = killerWeapon.toUpperCase();

    modal.classList.remove('hidden');
    let remain = sec;
    timerSec.textContent = remain;

    const intv = setInterval(() => {
      remain--;
      timerSec.textContent = remain;
      if (remain <= 0) {
        clearInterval(intv);
        modal.classList.add('hidden');
      }
    }, 1000);
  }

  handleMatchEnded(data) {
    this.inMatch = false;
    this.player.isADS = false;
    this.camera.fov = 75;
    this.camera.rotation.order = 'XYZ';
    this.camera.updateProjectionMatrix();
    document.getElementById('cyber-sniper-scope')?.classList.add('hidden');
    document.getElementById('crosshair')?.classList.remove('hidden');
    document.getElementById('hud-overlay')?.classList.add('hidden');
    document.getElementById('match-end-modal')?.classList.remove('hidden');

    const banner = document.getElementById('end-victory-banner');
    const sub = document.getElementById('end-sub-banner');

    if (data.mode === 'tdm') {
      const isWinner = data.winningTeam === this.player.team;
      if (banner) {
        banner.classList.remove('victory-royale-banner');
        banner.textContent = isWinner ? 'VICTORY!' : 'DEFEAT';
        banner.style.color = isWinner ? 'var(--cyan)' : 'var(--crimson)';
      }
      if (sub) sub.textContent = `TEAM ${data.winningTeam?.toUpperCase()} WON`;
      if (isWinner) sounds.playVictory();
      else sounds.playDefeat();
    } else {
      // BR
      const isWinner = data.isLocalWinner || (data.winner && data.winner.id === this.selfId);
      if (banner) {
        banner.textContent = isWinner ? 'VICTORY ROYALE #1' : 'MATCH CONCLUDED';
        banner.style.color = isWinner ? '#ffd700' : 'var(--cyan)';
        if (isWinner) {
          banner.classList.add('victory-royale-banner');
          this.launchVictoryConfetti();
        } else {
          banner.classList.remove('victory-royale-banner');
        }
      }
      if (sub) sub.textContent = `WINNER: ${data.winner ? data.winner.name : 'Unknown'}`;
      if (isWinner) sounds.playVictory();
      else sounds.playDefeat();
    }

    // Populate Match Stats Summary Grid
    const statKills = document.getElementById('end-stat-kills');
    const statDamage = document.getElementById('end-stat-damage');
    const statTime = document.getElementById('end-stat-time');
    const statScore = document.getElementById('end-stat-score');

    if (statKills) statKills.textContent = data.stats?.kills ?? this.player.kills ?? 0;
    if (statDamage) statDamage.textContent = data.stats?.damageDealt ?? this.player.damageDealt ?? 0;
    if (statTime) {
      const sec = data.stats?.timeSurvived ?? 0;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      statTime.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    if (statScore) {
      statScore.textContent = data.stats?.score ?? ((data.stats?.kills || this.player.kills || 0) * 100);
    }

    // Enable return and rematch buttons immediately
    const returnBtn = document.getElementById('btn-end-return-lobby');
    if (returnBtn) {
      returnBtn.disabled = false;
      returnBtn.textContent = '← RETURN TO LOBBY';
    }
    const rematchBtn = document.getElementById('btn-end-rematch');
    if (rematchBtn) {
      rematchBtn.disabled = false;
      rematchBtn.textContent = 'PLAY AGAIN / REMATCH ▶';
    }

    // Populate Leaderboard
    const lbRows = document.getElementById('end-leaderboard-rows');
    if (lbRows && data.leaderboard) {
      lbRows.innerHTML = '';
      data.leaderboard.forEach((entry, idx) => {
        const scoreVal = entry.score != null ? entry.score : ((entry.kills || 0) * 100);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${idx + 1}</td>
          <td>${entry.name} ${entry.isBot ? '<span class="bot-tag">[BOT]</span>' : ''}</td>
          <td>${entry.team.toUpperCase()}</td>
          <td>${entry.kills || 0}</td>
          <td>${entry.deaths || 0}</td>
          <td>${scoreVal}</td>
        `;
        lbRows.appendChild(tr);
      });
    }

    if (document.exitPointerLock) document.exitPointerLock();
  }

  // -------------------------------------------------------------
  // 12. STATE SNAPSHOT INTERPOLATION & BR STORM SYNC
  // -------------------------------------------------------------
  handleStateSnapshot(snapshot) {
    if (!this.inMatch) return;

    // Update Mode-specific Top Bar
    if (this.gameMode === 'tdm') {
      document.getElementById('hud-score-blue').textContent = snapshot.scores.blue || 0;
      document.getElementById('hud-score-red').textContent = snapshot.scores.red || 0;

      const m = Math.floor(snapshot.timeRemaining / 60);
      const s = snapshot.timeRemaining % 60;
      document.getElementById('hud-match-timer').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      // BR
      this.brState = snapshot.brState || this.brState;
      const aliveEl = document.getElementById('hud-br-alive');
      if (aliveEl) aliveEl.textContent = `${snapshot.aliveCount ?? 10} / 10`;
      const killsEl = document.getElementById('hud-br-kills');
      if (killsEl) killsEl.textContent = `${this.player.kills || 0}`;

      if (snapshot.safeZone) {
        this.safeZone = snapshot.safeZone;
        const sz = this.safeZone;
        const timerSec = Math.max(0, Math.ceil(sz.timer ?? sz.phaseTimer ?? 0));
        const m = Math.floor(timerSec / 60);
        const s = timerSec % 60;
        const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        const statusEl = document.getElementById('hud-storm-status');
        const radiusEl = document.getElementById('hud-storm-radius');

        if (statusEl) {
          if (sz.isShrinking || sz.shrinkSpeed > 0) {
            statusEl.textContent = 'ZONE COLLAPSING! RETREAT TO SAFE AREA';
            statusEl.style.color = 'var(--crimson)';
          } else {
            statusEl.textContent = `ZONE SHRINKS IN: ${timeStr}`;
            statusEl.style.color = 'var(--amber)';
          }
        }
        if (radiusEl) {
          const curR = Math.round(sz.radius ?? sz.currentRadius ?? 90);
          const dps = sz.dps ?? (sz.phase === 1 ? 5 : (sz.phase === 2 ? 8 : 15));
          radiusEl.textContent = `PHASE ${sz.phase || 1} • RADIUS: ${curR}m • DPS: ${dps}`;
        }
      }

      if (snapshot.groundLoot) {
        this.syncGroundLoot(snapshot.groundLoot);
      }
    }

    // Sync Remote Combatants (Players + Bots)
    const activeIds = new Set();
    const allRemotes = [...snapshot.players, ...snapshot.bots];

    for (const ent of allRemotes) {
      if (ent.id === this.selfId) {
        // Authoritative reconcile team if changed
        if (ent.team && ent.team !== this.player.team) {
          this.player.team = ent.team;
          this.updatePlayerTeamVisuals();
        }
        continue;
      }

      activeIds.add(ent.id);
      let localEnt = this.remoteEntities.get(ent.id);

      if (!localEnt) {
        // Create 3D Voxel Mascot
        const mesh = this.createMascotMesh(ent);
        localEnt = {
          mesh,
          targetPos: new THREE.Vector3(ent.x, ent.y, ent.z),
          targetYaw: ent.yaw,
          health: ent.health,
          team: ent.team,
          name: ent.name,
          isBot: ent.isBot
        };
        this.remoteEntities.set(ent.id, localEnt);
      } else {
        localEnt.targetPos.set(ent.x, ent.y, ent.z);
        localEnt.targetYaw = ent.yaw;
        localEnt.health = ent.health;
        localEnt.mesh.visible = ent.isAlive;
        if (localEnt.team !== ent.team) {
          localEnt.team = ent.team;
          this.updateMascotTeamColor(localEnt.mesh, ent.team);
        }
        this.updateOverheadBillboard(localEnt.mesh.userData.billboard, ent);
      }
    }

    // Remove obsolete entities
    for (const [id, localEnt] of this.remoteEntities) {
      if (!activeIds.has(id)) {
        this.scene.remove(localEnt.mesh);
        this.remoteEntities.delete(id);
      }
    }

    // Spectator Camera Following
    if (this.isSpectating && this.spectateTargetId) {
      const target = this.remoteEntities.get(this.spectateTargetId);
      if (target && target.mesh) {
        const pos = target.mesh.position;
        this.camera.position.set(pos.x, pos.y + 2.5, pos.z + 4.5);
        this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);
      }
    }
  }

  spawnLootCrateMesh(crate) {
    const group = new THREE.Group();
    group.position.set(crate.x, crate.y || 0.5, crate.z);
    group.userData.isNonCollidable = true;

    // 1. Heavy Dark Industrial Cargo Crate Body
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.9
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 1.3), boxMat);
    group.add(box);

    // 2. Glowing Cyan Edges & Corner Reinforcements
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.32, 0.87, 1.32));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f6ff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    group.add(wireframe);

    // 3. Tall 4-Meter Glowing Vertical Cyan Beacon Beam (Visible Across Map)
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.25, 4.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(beamGeo, beamMat);
    beacon.position.y = 2.4;
    group.add(beacon);
    group.userData.beacon = beacon;

    // 4. Floating Holographic Diamond Icon
    const holoGeo = new THREE.OctahedronGeometry(0.25, 0);
    const holoMat = new THREE.MeshBasicMaterial({ color: 0x00f6ff, wireframe: true });
    const holo = new THREE.Mesh(holoGeo, holoMat);
    holo.position.y = 1.0;
    group.add(holo);
    group.userData.holo = holo;

    const light = new THREE.PointLight(0x00f6ff, 2.5, 7);
    light.position.y = 0.8;
    group.add(light);

    if (this.arenaGroup) {
      this.arenaGroup.add(group);
    } else {
      this.scene.add(group);
    }
    this.lootCrateMeshes.set(crate.id, group);
  }

  removeLootCrateMesh(id) {
    const mesh = this.lootCrateMeshes.get(id);
    if (mesh) {
      if (mesh.parent) mesh.parent.remove(mesh);
      this.lootCrateMeshes.delete(id);
    }
  }

  syncGroundLoot(items) {
    if (!items || !Array.isArray(items)) return;
    const activeIds = new Set(items.map(it => it.id));

    // Remove obsolete ground loot
    for (const [id, loot] of this.groundLootMeshes) {
      if (!activeIds.has(id)) {
        if (loot.group.parent) loot.group.parent.remove(loot.group);
        this.groundLootMeshes.delete(id);
      }
    }

    // Add new ground loot
    for (const item of items) {
      if (!this.groundLootMeshes.has(item.id)) {
        this.spawnGroundLootMesh(item);
      }
    }
  }

  spawnGroundLootMesh(item) {
    const group = new THREE.Group();
    group.position.set(item.x, item.y + 0.35, item.z);
    group.userData.isNonCollidable = true;

    if (item.type === 'weapon') {
      const glowColor = item.weaponType === 'sniper' ? 0x9333ea : (item.weaponType === 'shotgun' ? 0xf59e0b : (item.weaponType === 'smg' ? 0x10b981 : 0x00f6ff));
      const bodyMat = new THREE.MeshStandardMaterial({
        color: glowColor,
        metalness: 0.8,
        roughness: 0.2
      });
      const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.12), bodyMat);
      group.add(gunBody);

      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), barrelMat);
      barrel.position.set(0.42, 0.02, 0);
      group.add(barrel);

      const light = new THREE.PointLight(glowColor, 1.2, 4);
      light.position.y = 0.3;
      group.add(light);
    } else if (item.type === 'ammo') {
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.6, roughness: 0.3 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), boxMat);
      group.add(box);

      const light = new THREE.PointLight(0xeab308, 1.2, 4);
      light.position.y = 0.3;
      group.add(light);
    } else if (item.type === 'medkit') {
      // Stark White Glossy Medical Supply Case
      const caseMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.15,
        metalness: 0.1
      });
      const medCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.45), caseMat);
      group.add(medCase);

      // Bold Emergency Red Cross on Top & Sides
      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const crossTopV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.34), redMat);
      crossTopV.position.y = 0.20;
      const crossTopH = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.12), redMat);
      crossTopH.position.y = 0.20;
      group.add(crossTopV);
      group.add(crossTopH);

      // Front Face Red Cross
      const crossFrontV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.02), redMat);
      crossFrontV.position.set(0, 0, 0.23);
      const crossFrontH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.02), redMat);
      crossFrontH.position.set(0, 0, 0.23);
      group.add(crossFrontV);
      group.add(crossFrontH);

      // Red Carrying Handle on Top
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.04), handleMat);
      handle.position.set(0, 0.23, 0);
      group.add(handle);

      // 3D Floating Glowing Emerald Green Cross Symbol (Rotates above Medkit)
      const greenCrossGroup = new THREE.Group();
      greenCrossGroup.position.set(0, 0.55, 0);
      const greenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const gV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.06), greenMat);
      const gH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.06), greenMat);
      greenCrossGroup.add(gV);
      greenCrossGroup.add(gH);
      group.add(greenCrossGroup);
      group.userData.floatingCross = greenCrossGroup;

      const light = new THREE.PointLight(0x22c55e, 2.0, 4.5);
      light.position.y = 0.45;
      group.add(light);
    } else if (item.type === 'armor') {
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x00f6ff, metalness: 0.7, roughness: 0.2 });
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.15), shieldMat);
      group.add(shield);

      const light = new THREE.PointLight(0x00f6ff, 1.5, 5);
      light.position.y = 0.3;
      group.add(light);
    }

    if (this.arenaGroup) {
      this.arenaGroup.add(group);
    } else {
      this.scene.add(group);
    }

    this.groundLootMeshes.set(item.id, { group, data: item, initialY: item.y + 0.35 });
  }

  removeGroundLootMesh(id) {
    const loot = this.groundLootMeshes.get(id);
    if (loot) {
      if (loot.group.parent) loot.group.parent.remove(loot.group);
      this.groundLootMeshes.delete(id);
    }
  }

  renderCompassBar() {
    const bar = document.getElementById('hud-compass-bar');
    if (!this.inMatch || this.gameMode !== 'br' || document.getElementById('hud-overlay')?.classList.contains('hud-staging-mode')) {
      bar?.classList.add('hidden');
      return;
    }
    bar?.classList.remove('hidden');

    const canvas = document.getElementById('compass-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let headingDeg = ((-this.player.yaw * 180 / Math.PI) % 360 + 360) % 360;
    const fovDeg = 120;
    const pxPerDeg = w / fovDeg;
    const centerX = w / 2;

    ctx.strokeStyle = 'rgba(0, 246, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(w, h - 2);
    ctx.stroke();

    const cardinalLabels = {
      0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
      180: 'S', 225: 'SW', 270: 'W', 315: 'NW'
    };

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const startDeg = Math.floor((headingDeg - fovDeg / 2) / 15) * 15;
    const endDeg = Math.ceil((headingDeg + fovDeg / 2) / 15) * 15;

    for (let d = startDeg; d <= endDeg; d += 15) {
      const normDeg = ((d % 360) + 360) % 360;
      let diff = d - headingDeg;
      const x = centerX + diff * pxPerDeg;

      if (x < -10 || x > w + 10) continue;

      const isCardinal = (normDeg % 45 === 0);
      const tickH = isCardinal ? 12 : 6;

      ctx.strokeStyle = isCardinal ? 'rgba(0, 246, 255, 0.9)' : 'rgba(0, 246, 255, 0.4)';
      ctx.lineWidth = isCardinal ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, h - 2);
      ctx.lineTo(x, h - 2 - tickH);
      ctx.stroke();

      if (isCardinal) {
        ctx.font = 'bold 10px "Rajdhani", sans-serif';
        ctx.fillStyle = (normDeg === 0) ? '#ff0055' : '#00f6ff';
        ctx.fillText(cardinalLabels[normDeg] || `${normDeg}°`, x, 2);
      }
    }

    if (this.safeZone && this.safeZone.currentCenter) {
      const targetCenter = this.safeZone.currentCenter;
      const dx = targetCenter.x - this.player.x;
      const dz = targetCenter.z - this.player.z;
      const safeAngle = Math.atan2(dx, -dz);
      let safeDeg = ((safeAngle * 180 / Math.PI) % 360 + 360) % 360;

      let safeDiff = ((safeDeg - headingDeg + 540) % 360) - 180;
      const markerX = centerX + safeDiff * pxPerDeg;

      const clampedX = Math.max(16, Math.min(w - 16, markerX));
      ctx.font = 'bold 11px "Rajdhani", sans-serif';
      ctx.fillStyle = '#ff0066';
      ctx.fillText('◈ SAFE', clampedX, 4);

      ctx.fillStyle = '#ff0066';
      ctx.beginPath();
      ctx.arc(clampedX, h - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  updateBRInventoryHUD() {
    const invBar = document.getElementById('hud-br-inventory');
    if (!this.inMatch || this.gameMode !== 'br') {
      invBar?.classList.add('hidden');
      return;
    }
    invBar?.classList.remove('hidden');

    const primarySlot = document.getElementById('br-slot-primary');
    const secondarySlot = document.getElementById('br-slot-secondary');
    const primaryName = document.getElementById('br-name-primary');
    const secondaryName = document.getElementById('br-name-secondary');
    const medicName = document.getElementById('br-name-medkit');

    const curW = this.player.weapon;
    const isPistol = (curW === 'pistol');

    if (primarySlot) primarySlot.classList.toggle('active', !isPistol);
    if (secondarySlot) secondarySlot.classList.toggle('active', isPistol);

    if (primaryName) {
      if (!isPistol) {
        primaryName.textContent = this.weapons[curW]?.name.toUpperCase() || curW.toUpperCase();
      } else {
        primaryName.textContent = 'EMPTY (LOOT WEAPON)';
      }
    }
    if (secondaryName) {
      secondaryName.textContent = 'PLASMA PISTOL';
    }
    if (medicName) {
      const medCount = this.player.medic?.medkit || 0;
      medicName.textContent = `Medkits: x${medCount}`;
    }
  }

  updateSafeZoneMesh(dt) {
    if (!this.inMatch || this.gameMode !== 'br') {
      if (this.safeZoneMesh) this.safeZoneMesh.visible = false;
      return;
    }

    if (!this.safeZoneMesh) {
      const ringGeo = new THREE.CylinderGeometry(1, 1, 40, 32, 1, true);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.safeZoneMesh = new THREE.Mesh(ringGeo, ringMat);
      this.safeZoneMesh.userData.isNonCollidable = true;
      if (this.arenaGroup) {
        this.arenaGroup.add(this.safeZoneMesh);
      } else {
        this.scene.add(this.safeZoneMesh);
      }
    }

    this.safeZoneMesh.visible = true;

    if (this.safeZone) {
      const cx = this.safeZone.currentCenter ? this.safeZone.currentCenter.x : (this.safeZone.center ? this.safeZone.center.x : 0);
      const cz = this.safeZone.currentCenter ? this.safeZone.currentCenter.z : (this.safeZone.center ? this.safeZone.center.z : 0);
      const r = Math.max(0.5, this.safeZone.currentRadius || this.safeZone.radius || 90);
      this.safeZoneMesh.scale.set(r, 1, r);
      this.safeZoneMesh.position.set(cx, 20, cz);

      // Check distance from player to safeZone center
      const dx = (this.player?.x || 0) - cx;
      const dz = (this.player?.z || 0) - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const isOutside = dist > r;

      const vignette = document.getElementById('storm-vignette');
      if (vignette) {
        if (isOutside) {
          const pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.008);
          vignette.style.opacity = pulse.toString();
          this.stormAlarmTimer = (this.stormAlarmTimer || 0) + dt;
          if (this.stormAlarmTimer >= 1.0) {
            this.stormAlarmTimer = 0;
            sounds.playStormAlarm();
          }
        } else {
          vignette.style.opacity = '0';
          this.stormAlarmTimer = 0.9;
        }
      }
    }
  }

  launchVictoryConfetti() {
    const canvas = document.getElementById('victory-confetti-canvas');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = [];
    const colors = ['#ffd700', '#00f6ff', '#ff0066', '#ffffff', '#10b981'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        gravity: 0.35
      });
    }

    let active = true;
    const animate = () => {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rot += p.vRot;

        if (p.y < canvas.height + 20) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        requestAnimationFrame(animate);
      } else {
        active = false;
        canvas.classList.add('hidden');
      }
    };
    requestAnimationFrame(animate);
  }

  updateHudVitals() {
    const hp = Math.max(0, Math.round(this.player.health));
    const ap = Math.max(0, Math.round(this.player.armor));

    const hpVal = document.getElementById('hud-health-val');
    const hpBar = document.getElementById('hud-health-bar');
    const apVal = document.getElementById('hud-armor-val');
    const apBar = document.getElementById('hud-armor-bar');

    if (hpVal) hpVal.textContent = hp;
    if (hpBar) hpBar.style.width = `${hp}%`;
    if (apVal) apVal.textContent = ap;
    if (apBar) apBar.style.width = `${ap}%`;

    // Update Medic Slot Counts
    if (this.player.medic) {
      const bEl = document.getElementById('slot-count-bandage');
      const mEl = document.getElementById('slot-count-medkit');
      const sEl = document.getElementById('slot-count-battery');
      if (bEl) bEl.textContent = `x${this.player.medic.bandage ?? 0}`;
      if (mEl) mEl.textContent = `x${this.player.medic.medkit ?? 0}`;
      if (sEl) sEl.textContent = `x${this.player.medic.shield_battery ?? 0}`;
    }

    // Critical HP Heartbeat Audio below 35% HP (audio-only cue; red glow is strictly reserved for enemy bullet damage)
    if (hp > 0 && hp < 35 && this.inMatch && !this.isSpectating) {
      const now = Date.now();
      if (!this.lastHeartbeatTime || now - this.lastHeartbeatTime > 900) {
        this.lastHeartbeatTime = now;
        sounds.playHeartbeat();
      }
    }
  }

  startHealingChannelUI(itemName, durationMs) {
    const channelBox = document.getElementById('hud-healing-channel');
    const titleEl = document.getElementById('hc-item-name');
    const barEl = document.getElementById('hc-progress-bar');

    const circularBox = document.getElementById('hud-circular-healing');
    const chCircle = document.getElementById('ch-progress-circle');
    const chCountdown = document.getElementById('ch-countdown');
    const chItemName = document.getElementById('ch-item-name');
    const chIcon = document.getElementById('ch-icon');

    if (titleEl) titleEl.textContent = `APPLYING ${itemName.toUpperCase()}...`;
    if (chItemName) chItemName.textContent = `USING ${itemName.toUpperCase()}...`;
    if (chIcon) chIcon.textContent = itemName.includes('bandage') ? '🩹' : (itemName.includes('battery') ? '🔋' : '🧰');

    channelBox?.classList.remove('hidden');
    circularBox?.classList.remove('hidden');
    if (barEl) barEl.style.width = '0%';

    const totalCircumference = 263.89; // 2 * PI * 42
    if (chCircle) chCircle.style.strokeDashoffset = totalCircumference;

    const startTime = Date.now();
    clearInterval(this.healProgressIntv);
    this.healProgressIntv = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      const remainingSec = Math.max(0, ((durationMs - elapsed) / 1000)).toFixed(1);

      if (barEl) barEl.style.width = `${pct}%`;
      if (chCountdown) chCountdown.textContent = `${remainingSec}s`;
      if (chCircle) {
        const offset = totalCircumference - (totalCircumference * (pct / 100));
        chCircle.style.strokeDashoffset = offset;
      }

      if (pct >= 100) {
        clearInterval(this.healProgressIntv);
        circularBox?.classList.add('hidden');
        channelBox?.classList.add('hidden');
      }
    }, 40);
  }

  cancelHealingChannelUI() {
    clearInterval(this.healProgressIntv);
    const channelBox = document.getElementById('hud-healing-channel');
    const circularBox = document.getElementById('hud-circular-healing');
    const barEl = document.getElementById('hc-progress-bar');
    if (channelBox) channelBox.classList.add('hidden');
    if (circularBox) circularBox.classList.add('hidden');
    if (barEl) barEl.style.width = '0%';
  }

  useMedicItem(itemKey) {
    if (!this.inMatch || this.isSpectating || !this.player.health) return;
    if (this.player.isHealing) {
      this.showToast('Already applying medic item...', 'amber');
      return;
    }
    if (!this.player.medic || (this.player.medic[itemKey] || 0) <= 0) {
      this.showToast('No items remaining!', 'amber');
      return;
    }
    if (itemKey === 'bandage' && this.player.health >= 75) {
      this.showToast('Nanite Bandage only heals up to 75 HP', 'amber');
      return;
    }
    if (itemKey === 'medkit' && this.player.health >= 100) {
      this.showToast('Health is already full (100 HP)', 'amber');
      return;
    }
    if (itemKey === 'shield_battery' && this.player.armor >= 100) {
      this.showToast('Shield is already fully charged', 'amber');
      return;
    }

    this.socket.emit('startHealing', { item: itemKey });
  }

  updateHudAmmo() {
    const w = this.weapons[this.player.weapon] || this.weapons.ar;
    const ammoData = this.player.ammo[this.player.weapon] || { mag: 0, reserve: 0 };
    const nameEl = document.getElementById('hud-weapon-name');
    const iconEl = document.getElementById('hud-weapon-icon');
    const slotEl = document.getElementById('hud-weapon-slot');
    const magEl = document.getElementById('hud-ammo-mag');
    const reserveEl = document.getElementById('hud-ammo-reserve');

    if (nameEl) nameEl.textContent = w.name;
    if (iconEl) iconEl.textContent = w.icon;
    if (slotEl) slotEl.textContent = `SLOT ${w.slot}`;
    if (magEl) magEl.textContent = ammoData.mag;
    if (reserveEl) reserveEl.textContent = ammoData.reserve;

    // Update interactive weapon pill strip
    document.querySelectorAll('.weapon-slot-pill').forEach((pill) => {
      const pWeapon = pill.dataset.weapon;
      if (pWeapon === this.player.weapon) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
      const pAmmo = this.player.ammo[pWeapon];
      const countEl = pill.querySelector('.pill-ammo-count');
      if (countEl && pAmmo) {
        countEl.textContent = `${pAmmo.mag}`;
      }
    });

    // Update mobile weapon tabs
    document.querySelectorAll('.m-weapon-tab').forEach((tab) => {
      if (tab.dataset.weapon === this.player.weapon) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  renderMinimap() {
    if (!this.inMatch || document.getElementById('hud-overlay')?.classList.contains('hud-staging-mode')) return;
    const canvas = document.getElementById('hud-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const px = this.player.x;
    const pz = this.player.z;
    const scale = 1.35; // 1.35px per meter (~48m radius viewport)

    ctx.clearRect(0, 0, w, h);

    // Circular radar clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.clip();

    // Concentric range circles
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.15)';
    ctx.lineWidth = 1;
    [20, 40, 58].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshair reference axes
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Sweeping radar beam animation
    const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
    const grad = ctx.createLinearGradient(
      cx, cy,
      cx + Math.cos(sweepAngle) * cx,
      cy + Math.sin(sweepAngle) * cy
    );
    grad.addColorStop(0, 'rgba(0, 246, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 246, 255, 0.0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * cx, cy + Math.sin(sweepAngle) * cy);
    ctx.stroke();

    // Map Boundaries [-40, 40] in world space
    const bMinX = cx + (-40 - px) * scale;
    const bMaxX = cx + (40 - px) * scale;
    const bMinZ = cy + (-40 - pz) * scale;
    const bMaxZ = cy + (40 - pz) * scale;
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bMinX, bMinZ, bMaxX - bMinX, bMaxZ - bMinZ);

    // Map Obstacles
    if (this.obstacleBoxes && this.obstacleBoxes.length > 0) {
      ctx.fillStyle = 'rgba(0, 246, 255, 0.18)';
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.45)';
      ctx.lineWidth = 1;
      for (const box of this.obstacleBoxes) {
        // Exclude huge perimeter outer walls
        const bw = box.max.x - box.min.x;
        const bd = box.max.z - box.min.z;
        if (bw >= 70 || bd >= 70) continue;

        const rx = cx + (box.min.x - px) * scale;
        const rz = cy + (box.min.z - pz) * scale;
        const rw = bw * scale;
        const rd = bd * scale;
        ctx.fillRect(rx, rz, rw, rd);
        ctx.strokeRect(rx, rz, rw, rd);
      }
    }

    // Jump-Pads
    if (this.jumpPads && this.jumpPads.length > 0) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      for (const jp of this.jumpPads) {
        const jx = cx + (jp.x - px) * scale;
        const jz = cy + (jp.z - pz) * scale;
        ctx.beginPath();
        ctx.arc(jx, jz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Safe Zone Storm (BR Mode)
    if (this.gameMode === 'br' && (this.safeZone || this.currentStorm)) {
      const center = this.safeZone?.currentCenter || { x: 0, z: 0 };
      const radius = this.safeZone ? this.safeZone.currentRadius : (this.currentStorm?.radius || 40);
      const sx = cx + (center.x - px) * scale;
      const sz = cy + (center.z - pz) * scale;
      const sr = radius * scale;
      ctx.strokeStyle = '#ff0066';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sz, Math.max(1, sr), 0, Math.PI * 2);
      ctx.stroke();

      if (this.safeZone && this.safeZone.targetRadius < this.safeZone.currentRadius) {
        const tx = cx + (this.safeZone.targetCenter.x - px) * scale;
        const tz = cy + (this.safeZone.targetCenter.z - pz) * scale;
        const tr = this.safeZone.targetRadius * scale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(tx, tz, Math.max(1, tr), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Remote Combatants (Teammates vs Enemies)
    for (const [, ent] of this.remoteEntities) {
      if (!ent.mesh || !ent.mesh.visible) continue;
      const ex = cx + (ent.mesh.position.x - px) * scale;
      const ey = cy + (ent.mesh.position.z - pz) * scale;

      const isTeammate = (this.gameMode === 'tdm' && ent.team === this.player.team);
      ctx.fillStyle = isTeammate ? '#00f6ff' : '#ff0055';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow ring
      ctx.strokeStyle = isTeammate ? 'rgba(0, 246, 255, 0.6)' : 'rgba(255, 0, 85, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Local Player Arrow at Center (facing camera yaw)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.player.yaw + Math.PI);

    // Player Field of View Cone
    ctx.fillStyle = 'rgba(0, 246, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 24, -Math.PI / 4, Math.PI / 4);
    ctx.closePath();
    ctx.fill();

    // Direction Arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 7); // Apex pointing forward
    ctx.lineTo(-4, -4);
    ctx.lineTo(0, -2);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // Restore circular clip

    // Update coordinate text in minimap header
    const coordsEl = document.getElementById('minimap-coords');
    if (coordsEl) {
      coordsEl.textContent = `X: ${Math.round(this.player.x)} | Z: ${Math.round(this.player.z)}`;
    }
  }

  // -------------------------------------------------------------
  // 13. FRAME UPDATE & PHYSICS LOOP
  // -------------------------------------------------------------
  renderLoop(time) {
    requestAnimationFrame((t) => this.renderLoop(t));

    const dt = Math.min(0.1, (time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;

    if (this.inMatch && !this.isSpectating) {
      this.updatePlayerPhysics(dt);
      this.updateViewmodel(dt);
      this.sendInputToServer();
      this.renderMinimap();
      this.renderCompassBar();
      this.updateBRInventoryHUD();
      this.updateLootProximity();
    } else if (this.inMatch && this.isSpectating) {
      if (this.spectateTargetId) {
        const target = this.remoteEntities.get(this.spectateTargetId);
        if (target && target.mesh) {
          const pos = target.mesh.position;
          this.camera.position.set(pos.x, pos.y + 2.5, pos.z + 4.5);
          this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);
        }
      }
      this.renderMinimap();
    } else if (!this.inMatch) {
      this.updateLobbyScene(dt, time);
    }

    this.interpolateRemoteEntities(dt);
    this.animateArenaObjects(dt);
    this.updateSafeZoneMesh(dt);

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerPhysics(dt) {
    if (!this.inMatch) return;
    if (this.isPaused && !this.isDroppingBR) return;
    const isSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchJoystick.isSprint || (this.touchJoystick.active && this.touchJoystick.y < -0.85);
    const hasOverdrive = Date.now() < this.player.speedBoostUntil;

    // Standard walk speed 6.0 m/s, sprint 9.5 m/s
    let baseSpeed = 6.0;
    if (isSprint) baseSpeed = 9.5;
    if (hasOverdrive) baseSpeed = 14.5;

    // While applying medic items, player walking speed is slowed by 50%
    if (this.player.isHealing) {
      baseSpeed *= 0.5;
    }

    // Movement Direction:
    let forward = 0;
    let strafe = 0;

    if (!this.isDroppingBR) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) strafe += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafe -= 1;

      // Mobile Virtual Joystick input
      if (this.touchJoystick.active) {
        strafe += this.touchJoystick.x;
        forward -= this.touchJoystick.y;
      }
    }

    // Action lock cancellation: Sprinting, jumping, or firing cancels healing immediately
    if (this.player.isHealing) {
      if ((isSprint && (forward !== 0 || strafe !== 0)) || this.keys['Space']) {
        this.player.isHealing = false;
        this.player.healItem = null;
        this.socket?.emit('cancelHealing');
        this.cancelHealingChannelUI();
        this.showToast('Healing cancelled by movement', 'amber');
      }
    }

    const len = Math.sqrt(strafe * strafe + forward * forward);
    if (len > 0) {
      strafe /= len;
      forward /= len;
    }

    // Camera Direction Vectors in Three.js coordinates
    const forwardX = -Math.sin(this.player.yaw);
    const forwardZ = -Math.cos(this.player.yaw);
    const rightX = Math.cos(this.player.yaw);
    const rightZ = -Math.sin(this.player.yaw);

    const targetVx = (forwardX * forward + rightX * strafe) * baseSpeed;
    const targetVz = (forwardZ * forward + rightZ * strafe) * baseSpeed;

    this.player.vx = THREE.MathUtils.lerp(this.player.vx, targetVx, dt * 16);
    this.player.vz = THREE.MathUtils.lerp(this.player.vz, targetVz, dt * 16);

    // Forward camera tilt during sprint (+2 degrees = 0.0349 rad)
    const targetTilt = (isSprint && forward > 0) ? 0.0349 : 0.0;
    this.cameraSprintTilt = THREE.MathUtils.lerp(this.cameraSprintTilt, targetTilt, dt * 8);

    // Kirka-Style Jump Mechanics: +8.5 m/s impulse, -20 m/s^2 gravity
    if (this.keys['Space'] && this.player.isGrounded) {
      this.player.vy = 8.5;
      this.player.isGrounded = false;
      sounds.playJumpBoost();
    }

    // Battle Royale Sky Drop Physics & Digital Thrusters (Phase 2)
    if (this.isDroppingBR) {
      forward = 0;
      strafe = 0;
      const gh = this.getGroundHeight(this.player.x, this.player.z, this.player.y);
      this.player.vy = -10.0;
      // While descending, render cyan thruster/flame particle bursts under feet
      this.spawnThrusterParticles(new THREE.Vector3(this.player.x, this.player.y - 0.2, this.player.z));
      if (this.player.y <= Math.max(gh, 1.0)) {
        this.player.y = Math.max(gh, 0);
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.isDroppingBR = false;
        this.cameraLandingDip = -0.1;
        sounds.playLandingThud();
      }
    } else {
      this.player.vy -= 20.0 * dt; // Realistic Gravity: -20 m/s^2
    }

    // Proposed vertical position
    let newY = this.player.y + this.player.vy * dt;

    // Platform, Catwalk, Ramp & Floor Detection
    const playerRadius = 0.6;
    const playerHeight = 1.8;
    let groundY = this.getGroundHeight(this.player.x, this.player.z, newY);

    // Map Jump-Pads Interaction (+18 to +22 m/s vertical lift + sparks)
    for (const jp of this.jumpPadDefs) {
      const dJp = Math.sqrt((this.player.x - jp.x) ** 2 + (this.player.z - jp.z) ** 2);
      if (dJp < 2.3 && this.player.isGrounded) {
        this.player.vy = jp.boostY;
        this.player.vx += jp.boostX;
        this.player.vz += jp.boostZ;
        this.player.isGrounded = false;
        sounds.playJumpBoost();
        this.spawnJumpPadSparks(new THREE.Vector3(jp.x, 0.35, jp.z));
        break;
      }
    }

    // Ground Touchdown & Landing Camera Dip (-0.1m) with Thud
    const wasAirborne = !this.player.isGrounded;
    if (newY <= groundY) {
      newY = groundY;
      if (wasAirborne && (this.player.vy < -3.0 || this.isDroppingBR)) {
        this.cameraLandingDip = -0.1;
        sounds.playLandingThud();
      }
      this.player.vy = 0;
      this.player.isGrounded = true;

      if (this.isDroppingBR) {
        this.isDroppingBR = false;
        this.brThrustersDeployed = false;
      }
    } else {
      this.player.isGrounded = false;
    }

    // AXIS-SEPARATED AABB OBSTACLE COLLISION WITH WALL SLIDING
    const dx = this.player.vx * dt;
    const dz = this.player.vz * dt;
    let newX = this.player.x;
    let newZ = this.player.z;

    // 1. Candidate X Movement Evaluation
    if (Math.abs(dx) > 0.0001) {
      const candX = this.player.x + dx;
      const testBoxX = new THREE.Box3(
        new THREE.Vector3(candX - playerRadius, newY, this.player.z - playerRadius),
        new THREE.Vector3(candX + playerRadius, newY + playerHeight, this.player.z + playerRadius)
      );
      let hitObstacleX = false;
      for (const box of this.obstacleBoxes) {
        if (newY >= box.max.y - 0.1) continue;
        if (newY + playerHeight <= box.min.y + 0.1) continue;
        if (testBoxX.intersectsBox(box)) {
          hitObstacleX = true;
          break;
        }
      }
      if (!hitObstacleX && Math.abs(candX) <= 37.4) {
        newX = candX;
      } else {
        this.player.vx = 0;
      }
    }

    // 2. Candidate Z Movement Evaluation (evaluated against updated newX)
    if (Math.abs(dz) > 0.0001) {
      const candZ = this.player.z + dz;
      const testBoxZ = new THREE.Box3(
        new THREE.Vector3(newX - playerRadius, newY, candZ - playerRadius),
        new THREE.Vector3(newX + playerRadius, newY + playerHeight, candZ + playerRadius)
      );
      let hitObstacleZ = false;
      for (const box of this.obstacleBoxes) {
        if (newY >= box.max.y - 0.1) continue;
        if (newY + playerHeight <= box.min.y + 0.1) continue;
        if (testBoxZ.intersectsBox(box)) {
          hitObstacleZ = true;
          break;
        }
      }
      if (!hitObstacleZ && Math.abs(candZ) <= 37.4) {
        newZ = candZ;
      } else {
        this.player.vz = 0;
      }
    }

    // Arena boundary clamp [-37.4, 37.4]
    this.player.x = Math.max(-37.4, Math.min(37.4, newX));
    this.player.y = newY;
    this.player.z = Math.max(-37.4, Math.min(37.4, newZ));

    // Collision De-penetration Safety Push-out:
    // If the player clips into an obstacle box or wall, gently push them out along the shallowest penetration axis
    if (this.obstacleBoxes && this.obstacleBoxes.length > 0) {
      const currentBox = new THREE.Box3(
        new THREE.Vector3(this.player.x - playerRadius, this.player.y, this.player.z - playerRadius),
        new THREE.Vector3(this.player.x + playerRadius, this.player.y + playerHeight, this.player.z + playerRadius)
      );
      for (const box of this.obstacleBoxes) {
        if (this.player.y >= box.max.y - 0.1 || this.player.y + playerHeight <= box.min.y + 0.1) continue;
        if (currentBox.intersectsBox(box)) {
          const overlapX1 = currentBox.max.x - box.min.x;
          const overlapX2 = box.max.x - currentBox.min.x;
          const overlapZ1 = currentBox.max.z - box.min.z;
          const overlapZ2 = box.max.z - currentBox.min.z;
          const pushX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
          const pushZ = overlapZ1 < overlapZ2 ? -overlapZ1 : overlapZ2;

          if (Math.abs(pushX) < Math.abs(pushZ)) {
            this.player.x += pushX;
          } else {
            this.player.z += pushZ;
          }
        }
      }
    }

    // Update Camera position and orientation (eye height: 1.65m + landing dip)
    if (this.deathCamActive) {
      // 45-degree deathcam looking down at victim death spot
      const camY = this.deathCamPos.y + 4.5;
      const camZ = this.deathCamPos.z + 4.5;
      this.camera.position.set(this.deathCamPos.x, camY, camZ);
      this.camera.lookAt(this.deathCamPos.x, this.deathCamPos.y + 0.6, this.deathCamPos.z);
    } else {
      const eyeHeight = 1.65 + this.cameraLandingDip;
      this.cameraLandingDip = THREE.MathUtils.lerp(this.cameraLandingDip, 0, dt * 10);
      this.camera.position.set(this.player.x, this.player.y + eyeHeight, this.player.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch + this.cameraSprintTilt;
    }

    // Update Local Spawn Shield Bubble
    if (this.localShieldBubble && this.localShieldBubble.visible) {
      this.localShieldBubble.position.set(this.player.x, this.player.y + 1.1, this.player.z);
      this.localShieldBubble.rotation.y += dt * 1.5;
    }

    // Loot Proximity Detection Radius: 2.5m
    this.updateLootProximity();

    // Weapon firing: semi-auto check for pistol, full auto / pump for others
    if (this.mouseButtons.left && !this.deathCamActive) {
      const curW = this.weapons[this.player.weapon];
      if (curW && curW.type === 'semi-auto') {
        if (this.pistolCanShoot) {
          this.fireWeapon();
          this.pistolCanShoot = false;
        }
      } else {
        this.fireWeapon();
      }
    }
  }

  updateLootProximity() {
    let closestItem = null;
    let closestDistSq = 2.5 * 2.5; // 2.5m proximity radius

    // Check ground loot items (BR 16 scattered items across crates and floors)
    if (this.groundLootMeshes && this.groundLootMeshes.size > 0) {
      for (const [id, itemObj] of this.groundLootMeshes) {
        if (!itemObj || !itemObj.group) continue;
        const g = itemObj.group;
        const dx = this.player.x - g.position.x;
        const dz = this.player.z - g.position.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < closestDistSq) {
          closestDistSq = dSq;
          let icon = '🔫';
          if (itemObj.data?.type === 'ammo') icon = '📦';
          else if (itemObj.data?.type === 'medkit') icon = '➕';
          else if (itemObj.data?.type === 'armor') icon = '🛡️';
          closestItem = {
            id,
            name: itemObj.data?.name || 'Ground Loot',
            icon,
            isGroundLoot: true,
            itemData: itemObj.data
          };
        }
      }
    }

    // Check dropped loot crates
    for (const [id, crateGroup] of this.lootCrateMeshes) {
      const dx = this.player.x - crateGroup.position.x;
      const dz = this.player.z - crateGroup.position.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestItem = { id, name: 'Cyber Loot Crate', icon: '🧰' };
      }
    }

    // Check power-up stations
    for (const [id, puGroup] of this.powerUpMeshes) {
      const dx = this.player.x - puGroup.position.x;
      const dz = this.player.z - puGroup.position.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        let name = 'Cyber Medkit';
        let icon = '🧰';
        if (id.includes('ammo')) { name = 'Ammo Crate'; icon = '⚡'; }
        else if (id.includes('armor')) { name = 'Shield Battery'; icon = '🛡️'; }
        else if (id.includes('speed')) { name = 'Quantum Overdrive'; icon = '⚡'; }
        closestItem = { id, name, icon };
      }
    }

    this.nearestLootItem = closestItem;
    const promptCard = document.getElementById('loot-proximity-prompt');
    const promptTitle = document.getElementById('lp-item-name');
    const promptIcon = document.getElementById('lp-item-icon');
    const mobilePickup = document.getElementById('mbtn-pickup');

    if (closestItem && this.inMatch && !this.isSpectating && !this.deathCamActive) {
      if (promptTitle) {
        promptTitle.textContent = closestItem.isGroundLoot ? `[F] TAKE ${closestItem.name.toUpperCase()}` : closestItem.name.toUpperCase();
      }
      if (promptIcon) promptIcon.textContent = closestItem.icon;
      promptCard?.classList.remove('hidden');
      mobilePickup?.classList.remove('hidden');
    } else {
      promptCard?.classList.add('hidden');
      mobilePickup?.classList.add('hidden');
    }
  }

  updateViewmodel(dt) {
    if (!this.viewmodelGun) return;

    // Strictly enforce active weapon mesh visibility
    if (this.viewmodelMeshes) {
      for (const [key, mesh] of Object.entries(this.viewmodelMeshes)) {
        mesh.visible = (key === this.player.weapon);
      }
    }

    const adsMult = this.player.isADS ? 0.5 : 1.0;
    const defaultX = this.viewmodelBasePos.x;
    const defaultY = this.viewmodelBasePos.y;
    const defaultZ = this.viewmodelBasePos.z;

    const adsX = this.viewmodelAdsPos.x;
    const adsY = this.viewmodelAdsPos.y;
    const adsZ = this.viewmodelAdsPos.z;

    const speed = Math.sqrt(this.player.vx * this.player.vx + this.player.vz * this.player.vz);
    this.viewmodelTime = (this.viewmodelTime || 0) + dt;

    let targetX = defaultX;
    let targetY = defaultY;
    let targetZ = defaultZ;
    let rotZ = 0;

    if (this.player.isADS) {
      // Snappy ADS Centering (Right Click / Mobile ADS Button):
      targetX = adsX;
      targetY = adsY;
      targetZ = adsZ;

      if (speed >= 0.2 && this.player.isGrounded) {
        this.walkCycle = (this.walkCycle || 0) + dt;
        targetY = adsY + Math.abs(Math.sin(this.walkCycle * 8)) * 0.02 * adsMult;
        targetX = adsX + Math.cos(this.walkCycle * 4) * 0.025 * adsMult;
        rotZ = Math.cos(this.walkCycle * 4) * 0.03 * adsMult;
      } else {
        targetY = adsY + Math.sin(this.viewmodelTime * 2.5) * 0.005 * adsMult;
        targetX = adsX + Math.cos(this.viewmodelTime * 1.25) * 0.003 * adsMult;
      }
    } else {
      if (speed < 0.2) {
        // Idle Breathing Bob
        targetY = defaultY + Math.sin(this.viewmodelTime * 2.5) * 0.005;
        targetX = defaultX + Math.cos(this.viewmodelTime * 1.25) * 0.003;
      } else if (this.player.isGrounded) {
        // Walking / Running Weapon Sway
        this.walkCycle = (this.walkCycle || 0) + dt;
        targetY = defaultY + Math.abs(Math.sin(this.walkCycle * 8)) * 0.02;
        targetX = defaultX + Math.cos(this.walkCycle * 4) * 0.025;
        rotZ = Math.cos(this.walkCycle * 4) * 0.03;
      }
    }

    // Weapon Swap Animation State Machine (150ms drop, swap model & cock, 150ms rise)
    let swapOffsetY = 0;
    if (this.weaponSwapState && this.weaponSwapState.isSwapping) {
      this.weaponSwapState.progress += dt / 0.15;
      if (this.weaponSwapState.phase === 1) {
        // Lowering gun downwards
        swapOffsetY = -Math.sin(Math.min(1, this.weaponSwapState.progress) * (Math.PI / 2)) * 0.35;
        if (this.weaponSwapState.progress >= 1.0) {
          this.player.weapon = this.weaponSwapState.pendingWeapon;
          this.weaponSwapState.phase = 2; // Raising
          this.weaponSwapState.progress = 0;
          if (this.viewmodelMeshes) {
            for (const [key, mesh] of Object.entries(this.viewmodelMeshes)) {
              mesh.visible = (key === this.player.weapon);
            }
          }
          sounds.playWeaponCock();
          this.updateHudAmmo();
          if (this.socket && this.inMatch) {
            this.socket.emit('switchWeapon', { weapon: this.player.weapon });
          }
        }
      } else if (this.weaponSwapState.phase === 2) {
        // Raising gun from bottom
        swapOffsetY = -Math.cos(Math.min(1, this.weaponSwapState.progress) * (Math.PI / 2)) * 0.35;
        if (this.weaponSwapState.progress >= 1.0) {
          this.weaponSwapState.isSwapping = false;
          this.weaponSwapState.phase = 0;
          this.weaponSwapState.pendingWeapon = null;
          swapOffsetY = 0;
        }
      }
    }

    targetY += swapOffsetY;

    // Shotgun pump action slide kickback & recovery
    if (this.shotgunPumpOffset > 0) {
      this.shotgunPumpOffset = Math.max(0, this.shotgunPumpOffset - dt * 0.45);
      if (this.viewmodelMeshes && this.viewmodelMeshes.shotgun && this.viewmodelMeshes.shotgun.userData.pumpSlide) {
        this.viewmodelMeshes.shotgun.userData.pumpSlide.position.z = 0.25 + this.shotgunPumpOffset;
      }
    }

    // Dynamic Recoil Kickback
    this.viewmodelRecoilZ = THREE.MathUtils.lerp(this.viewmodelRecoilZ, 0, dt * 15);
    this.viewmodelRecoilPitch = THREE.MathUtils.lerp(this.viewmodelRecoilPitch, 0, dt * 15);

    this.viewmodelGun.position.x = THREE.MathUtils.lerp(this.viewmodelGun.position.x, targetX, dt * 15);
    this.viewmodelGun.position.y = THREE.MathUtils.lerp(this.viewmodelGun.position.y, targetY, dt * 15);
    this.viewmodelGun.position.z = THREE.MathUtils.lerp(this.viewmodelGun.position.z, targetZ + this.viewmodelRecoilZ, dt * 15);

    this.viewmodelGun.rotation.x = THREE.MathUtils.lerp(this.viewmodelGun.rotation.x, -this.viewmodelRecoilPitch, dt * 15);
    this.viewmodelGun.rotation.z = THREE.MathUtils.lerp(this.viewmodelGun.rotation.z, rotZ, dt * 15);

    // Muzzle Flash Decay
    if (this.muzzleFlashMesh && this.muzzleFlashMesh.material.opacity > 0) {
      this.muzzleFlashMesh.material.opacity = Math.max(0, this.muzzleFlashMesh.material.opacity - dt * 20);
      this.muzzleFlashMesh.scale.multiplyScalar(0.88);
    }

    // 5. ADS FOV & Full-Screen Cyber Sniper Scope Overlay
    const isSniper = (this.player.weapon === 'sniper');
    const targetFov = this.player.isADS ? (isSniper ? 25 : 50) : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 15);
    this.camera.updateProjectionMatrix();

    // Toggle sniper optic overlay
    const sniperScopeEl = document.getElementById('cyber-sniper-scope');
    const crosshairEl = document.getElementById('crosshair');
    if (this.player.isADS && isSniper) {
      sniperScopeEl?.classList.remove('hidden');
      crosshairEl?.classList.add('hidden');
      this.viewmodelGun.visible = false;
    } else {
      sniperScopeEl?.classList.add('hidden');
      if (crosshairEl) crosshairEl.classList.remove('hidden');
      this.viewmodelGun.visible = !this.deathCamActive;
    }
  }

  sendInputToServer() {
    if (!this.socket || !this.inMatch) return;
    const now = Date.now();
    if (now - (this.lastInputSendTime || 0) < 32) return;
    this.lastInputSendTime = now;
    this.socket.emit('playerInput', {
      x: this.player.x,
      y: this.player.y,
      z: this.player.z,
      yaw: this.player.yaw,
      pitch: this.player.pitch
    });
  }

  interpolateRemoteEntities(dt) {
    for (const [, ent] of this.remoteEntities) {
      if (!ent.mesh) continue;
      ent.mesh.position.lerp(ent.targetPos, Math.min(1, dt * 15));
      ent.mesh.rotation.y = THREE.MathUtils.lerp(ent.mesh.rotation.y, ent.targetYaw, Math.min(1, dt * 15));

      ent.animTime = (ent.animTime || 0) + dt;

      // 1. Visor & Weapon Pitch Tilting (slaved to camera pitch angle)
      const targetPitch = ent.targetPitch || 0;
      if (ent.mesh.userData.headGroup) {
        ent.mesh.userData.headGroup.rotation.x = THREE.MathUtils.lerp(
          ent.mesh.userData.headGroup.rotation.x,
          targetPitch,
          dt * 15
        );
      }
      if (ent.mesh.userData.weaponPivot) {
        ent.mesh.userData.weaponPivot.rotation.x = THREE.MathUtils.lerp(
          ent.mesh.userData.weaponPivot.rotation.x,
          targetPitch,
          dt * 15
        );
      }

      // 2. Shield Bubble Visibility & Rotation
      if (ent.mesh.userData.shieldBubble) {
        ent.mesh.userData.shieldBubble.visible = !!ent.isInvulnerable;
        if (ent.mesh.userData.shieldBubble.visible) {
          ent.mesh.userData.shieldBubble.rotation.y += dt * 1.5;
        }
      }

      // 3. Locomotion & Jump Animation
      const isAirborne = (ent.mesh.position.y > 0.45);
      if (this.gameMode === 'br' && ent.mesh.position.y > 2.0) {
        if (Math.random() < 0.3) {
          this.spawnThrusterParticles(new THREE.Vector3(ent.mesh.position.x, ent.mesh.position.y - 0.2, ent.mesh.position.z));
        }
      }
      const distToTarget = ent.mesh.position.distanceTo(ent.targetPos);
      const isMoving = distToTarget > 0.05;

      if (isAirborne) {
        // Jump Pose: freeze leg swing: legs tuck backward (rotation.x = -0.4), arms raise upward slightly (rotation.z = ±0.3)
        if (ent.mesh.userData.legL) ent.mesh.userData.legL.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.legL.rotation.x, -0.4, dt * 12);
        if (ent.mesh.userData.legR) ent.mesh.userData.legR.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.legR.rotation.x, -0.4, dt * 12);
        if (ent.mesh.userData.armL) {
          ent.mesh.userData.armL.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.x, -0.88, dt * 12);
          ent.mesh.userData.armL.rotation.y = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.y, 0.28, dt * 12);
          ent.mesh.userData.armL.rotation.z = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.z, 0.65, dt * 12);
        }
        if (ent.mesh.userData.armR) {
          ent.mesh.userData.armR.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.x, -0.65, dt * 12);
          ent.mesh.userData.armR.rotation.y = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.y, -0.18, dt * 12);
          ent.mesh.userData.armR.rotation.z = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.z, -0.42, dt * 12);
        }
        if (ent.mesh.userData.headGroup) {
          ent.mesh.userData.headGroup.position.y = THREE.MathUtils.lerp(ent.mesh.userData.headGroup.position.y, 1.8, dt * 10);
        }
      } else if (isMoving) {
        // Walking Leg Animation: velocity > 0.1, swing leftLeg.rotation.x = Math.sin(animTime * 10) * 0.6 and rightLeg.rotation.x = -Math.sin(animTime * 10) * 0.6
        const legSwing = Math.sin(ent.animTime * 10) * 0.6;
        if (ent.mesh.userData.legL) ent.mesh.userData.legL.rotation.x = legSwing;
        if (ent.mesh.userData.legR) ent.mesh.userData.legR.rotation.x = -legSwing;

        // Tactical two-handed weapon running sway
        const gunBob = Math.sin(ent.animTime * 10) * 0.08;
        if (ent.mesh.userData.armL) {
          ent.mesh.userData.armL.rotation.x = -0.88 + gunBob;
          ent.mesh.userData.armL.rotation.y = 0.28;
          ent.mesh.userData.armL.rotation.z = 0.65;
        }
        if (ent.mesh.userData.armR) {
          ent.mesh.userData.armR.rotation.x = -0.65 + gunBob;
          ent.mesh.userData.armR.rotation.y = -0.18;
          ent.mesh.userData.armR.rotation.z = -0.42;
        }

        // Head / Helmet Bobbing: Helmet bounces slightly up and down Math.abs(Math.sin(animTime * 10)) * 0.05
        if (ent.mesh.userData.headGroup) {
          ent.mesh.userData.headGroup.position.y = 1.8 + Math.abs(Math.sin(ent.animTime * 10)) * 0.05;
        }
      } else {
        // Idle recovery: return to two-handed tactical rifle pose
        if (ent.mesh.userData.legL) ent.mesh.userData.legL.rotation.x *= 0.85;
        if (ent.mesh.userData.legR) ent.mesh.userData.legR.rotation.x *= 0.85;
        if (ent.mesh.userData.armL) {
          ent.mesh.userData.armL.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.x, -0.88, dt * 10);
          ent.mesh.userData.armL.rotation.y = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.y, 0.28, dt * 10);
          ent.mesh.userData.armL.rotation.z = THREE.MathUtils.lerp(ent.mesh.userData.armL.rotation.z, 0.65, dt * 10);
        }
        if (ent.mesh.userData.armR) {
          ent.mesh.userData.armR.rotation.x = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.x, -0.65, dt * 10);
          ent.mesh.userData.armR.rotation.y = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.y, -0.18, dt * 10);
          ent.mesh.userData.armR.rotation.z = THREE.MathUtils.lerp(ent.mesh.userData.armR.rotation.z, -0.42, dt * 10);
        }
        if (ent.mesh.userData.headGroup) {
          ent.mesh.userData.headGroup.position.y = THREE.MathUtils.lerp(ent.mesh.userData.headGroup.position.y, 1.8, dt * 10);
        }
      }
    }
  }

  spawnThrusterParticles(pos) {
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f6ff, transparent: true, opacity: 1 });
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.position.x += (Math.random() - 0.5) * 0.4;
    p.position.z += (Math.random() - 0.5) * 0.4;
    this.scene.add(p);
    this.thrusterParticles.push({ mesh: p, createdAt: Date.now(), lifeMs: 300 });
  }

  animateArenaObjects(dt) {
    const now = Date.now();

    // 1. Rotate power-ups (float 0.3m above ground with slow rotation and gentle neon glow)
    for (const [, puGroup] of this.powerUpMeshes) {
      puGroup.rotation.y += dt * 1.5;
      puGroup.position.y += Math.sin(now * 0.003) * 0.002;
    }

    // 2. Rotate loot crates and pulse beacon
    for (const [, crateMesh] of this.lootCrateMeshes) {
      if (crateMesh.userData.holo) crateMesh.userData.holo.rotation.y += dt * 2.5;
      if (crateMesh.userData.beacon) {
        crateMesh.userData.beacon.rotation.y -= dt * 0.8;
        const pulse = 0.35 + 0.15 * Math.sin(now * 0.005);
        if (crateMesh.userData.beacon.material) crateMesh.userData.beacon.material.opacity = pulse;
      }
    }

    // 3. Pulse jump-pads
    for (const jp of this.jumpPadMeshes) {
      jp.rotation.y += dt * 2.0;
    }

    // 4. Rotate and bob ground loot
    if (this.groundLootMeshes && this.groundLootMeshes.size > 0) {
      for (const [, loot] of this.groundLootMeshes) {
        loot.group.rotation.y += dt * 1.5;
        loot.group.position.y = loot.initialY + Math.sin(now * 0.003 + loot.group.position.x) * 0.08;
        if (loot.group.userData.floatingCross) {
          loot.group.userData.floatingCross.rotation.y += dt * 2.0;
        }
      }
    }

    // 4. Update Voxel Debris Physics
    for (let i = this.voxelDebris.length - 1; i >= 0; i--) {
      const item = this.voxelDebris[i];
      const elapsed = now - item.createdAt;
      const progress = elapsed / item.lifeMs;

      if (progress >= 1.0) {
        this.scene.remove(item.group);
        item.group.traverse((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        this.voxelDebris.splice(i, 1);
      } else {
        for (const p of item.particles) {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 20.0 * dt; // Gravity on voxel debris
          p.mesh.rotation.x += p.rotX * dt;
          p.mesh.rotation.y += p.rotY * dt;
          p.mesh.rotation.z += p.rotZ * dt;
          if (p.mesh.material) p.mesh.material.opacity = 1.0 - progress;
        }
      }
    }

    // 5. Update Hologram Ring FX
    for (let i = this.hologramRingFX.length - 1; i >= 0; i--) {
      const h = this.hologramRingFX[i];
      const elapsed = now - h.createdAt;
      const progress = elapsed / h.lifeMs;

      if (progress >= 1.0) {
        this.scene.remove(h.mesh);
        h.mesh.geometry.dispose();
        h.mesh.material.dispose();
        this.hologramRingFX.splice(i, 1);
      } else {
        h.mesh.position.y += dt * 1.8; // Hologram ring pulses upward
        h.mesh.scale.multiplyScalar(1.0 + dt * 0.8);
        h.mesh.material.opacity = (1.0 - progress) * 0.95;
      }
    }

    // 6. Update Jump Pad Sparks
    for (let i = this.jumpPadSparks.length - 1; i >= 0; i--) {
      const item = this.jumpPadSparks[i];
      const elapsed = now - item.createdAt;
      const progress = elapsed / item.lifeMs;

      if (progress >= 1.0) {
        this.scene.remove(item.group);
        this.jumpPadSparks.splice(i, 1);
      } else {
        for (const sp of item.sparks) {
          sp.mesh.position.x += sp.vx * dt;
          sp.mesh.position.y += sp.vy * dt;
          sp.mesh.position.z += sp.vz * dt;
          sp.vy -= 22.0 * dt;
          sp.mesh.material.opacity = 1.0 - progress;
        }
      }
    }

    // 7. Update Shield Deflect Sparks
    for (let i = this.shieldSparks.length - 1; i >= 0; i--) {
      const item = this.shieldSparks[i];
      const elapsed = now - item.createdAt;
      const progress = elapsed / item.lifeMs;

      if (progress >= 1.0) {
        this.scene.remove(item.group);
        this.shieldSparks.splice(i, 1);
      } else {
        for (const sp of item.sparks) {
          sp.mesh.position.x += sp.vx * dt;
          sp.mesh.position.y += sp.vy * dt;
          sp.mesh.position.z += sp.vz * dt;
          sp.mesh.material.opacity = 1.0 - progress;
        }
      }
    }

    // 8. Update Thruster Particles
    for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
      const tp = this.thrusterParticles[i];
      const elapsed = now - tp.createdAt;
      const progress = elapsed / tp.lifeMs;
      if (progress >= 1.0) {
        this.scene.remove(tp.mesh);
        this.thrusterParticles.splice(i, 1);
      } else {
        tp.mesh.position.y += dt * 3.5;
        tp.mesh.scale.multiplyScalar(0.92);
        tp.mesh.material.opacity = 1.0 - progress;
      }
    }
  }
}

// Instantiate Client Engine on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameClient = new CyberWarfareClient();
  window.returnToLobby = () => window.gameClient?.returnToLobby();
});
