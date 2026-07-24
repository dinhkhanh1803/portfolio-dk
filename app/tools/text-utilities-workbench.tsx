"use client";

import { Clipboard, Download, Eraser, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import {
  TEXT_UTILITIES_SAMPLE,
  cleanWhitespace,
  compareText,
  createSlug,
  decodeHtmlEntities,
  decodeUrl,
  encodeHtmlEntities,
  encodeUrl,
  extractLines,
  wrapLines,
} from "./text-utilities-engine";

type UtilityTab = "slug" | "diff" | "clean" | "url" | "entities" | "quote" | "extract";

const tabs: Array<{ id: UtilityTab; label: string; description: string }> = [
  { id: "slug", label: "Slug Generator", description: "Create URL-safe slugs from titles, labels, and Vietnamese text." },
  { id: "diff", label: "Diff Checker", description: "Compare two text blocks and inspect added, removed, and unchanged lines." },
  { id: "clean", label: "Whitespace Cleaner", description: "Trim messy text, normalize line endings, remove blanks, and collapse spacing." },
  { id: "url", label: "URL Tools", description: "Encode or decode full URLs and query components." },
  { id: "entities", label: "HTML Entities", description: "Encode unsafe HTML characters or decode named and numeric entities." },
  { id: "quote", label: "Quote Wrapper", description: "Wrap every line with quotes, brackets, Markdown bullets, or custom text." },
  { id: "extract", label: "Line Extractor", description: "Filter lines by text or regex, invert matches, unique, and sort the result." },
];

const tabSample: Record<Exclude<UtilityTab, "diff">, string> = {
  slug: TEXT_UTILITIES_SAMPLE.slug,
  clean: TEXT_UTILITIES_SAMPLE.clean,
  url: TEXT_UTILITIES_SAMPLE.url,
  entities: TEXT_UTILITIES_SAMPLE.html,
  quote: TEXT_UTILITIES_SAMPLE.quote,
  extract: TEXT_UTILITIES_SAMPLE.extract,
};

const wrapPresets = [
  { label: "Double quotes", prefix: '"', suffix: '"' },
  { label: "Single quotes", prefix: "'", suffix: "'" },
  { label: "Backticks", prefix: "`", suffix: "`" },
  { label: "Markdown list", prefix: "- ", suffix: "" },
  { label: "Array items", prefix: "  \"", suffix: "\"," },
  { label: "Brackets", prefix: "[", suffix: "]" },
];

export default function TextUtilitiesWorkbench() {
  const [tab, setTab] = useState<UtilityTab>("slug");
  const [input, setInput] = useState<string>(tabSample.slug);
  const [rightInput, setRightInput] = useState<string>(TEXT_UTILITIES_SAMPLE.rightDiff);
  const [separator, setSeparator] = useState<"-" | "_" | ".">("-");
  const [slugLowercase, setSlugLowercase] = useState(true);
  const [slugMax, setSlugMax] = useState(90);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [tabsToSpaces, setTabsToSpaces] = useState(true);
  const [urlComponent, setUrlComponent] = useState(false);
  const [entityMode, setEntityMode] = useState<"encode" | "decode">("encode");
  const [urlMode, setUrlMode] = useState<"encode" | "decode">("encode");
  const [wrapPrefix, setWrapPrefix] = useState('"');
  const [wrapSuffix, setWrapSuffix] = useState('"');
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [extractQuery, setExtractQuery] = useState("error");
  const [extractRegex, setExtractRegex] = useState(false);
  const [extractInvert, setExtractInvert] = useState(false);
  const [extractUnique, setExtractUnique] = useState(false);
  const [extractSort, setExtractSort] = useState(false);

  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  const diff = useMemo(() => compareText(input, rightInput), [input, rightInput]);

  const output = useMemo(() => {
    try {
      if (tab === "slug") return createSlug(input, { separator, lowercase: slugLowercase, maxLength: slugMax });
      if (tab === "clean") return cleanWhitespace(input, { trimLines, removeEmptyLines: removeEmpty, collapseSpaces, tabsToSpaces });
      if (tab === "url") return urlMode === "encode" ? encodeUrl(input, urlComponent) : decodeUrl(input, urlComponent);
      if (tab === "entities") return entityMode === "encode" ? encodeHtmlEntities(input) : decodeHtmlEntities(input);
      if (tab === "quote") return wrapLines(input, { prefix: wrapPrefix, suffix: wrapSuffix, skipEmpty });
      if (tab === "extract") return extractLines(input, { query: extractQuery, useRegex: extractRegex, invert: extractInvert, unique: extractUnique, sort: extractSort });
      return diff.map((line) => `${line.type === "added" ? "+" : line.type === "removed" ? "-" : " "} ${line.value}`).join("\n");
    } catch (error) {
      return error instanceof Error ? `Error: ${error.message}` : "Unable to process this input.";
    }
  }, [collapseSpaces, diff, entityMode, extractInvert, extractQuery, extractRegex, extractSort, extractUnique, input, removeEmpty, separator, skipEmpty, slugLowercase, slugMax, tab, tabsToSpaces, trimLines, urlComponent, urlMode, wrapPrefix, wrapSuffix]);

  const outputStats = useMemo(() => ({
    chars: output.length,
    lines: output ? output.split(/\r\n?|\n/).length : 0,
    bytes: new Blob([output]).size,
  }), [output]);

  const selectTab = (next: UtilityTab) => {
    setTab(next);
    if (next === "diff") {
      setInput(TEXT_UTILITIES_SAMPLE.leftDiff);
      setRightInput(TEXT_UTILITIES_SAMPLE.rightDiff);
    } else {
      setInput(tabSample[next]);
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard?.writeText(output);
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderControls = () => {
    if (tab === "slug") return <>
      <label>Separator<select value={separator} onChange={(event) => setSeparator(event.target.value as "-" | "_" | ".")}><option value="-">Dash (-)</option><option value="_">Underscore (_)</option><option value=".">Dot (.)</option></select></label>
      <label>Max length<input type="number" min={0} max={240} value={slugMax} onChange={(event) => setSlugMax(Number(event.target.value))} /></label>
      <label className="text-tool-check"><input type="checkbox" checked={slugLowercase} onChange={(event) => setSlugLowercase(event.target.checked)} /> Lowercase</label>
    </>;

    if (tab === "clean") return <>
      <label className="text-tool-check"><input type="checkbox" checked={trimLines} onChange={(event) => setTrimLines(event.target.checked)} /> Trim lines</label>
      <label className="text-tool-check"><input type="checkbox" checked={removeEmpty} onChange={(event) => setRemoveEmpty(event.target.checked)} /> Remove empty lines</label>
      <label className="text-tool-check"><input type="checkbox" checked={collapseSpaces} onChange={(event) => setCollapseSpaces(event.target.checked)} /> Collapse spaces</label>
      <label className="text-tool-check"><input type="checkbox" checked={tabsToSpaces} onChange={(event) => setTabsToSpaces(event.target.checked)} /> Tabs to spaces</label>
    </>;

    if (tab === "url") return <>
      <div className="text-tool-segmented"><button type="button" className={urlMode === "encode" ? "is-active" : ""} onClick={() => setUrlMode("encode")}>Encode</button><button type="button" className={urlMode === "decode" ? "is-active" : ""} onClick={() => setUrlMode("decode")}>Decode</button></div>
      <label className="text-tool-check"><input type="checkbox" checked={urlComponent} onChange={(event) => setUrlComponent(event.target.checked)} /> Treat as URL component</label>
    </>;

    if (tab === "entities") return <div className="text-tool-segmented"><button type="button" className={entityMode === "encode" ? "is-active" : ""} onClick={() => setEntityMode("encode")}>Encode</button><button type="button" className={entityMode === "decode" ? "is-active" : ""} onClick={() => setEntityMode("decode")}>Decode</button></div>;

    if (tab === "quote") return <>
      <div className="text-tool-segmented text-utility-preset-row">{wrapPresets.map((preset) => <button type="button" key={preset.label} onClick={() => { setWrapPrefix(preset.prefix); setWrapSuffix(preset.suffix); }}>{preset.label}</button>)}</div>
      <label>Prefix<input value={wrapPrefix} onChange={(event) => setWrapPrefix(event.target.value)} /></label>
      <label>Suffix<input value={wrapSuffix} onChange={(event) => setWrapSuffix(event.target.value)} /></label>
      <label className="text-tool-check"><input type="checkbox" checked={skipEmpty} onChange={(event) => setSkipEmpty(event.target.checked)} /> Skip empty lines</label>
    </>;

    if (tab === "extract") return <>
      <label className="text-utility-wide-field">Find lines containing<input value={extractQuery} onChange={(event) => setExtractQuery(event.target.value)} placeholder="error, warning, /TODO/" /></label>
      <label className="text-tool-check"><input type="checkbox" checked={extractRegex} onChange={(event) => setExtractRegex(event.target.checked)} /> Regex</label>
      <label className="text-tool-check"><input type="checkbox" checked={extractInvert} onChange={(event) => setExtractInvert(event.target.checked)} /> Invert</label>
      <label className="text-tool-check"><input type="checkbox" checked={extractUnique} onChange={(event) => setExtractUnique(event.target.checked)} /> Unique</label>
      <label className="text-tool-check"><input type="checkbox" checked={extractSort} onChange={(event) => setExtractSort(event.target.checked)} /> Sort</label>
    </>;

    return <div className="text-utility-diff-summary">
      <span>{diff.filter((line) => line.type === "same").length} unchanged</span>
      <span>{diff.filter((line) => line.type === "added").length} added</span>
      <span>{diff.filter((line) => line.type === "removed").length} removed</span>
    </div>;
  };

  return (
    <section className="text-utilities-workbench">
      <div className="data-format-tabs text-tool-tabs text-utility-tabs" role="tablist">
        {tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => selectTab(item.id)} key={item.id}>{item.label}</button>)}
      </div>

      <header className="text-tool-intro">
        <div>
          <h2>{active.label}</h2>
          <p>{active.description}</p>
        </div>
        <div className="text-tool-actions">
          <button type="button" onClick={() => selectTab(tab)}><FlaskConical size={15} /> Sample</button>
          <button type="button" onClick={() => { setInput(""); setRightInput(""); }}><Eraser size={15} /> Clear</button>
        </div>
      </header>

      <div className="text-tool-control-card text-utility-card">{renderControls()}</div>

      {tab === "diff" ? (
        <div className="text-utility-layout">
          <label className="text-tool-panel">
            <span>Original text <b>{input.length} chars</b></span>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
          </label>
          <label className="text-tool-panel">
            <span>Changed text <b>{rightInput.length} chars</b></span>
            <textarea value={rightInput} onChange={(event) => setRightInput(event.target.value)} spellCheck={false} />
          </label>
          <section className="text-tool-panel text-utility-diff-panel">
            <span>Diff output <b>{diff.length} lines</b></span>
            <div className="text-utility-diff" aria-label="Text diff result">
              {diff.map((line, index) => <div key={`${line.type}-${index}`} className={`is-${line.type}`}><b>{line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}</b><code>{line.value || " "}</code></div>)}
            </div>
            <div className="text-tool-output-actions">
              <button type="button" onClick={copyOutput}><Clipboard size={15} /> Copy</button>
              <button type="button" onClick={download}><Download size={15} /> Download .txt</button>
            </div>
          </section>
        </div>
      ) : (
        <div className="text-tool-grid">
          <label className="text-tool-panel">
            <span>Raw input <b>{input.length} chars</b></span>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
          </label>
          <section className="text-tool-panel">
            <span>Output <b>{outputStats.chars} chars · {outputStats.lines} lines · {outputStats.bytes} bytes</b></span>
            <pre>{output || "Result will appear here..."}</pre>
            <div className="text-tool-output-actions">
              <button type="button" onClick={copyOutput} disabled={!output}><Clipboard size={15} /> Copy</button>
              <button type="button" onClick={download} disabled={!output}><Download size={15} /> Download .txt</button>
            </div>
          </section>
        </div>
      )}

      <footer className="text-tool-stats">
        <span>Runs locally in your browser</span>
        <span>Raw sample included for every tab</span>
        <span>Copy and download ready</span>
      </footer>
    </section>
  );
}
