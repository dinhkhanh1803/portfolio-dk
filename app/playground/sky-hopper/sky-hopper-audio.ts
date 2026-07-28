export class SkyHopperAudio {
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

  private chirp(from: number, to: number, duration: number, gain: number, delay = 0) {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + delay;
      const end = start + duration;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), end);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    } catch {
      // Audio is an enhancement; gameplay remains available.
    }
  }

  playFlap() { this.chirp(360, 620, 0.08, 0.045); }
  playScore() {
    this.chirp(620, 860, 0.11, 0.055);
    this.chirp(820, 1080, 0.1, 0.035, 0.045);
  }
  playCrash() { this.chirp(180, 62, 0.26, 0.075); }
  playStart() { this.chirp(300, 520, 0.14, 0.045); }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => undefined);
  }
}
