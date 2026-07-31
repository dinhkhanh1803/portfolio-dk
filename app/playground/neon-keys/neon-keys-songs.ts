export type SongDifficulty = "easy" | "normal" | "hard";
export type SongNote = { beat: number; key: number };
export type PianoSong = {
  id: string;
  title: string;
  composer: string;
  difficulty: SongDifficulty;
  bpm: number;
  chart: SongNote[];
};

const melody = (keys: number[], step = 1): SongNote[] =>
  keys.map((key, index) => ({ beat: index * step, key }));

export const PIANO_SONGS: readonly PianoSong[] = [
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    composer: "L. van Beethoven",
    difficulty: "easy",
    bpm: 96,
    chart: melody([4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 4, 2, 2, 4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 2, 0, 0]),
  },
  {
    id: "twinkle",
    title: "Twinkle Twinkle",
    composer: "Traditional",
    difficulty: "easy",
    bpm: 90,
    chart: melody([0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0, 7, 7, 5, 5, 4, 4, 2, 7, 7, 5, 5, 4, 4, 2, 0, 0, 7, 7, 9, 9, 7]),
  },
  {
    id: "happy-birthday",
    title: "Happy Birthday",
    composer: "Traditional",
    difficulty: "normal",
    bpm: 108,
    chart: melody([0, 0, 2, 0, 5, 4, 0, 0, 2, 0, 7, 5, 0, 0, 11, 9, 5, 4, 2, 10, 10, 9, 5, 7, 5], .85),
  },
  {
    id: "jingle-bells",
    title: "Jingle Bells",
    composer: "James Lord Pierpont",
    difficulty: "normal",
    bpm: 120,
    chart: melody([4, 4, 4, 4, 4, 4, 4, 7, 0, 2, 4, 5, 5, 5, 5, 5, 4, 4, 4, 4, 2, 2, 4, 2, 7, 4, 4, 4, 4, 4, 4, 4, 7, 0, 2, 4], .75),
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    composer: "L. van Beethoven",
    difficulty: "hard",
    bpm: 132,
    chart: melody([11, 10, 11, 10, 11, 7, 10, 9, 5, 0, 4, 5, 7, 0, 4, 7, 9, 4, 8, 9, 11, 4, 11, 10, 11, 10, 11, 7, 10, 9, 5, 0, 4, 5, 7, 4, 9, 8], .6),
  },
  {
    id: "turkish-march",
    title: "Turkish March",
    composer: "W. A. Mozart",
    difficulty: "hard",
    bpm: 144,
    chart: melody([9, 8, 6, 5, 4, 5, 6, 8, 9, 11, 9, 8, 6, 5, 4, 2, 4, 5, 6, 8, 6, 5, 4, 2, 0, 2, 4, 5, 7, 9, 8, 6, 5, 4, 2, 0, 4, 6, 8, 9], .5),
  },
];

export const getPianoSong = (id?: string) =>
  PIANO_SONGS.find((song) => song.id === id) ?? PIANO_SONGS[0];

export const songDurationMs = (song: PianoSong) =>
  Math.ceil(((song.chart.at(-1)?.beat ?? 0) + 6) * 60_000 / song.bpm);
