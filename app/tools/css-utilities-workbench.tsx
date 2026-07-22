"use client";

import { Check, Clipboard, Download, RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

const utilityTabs = ["CSS Variable Generator", "CSS @supports Generator", "CSS Specificity Calculator", "CSS Box Model Visualizer", "Tailwind Config Generator"] as const;
type UtilityTab = (typeof utilityTabs)[number];
type Sides = { top: number; right: number; bottom: number; left: number };

const initialColors = { primary: "#3b82f6", secondary: "#64748b", accent: "#8b5cf6", success: "#22c55e", warning: "#f59e0b", error: "#ef4444", info: "#06b6d4" };
const newSides = (value: number): Sides => ({ top: value, right: value, bottom: value, left: value });
const copy = async (value: string, done: (value: boolean) => void) => { await navigator.clipboard.writeText(value); done(true); window.setTimeout(() => done(false), 1200); };
const download = (value: string, fileName: string) => { const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); };

function calculateSpecificity(selector: string) {
  const normalized = selector.replace(/:where\([^)]*\)/g, "").replace(/:(?:not|is|has)\(([^)]*)\)/g, " $1 ");
  const ids = (normalized.match(/#[\w-]+/g) || []).length;
  const classes = (normalized.match(/\.[\w-]+/g) || []).length + (normalized.match(/\[[^\]]+\]/g) || []).length + (normalized.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
  const pseudoElements = (normalized.match(/::[\w-]+/g) || []).length;
  const stripped = normalized.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, " ").replace(/[*]/g, " ");
  const elements = pseudoElements + (stripped.match(/(^|[\s>+~,(])([a-zA-Z][\w-]*)/g) || []).length;
  return { ids, classes, elements, score: ids * 100 + classes * 10 + elements };
}

export default function CssUtilitiesWorkbench() {
  const [active, setActive] = useState<UtilityTab>("CSS Variable Generator");
  const [copied, setCopied] = useState(false);
  const [colors, setColors] = useState(initialColors);
  const [spacing, setSpacing] = useState({ xs: .25, sm: .5, md: 1, lg: 1.5, xl: 2 });
  const [radius, setRadius] = useState({ sm: 6, md: 12, lg: 20 });
  const [supports, setSupports] = useState({ property: "backdrop-filter", value: "blur(10px)", not: false });
  const [selectors, setSelectors] = useState("div\n.active\n#header\nul li a\ndiv.container > p.text\n#nav .menu:hover");
  const [box, setBox] = useState({ boxSizing: "content-box", width: 200, height: 120, margin: newSides(16), border: newSides(2), padding: newSides(12), marginLinked: true, borderLinked: true, paddingLinked: true });
  const [tailwind, setTailwind] = useState({
    colors: { primary: "#3b82f6", secondary: "#64748b", accent: "#8b5cf6", neutral: "#1e293b", success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#06b6d4" },
    fontFamily: { sans: "Inter, system-ui, sans-serif", serif: "Georgia, serif", mono: "Fira Code, monospace" },
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem" },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", "2xl": "3rem" },
    borderRadius: { sm: "0.375rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", full: "9999px" },
    boxShadow: { sm: "0 1px 3px rgb(15 23 42 / 0.12)", md: "0 8px 24px rgb(15 23 42 / 0.14)", lg: "0 20px 50px rgb(15 23 42 / 0.18)" },
    container: { center: true, padding: "1.5rem" },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    language: "JavaScript",
  });

  const specificityRows = useMemo(() => selectors.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).map((selector) => ({ selector, ...calculateSpecificity(selector) })).sort((a, b) => b.score - a.score), [selectors]);
  const variablesOutput = useMemo(() => [":root {", ...Object.entries(colors).map(([name, value]) => "  --color-" + name + ": " + value + ";"), ...Object.entries(spacing).map(([name, value]) => "  --space-" + name + ": " + value + "rem;"), ...Object.entries(radius).map(([name, value]) => "  --radius-" + name + ": " + value + "px;"), "}"].join("\n"), [colors, spacing, radius]);
  const supportsOutput = ["@supports " + (supports.not ? "not " : "") + "(" + (supports.property || "display") + ": " + (supports.value || "grid") + ") {", "  .feature {", "    " + (supports.property || "display") + ": " + (supports.value || "grid") + ";", "  }", "}"].join("\n");
  const boxOutput = [".box {", "  box-sizing: " + box.boxSizing + ";", "  width: " + box.width + "px;", "  height: " + box.height + "px;", "  margin: " + Object.values(box.margin).join("px ") + "px;", "  border-width: " + Object.values(box.border).join("px ") + "px;", "  border-style: solid;", "  padding: " + Object.values(box.padding).join("px ") + "px;", "}"].join("\n");
  const tailwindConfigOutput = useMemo(() => {
    const fontFamily = Object.fromEntries(Object.entries(tailwind.fontFamily).map(([name, value]) => [name, value.split(",").map((item) => item.trim()).filter(Boolean)]));
    const config = {
      content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
      theme: {
        screens: tailwind.breakpoints,
        container: tailwind.container,
        extend: { colors: tailwind.colors, fontFamily, fontSize: tailwind.fontSize, spacing: tailwind.spacing, borderRadius: tailwind.borderRadius, boxShadow: tailwind.boxShadow },
      },
      plugins: [],
    };
    const serialized = JSON.stringify(config, null, 2);
    return tailwind.language === "TypeScript" ? 'import type { Config } from "tailwindcss";\n\nconst config: Config = ' + serialized + ";\n\nexport default config;" : "module.exports = " + serialized + ";";
  }, [tailwind]);
  const output = active.includes("Variable") ? variablesOutput : active.includes("@supports") ? supportsOutput : active.includes("Specificity") ? specificityRows.map((row) => row.selector + " /* 0," + row.ids + "," + row.classes + "," + row.elements + " */").join("\n") : active.includes("Box Model") ? boxOutput : tailwindConfigOutput;

  const updateSide = (group: "margin" | "border" | "padding", side: keyof Sides, value: number) => {
    const linkedKey = (group + "Linked") as "marginLinked" | "borderLinked" | "paddingLinked";
    setBox((current) => ({ ...current, [group]: current[linkedKey] ? newSides(value) : { ...current[group], [side]: value } }));
  };
  const renderSideGroup = (title: string, group: "margin" | "border" | "padding") => {
    const linkedKey = (group + "Linked") as "marginLinked" | "borderLinked" | "paddingLinked";
    return <div className="css-utility-section"><div className="css-utility-section-title"><strong>{title}</strong><label className="css-check"><input type="checkbox" checked={box[linkedKey]} onChange={(event) => setBox((current) => ({ ...current, [linkedKey]: event.target.checked }))} />Link</label></div><div className="css-side-grid">{(["top", "right", "bottom", "left"] as const).map((side) => <label key={side}>{side}<input type="number" min="0" value={box[group][side]} onChange={(event) => updateSide(group, side, Math.max(0, Number(event.target.value)))} /></label>)}</div></div>;
  };

  const renderVariableGenerator = () => <>
    <div className="css-utility-section"><strong>Colors</strong>{Object.entries(colors).map(([name, value]) => <label key={name}>{name}<span className="css-color-field"><input type="color" value={value} onChange={(event) => setColors((current) => ({ ...current, [name]: event.target.value }))} /><input value={value} onChange={(event) => setColors((current) => ({ ...current, [name]: event.target.value }))} /></span></label>)}</div>
    <div className="css-utility-section"><strong>Spacing</strong>{Object.entries(spacing).map(([name, value]) => <label className="css-range" key={name}>{name}<input type="range" min="0" max="4" step=".25" value={value} onChange={(event) => setSpacing((current) => ({ ...current, [name]: Number(event.target.value) }))} /><span>{value}rem</span></label>)}</div>
    <div className="css-utility-section"><strong>Radius</strong>{Object.entries(radius).map(([name, value]) => <label className="css-range" key={name}>{name}<input type="range" min="0" max="40" value={value} onChange={(event) => setRadius((current) => ({ ...current, [name]: Number(event.target.value) }))} /><span>{value}px</span></label>)}</div>
  </>;
  const renderSupportsGenerator = () => <>
    <label className="css-check"><input type="checkbox" checked={supports.not} onChange={(event) => setSupports((current) => ({ ...current, not: event.target.checked }))} />Use not operator</label>
    <div className="css-preset-buttons">{[["Grid", "display", "grid"], ["Backdrop", "backdrop-filter", "blur(10px)"], ["Container", "container-type", "inline-size"], ["Selector", "selector", ":has(*)"]].map(([label, property, value]) => <button key={label} onClick={() => setSupports({ property, value, not: false })}>{label}</button>)}</div>
    <label>CSS Property<input placeholder="e.g. display, backdrop-filter" value={supports.property} onChange={(event) => setSupports((current) => ({ ...current, property: event.target.value }))} /></label>
    <label>CSS Value<input placeholder="e.g. grid, blur(10px)" value={supports.value} onChange={(event) => setSupports((current) => ({ ...current, value: event.target.value }))} /></label>
    <button className="css-secondary" onClick={() => setSupports({ property: "", value: "", not: false })}>Clear All</button>
  </>;
  const renderSpecificityCalculator = () => <>
    <label>CSS Selectors (one per line)<textarea className="css-utility-textarea" value={selectors} onChange={(event) => setSelectors(event.target.value)} /></label>
    <div className="css-preset-buttons"><button onClick={() => setSelectors("div\n.active\n#header\nul li a\ndiv.container > p.text\n#nav .menu:hover")}>Load Examples</button><button onClick={() => setSelectors("")}>Clear</button></div>
    <div className="css-specificity-legend"><span>IDs = 100</span><span>Classes = 10</span><span>Elements = 1</span></div>
  </>;
  const renderBoxModelVisualizer = () => <>
    <div className="css-segmented"><button className={box.boxSizing === "content-box" ? "is-active" : ""} onClick={() => setBox((current) => ({ ...current, boxSizing: "content-box" }))}>content-box</button><button className={box.boxSizing === "border-box" ? "is-active" : ""} onClick={() => setBox((current) => ({ ...current, boxSizing: "border-box" }))}>border-box</button></div>
    <div className="css-field-row"><label>Width<input type="number" min="20" value={box.width} onChange={(event) => setBox((current) => ({ ...current, width: Number(event.target.value) }))} /></label><label>Height<input type="number" min="20" value={box.height} onChange={(event) => setBox((current) => ({ ...current, height: Number(event.target.value) }))} /></label></div>
    {renderSideGroup("Margin", "margin")}{renderSideGroup("Border Width", "border")}{renderSideGroup("Padding", "padding")}
    <button className="css-secondary" onClick={() => setBox((current) => ({ ...current, boxSizing: "content-box", width: 200, height: 120, margin: newSides(16), border: newSides(2), padding: newSides(12) }))}><RotateCcw size={14} />Reset</button>
  </>;
  const renderTailwindConfigGenerator = () => <>
    <div className="css-utility-section"><strong>Theme Colors</strong><div className="css-tailwind-token-grid">{Object.entries(tailwind.colors).map(([name, value]) => <label key={name}>{name}<span className="css-color-field"><input type="color" value={value} onChange={(event) => setTailwind((current) => ({ ...current, colors: { ...current.colors, [name]: event.target.value } }))} /><input value={value} onChange={(event) => setTailwind((current) => ({ ...current, colors: { ...current.colors, [name]: event.target.value } }))} /></span></label>)}</div></div>
    <div className="css-utility-section"><strong>Font Families</strong>{Object.entries(tailwind.fontFamily).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, fontFamily: { ...current.fontFamily, [name]: event.target.value } }))} /></label>)}</div>
    <div className="css-utility-section"><strong>Font Sizes</strong><div className="css-tailwind-token-grid">{Object.entries(tailwind.fontSize).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, fontSize: { ...current.fontSize, [name]: event.target.value } }))} /></label>)}</div></div>
    <div className="css-utility-section"><strong>Spacing Scale</strong><div className="css-tailwind-token-grid">{Object.entries(tailwind.spacing).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, spacing: { ...current.spacing, [name]: event.target.value } }))} /></label>)}</div></div>
    <div className="css-utility-section"><strong>Border Radius</strong><div className="css-tailwind-token-grid">{Object.entries(tailwind.borderRadius).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, borderRadius: { ...current.borderRadius, [name]: event.target.value } }))} /></label>)}</div></div>
    <div className="css-utility-section"><strong>Box Shadows</strong>{Object.entries(tailwind.boxShadow).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, boxShadow: { ...current.boxShadow, [name]: event.target.value } }))} /></label>)}</div>
    <div className="css-utility-section"><strong>Container</strong><label className="css-check"><input type="checkbox" checked={tailwind.container.center} onChange={(event) => setTailwind((current) => ({ ...current, container: { ...current.container, center: event.target.checked } }))} />Center container</label><label>Padding<input value={tailwind.container.padding} onChange={(event) => setTailwind((current) => ({ ...current, container: { ...current.container, padding: event.target.value } }))} /></label></div>
    <div className="css-utility-section"><strong>Breakpoints</strong><div className="css-tailwind-token-grid">{Object.entries(tailwind.breakpoints).map(([name, value]) => <label key={name}>{name}<input value={value} onChange={(event) => setTailwind((current) => ({ ...current, breakpoints: { ...current.breakpoints, [name]: event.target.value } }))} /></label>)}</div></div>
    <div className="css-segmented">{["JavaScript", "TypeScript"].map((language) => <button key={language} className={tailwind.language === language ? "is-active" : ""} onClick={() => setTailwind((current) => ({ ...current, language }))}>{language}</button>)}</div>
    <button className="css-secondary" onClick={() => download(tailwindConfigOutput, tailwind.language === "TypeScript" ? "tailwind.config.ts" : "tailwind.config.js")}><Download size={14} />Download config</button>
  </>;
  const renderControls = () => active.includes("Variable") ? renderVariableGenerator() : active.includes("@supports") ? renderSupportsGenerator() : active.includes("Specificity") ? renderSpecificityCalculator() : active.includes("Box Model") ? renderBoxModelVisualizer() : renderTailwindConfigGenerator();

  const renderUtilitiesPreview = () => {
    if (active.includes("Variable")) {
      const tokenStyle = { "--util-primary": colors.primary, "--util-secondary": colors.secondary, "--util-accent": colors.accent, "--util-success": colors.success, "--util-warning": colors.warning, "--util-error": colors.error } as CSSProperties;
      return <div className="css-variables-preview" style={tokenStyle}><strong>Live Preview</strong><div className="css-variable-buttons"><button>Primary</button><button>Secondary</button><button>Outline</button><button>Success</button><button>Warning</button><button>Error</button></div><div className="css-variable-cards"><article><b>Card Title</b><span>Design tokens update instantly.</span></article><article><b>Secondary Card</b><span>Reusable variables stay consistent.</span></article></div><h2>Heading 1 - 3xl</h2><h3>Heading 2 - 2xl</h3><p>Body text and badges use the same token set.</p></div>;
    }
    if (active.includes("@supports")) return <div className="css-supports-preview"><strong>{supports.not ? "Fallback query" : "Progressive enhancement"}</strong><code>({supports.property || "display"}: {supports.value || "grid"})</code><p>The generated rule applies only when the browser condition matches.</p></div>;
    if (active.includes("Specificity")) return <div className="css-specificity-list">{specificityRows.map((row, index) => <article key={row.selector + index} className={index === 0 ? "is-winner" : ""}><code>{row.selector}</code><span><b>{row.ids}</b><b>{row.classes}</b><b>{row.elements}</b><strong>{row.score}</strong></span></article>)}{!specificityRows.length && <p>Add one selector per line to compare specificity.</p>}</div>;
    if (active.includes("Box Model")) {
      const width = box.boxSizing === "border-box" ? Math.max(20, box.width - box.padding.left - box.padding.right - box.border.left - box.border.right) : box.width;
      const height = box.boxSizing === "border-box" ? Math.max(20, box.height - box.padding.top - box.padding.bottom - box.border.top - box.border.bottom) : box.height;
      return <div className="css-box-model-stage"><div className="css-box-model-legend" aria-label="Box model layers"><span><i className="is-margin" />Margin</span><span><i className="is-border" />Border</span><span><i className="is-padding" />Padding</span><span><i className="is-content" />Content</span></div><div className="css-box-diagram"><div className="css-box-margin" style={{ padding: Object.values(box.margin).join("px ") + "px" }}><div className="css-box-border" style={{ padding: Object.values(box.border).join("px ") + "px" }}><div className="css-box-padding" style={{ padding: Object.values(box.padding).join("px ") + "px" }}><div className="css-box-content" style={{ width, height }}>{width} x {height}</div></div></div></div></div></div>;
    }
    return <div className="css-tailwind-preview"><div>{Object.entries(tailwind.colors).map(([name, value]) => <i key={name} title={name} style={{ background: value }} />)}</div><strong>{tailwind.language} configuration</strong><p>{Object.keys(tailwind.colors).length} colors · {Object.keys(tailwind.fontSize).length} font sizes · {Object.keys(tailwind.spacing).length} spacing tokens · {Object.keys(tailwind.breakpoints).length} breakpoints</p></div>;
  };

  return <section className="css-tool-workbench css-tool-workbench--css-utilities">
    <div className="data-format-tabs css-tool-tabs" role="tablist">{utilityTabs.map((name) => <button key={name} className={active === name ? "is-active" : ""} onClick={() => setActive(name)}>{name}</button>)}</div>
    <div className="css-tool-intro"><div><h2>{active}</h2></div></div>
    <div className={"css-tool-grid" + (active.includes("Tailwind") ? " is-tailwind-config" : "")}><div className="css-control-panel">{renderControls()}</div><div className="css-preview-column"><div className="css-tool-preview">{renderUtilitiesPreview()}</div><div className="css-code-output"><div><strong>{active.includes("Tailwind") ? "Generated Config" : "CSS Output"}</strong><button onClick={() => copy(output, setCopied)}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button></div><pre>{output}</pre></div></div></div>
  </section>;
}
