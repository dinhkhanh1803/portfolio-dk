"use client";

import { Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type DuplicateKeep,
  type DuplicateMode,
  type ReplaceOptions,
  type RepeatOptions,
  type ReverseMode,
  type SortMode,
  type SplitMode,
  type TextCaseMode,
  type TrimMode,
  convertCase,
  removeDuplicateLines,
  repeatText,
  replaceText,
  reverseText,
  slugifyText,
  sortLines,
  splitText,
  textStats,
  trimText,
} from "./text-manipulation-engine";

type TextTab = "case" | "sort" | "trim" | "split" | "replace" | "repeat" | "counter" | "slugify" | "dedupe" | "reverse";

const tabs: Array<{ id: TextTab; label: string; description: string }> = [
  { id: "case", label: "Case Converter", description: "Convert text into common naming and writing cases." },
  { id: "sort", label: "Line Sorter", description: "Sort lines alphabetically, naturally, by length, or randomly." },
  { id: "trim", label: "Text Trimmer", description: "Trim outer whitespace, clean each line, collapse spacing, or remove empty lines." },
  { id: "split", label: "Text Splitter", description: "Split raw text into numbered parts by newline, comma, space, or custom delimiter." },
  { id: "replace", label: "Find & Replace", description: "Replace text with case-sensitive, whole-word, or regex matching." },
  { id: "repeat", label: "Text Repeater", description: "Repeat a snippet multiple times with custom separators and optional numbering." },
  { id: "counter", label: "Text Counter", description: "Count characters, words, lines, sentences, paragraphs, bytes, and reading time." },
  { id: "slugify", label: "Slugify", description: "Create URL-safe slugs from titles, Vietnamese text, and messy labels." },
  { id: "dedupe", label: "Duplicate Remover", description: "Remove duplicate lines with exact, trimmed, or case-insensitive matching." },
  { id: "reverse", label: "Text Reverser", description: "Reverse characters, words, or line order while keeping everything local." },
];

const sampleInput: Record<TextTab, string> = {
  case: "hello world from DK Tools\nbuild polished browser utilities",
  sort: "banana\nApple\ncherry\napple 10\napple 2\nDragon fruit",
  trim: "   DK Tools   \n\n   Clean every line   \n\n\nKeep content readable   ",
  split: "Lan Nguyen, Minh Tran, DK Tools, Browser Utilities",
  replace: "DK Tools helps DK users build useful browser tools. DK Tools runs locally.",
  repeat: "Ship polished tools.",
  counter: "DK Tools builds calm browser utilities.\n\nEach tool should be useful, readable, and fast.",
  slugify: "Tạo công cụ Text Manipulation thật chỉnh chu!",
  dedupe: "Lan Nguyen\nMinh Tran\nlan nguyen\nDK Tools\nMinh Tran\n  DK Tools  ",
  reverse: "DK Tools\nBrowser utilities\nText flows better when tools are clear.",
};

const caseModes: Array<{ id: TextCaseMode; label: string }> = [
  { id: "sentence", label: "Sentence" },
  { id: "title", label: "Title" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT" },
  { id: "dot", label: "dot.case" },
  { id: "path", label: "path/case" },
  { id: "upper", label: "UPPER" },
  { id: "lower", label: "lower" },
];

const sortModes: Array<{ id: SortMode; label: string }> = [
  { id: "asc", label: "A to Z" },
  { id: "desc", label: "Z to A" },
  { id: "natural", label: "Natural" },
  { id: "length", label: "Length" },
  { id: "random", label: "Random" },
];

const trimModes: Array<{ id: TrimMode; label: string }> = [
  { id: "outer", label: "Outer trim" },
  { id: "lines", label: "Trim lines" },
  { id: "collapse", label: "Collapse spaces" },
  { id: "remove-empty", label: "Remove empty" },
];

const splitModes: Array<{ id: SplitMode; label: string }> = [
  { id: "newline", label: "Newline" },
  { id: "comma", label: "Comma" },
  { id: "space", label: "Whitespace" },
  { id: "custom", label: "Custom" },
];

const duplicateModes: Array<{ id: DuplicateMode; label: string }> = [
  { id: "exact", label: "Exact" },
  { id: "trimmed", label: "Trimmed" },
  { id: "case-insensitive", label: "Case-insensitive" },
];

const reverseModes: Array<{ id: ReverseMode; label: string }> = [
  { id: "characters", label: "Characters" },
  { id: "words", label: "Words" },
  { id: "lines", label: "Lines" },
];

export default function TextManipulationWorkbench() {
  const [tab, setTab] = useState<TextTab>("case");
  const [input, setInput] = useState(sampleInput.case);
  const [caseMode, setCaseMode] = useState<TextCaseMode>("camel");
  const [sortMode, setSortMode] = useState<SortMode>("natural");
  const [sortTrim, setSortTrim] = useState(true);
  const [sortRemoveEmpty, setSortRemoveEmpty] = useState(true);
  const [sortUnique, setSortUnique] = useState(false);
  const [trimMode, setTrimMode] = useState<TrimMode>("lines");
  const [splitMode, setSplitMode] = useState<SplitMode>("comma");
  const [splitDelimiter, setSplitDelimiter] = useState("|");
  const [splitTrim, setSplitTrim] = useState(true);
  const [splitRemoveEmpty, setSplitRemoveEmpty] = useState(true);
  const [replaceOptions, setReplaceOptions] = useState<ReplaceOptions>({ find: "DK Tools", replacement: "DK Studio", caseSensitive: false, wholeWord: false, useRegex: false });
  const [repeatOptions, setRepeatOptions] = useState<RepeatOptions>({ count: 5, separator: "\n", prefixIndex: true });
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("case-insensitive");
  const [duplicateKeep, setDuplicateKeep] = useState<DuplicateKeep>("first");
  const [duplicateRemoveEmpty, setDuplicateRemoveEmpty] = useState(true);
  const [reverseMode, setReverseMode] = useState<ReverseMode>("characters");

  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  const stats = useMemo(() => textStats(input), [input]);

  const output = useMemo(() => {
    if (tab === "case") return convertCase(input, caseMode);
    if (tab === "sort") return sortLines(input, { mode: sortMode, trim: sortTrim, removeEmpty: sortRemoveEmpty, unique: sortUnique });
    if (tab === "trim") return trimText(input, trimMode);
    if (tab === "split") return splitText(input, { mode: splitMode, customDelimiter: splitDelimiter, trimParts: splitTrim, removeEmpty: splitRemoveEmpty });
    if (tab === "replace") return replaceText(input, replaceOptions);
    if (tab === "repeat") return repeatText(input, repeatOptions);
    if (tab === "counter") return [
      `Characters: ${stats.chars}`,
      `Characters without spaces: ${stats.charsNoSpaces}`,
      `Words: ${stats.words}`,
      `Lines: ${stats.lines}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Bytes: ${stats.bytes}`,
      `Reading time: ${stats.readingMinutes} min`,
    ].join("\n");
    if (tab === "slugify") return slugifyText(input);
    if (tab === "dedupe") return removeDuplicateLines(input, { mode: duplicateMode, keep: duplicateKeep, removeEmpty: duplicateRemoveEmpty });
    return reverseText(input, reverseMode);
  }, [caseMode, duplicateKeep, duplicateMode, duplicateRemoveEmpty, input, replaceOptions, repeatOptions, reverseMode, sortMode, sortRemoveEmpty, sortTrim, sortUnique, splitDelimiter, splitMode, splitRemoveEmpty, splitTrim, stats, tab, trimMode]);

  const outputStats = useMemo(() => textStats(output), [output]);

  const selectTab = (next: TextTab) => {
    setTab(next);
    setInput(sampleInput[next]);
  };

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderControls = () => {
    if (tab === "case") return <div className="text-tool-segmented">{caseModes.map((mode) => <button type="button" key={mode.id} className={caseMode === mode.id ? "is-active" : ""} onClick={() => setCaseMode(mode.id)}>{mode.label}</button>)}</div>;
    if (tab === "trim") return <div className="text-tool-segmented">{trimModes.map((mode) => <button type="button" key={mode.id} className={trimMode === mode.id ? "is-active" : ""} onClick={() => setTrimMode(mode.id)}>{mode.label}</button>)}</div>;
    if (tab === "reverse") return <div className="text-tool-segmented">{reverseModes.map((mode) => <button type="button" key={mode.id} className={reverseMode === mode.id ? "is-active" : ""} onClick={() => setReverseMode(mode.id)}>{mode.label}</button>)}</div>;

    if (tab === "sort") return <>
      <label>Sort mode<select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>{sortModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
      <label className="text-tool-check"><input type="checkbox" checked={sortTrim} onChange={(event) => setSortTrim(event.target.checked)} /> Trim lines</label>
      <label className="text-tool-check"><input type="checkbox" checked={sortRemoveEmpty} onChange={(event) => setSortRemoveEmpty(event.target.checked)} /> Remove empty</label>
      <label className="text-tool-check"><input type="checkbox" checked={sortUnique} onChange={(event) => setSortUnique(event.target.checked)} /> Unique output</label>
    </>;

    if (tab === "split") return <>
      <label>Split by<select value={splitMode} onChange={(event) => setSplitMode(event.target.value as SplitMode)}>{splitModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
      {splitMode === "custom" ? <label>Delimiter<input value={splitDelimiter} onChange={(event) => setSplitDelimiter(event.target.value)} /></label> : null}
      <label className="text-tool-check"><input type="checkbox" checked={splitTrim} onChange={(event) => setSplitTrim(event.target.checked)} /> Trim parts</label>
      <label className="text-tool-check"><input type="checkbox" checked={splitRemoveEmpty} onChange={(event) => setSplitRemoveEmpty(event.target.checked)} /> Remove empty</label>
    </>;

    if (tab === "replace") return <>
      <label>Find<input value={replaceOptions.find} onChange={(event) => setReplaceOptions((current) => ({ ...current, find: event.target.value }))} /></label>
      <label>Replace with<input value={replaceOptions.replacement} onChange={(event) => setReplaceOptions((current) => ({ ...current, replacement: event.target.value }))} /></label>
      <label className="text-tool-check"><input type="checkbox" checked={replaceOptions.caseSensitive} onChange={(event) => setReplaceOptions((current) => ({ ...current, caseSensitive: event.target.checked }))} /> Case sensitive</label>
      <label className="text-tool-check"><input type="checkbox" checked={replaceOptions.wholeWord} onChange={(event) => setReplaceOptions((current) => ({ ...current, wholeWord: event.target.checked }))} /> Whole word</label>
      <label className="text-tool-check"><input type="checkbox" checked={replaceOptions.useRegex} onChange={(event) => setReplaceOptions((current) => ({ ...current, useRegex: event.target.checked }))} /> Regex</label>
    </>;

    if (tab === "repeat") return <>
      <label>Count<input type="number" min={1} max={500} value={repeatOptions.count} onChange={(event) => setRepeatOptions((current) => ({ ...current, count: Number(event.target.value) }))} /></label>
      <label>Separator<select value={repeatOptions.separator} onChange={(event) => setRepeatOptions((current) => ({ ...current, separator: event.target.value }))}><option value="\n">Newline</option><option value="\n\n">Blank line</option><option value=", ">Comma</option><option value=" ">Space</option></select></label>
      <label className="text-tool-check"><input type="checkbox" checked={repeatOptions.prefixIndex} onChange={(event) => setRepeatOptions((current) => ({ ...current, prefixIndex: event.target.checked }))} /> Prefix number</label>
    </>;

    if (tab === "dedupe") return <>
      <label>Match<select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value as DuplicateMode)}>{duplicateModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
      <label>Keep<select value={duplicateKeep} onChange={(event) => setDuplicateKeep(event.target.value as DuplicateKeep)}><option value="first">First occurrence</option><option value="last">Last occurrence</option></select></label>
      <label className="text-tool-check"><input type="checkbox" checked={duplicateRemoveEmpty} onChange={(event) => setDuplicateRemoveEmpty(event.target.checked)} /> Remove empty</label>
    </>;

    return <div className="text-tool-stats text-tool-stats-inline">
      <span>{stats.chars} chars</span><span>{stats.charsNoSpaces} no-space chars</span><span>{stats.words} words</span><span>{stats.lines} lines</span><span>{stats.sentences} sentences</span><span>{stats.paragraphs} paragraphs</span><span>{stats.bytes} bytes</span><span>{stats.readingMinutes} min read</span>
    </div>;
  };

  return (
    <section className="text-manipulation-workbench">
      <div className="data-format-tabs text-tool-tabs" role="tablist">
        {tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => selectTab(item.id)} key={item.id}>{item.label}</button>)}
      </div>

      <header className="text-tool-intro">
        <div>
          <h2>{active.label}</h2>
          <p>{active.description}</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={() => setInput(sampleInput[tab])}><FlaskConical size={15} /> Sample</button>
          <button type="button" onClick={() => setInput("")}><Eraser size={15} /> Clear</button>
        </div>
      </header>

      <div className="text-tool-control-card">{renderControls()}</div>

      <div className="text-tool-grid">
        <label className="text-tool-panel">
          <span>Raw input <b>{stats.chars} chars · {stats.words} words · {stats.lines} lines</b></span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
        </label>

        <section className="text-tool-panel">
          <span>Output <b>{outputStats.chars} chars · {outputStats.words} words · {outputStats.lines} lines</b></span>
          <pre>{output || "Result will appear here..."}</pre>
          <div className="text-tool-output-actions">
            <button type="button" onClick={copyOutput} disabled={!output}><Clipboard size={15} /> Copy</button>
            <button type="button" onClick={downloadOutput} disabled={!output}><Download size={15} /> Download .txt</button>
          </div>
        </section>
      </div>

      <footer className="text-tool-stats">
        <span>{stats.bytes} input bytes</span>
        <span>{outputStats.bytes} output bytes</span>
        <span>Runs locally in your browser</span>
      </footer>
    </section>
  );
}
