"use client";

import { ArrowLeftRight, Check, Clipboard, Download, Eraser, FlaskConical, Play, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { type ByteEncoding, type EncodingDirection, type EncodingKind, decodeBytes, encodeBytes, transformEncoding } from "./encoding-engine";

const tabs: { id: EncodingKind; label: string; hint: string; sample: string }[] = [
  { id: "base64", label: "Base64", hint: "Chuyển văn bản Unicode sang Base64 an toàn.", sample: "Xin chào DK Coder 👋" },
  { id: "base32", label: "Base32", hint: "Mã hóa và giải mã Base32 theo RFC 4648.", sample: "DK Tools chuẩn RFC 4648" },
  { id: "url", label: "URL", hint: "Mã hóa thành phần URL theo chuẩn URI.", sample: "https://dkcoder.vn/tim-kiem?q=công cụ" },
  { id: "html", label: "HTML Entities", hint: "Bảo vệ ký tự đặc biệt khi nhúng vào HTML.", sample: '<button aria-label="Mở">Tools & Apps</button>' },
  { id: "binary", label: "Text / Binary", hint: "Chuyển văn bản UTF-8 sang Binary, Hex, Decimal hoặc Base64.", sample: "DK ✓" },
  { id: "data-uri", label: "Data URL", hint: "Đóng gói file để nhúng trực tiếp vào HTML, CSS hoặc JavaScript.", sample: "Hello from DK Tools!" },
];
const separators = { space: " ", newline: "\n", none: "" } as const;

export default function EncodingWorkbench() {
  const [kind, setKind] = useState<EncodingKind>("base64");
  const [direction, setDirection] = useState<EncodingDirection>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [byteEncoding, setByteEncoding] = useState<ByteEncoding>("binary");
  const [separator, setSeparator] = useState<keyof typeof separators>("space");
  const [fileName, setFileName] = useState("");
  const [mime, setMime] = useState("");
  const [copied, setCopied] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const active = tabs.find((tab) => tab.id === kind)!;
  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(output).length, [output]);

  const run = () => {
    try {
      const result = kind === "binary"
        ? direction === "encode" ? encodeBytes(input, byteEncoding, separators[separator]) : decodeBytes(input, byteEncoding)
        : transformEncoding(kind, direction, input, { urlSafe });
      setOutput(result); setError("");
    } catch (reason) {
      setOutput(""); setError(reason instanceof Error ? reason.message : "Không thể xử lý dữ liệu.");
    }
  };
  const changeKind = (next: EncodingKind) => { setKind(next); setInput(""); setOutput(""); setFileName(""); setError(""); setDirection("encode"); };
  const copyText = async (value: string, id = "output") => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(id); window.setTimeout(() => setCopied(""), 1400); };
  const download = () => { if (!output) return; const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = kind + "-result.txt"; link.click(); URL.revokeObjectURL(url); };
  const loadFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File vượt quá giới hạn 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setOutput(String(reader.result ?? "")); setInput(file.name); setFileName(file.name); setMime(file.type || "application/octet-stream"); setError(""); };
    reader.onerror = () => setError("Không thể đọc file này.");
    reader.readAsDataURL(file);
  };
  const snippets = output ? {
    HTML: '<img src="' + output + '" alt="' + (fileName || "Embedded asset") + '">',
    CSS: 'background-image: url("' + output + '");',
    JavaScript: 'const asset = "' + output + '";',
  } : null;

  return <section className={"encoding-workbench " + (kind === "data-uri" ? "is-data-uri" : "")}>
    <div className="encoding-tabs" role="tablist">{tabs.map((tab) => <button role="tab" aria-selected={kind === tab.id} className={kind === tab.id ? "is-active" : ""} onClick={() => changeKind(tab.id)} key={tab.id}>{tab.label}</button>)}</div>
    <div className="encoding-intro">
      <div><span>Encoding lab</span><h2>{kind === "data-uri" ? "Data URL Generator" : active.label + " Encoder / Decoder"}</h2><p>{active.hint} Mọi xử lý diễn ra ngay trên thiết bị.</p></div>
      {kind !== "data-uri" && <div className="encoding-direction"><button className={direction === "encode" ? "is-active" : ""} onClick={() => setDirection("encode")}>Encode</button><button className={direction === "decode" ? "is-active" : ""} onClick={() => setDirection("decode")}>Decode</button></div>}
    </div>

    {kind === "data-uri" ? <>
      <label className={"data-url-dropzone " + (fileName ? "has-file" : "")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); loadFile(event.dataTransfer.files[0]); }}>
        <span className="data-url-upload-icon"><UploadCloud size={30}/></span>
        <span className="data-url-upload-copy">
          <strong>{fileName || "Kéo và thả file vào đây"}</strong>
          <small>{fileName ? mime + " · Data URL đã sẵn sàng" : "PNG, JPG, SVG, font, tài liệu và các định dạng khác · tối đa 5 MB"}</small>
        </span>
        <span className="data-url-browse">{fileName ? "Chọn file khác" : "Chọn file"}</span>
        <input ref={fileInput} type="file" onChange={(event) => loadFile(event.target.files?.[0])}/>
      </label>
      {output && <div className="data-url-result"><div><strong>Data URL</strong><span>{output.length.toLocaleString()} ký tự</span><button onClick={() => copyText(output)}>{copied === "output" ? <Check size={14}/> : <Clipboard size={14}/>} Sao chép</button></div><textarea readOnly value={output}/></div>}
      {snippets && <div className="data-url-snippets">{Object.entries(snippets).map(([label, value]) => <div key={label}><span>{label}</span><code>{value}</code><button onClick={() => copyText(value, label)}>{copied === label ? <Check size={14}/> : <Clipboard size={14}/>}</button></div>)}</div>}
    </> : <>
      <div className="encoding-options">
        {kind === "base64" && <label><input type="checkbox" checked={urlSafe} onChange={(event) => setUrlSafe(event.target.checked)} /> URL-safe Base64</label>}
        {kind === "binary" && <>
          <label>Định dạng <select value={byteEncoding} onChange={(event) => setByteEncoding(event.target.value as ByteEncoding)}><option value="binary">Binary</option><option value="hex">Hex</option><option value="decimal">Decimal</option><option value="base64">Base64</option></select></label>
          {direction === "encode" && byteEncoding !== "base64" && <label>Phân cách <select value={separator} onChange={(event) => setSeparator(event.target.value as keyof typeof separators)}><option value="space">Khoảng trắng</option><option value="newline">Xuống dòng</option><option value="none">Không có</option></select></label>}
        </>}
        <button onClick={() => { setInput(active.sample); setOutput(""); }}><FlaskConical size={15}/> Dữ liệu mẫu</button>
        <button onClick={() => { setInput(""); setOutput(""); setError(""); }}><Eraser size={15}/> Xóa</button>
      </div>
      <div className="encoding-editor-grid">
        <label className="encoding-editor"><span><b>Input</b><small>{input.length} ký tự · {inputBytes} bytes</small></span><textarea spellCheck={false} value={input} onChange={(event) => setInput(event.target.value)} placeholder={direction === "encode" ? "Nhập nội dung cần mã hóa…" : "Dán " + active.label + " cần giải mã…"} /></label>
        <div className="encoding-actions"><button className="is-primary" onClick={run}><Play size={16}/> {direction === "encode" ? "Encode" : "Decode"}</button><button disabled={!output} onClick={() => { setInput(output); setOutput(input); setDirection(direction === "encode" ? "decode" : "encode"); setError(""); }}><ArrowLeftRight size={16}/> Swap</button></div>
        <label className="encoding-editor"><span><b>Output</b><small>{output.length} ký tự · {outputBytes} bytes</small></span><textarea spellCheck={false} value={output} readOnly placeholder="Kết quả sẽ xuất hiện ở đây…" /><div className="encoding-output-actions"><button type="button" disabled={!output} onClick={() => copyText(output)}>{copied === "output" ? <Check size={15}/> : <Clipboard size={15}/>} {copied === "output" ? "Đã sao chép" : "Sao chép"}</button><button type="button" disabled={!output} onClick={download}><Download size={15}/> Tải .txt</button></div></label>
      </div>
    </>}
    {error && <p className="encoding-error" role="alert">{error}</p>}
  </section>;
}