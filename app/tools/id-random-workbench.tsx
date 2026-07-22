"use client";

import { Check, Clipboard, Download, Dices, RefreshCw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { formatUuid, generateNanoId, generatePassphrase, generatePassword, generateUlid, generateUsername, generateUuidV4, passwordEntropy, pickRandom, rollDice } from "./id-random-engine";

type Mode = "ids" | "bulk" | "password" | "password-pro" | "username" | "picker" | "dice";
type IdKind = "UUID" | "ULID" | "Nano ID";

const tabs: { id: Mode; label: string; description: string }[] = [
  { id: "ids", label: "ID Generator", description: "Generate unique UUID, ULID, and Nano ID values with browser-native cryptography." },
  { id: "bulk", label: "Bulk UUID Generator", description: "Create and format up to 100 cryptographically random UUID v4 values." },
  { id: "password", label: "Password Generator", description: "Create secure passwords, pronounceable strings, or memorable passphrases." },
  { id: "password-pro", label: "Password Generator Pro", description: "Tune password entropy, ambiguity rules, passphrases, and result counts." },
  { id: "username", label: "Username Generator", description: "Combine curated adjectives and nouns into unique handles." },
  { id: "picker", label: "Random Picker", description: "Pick or shuffle items from a newline-separated list." },
  { id: "dice", label: "Dice Roller (RPG)", description: "Roll standard RPG dice with quantities, modifiers, or dice notation." },
];

const sampleUuid = "75340c11-becf-4e8f-a827-684c4bacf47c";
const sampleUuids = [
  "f3c8b8e7-e86e-400d-9dc9-5c73a728c038",
  "e3726779-ba86-4626-aa3d-225b46f308f4",
  "e96cd700-f30e-4d43-9621-bf969022a812",
  "47ff286c-d75a-4413-8fd4-b23e82803dd4",
  "607cf123-a00a-4887-85ab-cc2cea71cff5",
];

const copyText = async (value: string, key: string, setCopied: (value: string) => void) => {
  await navigator.clipboard.writeText(value);
  setCopied(key);
  window.setTimeout(() => setCopied(""), 1400);
};

const downloadText = (value: string, name: string) => {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

function CopyButton({ value, id, copied, setCopied, label = "Copy" }: { value: string; id: string; copied: string; setCopied: (value: string) => void; label?: string }) {
  return <button className="random-copy" type="button" onClick={() => copyText(value, id, setCopied)} aria-label={`${label} ${id}`}>{copied === id ? <Check size={14} /> : <Clipboard size={14} />}{label}</button>;
}

export default function IdRandomWorkbench() {
  const [mode, setMode] = useState<Mode>("ids");
  const [copied, setCopied] = useState("");
  const [idKind, setIdKind] = useState<IdKind>("UUID");
  const [idCount, setIdCount] = useState(1);
  const [nanoLength, setNanoLength] = useState(21);
  const [nanoAlphabet, setNanoAlphabet] = useState("_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const [ids, setIds] = useState([sampleUuid]);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkOptions, setBulkOptions] = useState({ uppercase: false, braces: false, noDashes: false });
  const [bulkIds, setBulkIds] = useState(sampleUuids);
  const [passwordMode, setPasswordMode] = useState<"Characters" | "Pronounceable" | "Passphrase">("Characters");
  const [passwordLength, setPasswordLength] = useState(20);
  const [passwordCount, setPasswordCount] = useState(5);
  const [passwordOptions, setPasswordOptions] = useState({ lowercase: true, uppercase: true, numbers: true, symbols: true, excludeSimilar: false, customCharacters: "", excludeCharacters: "" });
  const [passwords, setPasswords] = useState(["r0!J[r9;mS&?1#>FB!=<"]);
  const [proKind, setProKind] = useState<"Password" | "Passphrase">("Password");
  const [proLength, setProLength] = useState(16);
  const [proCount, setProCount] = useState(3);
  const [proWords, setProWords] = useState(4);
  const [proSeparator, setProSeparator] = useState("-");
  const [proCapitalize, setProCapitalize] = useState(true);
  const [proResults, setProResults] = useState(["c#9qDtR!d2d<HFWK", "C{1t*1M$iUY(Cm?j", "#CdSMn0,xyb[W#dw"]);
  const [usernameStyle, setUsernameStyle] = useState<"camelCase" | "snake_case" | "kebab-case" | "l33t">("camelCase");
  const [appendNumber, setAppendNumber] = useState(true);
  const [usernameCount, setUsernameCount] = useState(8);
  const [usernames, setUsernames] = useState(["vividQuartz214", "sacredCanyon666", "royalFox574", "sacredVortex87", "neonGlacier236", "emberHawk973", "ultraLynx156", "brightComet636"]);
  const [pickerItems, setPickerItems] = useState("Apple\nBanana\nCherry\nDate\nElderberry");
  const [pickCount, setPickCount] = useState(1);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [diceQuantity, setDiceQuantity] = useState(1);
  const [diceSides, setDiceSides] = useState(20);
  const [diceModifier, setDiceModifier] = useState(0);
  const [diceNotation, setDiceNotation] = useState("2d6+3");
  const [diceResult, setDiceResult] = useState<ReturnType<typeof rollDice> | null>(null);
  const [error, setError] = useState("");
  const active = tabs.find((tab) => tab.id === mode)!;

  const runSafely = (operation: () => void) => {
    try { operation(); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to generate a result."); }
  };

  const generateIds = () => runSafely(() => setIds(Array.from({ length: Math.max(1, Math.min(100, idCount)) }, () => idKind === "UUID" ? generateUuidV4() : idKind === "ULID" ? generateUlid() : generateNanoId(nanoLength, nanoAlphabet))));
  const generateBulk = () => runSafely(() => setBulkIds(Array.from({ length: Math.max(1, Math.min(100, bulkCount)) }, () => formatUuid(generateUuidV4(), bulkOptions))));
  const generatePasswords = () => runSafely(() => setPasswords(Array.from({ length: Math.max(1, Math.min(20, passwordCount)) }, () => passwordMode === "Passphrase" ? generatePassphrase(4, "-", true) : passwordMode === "Pronounceable" ? generatePassphrase(3, "", false) : generatePassword({ length: passwordLength, ...passwordOptions }))));
  const generatePro = () => runSafely(() => setProResults(Array.from({ length: proCount }, () => proKind === "Passphrase" ? generatePassphrase(proWords, proSeparator, proCapitalize) : generatePassword({ length: proLength, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeSimilar: passwordOptions.excludeSimilar, customCharacters: "", excludeCharacters: "" }))));
  const pickerList = useMemo(() => pickerItems.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), [pickerItems]);
  const strength = passwordEntropy(proLength, passwordOptions.excludeSimilar ? 76 : 84);

  const renderIds = () => <><div className="random-segmented">{(["UUID", "ULID", "Nano ID"] as IdKind[]).map((kind) => <button className={idKind === kind ? "is-active" : ""} onClick={() => setIdKind(kind)} key={kind}>{kind}</button>)}</div><div className="random-control-card"><label>Count<input type="number" min="1" max="100" value={idCount} onChange={(event) => setIdCount(Number(event.target.value))} /></label>{idKind === "Nano ID" && <><label>Length<input type="number" min="1" max="256" value={nanoLength} onChange={(event) => setNanoLength(Number(event.target.value))} /></label><label className="is-wide">Alphabet<input value={nanoAlphabet} onChange={(event) => setNanoAlphabet(event.target.value)} /></label></>}<button className="random-primary" onClick={generateIds}><Shuffle size={15} />Generate</button></div><ResultList values={ids} copied={copied} setCopied={setCopied} file="generated-ids.txt" /> </>;

  const renderBulk = () => <><div className="random-control-card is-inline"><label>Count (1–100)<input type="number" min="1" max="100" value={bulkCount} onChange={(event) => setBulkCount(Number(event.target.value))} /></label>{Object.entries(bulkOptions).map(([key, value]) => <label className="random-check" key={key}><input type="checkbox" checked={value} onChange={(event) => setBulkOptions((current) => ({ ...current, [key]: event.target.checked }))} />{key === "noDashes" ? "No dashes" : key[0]!.toUpperCase() + key.slice(1)}</label>)}<button className="random-primary" onClick={generateBulk}><RefreshCw size={15} />Generate</button></div><div className="random-nil-card"><span>NIL UUID</span><code>00000000-0000-0000-0000-000000000000</code><CopyButton value="00000000-0000-0000-0000-000000000000" id="nil" copied={copied} setCopied={setCopied} /></div><ResultList values={bulkIds} copied={copied} setCopied={setCopied} file="uuids.txt" /></>;

  const renderPassword = () => <><div className="random-segmented is-compact"><span>Mode:</span>{(["Characters", "Pronounceable", "Passphrase"] as const).map((kind) => <button className={passwordMode === kind ? "is-active" : ""} onClick={() => setPasswordMode(kind)} key={kind}>{kind}</button>)}</div><div className="random-control-card"><div className="random-field-row"><label>Length<input type="number" min="4" max="256" value={passwordLength} onChange={(event) => setPasswordLength(Number(event.target.value))} /></label><label>Count<input type="number" min="1" max="20" value={passwordCount} onChange={(event) => setPasswordCount(Number(event.target.value))} /></label></div><div className="random-checkbox-grid">{(["lowercase", "uppercase", "numbers", "symbols", "excludeSimilar"] as const).map((key) => <label className="random-check" key={key}><input type="checkbox" checked={passwordOptions[key]} onChange={(event) => setPasswordOptions((current) => ({ ...current, [key]: event.target.checked }))} />{key.replace(/([A-Z])/g, " $1")}</label>)}</div><label>Custom character set (optional)<input value={passwordOptions.customCharacters} onChange={(event) => setPasswordOptions((current) => ({ ...current, customCharacters: event.target.value }))} placeholder="abc123!@#" /></label><label>Exclude characters<input value={passwordOptions.excludeCharacters} onChange={(event) => setPasswordOptions((current) => ({ ...current, excludeCharacters: event.target.value }))} placeholder="Il1O0" /></label><button className="random-primary" onClick={generatePasswords}>Generate passwords</button></div><ResultList values={passwords} copied={copied} setCopied={setCopied} file="passwords.txt" showStrength /></>;

  const renderPasswordPro = () => <><div className="random-segmented is-compact">{(["Password", "Passphrase"] as const).map((kind) => <button className={proKind === kind ? "is-active" : ""} onClick={() => setProKind(kind)} key={kind}>{kind}</button>)}</div><div className="random-control-card">{proKind === "Password" ? <label>Length <b>{proLength}</b><input type="range" min="8" max="64" value={proLength} onChange={(event) => setProLength(Number(event.target.value))} /></label> : <><label>Word count <b>{proWords}</b><input type="range" min="3" max="10" value={proWords} onChange={(event) => setProWords(Number(event.target.value))} /></label><div className="random-field-row"><label>Separator<input value={proSeparator} onChange={(event) => setProSeparator(event.target.value)} /></label><label className="random-check"><input type="checkbox" checked={proCapitalize} onChange={(event) => setProCapitalize(event.target.checked)} />Capitalize words</label></div></>}<label>Count <b>{proCount}</b><input type="range" min="1" max="10" value={proCount} onChange={(event) => setProCount(Number(event.target.value))} /></label><label className="random-check"><input type="checkbox" checked={passwordOptions.excludeSimilar} onChange={(event) => setPasswordOptions((current) => ({ ...current, excludeSimilar: event.target.checked }))} />Exclude ambiguous characters</label><button className="random-primary" onClick={generatePro}><RefreshCw size={15} />Generate</button></div><ResultList values={proResults} copied={copied} setCopied={setCopied} file="secure-passwords.txt" strength={`${strength} bits`} /></>;

  const renderUsername = () => <><div className="random-control-card"><span className="random-label">Style</span><div className="random-segmented">{(["camelCase", "snake_case", "kebab-case", "l33t"] as const).map((style) => <button className={usernameStyle === style ? "is-active" : ""} onClick={() => setUsernameStyle(style)} key={style}>{style}</button>)}</div><label className="random-check"><input type="checkbox" checked={appendNumber} onChange={(event) => setAppendNumber(event.target.checked)} />Append random number</label><label>Count <b>{usernameCount}</b><input type="range" min="1" max="20" value={usernameCount} onChange={(event) => setUsernameCount(Number(event.target.value))} /></label><button className="random-primary" onClick={() => setUsernames(Array.from({ length: usernameCount }, () => generateUsername(usernameStyle, appendNumber)))}><RefreshCw size={15} />Generate</button></div><ResultList values={usernames} copied={copied} setCopied={setCopied} file="usernames.txt" grid /></>;

  const renderPicker = () => <><div className="random-control-card"><label>Enter items (one per line) — {pickerList.length} items<textarea value={pickerItems} onChange={(event) => setPickerItems(event.target.value)} /></label><div className="random-field-row"><label>Pick<input type="number" min="1" value={pickCount} onChange={(event) => setPickCount(Number(event.target.value))} /></label><label className="random-check"><input type="checkbox" checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} />Allow duplicates</label></div><div className="random-action-row"><button className="random-primary" onClick={() => runSafely(() => setPicked(pickRandom(pickerList, pickCount, allowDuplicates)))}><Shuffle size={15} />Pick {pickCount}</button><button onClick={() => runSafely(() => setPicked(pickRandom(pickerList, pickerList.length, false)))}>Shuffle all</button></div></div>{picked.length > 0 && <ResultList values={picked} copied={copied} setCopied={setCopied} file="random-picks.txt" />}</>;

  const renderDice = () => <div className="random-dice-grid"><div className="random-control-card"><label>Quantity<input type="number" min="1" max="50" value={diceQuantity} onChange={(event) => setDiceQuantity(Number(event.target.value))} /></label><span className="random-label">Die type</span><div className="random-die-types">{[4, 6, 8, 10, 12, 20, 100].map((sides) => <button className={diceSides === sides ? "is-active" : ""} onClick={() => setDiceSides(sides)} key={sides}>d{sides}</button>)}</div><label>Modifier (+/−)<input type="number" value={diceModifier} onChange={(event) => setDiceModifier(Number(event.target.value))} /></label><button className="random-primary" onClick={() => runSafely(() => setDiceResult(rollDice(`${diceQuantity}d${diceSides}${diceModifier >= 0 ? "+" : ""}${diceModifier}`)))}><Dices size={16} />Roll {diceQuantity}d{diceSides}</button><hr /><label>Or use notation (e.g. 2d6+3)<span className="random-input-action"><input value={diceNotation} onChange={(event) => setDiceNotation(event.target.value)} /><button onClick={() => runSafely(() => setDiceResult(rollDice(diceNotation)))}>Roll</button></span></label></div><div className="random-dice-result">{diceResult ? <><Dices size={38} /><strong>{diceResult.total}</strong><span>{diceResult.rolls.join(" + ")}{diceResult.modifier ? ` ${diceResult.modifier > 0 ? "+" : "−"} ${Math.abs(diceResult.modifier)}` : ""}</span><small>{diceResult.count}d{diceResult.sides}</small></> : <><Dices size={42} /><span>Roll to see result</span></>}</div></div>;

  return <section className="random-generator-workbench">
    <div className="data-format-tabs random-tabs" role="tablist">{tabs.map((tab) => <button role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => { setMode(tab.id); setError(""); }} key={tab.id}>{tab.label}</button>)}</div>
    <div className="random-intro"><h2>{active.label}</h2><p>{active.description}</p></div>
    {error && <div className="random-error" role="alert">{error}</div>}
    {mode === "ids" ? renderIds() : mode === "bulk" ? renderBulk() : mode === "password" ? renderPassword() : mode === "password-pro" ? renderPasswordPro() : mode === "username" ? renderUsername() : mode === "picker" ? renderPicker() : renderDice()}
  </section>;
}

function ResultList({ values, copied, setCopied, file, showStrength = false, strength, grid = false }: { values: string[]; copied: string; setCopied: (value: string) => void; file: string; showStrength?: boolean; strength?: string; grid?: boolean }) {
  const joined = values.join("\n");
  return <section className="random-results"><div className="random-results-head"><span>{values.length} generated</span><div><CopyButton value={joined} id={`all-${file}`} copied={copied} setCopied={setCopied} label="Copy all" /><button onClick={() => downloadText(joined, file)}><Download size={14} />Download</button></div></div><div className={`random-result-list ${grid ? "is-grid" : ""}`}>{values.map((value, index) => <article key={`${value}-${index}`}><code>{value}</code>{(showStrength || strength) && <span>{strength ?? "Very strong"}</span>}<CopyButton value={value} id={`${file}-${index}`} copied={copied} setCopied={setCopied} label="" /></article>)}</div></section>;
}
