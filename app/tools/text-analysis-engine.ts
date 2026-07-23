export type TextAnalysis = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  bytes: number;
  averageWordLength: number;
  readingMinutes: number;
  speakingMinutes: number;
  longestWord: string;
  longestSentence: string;
  sentiment: "positive" | "neutral" | "negative";
  readability: ReadabilityScore;
  keywords: KeywordDensity[];
  charactersFrequency: CharacterFrequency[];
};

export type KeywordDensity = {
  word: string;
  count: number;
  percentage: number;
};

export type CharacterFrequency = {
  character: string;
  count: number;
  percentage: number;
};

export type ReadabilityScore = {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  level: string;
  syllables: number;
  wordsPerSentence: number;
};

const positiveWords = new Set(["good", "great", "useful", "clear", "fast", "polished", "calm", "excellent", "strong", "beautiful", "secure", "helpful"]);
const negativeWords = new Set(["bad", "broken", "slow", "hard", "error", "fail", "poor", "confusing", "weak", "bug", "issue", "problem"]);

export const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "he", "her", "his", "i", "in", "is", "it", "its", "me", "my", "of", "on", "or", "our", "she", "so", "that", "the", "their", "them", "they", "this", "to", "was", "we", "were", "with", "you", "your",
  "các", "cái", "cho", "của", "để", "được", "khi", "là", "mà", "một", "này", "những", "thì", "trong", "và", "với",
]);

const getWords = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [];
const getSentences = (text: string) => text.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((item) => item.trim()).filter(Boolean) ?? [];

const countSyllables = (word: string) => {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return 1;
  const stripped = normalized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
};

export function getKeywordDensity(text: string, options: { limit?: number; includeStopWords?: boolean } = {}): KeywordDensity[] {
  const words = getWords(text).filter((word) => options.includeStopWords || !stopWords.has(word));
  const total = words.length || 1;
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, options.limit ?? 12)
    .map(([word, count]) => ({ word, count, percentage: Number(((count / total) * 100).toFixed(2)) }));
}

export function getCharacterFrequency(text: string, limit = 18): CharacterFrequency[] {
  const characters = [...text].filter((char) => !/\s/u.test(char));
  const total = characters.length || 1;
  const counts = new Map<string, number>();
  for (const character of characters) counts.set(character, (counts.get(character) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([character, count]) => ({ character, count, percentage: Number(((count / total) * 100).toFixed(2)) }));
}

export function getReadability(text: string): ReadabilityScore {
  const words = getWords(text);
  const sentences = getSentences(text);
  const wordCount = Math.max(1, words.length);
  const sentenceCount = Math.max(1, sentences.length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllables / wordCount;
  const fleschReadingEase = Number((206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord).toFixed(1));
  const fleschKincaidGrade = Number((0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59).toFixed(1));
  const level = fleschReadingEase >= 80 ? "Easy" : fleschReadingEase >= 60 ? "Plain" : fleschReadingEase >= 40 ? "Moderate" : "Difficult";
  return { fleschReadingEase, fleschKincaidGrade, level, syllables, wordsPerSentence: Number(wordsPerSentence.toFixed(1)) };
}

export function analyzeText(text: string): TextAnalysis {
  const words = getWords(text);
  const sentences = getSentences(text);
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/u).filter(Boolean).length : 0;
  const uniqueWords = new Set(words).size;
  const longestWord = words.reduce((longest, word) => word.length > longest.length ? word : longest, "");
  const longestSentence = sentences.reduce((longest, sentence) => sentence.length > longest.length ? sentence : longest, "");
  const averageWordLength = words.length ? words.join("").length / words.length : 0;
  const sentimentScore = words.reduce((score, word) => score + (positiveWords.has(word) ? 1 : 0) - (negativeWords.has(word) ? 1 : 0), 0);

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/gu, "").length,
    words: words.length,
    uniqueWords,
    lines: text ? text.split(/\r?\n/u).length : 0,
    sentences: sentences.length,
    paragraphs,
    bytes: new Blob([text]).size,
    averageWordLength: Number(averageWordLength.toFixed(2)),
    readingMinutes: Math.max(1, Math.ceil(words.length / 220)),
    speakingMinutes: Math.max(1, Math.ceil(words.length / 150)),
    longestWord,
    longestSentence,
    sentiment: sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral",
    readability: getReadability(text),
    keywords: getKeywordDensity(text),
    charactersFrequency: getCharacterFrequency(text),
  };
}

export function formatAnalysisReport(analysis: TextAnalysis) {
  return JSON.stringify(analysis, null, 2);
}
