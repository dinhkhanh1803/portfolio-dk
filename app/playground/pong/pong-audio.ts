export class PongAudio {
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
    }
  }

  private tone(
    frequency: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    endFrequency = frequency,
    delay = 0,
  ) {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + delay;
      const end = start + duration;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFrequency),
        end,
      );
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    } catch {
      // Audio is optional.
    }
  }

  playPaddleHit() {
    this.tone(520, 0.055, 0.04, "square", 680);
  }

  playWallBounce() {
    this.tone(300, 0.045, 0.026, "triangle", 250);
  }

  playScore() {
    this.tone(260, 0.18, 0.052, "sawtooth", 120);
  }

  playCountdown() {
    this.tone(440, 0.08, 0.034, "sine", 500);
  }

  playVictory() {
    this.tone(520, 0.12, 0.05, "triangle", 760);
    this.tone(720, 0.18, 0.045, "triangle", 980, 0.1);
  }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => undefined);
  }
}
