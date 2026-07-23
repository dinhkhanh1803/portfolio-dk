"use client";

import { Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeText, formatAnalysisReport, getKeywordDensity, type TextAnalysis } from "./text-analysis-engine";

type AnalysisTab = "overview" | "keywords" | "characters" | "readability";

export const TEXT_ANALYSIS_SAMPLE = `DK Tools helps builders ship polished browser utilities.

Good tools feel clear, fast, private, and practical. A useful text analysis tool should count words, reveal repeated terms, estimate reading time, and make readability easier to understand.

This sample is intentionally short, but it still contains repeated words like tools, browser, useful, and readability.`;

const tabs: Array<{ id: AnalysisTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "keywords", label: "Keyword Density" },
  { id: "characters", label: "Character Frequency" },
  { id: "readability", label: "Readability" },
];

const metricCards = (analysis: TextAnalysis) => [
  ["Word Count", analysis.words.toLocaleString()],
  ["Characters", analysis.characters.toLocaleString()],
  ["No-space chars", analysis.charactersNoSpaces.toLocaleString()],
  ["Unique words", analysis.uniqueWords.toLocaleString()],
  ["Lines", analysis.lines.toLocaleString()],
  ["Sentences", analysis.sentences.toLocaleString()],
  ["Paragraphs", analysis.paragraphs.toLocaleString()],
  ["Reading time", `${analysis.readingMinutes} min`],
  ["Speaking time", `${analysis.speakingMinutes} min`],
  ["Avg word length", `${analysis.averageWordLength}`],
  ["Bytes", analysis.bytes.toLocaleString()],
  ["Sentiment", analysis.sentiment],
];

export default function TextAnalysisWorkbench() {
  const [tab, setTab] = useState<AnalysisTab>("overview");
  const [input, setInput] = useState(TEXT_ANALYSIS_SAMPLE);
  const [includeStopWords, setIncludeStopWords] = useState(false);
  const analysis = useMemo(() => analyzeText(input), [input]);
  const report = useMemo(() => formatAnalysisReport(analysis), [analysis]);
  const keywords = useMemo(() => includeStopWords ? getKeywordDensity(input, { includeStopWords: true }) : analysis.keywords, [analysis.keywords, includeStopWords, input]);

  const copyReport = async () => {
    await navigator.clipboard?.writeText(report);
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "text-analysis-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderPanel = () => {
    if (tab === "keywords") return (
      <section className="text-analysis-card">
        <div className="text-analysis-card-head">
          <h3>Top keywords</h3>
          <label className="text-tool-check"><input type="checkbox" checked={includeStopWords} onChange={(event) => setIncludeStopWords(event.target.checked)} /> Include stop words</label>
        </div>
        <div className="text-analysis-bars">
          {keywords.map((item) => <div key={item.word} className="text-analysis-bar-row">
            <span>{item.word}</span>
            <b>{item.count}</b>
            <i style={{ width: `${Math.max(4, item.percentage * 6)}%` }} />
            <em>{item.percentage}%</em>
          </div>)}
        </div>
      </section>
    );

    if (tab === "characters") return (
      <section className="text-analysis-card">
        <div className="text-analysis-card-head"><h3>Character Frequency</h3><span>{analysis.charactersNoSpaces} non-space chars</span></div>
        <div className="text-analysis-frequency">
          {analysis.charactersFrequency.map((item) => <div key={item.character}>
            <strong>{item.character}</strong>
            <span>{item.count} · {item.percentage}%</span>
          </div>)}
        </div>
      </section>
    );

    if (tab === "readability") return (
      <section className="text-analysis-card text-analysis-readability">
        <div>
          <span>Flesch score</span>
          <strong>{analysis.readability.fleschReadingEase}</strong>
          <small>{analysis.readability.level}</small>
        </div>
        <div>
          <span>Grade level</span>
          <strong>{analysis.readability.fleschKincaidGrade}</strong>
          <small>Flesch-Kincaid estimate</small>
        </div>
        <div>
          <span>Syllables</span>
          <strong>{analysis.readability.syllables}</strong>
          <small>{analysis.readability.wordsPerSentence} words / sentence</small>
        </div>
        <article>
          <b>Longest sentence</b>
          <p>{analysis.longestSentence || "No sentence detected yet."}</p>
        </article>
      </section>
    );

    return (
      <section className="text-analysis-metrics">
        {metricCards(analysis).map(([label, value]) => <div className="text-analysis-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>)}
      </section>
    );
  };

  return (
    <section className="text-analysis-workbench">
      <div className="data-format-tabs text-tool-tabs text-analysis-tabs" role="tablist">
        {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>

      <header className="text-tool-intro">
        <div>
          <h2>Text Analysis</h2>
          <p>Analyze word count, keyword density, character frequency, readability, reading time, and text quality signals directly in your browser.</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={() => setInput(TEXT_ANALYSIS_SAMPLE)}><FlaskConical size={15} /> Sample</button>
          <button type="button" onClick={() => setInput("")}><Eraser size={15} /> Clear</button>
        </div>
      </header>

      <div className="text-analysis-layout">
        <label className="text-tool-panel text-analysis-input">
          <span>Raw text <b>{analysis.characters} chars · {analysis.words} words</b></span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
        </label>

        <div className="text-analysis-results">
          {renderPanel()}
          <section className="text-tool-panel text-analysis-report">
            <span>Analysis report <b>JSON output</b></span>
            <pre>{report}</pre>
            <div className="text-tool-output-actions">
              <button type="button" onClick={copyReport}><Clipboard size={15} /> Copy report</button>
              <button type="button" onClick={downloadReport}><Download size={15} /> Download .json</button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
