"use client";

import {
  Binary, Braces, Calculator, CalendarClock, ChevronDown, Code2, Crop, Database,
  FileCode2, FileJson, FileText, Fingerprint, Hash, Image as ImageIcon, Layers3, LayoutGrid,
  Link2, ListFilter, Network, Palette, PanelLeftClose, Regex, Search, Share2,
  ShieldCheck, SlidersHorizontal, Sparkles, Star, TextCursorInput, Type, WandSparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../language-provider";
import EncodingWorkbench from "./encoding-workbench";
import DataFormatWorkbench from "./data-format-workbench";
import CryptoWorkbench from "./crypto-workbench";
import CodeConverterWorkbench from "./code-converter-workbench";
import NumberToolsWorkbench from "./number-tools-workbench";
import UnitToolsWorkbench from "./unit-tools-workbench";
import DateTimeWorkbench from "./date-time-workbench";

type ToolCollection = {
  id: string;
  label: string;
  icon: typeof Search;
  tools: string[];
};

type ToolGroup = { id: string; label: string; collections: ToolCollection[] };

const groups: ToolGroup[] = [
  { id: "encoding", label: "Encoding", collections: [
    { id: "encoding-tools", label: "Encoding Tools", icon: Binary, tools: ["Base64", "Base32", "URL Encoder", "HTML Entities", "Text / Binary", "Data URL"] },
    { id: "crypto-hash", label: "Crypto & Hash Tools", icon: ShieldCheck, tools: ["Hash Generator", "Text Hash Generator", "HMAC Generator", "SRI Hash Generator", "JWT Debugger", "JWT Inspector", "Text Encrypt / Decrypt", "Password Generator"] },
  ]},
  { id: "converters", label: "Converters", collections: [
    { id: "data-format", label: "Data Format Converters", icon: FileJson, tools: ["CSV to JSON", "JSON to CSV", "CSV to SQL", "CSV to Markdown", "YAML to JSON", "JSON to YAML", "JSON to XML", "XML to JSON", "Markdown to JSON", "Markdown to Notion"] },
    { id: "code-converters", label: "Code Converters", icon: Code2, tools: ["JSON to TypeScript", "JSON to Zod Schema", "JSON to Go Struct", "SQL to TypeScript", "HTML to JSX", "SVG to JSX", "CSS to Tailwind", "cURL to Fetch", "Docker Run to Compose", "Figma Token Converter"] },
    { id: "number-converters", label: "Number Converters", icon: Hash, tools: ["Number Base Converter", "Number Base Playground", "Roman Numeral Converter", "Number to Words", "IP Address Converter", "Byte Unit Converter"] },
    { id: "unit-converters", label: "Unit Converters", icon: Calculator, tools: ["Unit Converter", "CSS Unit Converter", "Temperature Converter", "Aspect Ratio Calculator", "Number Format Explorer"] },
    { id: "date-time", label: "Date & Time Tools", icon: CalendarClock, tools: ["Timestamp Converter", "Timezone Converter", "Duration Calculator", "Date Difference Calculator", "Date Format Explorer"] },
  ]},
  { id: "css", label: "CSS", collections: [
    { id: "color-tools", label: "Color Tools", icon: Palette, tools: ["Color Converter", "Palette Generator", "Contrast Checker", "Color Mixer"] },
    { id: "gradients-patterns", label: "CSS Gradients & Patterns", icon: Sparkles, tools: ["Gradient Generator", "Mesh Gradient", "Pattern Generator"] },
    { id: "shadows-effects", label: "CSS Shadows & Effects", icon: Layers3, tools: ["Box Shadow", "Text Shadow", "Glassmorphism", "Neumorphism"] },
    { id: "layout-tools", label: "CSS Layout Tools", icon: LayoutGrid, tools: ["Grid Generator", "Flexbox Playground", "Aspect Ratio"] },
    { id: "animations", label: "CSS Animations", icon: Zap, tools: ["Keyframe Builder", "Transition Preview", "Easing Editor"] },
    { id: "typography", label: "CSS Typography", icon: Type, tools: ["Fluid Type Scale", "Text Stroke", "Clamp Generator"] },
    { id: "shapes-borders", label: "CSS Shapes & Borders", icon: Crop, tools: ["Border Radius", "Clip Path", "Blob Generator", "Triangle Generator"] },
    { id: "component-generators", label: "CSS Component Generators", icon: WandSparkles, tools: ["Button Generator", "Card Generator", "Loader Generator", "Toggle Generator"] },
    { id: "css-utilities", label: "CSS Utilities", icon: SlidersHorizontal, tools: ["CSS Minifier", "Prefix Helper", "Specificity Calculator"] },
  ]},
  { id: "generators", label: "Generators", collections: [
    { id: "id-random", label: "ID & Random Generators", icon: Fingerprint, tools: ["UUID Generator", "Nano ID", "Random Number", "Random String"] },
    { id: "mock-data", label: "Content & Mock Data Generators", icon: Database, tools: ["Lorem Ipsum", "Mock User Data", "JSON Dataset", "Avatar Placeholder"] },
    { id: "favicon-placeholder", label: "Favicon & Placeholder Generators", icon: ImageIcon, tools: ["Favicon Generator", "Image Placeholder", "Initials Avatar"] },
    { id: "config-files", label: "Config File Generators", icon: FileCode2, tools: ["ESLint Config", "TSConfig", "Dockerfile", "Gitignore"] },
    { id: "cron-schedule", label: "Cron & Schedule Tools", icon: CalendarClock, tools: ["Cron Builder", "Cron Explainer", "Schedule Preview"] },
    { id: "markdown-docs", label: "Markdown & Docs Generators", icon: FileText, tools: ["Markdown Editor", "README Generator", "Table Generator", "Changelog"] },
    { id: "developer-utilities", label: "Developer Utilities", icon: Code2, tools: ["JWT Decoder", "QR Code Generator", "User Agent Parser", "HTTP Status Lookup"] },
  ]},
  { id: "formatters", label: "Formatters", collections: [
    { id: "json-tools", label: "JSON Tools", icon: Braces, tools: ["JSON Formatter", "JSON Minifier", "JSON Validator", "JSON Diff"] },
    { id: "code-formatters", label: "Code Formatters", icon: FileCode2, tools: ["HTML Formatter", "CSS Formatter", "SQL Formatter", "JavaScript Formatter"] },
  ]},
  { id: "text", label: "Text Tools", collections: [
    { id: "text-manipulation", label: "Text Manipulation", icon: TextCursorInput, tools: ["Case Converter", "Line Sorter", "Duplicate Remover", "Text Reverser"] },
    { id: "text-analysis", label: "Text Analysis", icon: ListFilter, tools: ["Word Counter", "Reading Time", "Character Frequency"] },
    { id: "regex-tools", label: "Regex Tools", icon: Regex, tools: ["Regex Tester", "Regex Explainer", "Pattern Library"] },
    { id: "text-utilities", label: "Text Utilities", icon: Sparkles, tools: ["Slug Generator", "Diff Checker", "Whitespace Cleaner"] },
    { id: "calculators", label: "Calculators", icon: Calculator, tools: ["Percentage", "Aspect Ratio", "Ohm Law", "Compound Interest"] },
  ]},
  { id: "web", label: "Web", collections: [
    { id: "seo-social", label: "SEO & Social Tools", icon: Share2, tools: ["Meta Tag Generator", "Open Graph Preview", "Robots.txt", "Sitemap"] },
    { id: "network-http", label: "Network & HTTP Tools", icon: Network, tools: ["DNS Lookup", "HTTP Headers", "IP Inspector", "URL Parser"] },
  ]},
  { id: "media", label: "Media", collections: [
    { id: "image-editor", label: "Image Editor", icon: Crop, tools: ["Crop Image", "Resize Image", "Rotate Image"] },
    { id: "image-color", label: "Image Color Tools", icon: Palette, tools: ["Color Picker", "Duotone", "Tint & Shade"] },
    { id: "image-effects", label: "Image Effects", icon: Zap, tools: ["Blur", "Pixelate", "Noise", "Vignette"] },
    { id: "image-enhance", label: "Image Enhance & Style", icon: WandSparkles, tools: ["Sharpen", "Upscale", "Background Cleanup"] },
    { id: "image-export", label: "Image Conversion & Export", icon: ImageIcon, tools: ["PNG to WebP", "JPG to PNG", "Image Compressor"] },
    { id: "audio-tools", label: "Audio Tools", icon: SlidersHorizontal, tools: ["Audio Trimmer", "Waveform", "Format Converter"] },
    { id: "video-tools", label: "Video Tools", icon: PanelLeftClose, tools: ["Video Trimmer", "GIF Maker", "Thumbnail Extractor"] },
  ]},
];

const allCollections = groups.flatMap((group) => group.collections.map((collection) => ({ ...collection, group: group.label })));
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const interfaceCopy = {
  vi: { badge: "DK Coder · Toolbox", title: "Công cụ nhỏ, giải quyết việc lớn.", lead: "Bộ tiện ích dành cho lập trình, thiết kế và xử lý nội dung — nhanh, riêng tư và ngay trong trình duyệt.", filter: "Lọc công cụ...", quick: "Tìm nhanh bất kỳ công cụ nào...", recent: "Dùng gần đây", results: "Kết quả tìm kiếm", collections: "bộ công cụ", input: "Dữ liệu vào", output: "Kết quả", run: "Chạy công cụ", clear: "Xóa" },
  en: { badge: "DK Coder · Toolbox", title: "Small tools, meaningful momentum.", lead: "A focused collection for development, design and content work — fast, private and browser-first.", filter: "Filter tools...", quick: "Quick search for any tool...", recent: "Recently used", results: "Search results", collections: "collections", input: "Input", output: "Output", run: "Run tool", clear: "Clear" },
} as const;

export function ToolsHub({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = interfaceCopy[language];
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(["JSON Formatter", "Markdown Editor", "QR Code Generator"]);
  const activeCollection = allCollections.find((item) => item.id === collectionId) ?? allCollections[0];
  const [activeTool, setActiveTool] = useState(activeCollection.tools[0]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setFavorites(JSON.parse(localStorage.getItem("dk-tools:favorites") ?? "[]"));
        setRecent(JSON.parse(localStorage.getItem("dk-tools:recent") ?? '["JSON Formatter","Markdown Editor","QR Code Generator"]'));
      } catch {
        localStorage.removeItem("dk-tools:favorites");
        localStorage.removeItem("dk-tools:recent");
      }
    });
  }, []);

  const updateFavorites = (collectionId: string) => {
    setFavorites((current) => {
      const next = current.includes(collectionId) ? current.filter((id) => id !== collectionId) : [...current, collectionId];
      localStorage.setItem("dk-tools:favorites", JSON.stringify(next));
      return next;
    });
  };

  const searchResults = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return [];
    return allCollections.filter((collection) => normalize(`${collection.label} ${collection.tools.join(" ")}`).includes(needle));
  }, [query]);

  const openCollection = (collection: ToolCollection) => router.push(`/tools/${collection.id}`);

  const openRecentTool = (name: string) => {
    const collection = allCollections.find((item) => item.tools.includes(name));
    if (collection) router.push(`/tools/${collection.id}`);
  };

  const selectTool = (name: string) => {
    setActiveTool(name);
    setRecent((current) => {
      const next = [name, ...current.filter((item) => item !== name)].slice(0, 6);
      localStorage.setItem("dk-tools:recent", JSON.stringify(next));
      return next;
    });
    setOutput("");
  };

  const runTool = () => {
    try {
      if (activeTool === "Base64 Encoder") setOutput(btoa(unescape(encodeURIComponent(input))));
      else if (activeTool === "Base64 Decoder") setOutput(decodeURIComponent(escape(atob(input))));
      else if (activeTool === "URL Encoder") setOutput(encodeURIComponent(input));
      else if (activeTool === "URL Decoder") setOutput(decodeURIComponent(input));
      else if (activeTool.includes("JSON Formatter")) setOutput(JSON.stringify(JSON.parse(input), null, 2));
      else if (activeTool.includes("JSON Minifier")) setOutput(JSON.stringify(JSON.parse(input)));
      else if (activeTool === "Slug Generator") setOutput(normalize(input).trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
      else if (activeTool === "Case Converter") setOutput(input.split(/\s+/).filter(Boolean).map((word, index) => index ? word[0]?.toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join(""));
      else if (activeTool === "Word Counter") setOutput(`${input.trim() ? input.trim().split(/\s+/).length : 0} words · ${input.length} characters`);
      else if (activeTool === "Text Reverser") setOutput([...input].reverse().join(""));
      else if (activeTool === "Whitespace Cleaner") setOutput(input.replace(/\s+/g, " ").trim());
      else setOutput(input || `${activeTool} is ready for input.`);
    } catch {
      setOutput("Invalid input for this tool. Please check the value and try again.");
    }
  };

  return (
    <main className={`tools-hub ${collectionId ? "is-tool-detail" : "is-tools-index"}`}>
      <aside className="tools-sidebar">
        <button className="tools-sidebar-title" onClick={() => router.push("/tools")}><Zap size={18} /><strong>DK Tools</strong><span>{allCollections.length}</span></button>
        <label className="tools-filter"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.filter} /></label>
        <div className="tools-nav">
          {groups.map((group) => {
            const isCollapsed = collapsed.includes(group.id);
            return <section className="tools-nav-group" key={group.id}>
              <button className="tools-group-heading" onClick={() => setCollapsed((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id])}>
                <span>{group.label}</span><b>{group.collections.length}</b><ChevronDown className={isCollapsed ? "is-collapsed" : ""} size={16} />
              </button>
              {!isCollapsed && group.collections.map((collection) => {
                const Icon = collection.icon;
                return <button className={`tools-nav-item ${collectionId === collection.id ? "is-active" : ""}`} onClick={() => openCollection(collection)} key={collection.id}>
                  <Icon size={17} /><span>{collection.label}</span><Star onClick={(event) => { event.stopPropagation(); updateFavorites(collection.id); }} className={favorites.includes(collection.id) ? "is-favorite" : ""} size={16} />
                </button>;
              })}
            </section>;
          })}
        </div>
      </aside>

      <section className={`tools-main ${collectionId ? "is-detail" : ""}`}>
        {!collectionId && <>
          <header className="tools-hero">
            <span><Sparkles size={15} /> {t.badge}</span>
            <h1>{t.title}</h1>
            <p>{t.lead}</p>
            <label className="tools-quick-search"><Search size={25} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.quick} /><kbd>⌘ K</kbd></label>
            <div className="tools-proof"><span>100+ utilities</span><i /><span>Instant search</span><i /><span>Private by design</span></div>
          </header>
          {query ? <section className="tools-search-results">
            <div className="tools-section-heading"><h2>{t.results}</h2><span>{searchResults.length} {t.collections}</span></div>
            <div className="tool-collection-grid">{searchResults.map((collection) => <button key={collection.id} onClick={() => openCollection(collection)}><collection.icon size={19} /><strong>{collection.label}</strong><span>{collection.tools.slice(0, 3).join(" · ")}</span></button>)}</div>
          </section> : <section className="tools-recent"><h2>{t.recent}</h2><div>{recent.map((name) => <button key={name} onClick={() => openRecentTool(name)}><Link2 size={15} />{name}</button>)}</div></section>}
        </>}

        {collectionId && <>
          <header className="tools-detail-header">
            <div className="tools-breadcrumb"><button onClick={() => router.push("/tools")}>Tools</button><span>/</span><span>{activeCollection.group}</span><span>/</span><strong>{activeCollection.label}</strong></div>
            <span className="tools-detail-kicker">{activeCollection.group}</span>
            <h1>{activeCollection.label}</h1>
            <p>{language === "vi" ? `Bộ ${activeCollection.tools.length} tiện ích ${activeCollection.label.toLowerCase()} chạy trực tiếp trong trình duyệt.` : `${activeCollection.tools.length} focused ${activeCollection.label.toLowerCase()} that run directly in your browser.`}</p>
          </header>
          {activeCollection.id === "encoding-tools" ? <EncodingWorkbench /> : activeCollection.id === "data-format" ? <DataFormatWorkbench /> : activeCollection.id === "crypto-hash" ? <CryptoWorkbench /> : activeCollection.id === "code-converters" ? <CodeConverterWorkbench /> : activeCollection.id === "number-converters" ? <NumberToolsWorkbench /> : activeCollection.id === "unit-converters" ? <UnitToolsWorkbench /> : activeCollection.id === "date-time" ? <DateTimeWorkbench /> : <section className="tool-workspace">
            <div className="tool-tabs">{activeCollection.tools.map((name) => <button className={activeTool === name ? "is-active" : ""} onClick={() => selectTool(name)} key={name}>{name}</button>)}</div>
            <div className="tool-runner">
              <label><span>{t.input}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Paste or type content for ${activeTool}...`} /></label>
              <div className="tool-runner-actions"><button onClick={runTool}>{t.run} <Zap size={16} /></button><button onClick={() => { setInput(""); setOutput(""); }}>{t.clear}</button></div>
              <label><span>{t.output}</span><textarea value={output} readOnly placeholder="Your result appears here..." /></label>
            </div>
          </section>}
        </>}
      </section>
    </main>
  );
}

export default function ToolsPage() {
  return <ToolsHub />;
}
