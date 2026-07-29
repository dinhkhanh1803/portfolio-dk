export type SerpentCue = "core" | "skill" | "shield" | "damage" | "laser" | "portal" | "boss" | "victory" | "gameover";

export function createSerpentAudio() {
  let context: AudioContext | null = null;
  let muted = false;
  const unlock = async () => {
    context ??= new AudioContext();
    if (context.state === "suspended") await context.resume();
  };
  const play = (cue: SerpentCue, combo = 1) => {
    if (muted || !context) return;
    const frequencies: Record<SerpentCue, number> = {
      core: 420 + Math.min(8, combo) * 34, skill: 760, shield: 240, damage: 95,
      laser: 170, portal: 540, boss: 72, victory: 880, gameover: 110,
    };
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = cue === "damage" || cue === "boss" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequencies[cue], context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequencies[cue] * 1.25), context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  };
  return {
    unlock() { return unlock(); },
    setMuted(value: boolean) { muted = value; },
    play(cue: SerpentCue, combo = 1) { play(cue, combo); },
    dispose() { if (context) void context.close(); context = null; },
  };
}
