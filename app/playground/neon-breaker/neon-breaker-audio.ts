export class NeonBreakerAudio {
  private context: AudioContext | null = null;
  private muted = false;

  async unlock() {
    if (this.muted || typeof window === "undefined") return;
    try {
      this.context ??= new window.AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      this.context = null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.context?.state === "running") {
      void this.context.suspend().catch(() => undefined);
    } else if (!muted) {
      void this.unlock();
    } else if (!muted) {
      void this.unlock();
    }
  }

  private tone(frequency: number, duration: number, gain: number, type: OscillatorType, end = frequency, delay = 0) {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), start + duration);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      // Audio is progressive enhancement.
    }
  }

  playPaddle() { this.tone(440, 0.055, 0.035, "square", 620); }
  playWall() { this.tone(250, 0.04, 0.022, "triangle", 210); }
  playBrick() { this.tone(650, 0.055, 0.032, "square", 850); }
  playPowerUp() {
    this.tone(520, 0.11, 0.04, "sine", 760);
    this.tone(760, 0.14, 0.032, "sine", 1040, 0.08);
  }
  playLifeLost() { this.tone(310, 0.22, 0.045, "sawtooth", 90); }
  playLevelClear() {
    this.tone(440, 0.12, 0.04, "triangle", 660);
    this.tone(660, 0.18, 0.04, "triangle", 940, 0.1);
  }
  playGameOver() { this.tone(260, 0.35, 0.05, "sawtooth", 70); }
  playVictory() {
    this.tone(520, 0.16, 0.045, "triangle", 820);
    this.tone(780, 0.22, 0.04, "triangle", 1200, 0.12);
  }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => undefined);
  }
}
