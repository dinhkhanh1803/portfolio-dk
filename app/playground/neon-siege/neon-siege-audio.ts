export class NeonSiegeAudio {
  private context: AudioContext | null = null;
  private muted = false;

  async unlock() {
    if (this.muted || typeof window === "undefined") return;
    try {
      this.context ??= new window.AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
    } catch { this.context = null; }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.context?.state === "running") void this.context.suspend().catch(() => undefined);
    if (!muted) void this.unlock();
  }

  private tone(frequency: number, end: number, duration: number, gain = 0.03, type: OscillatorType = "triangle") {
    const context = this.context;
    if (!context || this.muted || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), now + duration);
    envelope.gain.setValueAtTime(gain, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  play(kind: string, label = "") {
    if (kind === "shot") {
      const cue = { pulse: 720, frost: 430, tesla: 980, railgun: 240 }[label] ?? 620;
      this.tone(cue, label === "railgun" ? 80 : cue * 1.28, label === "railgun" ? 0.16 : 0.055, 0.018, label === "frost" ? "sine" : "square");
    }
    if (kind === "kill") this.tone(460, 720, 0.08, 0.025);
    if (kind === "leak") this.tone(label === "GAMEOVER" ? 150 : 220, 55, label === "GAMEOVER" ? 0.55 : 0.3, 0.045, "sawtooth");
    if (kind === "build") this.tone(330, 660, 0.13, 0.03);
    if (kind === "upgrade") this.tone(520, 920, 0.16, 0.035);
    if (kind === "sell") this.tone(620, 280, 0.12, 0.025);
    if (kind === "skill") this.tone(label === "BOSS" ? 110 : label === "EMP" ? 920 : label === "OVERCLOCK" ? 560 : 760, label === "BOSS" ? 55 : 160, label === "BOSS" ? 0.5 : 0.25, 0.045, "sawtooth");
    if (kind === "wave") this.tone(label === "VICTORY" ? 620 : 390, label === "VICTORY" ? 1320 : 980, 0.24, 0.04);
  }

  dispose() {
    const context = this.context;
    this.context = null;
    if (context) void context.close().catch(() => undefined);
  }
}
