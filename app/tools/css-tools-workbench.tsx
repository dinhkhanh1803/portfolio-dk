"use client";

import { Check, Clipboard, Shuffle } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { animationCss, backdropFilterCss, borderCss, borderRadiusCss, clipPathCss, colorFormats, contrastRatio, filterCss, filterValue, fontFaceCss, fontStackCss, glassmorphismCss, gradientCss, gridCss, hexToRgb, letterSpacingCss, lineClampCss, maskCss, mixBlendCss, neumorphismCss, objectFitCss, outlineCss, rgbToHex, scrollbarCss, shadowCss, textEffectCss, textShadowCss, textWrapCss, triangleCss, typeScaleCss, writingModeCss } from "./css-tools-engine";

type CssCollectionId = "color-tools" | "gradients-patterns" | "shadows-effects" | "layout-tools" | "animations" | "typography" | "shapes-borders";
type Props = { collectionId: CssCollectionId };
const tabs: Record<CssCollectionId, string[]> = {
  "color-tools": ["Color Format Converter", "Color Name Finder", "Image Color Picker", "CSS Contrast Checker", "Color Contrast Grid", "Color Palette AI", "Color Scheme Generator"],
  "gradients-patterns": ["CSS Gradient Generator", "CSS Conic Gradient Generator", "CSS Gradient Mesh", "CSS Gradient Border Generator", "CSS Gradient Text", "CSS Background Pattern Generator", "SVG Pattern Generator", "CSS Noise Generator", "CSS Blob Generator"],
  "shadows-effects": ["Box Shadow Generator", "Text Shadow Generator", "CSS Multi-Layer Shadow", "CSS Text Shadow Generator", "Glassmorphism Generator", "CSS Backdrop Filter Generator", "CSS Neumorphism Generator", "CSS Mix Blend Mode Generator", "CSS Mask Generator", "CSS Filter Generator"],
  "layout-tools": ["CSS Grid Generator", "CSS Grid Layout Builder", "CSS Flexbox Generator", "CSS Flex Playground", "CSS Columns Generator", "CSS Container Query Generator", "Media Query Generator", "CSS Calc Generator", "CSS Clamp Generator", "Aspect Ratio Generator", "CSS Overflow Generator"],
  animations: ["CSS Animation Generator", "CSS Keyframe Animator", "CSS Transition Generator", "CSS Transform Generator", "CSS 3D Transform", "CSS Perspective Generator", "Cubic Bezier Editor", "CSS Easing Editor", "CSS Scroll Snap Generator", "CSS Scroll Timeline Generator", "CSS Typing Effect Generator", "CSS Loader Generator"],
  typography: ["CSS Text Effects", "CSS Type Scale Generator", "CSS Font-Face Generator", "CSS Font Stack Generator", "CSS Line Clamp Generator", "CSS Letter Spacing Generator", "Text Wrap Generator", "CSS Writing Mode Generator"],
  "shapes-borders": ["Border Radius Generator", "CSS Border Generator", "CSS Outline Generator", "Clip-path Generator", "CSS Clip-path Shapes", "CSS Triangle Generator", "CSS Object Fit Generator", "CSS Scrollbar Generator"],
};
const palettes = [["#ff6b6b", "#ffd93d", "#6bcb77"], ["#22d3ee", "#3b82f6", "#0f172a"], ["#7c3aed", "#60a5fa", "#f0abfc"], ["#0f172a", "#2dd4bf", "#f8fafc"], ["#f97316", "#ec4899", "#8b5cf6"]];
const colorNames = [{ name: "Royal Blue", hex: "#3b82f6" }, { name: "Emerald", hex: "#10b981" }, { name: "Rose", hex: "#f43f5e" }, { name: "Slate", hex: "#0f172a" }, { name: "Amber", hex: "#f59e0b" }];
const gradients = ["linear", "radial", "conic"] as const;
const copy = async (value: string, setCopied: (value: boolean) => void) => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1300); };
const gradientValue = (type: "linear" | "radial" | "conic", angle: number, colors: string[]) => gradientCss(type, angle, colors).replace("background: ", "").replace(";", "");
const nearestColorName = (hex: string) => {
  const rgb = hexToRgb(hex);
  return colorNames.map((item) => {
    const next = hexToRgb(item.hex);
    return { ...item, distance: Math.hypot(rgb.r - next.r, rgb.g - next.g, rgb.b - next.b) };
  }).sort((a, b) => a.distance - b.distance)[0]!;
};

export default function CssToolsWorkbench({ collectionId }: Props) {
  const [active, setActive] = useState(tabs[collectionId][0]!);
  const [copied, setCopied] = useState(false);
  const [hex, setHex] = useState("#3b82f6");
  const [foreground, setForeground] = useState("#ffffff");
  const [alpha, setAlpha] = useState(100);
  const [gradientType, setGradientType] = useState<(typeof gradients)[number]>("linear");
  const [angle, setAngle] = useState(135);
  const [colors, setColors] = useState(["#ff6b6b", "#ffd93d", "#6bcb77"]);
  const [shadow, setShadow] = useState({ x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 10, inset: false });
  const [textShadowLayers, setTextShadowLayers] = useState([{ x: 0, y: 0, blur: 8, color: "#00e5ff" }, { x: 0, y: 0, blur: 18, color: "#0088ff" }]);
  const [effectFilters, setEffectFilters] = useState({ blur: 0, brightness: 100, contrast: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100, saturate: 100, sepia: 0 });
  const [glass, setGlass] = useState({ blur: 20, opacity: 40, radius: 16, borderWidth: 1, borderOpacity: 50, color: "#ffffff", saturate: 180, brightness: 95 });
  const [neumorphism, setNeumorphism] = useState({ background: "#e0e5ec", distance: 12, blur: 24, intensity: 15, radius: 20, size: 200, shape: "flat" as "flat" | "concave" | "convex" | "pressed" });
  const [blend, setBlend] = useState({ mode: "difference", background: "#ae6565", foreground: "#5c901d", target: "Rectangle" });
  const [mask, setMask] = useState({ shape: "circle", size: 58, feather: 2, color: "#8b5cf6" });
  const [grid, setGrid] = useState({ columns: "repeat(3, 1fr)", rows: "auto", gap: 16, justifyItems: "start", alignItems: "stretch", justifyContent: "start", alignContent: "stretch" });
  const [layout, setLayout] = useState({ gridColumns: 3, gridRows: 2, equalTracks: true, flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", alignItems: "stretch", itemCount: 5, columnCount: 2, columnWidth: "auto", columnGap: "1.5em", columnRule: "none", containerName: "", containerType: "inline-size", queryFeature: "min-width", queryValue: 300, queryUnit: "px", mediaType: "all", mediaFeature: "min-width", mediaValue: 768, mediaUnit: "px", queryPreviewWidth: 400, mediaPreviewWidth: 900, calcA: 100, calcAUnit: "%", calcOp: "-", calcB: 2, calcBUnit: "rem", clampMin: 16, clampMinUnit: "px", clampPreferred: 2, clampPreferredUnit: "vw", clampBase: 1, clampBaseUnit: "rem", clampMax: 48, clampMaxUnit: "px", aspectW: 16, aspectH: 9, aspectFallback: false, aspectWidth: "100%", overflow: "auto", overflowX: "visible", overflowY: "visible", overflowWidth: 300, overflowHeight: 200 });
  const [animation, setAnimation] = useState({ name: "fadeIn", duration: 1000, delay: 0, timing: "ease", iteration: "1", direction: "normal", fillMode: "none" });
  const [animationLab, setAnimationLab] = useState({ keyframes: [{ offset: 0, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }, { offset: 100, x: 80, y: -20, scale: 1.08, rotate: 8, opacity: 1 }], selectedKeyframe: 0, transitionProperty: "all", transitionActive: false, transformRotate: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, skewX: 0, skewY: 0, perspective: 0, originX: 50, originY: 50, rotateX: -20, rotateY: 30, rotateZ: 0, translateZ: 0, perspective3d: 800, scale3d: 1, perspectiveOriginX: 50, perspectiveOriginY: 50, bezier: [0.25, 0.1, 0.25, 1], snapAxis: "x", snapStrictness: "mandatory", snapAlign: "center", snapPaddingX: 20, snapPaddingY: 0, snapMarginX: 10, snapMarginY: 0, timelineName: "scroll-timeline", timelineSource: "root", timelineAxis: "block", timelineProperty: "opacity", timelineFrom: "0", timelineTo: "1", typingDuration: 3000, typingCursor: 2, typingColor: "#10b981", typingBackground: "#1e1e1e", typingBlink: true, loaderStyle: "ring", loaderSize: 48, loaderColor: "#6366f1" });
  const [text, setText] = useState("DK Tools");
  const [imageUrl, setImageUrl] = useState("");
  const [gridColors, setGridColors] = useState("#000000\n#ffffff\n#1d4ed8\n#facc15\n#64748b");
  const [palettePrompt, setPalettePrompt] = useState("sunset over ocean");
  const [scheme, setScheme] = useState("Analogous");
  const [patternType, setPatternType] = useState("Dots");
  const [patternSize, setPatternSize] = useState(20);
  const [blobSize, setBlobSize] = useState(280);
  const [fontSize, setFontSize] = useState(64);
  const [fontWeight, setFontWeight] = useState(700);
  const [fontFamily, setFontFamily] = useState("system-ui");
  const [scaleBase, setScaleBase] = useState(16);
  const [scaleRatio, setScaleRatio] = useState(1.25);
  const [scaleAbove, setScaleAbove] = useState(6);
  const [scaleBelow, setScaleBelow] = useState(2);
  const [scaleUnit, setScaleUnit] = useState<"rem" | "px">("rem");
  const [fontFace, setFontFace] = useState({ family: "MyFont", weight: "400", style: "normal", display: "swap", woff2: "https://example.com/font.woff2", woff: "https://example.com/font.woff", unicodeRange: "U+0025-00FF" });
  const [fontStack, setFontStack] = useState({ primary: "Inter", category: "sans-serif", os: true });
  const [lineClamp, setLineClamp] = useState({ lines: 3, ellipsis: true });
  const [letterSpacing, setLetterSpacing] = useState({ value: 0, unit: "px" as "px" | "em" });
  const [wrap, setWrap] = useState({ whiteSpace: "normal", overflow: "visible", width: 350, lineHeight: 1.5 });
  const [writing, setWriting] = useState({ mode: "horizontal-tb", direction: "ltr" as "ltr" | "rtl", orientation: "mixed" });
  const [shape, setShape] = useState({ radiusMode: "uniform", radius: 16, topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16, borderWidth: 3, borderStyle: "solid", borderColor: "#3b82f6", outlineWidth: 3, outlineStyle: "solid", outlineColor: "#f97316", outlineOffset: 6, clipShape: "hexagon", clipInset: 12, triangleDirection: "up" as "up" | "right" | "down" | "left", triangleWidth: 140, triangleHeight: 120, objectFit: "cover", objectPosition: "center", scrollbarSize: 12, scrollbarThumb: "#3b82f6", scrollbarTrack: "#e5e7eb", scrollbarRadius: 999 });
  const colorData = useMemo(() => colorFormats(hex, alpha), [alpha, hex]);
  const rgb = hexToRgb(hex);
  const activeTitle = active;

  const bezierValue = `cubic-bezier(${animationLab.bezier.map((value) => Number(value).toFixed(2).replace(/\.00$/, "")).join(", ")})`;
  const transformValue = `perspective(${animationLab.perspective}px) translate(${animationLab.translateX}px, ${animationLab.translateY}px) rotate(${animationLab.transformRotate}deg) skew(${animationLab.skewX}deg, ${animationLab.skewY}deg) scale(${animationLab.scaleX}, ${animationLab.scaleY})`;
  const transform3dValue = `rotateX(${animationLab.rotateX}deg) rotateY(${animationLab.rotateY}deg) rotateZ(${animationLab.rotateZ}deg) translateZ(${animationLab.translateZ}px) scale(${animationLab.scale3d})`;
  const typingEffectCss = `.typing-text {\n  overflow: hidden;\n  white-space: nowrap;\n  border-right: ${animationLab.typingCursor}px solid ${animationLab.typingColor};\n  animation: typing ${animationLab.typingDuration}ms steps(${Math.max(text.length, 1)}) forwards${animationLab.typingBlink ? `, blink .75s step-end infinite` : ""};\n  color: ${animationLab.typingColor};\n  background: ${animationLab.typingBackground};\n}\n\n@keyframes typing { from { width: 0; } to { width: ${Math.max(text.length, 1)}ch; } }${animationLab.typingBlink ? `\n@keyframes blink { 50% { border-color: transparent; } }` : ""}`;
  const loaderCss = `.loader {\n  width: ${animationLab.loaderSize}px;\n  height: ${animationLab.loaderSize}px;\n  color: ${animationLab.loaderColor};\n  animation: loader-spin ${animation.duration}ms linear infinite;\n}\n\n@keyframes loader-spin { to { transform: rotate(360deg); } }`;
  const shapeRadius = shape.radiusMode === "uniform" ? { topLeft: shape.radius, topRight: shape.radius, bottomRight: shape.radius, bottomLeft: shape.radius, unit: "px" as const } : { topLeft: shape.topLeft, topRight: shape.topRight, bottomRight: shape.bottomRight, bottomLeft: shape.bottomLeft, unit: "px" as const };
  const shapeClipPath = clipPathCss(shape.clipShape, shape.clipInset).replace("clip-path: ", "").replace(";", "");
  const trianglePreviewBorder = shape.triangleDirection === "up" ? { borderLeft: `${Math.round(shape.triangleWidth / 2)}px solid transparent`, borderRight: `${Math.round(shape.triangleWidth / 2)}px solid transparent`, borderBottom: `${shape.triangleHeight}px solid ${shape.borderColor}` } : shape.triangleDirection === "down" ? { borderLeft: `${Math.round(shape.triangleWidth / 2)}px solid transparent`, borderRight: `${Math.round(shape.triangleWidth / 2)}px solid transparent`, borderTop: `${shape.triangleHeight}px solid ${shape.borderColor}` } : { borderTop: `${Math.round(shape.triangleHeight / 2)}px solid transparent`, borderBottom: `${Math.round(shape.triangleHeight / 2)}px solid transparent`, [shape.triangleDirection === "right" ? "borderLeft" : "borderRight"]: `${shape.triangleWidth}px solid ${shape.borderColor}` };
  const css = useMemo(() => {
    if (collectionId === "color-tools") {
      if (active.includes("Name")) return `/* Closest color name */\n--${nearestColorName(hex).name.toLowerCase().replace(/\s+/g, "-")}: ${hex};`;
      if (active.includes("Contrast")) return `color: ${foreground};\nbackground: ${hex};\n/* Contrast ratio: ${contrastRatio(foreground, hex)} */`;
      if (active.includes("Grid")) return palettes.flatMap((palette) => palette.map((bg) => `.swatch-${bg.slice(1)} { color: ${contrastRatio("#ffffff", bg) > 4.5 ? "#ffffff" : "#0f172a"}; background: ${bg}; }`)).join("\n");
      if (active.includes("Palette") || active.includes("Scheme")) return colors.map((color, index) => `--palette-${index + 1}: ${color};`).join("\n");
      return `${colorData.cssVariables}\ncolor: ${foreground};\nbackground: ${colorData.hex};`;
    }
    if (collectionId === "gradients-patterns") {
      if (active.includes("Text")) return `.gradient-text {\n  background: ${gradientValue(gradientType, angle, colors)};\n  -webkit-background-clip: text;\n  color: transparent;\n}`;
      if (active.includes("Border")) return `.gradient-border {\n  border: 2px solid transparent;\n  background: linear-gradient(#fff, #fff) padding-box, ${gradientValue(gradientType, angle, colors)} border-box;\n}`;
      if (active.includes("Pattern") || active.includes("Noise")) return `background-image: radial-gradient(${colors[0]} 1px, transparent 1px);\nbackground-size: 18px 18px;`;
      if (active.includes("Blob")) return `.blob {\n  border-radius: 42% 58% 61% 39%;\n  background: ${gradientValue(gradientType, angle, colors)};\n}`;
      return gradientCss(active.includes("Conic") ? "conic" : active.includes("Mesh") ? "radial" : gradientType, angle, colors);
    }
    if (collectionId === "shadows-effects") {
      if (active.includes("Text Shadow")) return `.shadow-text {\n  font-size: 72px;\n  color: #ffffff;\n  ${textShadowCss(textShadowLayers)}\n}`;
      if (active.includes("Multi-Layer")) return `.shadow-stack {\n  ${shadowCss(shadow)}\n  filter: drop-shadow(0 16px 30px rgba(15, 23, 42, 0.18));\n}`;
      if (active.includes("Glass")) return glassmorphismCss(glass);
      if (active.includes("Backdrop")) return backdropFilterCss(effectFilters);
      if (active.includes("Neumorphism")) return neumorphismCss(neumorphism);
      if (active.includes("Blend")) return mixBlendCss(blend.mode, blend.background, blend.foreground);
      if (active.includes("Mask")) return maskCss(mask.shape, mask.size, mask.feather, mask.color);
      if (active.includes("Filter")) return filterCss(effectFilters);
      return shadowCss(shadow);
    }
    if (collectionId === "shapes-borders") {
      if (active.includes("Border Generator")) return borderCss({ width: shape.borderWidth, style: shape.borderStyle, color: shape.borderColor, radius: shape.radius });
      if (active.includes("Outline")) return outlineCss({ width: shape.outlineWidth, style: shape.outlineStyle, color: shape.outlineColor, offset: shape.outlineOffset });
      if (active.includes("Clip-path")) return clipPathCss(shape.clipShape, shape.clipInset);
      if (active.includes("Triangle")) return triangleCss({ direction: shape.triangleDirection, width: shape.triangleWidth, height: shape.triangleHeight, color: shape.borderColor });
      if (active.includes("Object Fit")) return objectFitCss(shape.objectFit, shape.objectPosition);
      if (active.includes("Scrollbar")) return scrollbarCss({ size: shape.scrollbarSize, thumb: shape.scrollbarThumb, track: shape.scrollbarTrack, radius: shape.scrollbarRadius });
      return borderRadiusCss(shapeRadius);
    }
    if (collectionId === "typography") {
      const effect = active.includes("Neon") ? "neon" : active.includes("Glitch") ? "glitch" : active.includes("Stroke") ? "stroke" : "gradient";
      if (active.includes("Type Scale")) return typeScaleCss(scaleBase, scaleRatio, scaleAbove, scaleBelow, scaleUnit);
      if (active.includes("Font-Face")) return fontFaceCss({ family: fontFace.family, weight: fontFace.weight, style: fontFace.style, display: fontFace.display, urls: { woff2: fontFace.woff2, woff: fontFace.woff }, unicodeRange: fontFace.unicodeRange });
      if (active.includes("Font Stack")) return fontStackCss(fontStack.primary, fontStack.category, fontStack.os);
      if (active.includes("Line Clamp")) return lineClampCss(lineClamp.lines, lineClamp.ellipsis);
      if (active.includes("Letter Spacing")) return letterSpacingCss(letterSpacing.value, letterSpacing.unit);
      if (active.includes("Text Wrap")) return textWrapCss(wrap.whiteSpace, wrap.overflow, wrap.width, wrap.lineHeight);
      if (active.includes("Writing Mode")) return writingModeCss(writing.mode, writing.direction, writing.orientation);
      return textEffectCss(effect, text, fontSize, fontWeight, fontFamily, angle, colors);
    }
    if (collectionId === "layout-tools") {
      const gridLayoutCss = `.grid-layout {\n  display: grid;\n  grid-template-columns: repeat(${layout.gridColumns}, ${layout.equalTracks ? "1fr" : "minmax(120px, 1fr)"});\n  grid-template-rows: repeat(${layout.gridRows}, ${layout.equalTracks ? "1fr" : "auto"});\n  gap: ${grid.gap}px;\n}`;
      const flexCss = `.flex-container {\n  display: flex;\n  flex-direction: ${layout.flexDirection};\n  justify-content: ${layout.justifyContent};\n  align-items: ${layout.alignItems};\n  flex-wrap: ${layout.flexWrap};\n  gap: ${grid.gap}px;\n}`;
      const calcValue = `calc(${layout.calcA}${layout.calcAUnit} ${layout.calcOp} ${layout.calcB}${layout.calcBUnit})`;
      const clampValue = `clamp(${layout.clampMin}${layout.clampMinUnit}, ${layout.clampPreferred}${layout.clampPreferredUnit} + ${layout.clampBase}${layout.clampBaseUnit}, ${layout.clampMax}${layout.clampMaxUnit})`;
      if (active.includes("Grid Layout")) return gridLayoutCss;
      if (active.includes("Flex")) return flexCss;
      if (active.includes("Columns")) return `.columns {\n  column-count: ${layout.columnCount};\n  column-width: ${layout.columnWidth};\n  column-gap: ${layout.columnGap};${layout.columnRule === "none" ? "" : `\n  column-rule: ${layout.columnRule};`}\n}`;
      if (active.includes("Container")) return `.container {\n  container-type: ${layout.containerType};${layout.containerName ? `\n  container-name: ${layout.containerName};` : ""}\n}\n\n@container ${layout.containerName ? `${layout.containerName} ` : ""}(${layout.queryFeature}: ${layout.queryValue}${layout.queryUnit}) {\n  .child {\n    color: blue;\n    font-size: 1.2rem;\n  }\n}`;
      if (active.includes("Media")) return `@media ${layout.mediaType} and (${layout.mediaFeature}: ${layout.mediaValue}${layout.mediaUnit}) {\n  .responsive {\n    display: grid;\n    grid-template-columns: 1fr;\n  }\n}`;
      if (active.includes("Calc")) return `width: ${calcValue};`;
      if (active.includes("Clamp")) return `font-size: ${clampValue};`;
      if (active.includes("Aspect")) return `.aspect-box {\n  aspect-ratio: ${layout.aspectW} / ${layout.aspectH};\n  width: ${layout.aspectWidth};${layout.aspectFallback ? `\n  height: auto;` : ""}\n}`;
      if (active.includes("Overflow")) return `.container {\n  width: ${layout.overflowWidth}px;\n  height: ${layout.overflowHeight}px;\n  overflow: ${layout.overflow};\n  overflow-x: ${layout.overflowX};\n  overflow-y: ${layout.overflowY};\n}`;
      return gridCss(grid);
    }
    if (collectionId === "animations") {
      const keyframesCss = `@keyframes custom-motion {\n${animationLab.keyframes.map((frame) => `  ${frame.offset}% { transform: translate(${frame.x}px, ${frame.y}px) scale(${frame.scale}) rotate(${frame.rotate}deg); opacity: ${frame.opacity}; }`).join("\n")}\n}\n\n.animated-element {\n  animation: custom-motion ${animation.duration}ms ${animation.timing} ${animation.delay}ms ${animation.iteration} ${animation.direction} ${animation.fillMode};\n}`;
      if (active.includes("Keyframe")) return keyframesCss;
      if (active.includes("Transition")) return `.transition-demo {\n  transition: ${animationLab.transitionProperty} ${animation.duration}ms ${animation.timing} ${animation.delay}ms;\n}\n.transition-demo:hover, .transition-demo.is-active {\n  opacity: .72;\n  transform: translateY(-10px) scale(1.08);\n  background: ${colors[0]};\n}`;
      if (active === "CSS Transform Generator") return `.transform-box {\n  transform: ${transformValue};\n  transform-origin: ${animationLab.originX}% ${animationLab.originY}%;\n}`;
      if (active.includes("3D Transform")) return `.scene { perspective: ${animationLab.perspective3d}px; }\n.card {\n  transform: ${transform3dValue};\n  transform-style: preserve-3d;\n}`;
      if (active.includes("Perspective")) return `.parent-element {\n  perspective: ${animationLab.perspective3d}px;\n  perspective-origin: ${animationLab.perspectiveOriginX}% ${animationLab.perspectiveOriginY}%;\n}\n.child-element {\n  transform: rotateX(${animationLab.rotateX}deg) rotateY(${animationLab.rotateY}deg) translateZ(${animationLab.translateZ}px);\n  transform-style: preserve-3d;\n}`;
      if (active.includes("Bezier") || active.includes("Easing")) return `${bezierValue}\n\n.animated-element {\n  transition-timing-function: ${bezierValue};\n  animation-timing-function: ${bezierValue};\n}`;
      if (active.includes("Scroll Snap")) return `.scroll-container {\n  scroll-snap-type: ${animationLab.snapAxis} ${animationLab.snapStrictness};\n  scroll-padding: ${animationLab.snapPaddingY}px ${animationLab.snapPaddingX}px;\n  overflow-${animationLab.snapAxis}: auto;\n  display: ${animationLab.snapAxis === "x" ? "flex" : "grid"};\n}\n.scroll-item {\n  scroll-snap-align: ${animationLab.snapAlign};\n  scroll-margin: ${animationLab.snapMarginY}px ${animationLab.snapMarginX}px;\n}`;
      if (active.includes("Scroll Timeline")) return `@scroll-timeline --${animationLab.timelineName} {\n  source: ${animationLab.timelineSource};\n  axis: ${animationLab.timelineAxis};\n}\n\n.scroll-animated {\n  animation: scroll-linked linear both;\n  animation-timeline: --${animationLab.timelineName};\n}\n\n@keyframes scroll-linked {\n  from { ${animationLab.timelineProperty}: ${animationLab.timelineFrom}; }\n  to { ${animationLab.timelineProperty}: ${animationLab.timelineTo}; }\n}`;
      if (active.includes("Typing")) return typingEffectCss;
      if (active.includes("Loader")) return loaderCss;
      return animationCss(animation);
    }
    return animationCss(animation);
  }, [active, animation, angle, blend.background, blend.foreground, blend.mode, collectionId, colorData, colors, effectFilters, fontFace, fontFamily, fontSize, fontStack, fontWeight, foreground, glass, gradientType, grid, hex, layout, letterSpacing, lineClamp, mask.color, mask.feather, mask.shape, mask.size, neumorphism, scaleAbove, scaleBase, scaleBelow, scaleRatio, scaleUnit, shadow, text, textShadowLayers, wrap, writing, animationLab, bezierValue, transformValue, transform3dValue, typingEffectCss, loaderCss, shape, shapeRadius]);

  const setRgb = (channel: "r" | "g" | "b", value: number) => setHex(rgbToHex(channel === "r" ? value : rgb.r, channel === "g" ? value : rgb.g, channel === "b" ? value : rgb.b));
  const setRandomPalette = () => setColors([0, 1, 2].map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")));
  const parsedGridColors = gridColors.split(/\s+/).filter((item) => /^#[0-9a-f]{6}$/i.test(item));

  const selectedKeyframe = animationLab.keyframes[animationLab.selectedKeyframe] ?? animationLab.keyframes[0]!;
  const updateSelectedKeyframe = (key: "offset" | "x" | "y" | "scale" | "rotate" | "opacity", value: number) => setAnimationLab((current) => ({ ...current, keyframes: current.keyframes.map((frame, index) => index === current.selectedKeyframe ? { ...frame, [key]: value } : frame) }));
  const renderColorFormat = () => <>
    <div className="css-color-preview" style={{ background: hex }}><strong>{hex}</strong></div>
    <div className="css-field-row"><label>{active.includes("Name") ? "Search / HEX" : "HEX"}<input value={hex} onChange={(event) => setHex(event.target.value)} /></label><label>Text<input value={foreground} onChange={(event) => setForeground(event.target.value)} /></label></div>
    {active.includes("Palette") || active.includes("Scheme") ? <><div className="css-preset-grid">{palettes.map((palette) => <button key={palette.join()} style={{ background: gradientValue("linear", 135, palette) }} onClick={() => setColors(palette)} />)}</div>{colors.map((color, index) => <label className="css-color-stop" key={index}>Color {index + 1}<input type="color" value={color} onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><input value={color} onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</> : <>{["r", "g", "b"].map((channel) => <label className="css-range" key={channel}>{channel.toUpperCase()} <input type="range" min="0" max="255" value={rgb[channel as "r" | "g" | "b"]} onChange={(event) => setRgb(channel as "r" | "g" | "b", Number(event.target.value))} /><span>{rgb[channel as "r" | "g" | "b"]}</span></label>)}<label className="css-range">Alpha <input type="range" min="0" max="100" value={alpha} onChange={(event) => setAlpha(Number(event.target.value))} /><span>{alpha}%</span></label></>}
    {active.includes("Name") && <div className="css-info-card"><span>Closest match</span><strong>{nearestColorName(hex).name}</strong><small>{nearestColorName(hex).hex}</small></div>}
    {active.includes("Contrast") && <div className="css-info-card"><span>Contrast ratio</span><strong>{contrastRatio(foreground, hex)}:1</strong><small>{contrastRatio(foreground, hex) >= 4.5 ? "AA pass for normal text" : "Needs stronger contrast"}</small></div>}
  </>;

  const renderColorNameFinder = () => <>
    <div className="css-field-row"><label>Enter a color (hex, rgb, or name)<input value={hex} onChange={(event) => setHex(event.target.value)} /></label><label>Preview<input type="color" value={hex} onChange={(event) => setHex(event.target.value)} /></label></div>
    <div className="css-name-result"><i style={{ background: nearestColorName(hex).hex }} /><div><strong>{nearestColorName(hex).name}</strong><span>{nearestColorName(hex).hex} Ãƒâ€šÃ‚Â· distance {Math.round(nearestColorName(hex).distance)}</span></div><button onClick={() => copy(nearestColorName(hex).hex, setCopied)}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></div>
    <div className="css-alternative-grid">{colorNames.map((item) => <button key={item.name} onClick={() => setHex(item.hex)}><i style={{ background: item.hex }} /><span>{item.name}</span><code>{item.hex}</code></button>)}</div>
    <label>Reverse: pick a named color<select value={nearestColorName(hex).name} onChange={(event) => setHex(colorNames.find((item) => item.name === event.target.value)?.hex ?? hex)}>{colorNames.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
  </>;

  const renderImageColorPicker = () => <>
    <label className="css-upload-zone"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setImageUrl(URL.createObjectURL(file)); }} /><span>Drag & drop an image here, or click to browse</span><small>Supports PNG, JPG, GIF, WebP, SVG, and more</small></label>
    <div className="css-image-stage">{imageUrl ? <div className="css-uploaded-image" style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label="Uploaded color source" /> : <span>No image loaded Ã¢â‚¬â€ upload one above</span>}</div>
    <div className="css-alternative-grid">{colors.map((color, index) => <button key={color} onClick={() => setHex(color)}><i style={{ background: color }} /><span>Extracted {index + 1}</span><code>{color}</code></button>)}</div>
  </>;

  const renderContrastChecker = () => <>
    <div className="css-field-row"><label>Foreground (Text) Color<input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} /><input value={foreground} onChange={(event) => setForeground(event.target.value)} /></label><label>Background Color<input type="color" value={hex} onChange={(event) => setHex(event.target.value)} /><input value={hex} onChange={(event) => setHex(event.target.value)} /></label></div>
    <div className="css-info-card"><span>Contrast Ratio</span><strong>{contrastRatio(foreground, hex)}:1</strong><small>{contrastRatio(foreground, hex) >= 7 ? "Excellent Ãƒâ€šÃ‚Â· AAA ready" : contrastRatio(foreground, hex) >= 4.5 ? "Good Ãƒâ€šÃ‚Â· AA ready" : "Needs more contrast"}</small></div>
    <div className="css-preview-card" style={{ color: foreground, background: hex }}><strong>Sample Heading</strong><p>This paragraph previews accessible body text.</p></div>
  </>;

  const renderContrastGrid = () => <>
    <label className="css-contrast-grid">Hex colors<textarea value={gridColors} onChange={(event) => setGridColors(event.target.value)} /><small>{parsedGridColors.length} valid</small></label>
    <div className="css-contrast-matrix">{parsedGridColors.map((bg) => parsedGridColors.map((fg) => <div key={`${bg}-${fg}`} style={{ color: fg, background: bg }}><b>{contrastRatio(fg, bg)}</b><small>{contrastRatio(fg, bg) >= 4.5 ? "AAÃƒÂ¢Ã…â€œÃ¢â‚¬Å“" : "AAÃƒÆ’Ã¢â‚¬â€"}</small></div>))}</div>
  </>;

  const renderPaletteAi = () => <>
    <div className="css-field-row is-generate"><label>Prompt<input value={palettePrompt} onChange={(event) => setPalettePrompt(event.target.value)} /></label><button onClick={setRandomPalette}>Generate</button></div>
    <div className="css-chip-row">{["sunset over ocean", "forest morning mist", "cyberpunk neon city", "pastel spring garden", "dark elegant royal"].map((item) => <button key={item} onClick={() => setPalettePrompt(item)}>{item}</button>)}</div>
    <div className="css-palette-cards">{colors.concat(["#eee3e4", "#2d2920"]).slice(0, 5).map((color, index) => <article key={`${color}-${index}`}><div style={{ background: color }} /><span>{["Primary", "Secondary", "Accent", "Background", "Text"][index]}</span><strong>{color}</strong><small>{String(index + 1).padStart(2, "0")}</small></article>)}</div>
  </>;

  const renderSchemeGenerator = () => <>
    <div className="css-field-row"><label>Base color<input type="color" value={hex} onChange={(event) => setHex(event.target.value)} /><input value={hex} onChange={(event) => setHex(event.target.value)} /></label><label>Scheme<select value={scheme} onChange={(event) => setScheme(event.target.value)}>{["Analogous", "Complementary", "Triadic", "Monochrome"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="css-gradient-strip" style={{ background: gradientValue("linear", 90, colors) }} />
    <div className="css-alternative-grid">{colors.map((color, index) => <button key={color} onClick={() => setHex(color)}><i style={{ background: color }} /><span>{scheme} {index + 1}</span><code>{color}</code></button>)}</div>
  </>;

  const renderColorControls = () => active.includes("Name") ? renderColorNameFinder() : active.includes("Image") ? renderImageColorPicker() : active.includes("Contrast Checker") ? renderContrastChecker() : active.includes("Contrast Grid") ? renderContrastGrid() : active.includes("Palette") ? renderPaletteAi() : active.includes("Scheme") ? renderSchemeGenerator() : renderColorFormat();

  const renderGradientStops = () => <>
    <label className="css-range">Direction <input type="range" min="0" max="360" value={angle} onChange={(event) => setAngle(Number(event.target.value))} /><span>{angle}Ãƒâ€šÃ‚Â°</span></label>
    <div className="css-preset-grid">{palettes.map((palette) => <button key={palette.join()} style={{ background: gradientValue("linear", 135, palette) }} onClick={() => setColors(palette)} />)}</div>
    {colors.map((color, index) => <label className="css-color-stop" key={index}>Stop {index + 1}<input type="color" value={color} onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><input value={color} onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}
    <button className="css-secondary" onClick={setRandomPalette}><Shuffle size={15} />Random</button>
  </>;

  const renderGradientGenerator = () => <><div className="css-segmented">{gradients.map((type) => <button key={type} className={gradientType === type ? "is-active" : ""} onClick={() => setGradientType(type)}>{type}</button>)}</div>{renderGradientStops()}</>;
  const renderConicGradient = () => <><div className="css-preset-buttons">{[["Rainbow", ["#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ff0000"]], ["Pie Chart", ["#f97316", "#22c55e", "#3b82f6"]], ["Sunset", ["#ff6b6b", "#ffd93d", "#7c3aed"]]].map(([label, palette]) => <button key={label as string} onClick={() => setColors(palette as string[])}>{label as string}</button>)}</div>{renderGradientStops()}</>;
  const renderGradientMesh = () => <><div className="css-mesh-preview" style={{ background: colors.map((color, index) => `radial-gradient(circle at ${25 + index * 22}% ${30 + index * 12}%, ${color} 0, transparent 48%)`).join(", ") }} /> <div className="css-alternative-grid">{colors.map((color, index) => <button key={color}><i style={{ background: color }} /><span>{color}</span><code>#{index + 1}</code></button>)}</div><button className="css-secondary" onClick={setRandomPalette}><Shuffle size={15} />Randomize</button></>;
  const renderGradientBorder = () => <><div className="css-segmented">{gradients.map((type) => <button key={type} className={gradientType === type ? "is-active" : ""} onClick={() => setGradientType(type)}>{type}</button>)}</div><label className="css-range">Border Width <input type="range" min="1" max="16" value={Math.max(1, Math.round(angle / 45))} onChange={(event) => setAngle(Number(event.target.value) * 45)} /><span>{Math.max(1, Math.round(angle / 45))}px</span></label>{renderGradientStops()}</>;
  const renderGradientText = () => <><label>Text<input value={text} onChange={(event) => setText(event.target.value)} /></label>{renderGradientStops()}<label className="css-range">Font size <input type="range" min="24" max="96" value={64} readOnly /><span>64px</span></label></>;
  const renderBackgroundPattern = () => <><div className="css-preset-buttons">{["Dots", "Grid", "Stripes", "Checkerboard", "Radial", "Polka"].map((item) => <button key={item} className={patternType === item ? "is-active" : ""} onClick={() => setPatternType(item)}>{item}</button>)}</div><label className="css-range">Size <input type="range" min="6" max="80" value={patternSize} onChange={(event) => setPatternSize(Number(event.target.value))} /><span>{patternSize}px</span></label><div className="css-field-row"><label>Primary<input type="color" value={colors[0]} onChange={(event) => setColors((current) => [event.target.value, ...current.slice(1)])} /></label><label>Background<input type="color" value="#ffffff" readOnly /></label></div></>;
  const renderSvgPattern = () => <><label>Pattern<select value={patternType} onChange={(event) => setPatternType(event.target.value)}>{["Dots", "Grid", "Lines"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="css-range">Shape Size <input type="range" min="2" max="28" value={Math.min(patternSize, 28)} onChange={(event) => setPatternSize(Number(event.target.value))} /><span>{Math.min(patternSize, 28)}px</span></label><div className="css-svg-export"><code>{`<svg width="32" height="32"><circle cx="16" cy="16" r="${Math.max(2, Math.round(patternSize / 4))}" fill="${colors[0]}"/></svg>`}</code></div></>;
  const renderNoiseGenerator = () => <><div className="css-preset-buttons">{["Film Grain", "Paper Texture", "Dot Pattern", "Lines", "Crosshatch", "Perlin Noise"].map((item) => <button key={item} onClick={() => setPatternType(item)}>{item}</button>)}</div><label className="css-range">Opacity <input type="range" min="1" max="40" value={Math.min(alpha, 40)} onChange={(event) => setAlpha(Number(event.target.value))} /><span>{Math.min(alpha, 40)}%</span></label><label className="css-range">Density <input type="range" min="10" max="100" value={patternSize} onChange={(event) => setPatternSize(Number(event.target.value))} /><span>{patternSize}%</span></label></>;
  const renderBlobGenerator = () => <><div className="css-blob-preview" style={{ width: blobSize, height: blobSize, background: gradientValue("linear", angle, colors) }} /><label className="css-range">Size <input type="range" min="120" max="360" value={blobSize} onChange={(event) => setBlobSize(Number(event.target.value))} /><span>{blobSize}px</span></label><label className="css-range">Complexity <input type="range" min="0" max="100" value={50} readOnly /><span>50%</span></label><button className="css-secondary" onClick={setRandomPalette}><Shuffle size={15} />Randomize</button></>;
  const renderGradientControls = () => active.includes("Conic") ? renderConicGradient() : active.includes("Mesh") ? renderGradientMesh() : active.includes("Border") ? renderGradientBorder() : active.includes("Text") ? renderGradientText() : active.includes("Background") ? renderBackgroundPattern() : active.includes("SVG") ? renderSvgPattern() : active.includes("Noise") ? renderNoiseGenerator() : active.includes("Blob") ? renderBlobGenerator() : renderGradientGenerator();

  const renderBoxShadow = () => <>
    <div className="css-preset-buttons">{[["Soft", { x: 0, y: 12, blur: 32, spread: -8, opacity: 18 }], ["Deep", { x: 0, y: 24, blur: 48, spread: -12, opacity: 28 }], ["Inset", { x: 0, y: 6, blur: 18, spread: -4, opacity: 18, inset: true }]].map(([label, values]) => <button key={label as string} onClick={() => setShadow((current) => ({ ...current, ...(values as Partial<typeof shadow>) }))}>{label as string}</button>)}</div>
    {(["x", "y", "blur", "spread", "opacity"] as const).map((key) => <label className="css-range" key={key}>{key} <input type="range" min={key === "spread" ? -40 : 0} max={key === "opacity" ? 100 : 80} value={shadow[key]} onChange={(event) => setShadow((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{shadow[key]}{key === "opacity" ? "%" : "px"}</span></label>)}
    <div className="css-field-row"><label>Shadow Color<input type="color" value={shadow.color} onChange={(event) => setShadow((current) => ({ ...current, color: event.target.value }))} /></label><label className="css-check"><input type="checkbox" checked={shadow.inset} onChange={(event) => setShadow((current) => ({ ...current, inset: event.target.checked }))} />Inset shadow</label></div>
  </>;

  const renderTextShadow = () => <>
    <div className="css-preset-buttons">{["3D", "Glow", "Outline", "Retro"].map((preset) => <button key={preset} onClick={() => setTextShadowLayers(preset === "Glow" ? [{ x: 0, y: 0, blur: 8, color: "#00e5ff" }, { x: 0, y: 0, blur: 18, color: "#00e5ff" }, { x: 0, y: 0, blur: 32, color: "#0088ff" }] : preset === "3D" ? [{ x: 2, y: 2, blur: 0, color: "#0f172a" }, { x: 4, y: 4, blur: 0, color: "#334155" }] : preset === "Outline" ? [{ x: 1, y: 1, blur: 0, color: "#111827" }, { x: -1, y: -1, blur: 0, color: "#111827" }] : [{ x: 3, y: 3, blur: 0, color: "#ec4899" }, { x: 6, y: 6, blur: 0, color: "#22d3ee" }])}>{preset}</button>)}</div>
    <label>Preview Text<input value={text} onChange={(event) => setText(event.target.value)} /></label>
    <label className="css-range">Font Size <input type="range" min="28" max="120" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><span>{fontSize}px</span></label>
    {textShadowLayers.map((layer, index) => <div className="css-layer-card" key={index}><strong>Layer {index + 1}</strong><div className="css-field-row"><label>X<input type="number" value={layer.x} onChange={(event) => setTextShadowLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, x: Number(event.target.value) } : item))} /></label><label>Y<input type="number" value={layer.y} onChange={(event) => setTextShadowLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, y: Number(event.target.value) } : item))} /></label></div><label className="css-range">Blur <input type="range" min="0" max="48" value={layer.blur} onChange={(event) => setTextShadowLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, blur: Number(event.target.value) } : item))} /><span>{layer.blur}px</span></label><label>Color<input type="color" value={layer.color} onChange={(event) => setTextShadowLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} /></label></div>)}
    <button className="css-secondary" onClick={() => setTextShadowLayers((current) => [...current, { x: 0, y: 0, blur: 12, color: "#ffffff" }])}>+ Add layer</button>
  </>;

  const renderMultiLayerShadow = () => <>
    <div className="css-preset-buttons">{["Material", "Layered Glow", "Deep Shadow", "Inner Pressed"].map((item) => <button key={item} onClick={() => setShadow((current) => ({ ...current, y: item.includes("Deep") ? 24 : 8, blur: item.includes("Glow") ? 34 : 18, spread: item.includes("Pressed") ? -4 : -2, opacity: item.includes("Deep") ? 30 : 16, inset: item.includes("Pressed") }))}>{item}</button>)}</div>
    {renderBoxShadow()}
  </>;

  const renderGlassmorphism = () => <>
    <div className="css-preset-buttons">{[["Light Glass", { blur: 16, opacity: 28, saturate: 160 }], ["Heavy Blur", { blur: 30, opacity: 34, saturate: 190 }], ["Dark Glass", { color: "#0f172a", opacity: 34, borderOpacity: 22 }], ["Blue Tint", { color: "#bfdbfe", opacity: 32, saturate: 180 }]].map(([label, values]) => <button key={label as string} onClick={() => setGlass((current) => ({ ...current, ...(values as Partial<typeof glass>) }))}>{label as string}</button>)}</div>
    {(["blur", "opacity", "radius", "borderWidth", "borderOpacity", "saturate", "brightness"] as const).map((key) => <label className="css-range" key={key}>{key} <input type="range" min={key === "brightness" ? 40 : 0} max={key === "saturate" ? 300 : key === "borderWidth" ? 8 : key === "radius" ? 48 : 100} value={glass[key]} onChange={(event) => setGlass((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{glass[key]}{key === "blur" || key === "radius" || key === "borderWidth" ? "px" : "%"}</span></label>)}
    <label>Glass Color<input type="color" value={glass.color} onChange={(event) => setGlass((current) => ({ ...current, color: event.target.value }))} /></label>
  </>;

  const renderEffectFilterSliders = (backdrop = false) => <>
    <div className="css-preset-buttons">{[["None", {}], ["Grayscale", { grayscale: 100 }], ["Vintage", { sepia: 55, contrast: 110, brightness: 95 }], ["Invert", { invert: 100 }], ["High Contrast", { contrast: 180 }], ["Soft Blur", { blur: backdrop ? 12 : 4 }], ["Warm", { sepia: 20, saturate: 125 }], ["Cool", { hueRotate: 35, saturate: 120 }]].map(([label, values]) => <button key={label as string} onClick={() => setEffectFilters((current) => ({ ...current, ...(values as Partial<typeof effectFilters>) }))}>{label as string}</button>)}</div>
    {(["blur", "brightness", "contrast", "grayscale", "hueRotate", "invert", "opacity", "saturate", "sepia"] as const).map((key) => <label className="css-range" key={key}>{key} <input type="range" min="0" max={key === "blur" ? 32 : key === "hueRotate" ? 360 : key === "brightness" || key === "contrast" || key === "saturate" ? 220 : 100} value={effectFilters[key]} onChange={(event) => setEffectFilters((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{effectFilters[key]}{key === "blur" ? "px" : key === "hueRotate" ? "Ã‚Â°" : "%"}</span></label>)}
  </>;
  const renderBackdropFilter = () => renderEffectFilterSliders(true);
  const renderFilterGenerator = () => renderEffectFilterSliders(false);

  const renderNeumorphism = () => <>
    <div className="css-preset-buttons">{[["Soft Card", { shape: "flat", background: "#e0e5ec", distance: 12, blur: 24 }], ["Pressed Button", { shape: "pressed", background: "#e0e5ec", distance: 8, blur: 18 }], ["Concave Dish", { shape: "concave" }], ["Convex Bump", { shape: "convex" }], ["Dark Mode", { background: "#20242a", intensity: 28 }]].map(([label, values]) => <button key={label as string} onClick={() => setNeumorphism((current) => ({ ...current, ...(values as Partial<typeof neumorphism>) }))}>{label as string}</button>)}</div>
    <label>Background<input type="color" value={neumorphism.background} onChange={(event) => setNeumorphism((current) => ({ ...current, background: event.target.value }))} /></label>
    {(["distance", "blur", "intensity", "radius", "size"] as const).map((key) => <label className="css-range" key={key}>{key} <input type="range" min={key === "size" ? 90 : 0} max={key === "size" ? 320 : key === "intensity" ? 60 : 80} value={neumorphism[key]} onChange={(event) => setNeumorphism((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{neumorphism[key]}{key === "intensity" ? "%" : "px"}</span></label>)}
    <div className="css-segmented">{(["flat", "concave", "convex", "pressed"] as const).map((shape) => <button key={shape} className={neumorphism.shape === shape ? "is-active" : ""} onClick={() => setNeumorphism((current) => ({ ...current, shape }))}>{shape}</button>)}</div>
  </>;

  const renderMixBlendMode = () => <>
    <div className="css-preset-buttons">{["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"].map((mode) => <button key={mode} className={blend.mode === mode ? "is-active" : ""} onClick={() => setBlend((current) => ({ ...current, mode }))}>{mode}</button>)}</div>
    <div className="css-field-row"><label>Background<input type="color" value={blend.background} onChange={(event) => setBlend((current) => ({ ...current, background: event.target.value }))} /></label><label>Foreground<input type="color" value={blend.foreground} onChange={(event) => setBlend((current) => ({ ...current, foreground: event.target.value }))} /></label></div>
    <div className="css-segmented">{["Text Overlay", "Circle", "Rectangle"].map((target) => <button key={target} className={blend.target === target ? "is-active" : ""} onClick={() => setBlend((current) => ({ ...current, target }))}>{target}</button>)}</div>
  </>;

  const renderMaskGenerator = () => <>
    <div className="css-preset-buttons">{["circle", "ellipse", "diamond", "stripe"].map((shape) => <button key={shape} className={mask.shape === shape ? "is-active" : ""} onClick={() => setMask((current) => ({ ...current, shape }))}>{shape}</button>)}</div>
    <label>Fill Color<input type="color" value={mask.color} onChange={(event) => setMask((current) => ({ ...current, color: event.target.value }))} /></label>
    <label className="css-range">Mask Size <input type="range" min="10" max="90" value={mask.size} onChange={(event) => setMask((current) => ({ ...current, size: Number(event.target.value) }))} /><span>{mask.size}%</span></label>
    <label className="css-range">Feather <input type="range" min="0" max="20" value={mask.feather} onChange={(event) => setMask((current) => ({ ...current, feather: Number(event.target.value) }))} /><span>{mask.feather}%</span></label>
  </>;

  const renderShadowControls = () => active.includes("Text Shadow") ? renderTextShadow() : active.includes("Multi-Layer") ? renderMultiLayerShadow() : active.includes("Glass") ? renderGlassmorphism() : active.includes("Backdrop") ? renderBackdropFilter() : active.includes("Neumorphism") ? renderNeumorphism() : active.includes("Blend") ? renderMixBlendMode() : active.includes("Mask") ? renderMaskGenerator() : active.includes("Filter") ? renderFilterGenerator() : renderBoxShadow();

  const renderGridGenerator = () => <>
    <div className="css-preset-buttons">{[["3 Equal Columns", "repeat(3, 1fr)"], ["2 Columns", "30% 70%"], ["4 Equal Columns", "repeat(4, 1fr)"], ["Auto-fit", "repeat(auto-fit, minmax(250px, 1fr))"]].map(([label, value]) => <button key={label} onClick={() => setGrid((current) => ({ ...current, columns: value }))}>{label}</button>)}</div>
    <label>Grid Template Columns<input value={grid.columns} onChange={(event) => setGrid((current) => ({ ...current, columns: event.target.value }))} /></label><label>Grid Template Rows<input value={grid.rows} onChange={(event) => setGrid((current) => ({ ...current, rows: event.target.value }))} /></label>
    <label className="css-range">Gap <input type="range" min="0" max="80" value={grid.gap} onChange={(event) => setGrid((current) => ({ ...current, gap: Number(event.target.value) }))} /><span>{grid.gap}px</span></label>
    {(["justifyItems", "alignItems", "justifyContent", "alignContent"] as const).map((key) => <label key={key}>{key}<select value={grid[key]} onChange={(event) => setGrid((current) => ({ ...current, [key]: event.target.value }))}>{["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"].map((item) => <option key={item}>{item}</option>)}</select></label>)}
  </>;

  const renderGridLayoutBuilder = () => <>
    <label className="css-range">Columns <input type="range" min="1" max="6" value={layout.gridColumns} onChange={(event) => setLayout((current) => ({ ...current, gridColumns: Number(event.target.value) }))} /><span>{layout.gridColumns}</span></label>
    <label className="css-range">Rows <input type="range" min="1" max="6" value={layout.gridRows} onChange={(event) => setLayout((current) => ({ ...current, gridRows: Number(event.target.value) }))} /><span>{layout.gridRows}</span></label>
    <label className="css-range">Gap <input type="range" min="0" max="48" value={grid.gap} onChange={(event) => setGrid((current) => ({ ...current, gap: Number(event.target.value) }))} /><span>{grid.gap}px</span></label>
    <label className="css-check"><input type="checkbox" checked={layout.equalTracks} onChange={(event) => setLayout((current) => ({ ...current, equalTracks: event.target.checked }))} />Equal tracks (1fr each)</label>
  </>;

  const renderFlexboxGenerator = () => <>
    <div className="css-field-row"><label>Flex Direction<select value={layout.flexDirection} onChange={(event) => setLayout((current) => ({ ...current, flexDirection: event.target.value }))}>{["row", "row-reverse", "column", "column-reverse"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Flex Wrap<select value={layout.flexWrap} onChange={(event) => setLayout((current) => ({ ...current, flexWrap: event.target.value }))}>{["nowrap", "wrap", "wrap-reverse"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="css-field-row"><label>Justify Content<select value={layout.justifyContent} onChange={(event) => setLayout((current) => ({ ...current, justifyContent: event.target.value }))}>{["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Align Items<select value={layout.alignItems} onChange={(event) => setLayout((current) => ({ ...current, alignItems: event.target.value }))}>{["stretch", "flex-start", "flex-end", "center", "baseline"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label className="css-range">Gap <input type="range" min="0" max="48" value={grid.gap} onChange={(event) => setGrid((current) => ({ ...current, gap: Number(event.target.value) }))} /><span>{grid.gap}px</span></label><label className="css-range">Items <input type="range" min="1" max="12" value={layout.itemCount} onChange={(event) => setLayout((current) => ({ ...current, itemCount: Number(event.target.value) }))} /><span>{layout.itemCount}</span></label>
  </>;

  const renderFlexPlayground = () => <>
    <div className="css-preset-buttons">{["row", "row-reverse", "column", "column-reverse"].map((item) => <button key={item} className={layout.flexDirection === item ? "is-active" : ""} onClick={() => setLayout((current) => ({ ...current, flexDirection: item }))}>{item}</button>)}</div>
    <div className="css-preset-buttons">{["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"].map((item) => <button key={item} className={layout.justifyContent === item ? "is-active" : ""} onClick={() => setLayout((current) => ({ ...current, justifyContent: item }))}>{item}</button>)}</div>
    <div className="css-preset-buttons">{["stretch", "flex-start", "flex-end", "center", "baseline"].map((item) => <button key={item} className={layout.alignItems === item ? "is-active" : ""} onClick={() => setLayout((current) => ({ ...current, alignItems: item }))}>{item}</button>)}</div>
    {renderFlexboxGenerator()}
  </>;

  const renderColumnsGenerator = () => <>
    <div className="css-preset-buttons">{[["2 Columns", 2], ["3 Columns", 3], ["4 Columns", 4], ["Newspaper", 3], ["Magazine", 2]].map(([label, count]) => <button key={label as string} onClick={() => setLayout((current) => ({ ...current, columnCount: count as number, columnGap: label === "Magazine" ? "2rem" : "1.5em" }))}>{label as string}</button>)}</div>
    <label className="css-range">Column Count <input type="range" min="1" max="6" value={layout.columnCount} onChange={(event) => setLayout((current) => ({ ...current, columnCount: Number(event.target.value) }))} /><span>{layout.columnCount}</span></label>
    <label>Column Width<input value={layout.columnWidth} onChange={(event) => setLayout((current) => ({ ...current, columnWidth: event.target.value }))} /></label><label>Column Gap<input value={layout.columnGap} onChange={(event) => setLayout((current) => ({ ...current, columnGap: event.target.value }))} /></label>
    <label>Column Rule<select value={layout.columnRule} onChange={(event) => setLayout((current) => ({ ...current, columnRule: event.target.value }))}>{["none", "1px solid #d1d5db", "2px dotted #94a3b8", "3px double #14b8a6"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderContainerQuery = () => <>
    <div className="css-preset-buttons">{[["Mobile First", 300], ["Responsive Card", 420], ["Sidebar Layout", 720], ["Height Based", 300]].map(([label, value]) => <button key={label as string} onClick={() => setLayout((current) => ({ ...current, queryValue: value as number, queryFeature: label === "Height Based" ? "min-height" : "min-width" }))}>{label as string}</button>)}</div>
    <label>Container Name<input value={layout.containerName} onChange={(event) => setLayout((current) => ({ ...current, containerName: event.target.value }))} /></label><label>Container Type<select value={layout.containerType} onChange={(event) => setLayout((current) => ({ ...current, containerType: event.target.value }))}>{["inline-size", "size", "normal"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>Feature<select value={layout.queryFeature} onChange={(event) => setLayout((current) => ({ ...current, queryFeature: event.target.value }))}>{["min-width", "max-width", "min-height", "max-height"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Value<input type="number" value={layout.queryValue} onChange={(event) => setLayout((current) => ({ ...current, queryValue: Number(event.target.value) }))} /></label></div>
    <div className="css-field-row"><label>Unit<select value={layout.queryUnit} onChange={(event) => setLayout((current) => ({ ...current, queryUnit: event.target.value }))}>{["px", "rem", "em"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="css-range">Preview Width <input type="range" min="220" max="900" value={layout.queryPreviewWidth} onChange={(event) => setLayout((current) => ({ ...current, queryPreviewWidth: Number(event.target.value) }))} /><span>{layout.queryPreviewWidth}px</span></label></div>
  </>;

  const renderMediaQuery = () => <>
    <div className="css-preset-buttons">{[["Mobile First", 768], ["Desktop First", 1024], ["Tablet", 640], ["Landscape", 900], ["Print", 0]].map(([label, value]) => <button key={label as string} onClick={() => setLayout((current) => ({ ...current, mediaType: label === "Print" ? "print" : "all", mediaValue: value as number, mediaFeature: label === "Desktop First" ? "max-width" : "min-width" }))}>{label as string}</button>)}</div>
    <label>Media Type<select value={layout.mediaType} onChange={(event) => setLayout((current) => ({ ...current, mediaType: event.target.value }))}>{["all", "screen", "print"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>Feature<select value={layout.mediaFeature} onChange={(event) => setLayout((current) => ({ ...current, mediaFeature: event.target.value }))}>{["min-width", "max-width", "min-height", "max-height"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Value<input type="number" value={layout.mediaValue} onChange={(event) => setLayout((current) => ({ ...current, mediaValue: Number(event.target.value) }))} /></label></div>
    <div className="css-field-row"><label>Unit<select value={layout.mediaUnit} onChange={(event) => setLayout((current) => ({ ...current, mediaUnit: event.target.value }))}>{["px", "rem", "em"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="css-range">Preview Width <input type="range" min="320" max="1440" value={layout.mediaPreviewWidth} onChange={(event) => setLayout((current) => ({ ...current, mediaPreviewWidth: Number(event.target.value) }))} /><span>{layout.mediaPreviewWidth}px</span></label></div>
  </>;

  const renderCalcGenerator = () => <>
    <div className="css-field-row"><label>First Value<input type="number" value={layout.calcA} onChange={(event) => setLayout((current) => ({ ...current, calcA: Number(event.target.value) }))} /></label><label>Unit<select value={layout.calcAUnit} onChange={(event) => setLayout((current) => ({ ...current, calcAUnit: event.target.value }))}>{["%", "px", "rem", "vw"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label>Operator<select value={layout.calcOp} onChange={(event) => setLayout((current) => ({ ...current, calcOp: event.target.value }))}>{["-", "+", "*", "/"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>Second Value<input type="number" value={layout.calcB} onChange={(event) => setLayout((current) => ({ ...current, calcB: Number(event.target.value) }))} /></label><label>Unit<select value={layout.calcBUnit} onChange={(event) => setLayout((current) => ({ ...current, calcBUnit: event.target.value }))}>{["rem", "px", "%", "vw"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
  </>;

  const renderClampGenerator = () => <>
    <div className="css-preset-buttons">{[["Body Text", [16, 2, 1, 20]], ["Heading H1", [36, 5, 1, 72]], ["Heading H2", [28, 4, 1, 56]], ["Subtle", [14, 1, 1, 18]]].map(([label, values]) => <button key={label as string} onClick={() => { const [min, preferred, base, max] = values as number[]; setLayout((current) => ({ ...current, clampMin: min, clampPreferred: preferred, clampBase: base, clampMax: max })); }}>{label as string}</button>)}</div>
    {(["clampMin", "clampPreferred", "clampBase", "clampMax"] as const).map((key) => <label className="css-range" key={key}>{key.replace("clamp", "")} <input type="range" min="0" max={key === "clampMax" ? 120 : 20} value={layout[key]} onChange={(event) => setLayout((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{layout[key]}</span></label>)}
  </>;

  const renderAspectRatio = () => <>
    <div className="css-preset-buttons">{[["16:9", 16, 9], ["4:3", 4, 3], ["1:1", 1, 1], ["21:9", 21, 9], ["3:2", 3, 2], ["5:4", 5, 4]].map(([label, w, h]) => <button key={label as string} onClick={() => setLayout((current) => ({ ...current, aspectW: w as number, aspectH: h as number }))}>{label as string}</button>)}</div>
    <div className="css-field-row"><label>Width<input type="number" value={layout.aspectW} onChange={(event) => setLayout((current) => ({ ...current, aspectW: Number(event.target.value) }))} /></label><label>Height<input type="number" value={layout.aspectH} onChange={(event) => setLayout((current) => ({ ...current, aspectH: Number(event.target.value) }))} /></label></div>
    <label>Container Width<input value={layout.aspectWidth} onChange={(event) => setLayout((current) => ({ ...current, aspectWidth: event.target.value }))} /></label><label className="css-check"><input type="checkbox" checked={layout.aspectFallback} onChange={(event) => setLayout((current) => ({ ...current, aspectFallback: event.target.checked }))} />Include fallback</label>
  </>;

  const renderOverflowGenerator = () => <>
    <div className="css-preset-buttons">{[["Scrollable", "auto"], ["Hidden", "hidden"], ["Always Scroll", "scroll"], ["Visible", "visible"], ["Clip", "clip"]].map(([label, value]) => <button key={label as string} onClick={() => setLayout((current) => ({ ...current, overflow: value as string }))}>{label as string}</button>)}</div>
    <label>Overflow<select value={layout.overflow} onChange={(event) => setLayout((current) => ({ ...current, overflow: event.target.value }))}>{["auto", "hidden", "scroll", "visible", "clip"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>Overflow X<select value={layout.overflowX} onChange={(event) => setLayout((current) => ({ ...current, overflowX: event.target.value }))}>{["visible", "hidden", "scroll", "auto", "clip"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Overflow Y<select value={layout.overflowY} onChange={(event) => setLayout((current) => ({ ...current, overflowY: event.target.value }))}>{["visible", "hidden", "scroll", "auto", "clip"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label className="css-range">Width <input type="range" min="160" max="520" value={layout.overflowWidth} onChange={(event) => setLayout((current) => ({ ...current, overflowWidth: Number(event.target.value) }))} /><span>{layout.overflowWidth}px</span></label><label className="css-range">Height <input type="range" min="100" max="360" value={layout.overflowHeight} onChange={(event) => setLayout((current) => ({ ...current, overflowHeight: Number(event.target.value) }))} /><span>{layout.overflowHeight}px</span></label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderLayoutControls = () => active.includes("Grid Layout") ? renderGridLayoutBuilder() : active.includes("Flexbox") ? renderFlexboxGenerator() : active.includes("Flex Playground") ? renderFlexPlayground() : active.includes("Columns") ? renderColumnsGenerator() : active.includes("Container") ? renderContainerQuery() : active.includes("Media") ? renderMediaQuery() : active.includes("Calc") ? renderCalcGenerator() : active.includes("Clamp") ? renderClampGenerator() : active.includes("Aspect") ? renderAspectRatio() : active.includes("Overflow") ? renderOverflowGenerator() : renderGridGenerator();

  const renderTextEffects = () => <>
    <div className="css-segmented">{["Gradient", "Neon", "Glitch", "Stroke"].map((item) => <button key={item} className={active.includes(item) || (active === "CSS Text Effects" && item === "Gradient") ? "is-active" : ""} onClick={() => setActive(item === "Gradient" ? "CSS Text Effects" : `CSS Text Effects ${item}`)}>{item}</button>)}</div>
    <label>Preview Text<input value={text} onChange={(event) => setText(event.target.value)} /></label>
    {renderGradientStops()}
    <label className="css-range">Font Size <input type="range" min="24" max="120" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><span>{fontSize}px</span></label>
    <label>Font Weight<select value={fontWeight} onChange={(event) => setFontWeight(Number(event.target.value))}>{[300, 400, 500, 600, 700, 800, 900].map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></label>
    <label>Font Family<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>{["system-ui", "Inter", "Georgia", "monospace", "serif"].map((item) => <option key={item}>{item}</option>)}</select></label>
  </>;

  const renderTypeScale = () => <>
    <div className="css-field-row"><label>Base Font Size<input type="number" value={scaleBase} onChange={(event) => setScaleBase(Number(event.target.value))} /></label><label>Scale Ratio<input type="number" step="0.001" value={scaleRatio} onChange={(event) => setScaleRatio(Number(event.target.value))} /></label></div>
    <div className="css-field-row"><label>Steps Above<input type="number" min="1" max="8" value={scaleAbove} onChange={(event) => setScaleAbove(Number(event.target.value))} /></label><label>Steps Below<input type="number" min="0" max="4" value={scaleBelow} onChange={(event) => setScaleBelow(Number(event.target.value))} /></label></div>
    <div className="css-segmented"><button className={scaleUnit === "rem" ? "is-active" : ""} onClick={() => setScaleUnit("rem")}>rem</button><button className={scaleUnit === "px" ? "is-active" : ""} onClick={() => setScaleUnit("px")}>px</button></div>
    <div className="css-type-scale-preview">{[-2, -1, 0, 1, 2, 3, 4].map((step, index) => <div key={step}><code>{step === 0 ? "base" : step > 0 ? `+${step}` : step}</code><span style={{ fontSize: `${Math.max(12, scaleBase * scaleRatio ** step)}px` }}>--text-{["xs", "sm", "base", "md", "lg", "xl", "2xl"][index]}</span></div>)}</div>
  </>;

  const renderFontFace = () => <>
    <label>Font Family Name<input value={fontFace.family} onChange={(event) => setFontFace((current) => ({ ...current, family: event.target.value }))} /></label>
    <div className="css-preset-buttons">{["100", "200", "300", "400", "500", "600", "700", "800", "900"].map((weight) => <button key={weight} className={fontFace.weight === weight ? "is-active" : ""} onClick={() => setFontFace((current) => ({ ...current, weight }))}>{weight}</button>)}</div>
    <div className="css-field-row"><label>Style<select value={fontFace.style} onChange={(event) => setFontFace((current) => ({ ...current, style: event.target.value }))}>{["normal", "italic", "oblique"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Display<select value={fontFace.display} onChange={(event) => setFontFace((current) => ({ ...current, display: event.target.value }))}>{["swap", "auto", "block", "fallback", "optional"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label>WOFF2 URL<input value={fontFace.woff2} onChange={(event) => setFontFace((current) => ({ ...current, woff2: event.target.value }))} /></label>
    <label>WOFF URL<input value={fontFace.woff} onChange={(event) => setFontFace((current) => ({ ...current, woff: event.target.value }))} /></label>
    <label>Unicode Range<input value={fontFace.unicodeRange} onChange={(event) => setFontFace((current) => ({ ...current, unicodeRange: event.target.value }))} /></label>
  </>;

  const renderFontStack = () => <>
    <div className="css-preset-buttons">{["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Georgia", "Source Code Pro", "JetBrains Mono"].map((font) => <button key={font} className={fontStack.primary === font ? "is-active" : ""} onClick={() => setFontStack((current) => ({ ...current, primary: font }))}>{font}</button>)}</div>
    <label>Custom primary font<input value={fontStack.primary} onChange={(event) => setFontStack((current) => ({ ...current, primary: event.target.value }))} /></label>
    <label>Fallback Category<select value={fontStack.category} onChange={(event) => setFontStack((current) => ({ ...current, category: event.target.value }))}>{["sans-serif", "serif", "monospace", "cursive", "fantasy"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="css-check"><input type="checkbox" checked={fontStack.os} onChange={(event) => setFontStack((current) => ({ ...current, os: event.target.checked }))} />Include OS-specific fonts</label>
    <label className="css-range">Preview Size <input type="range" min="14" max="72" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><span>{fontSize}px</span></label>
  </>;

  const renderLineClamp = () => <>
    <div className="css-preset-buttons">{[1, 2, 3, 4, 5, 6].map((lines) => <button key={lines} className={lineClamp.lines === lines ? "is-active" : ""} onClick={() => setLineClamp((current) => ({ ...current, lines }))}>{lines} line{lines > 1 ? "s" : ""}</button>)}</div>
    <label className="css-range">Number of Lines <input type="range" min="1" max="10" value={lineClamp.lines} onChange={(event) => setLineClamp((current) => ({ ...current, lines: Number(event.target.value) }))} /><span>{lineClamp.lines}</span></label>
    <label className="css-check"><input type="checkbox" checked={lineClamp.ellipsis} onChange={(event) => setLineClamp((current) => ({ ...current, ellipsis: event.target.checked }))} />Show ellipsis</label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderLetterSpacing = () => <>
    <div className="css-preset-buttons">{[["Tight", -1], ["Normal", 0], ["Loose", 2], ["Wide", 4], ["Ultra Wide", 8]].map(([label, value]) => <button key={label as string} onClick={() => setLetterSpacing((current) => ({ ...current, value: value as number }))}>{label as string}</button>)}</div>
    <div className="css-segmented"><button className={letterSpacing.unit === "px" ? "is-active" : ""} onClick={() => setLetterSpacing((current) => ({ ...current, unit: "px" }))}>px</button><button className={letterSpacing.unit === "em" ? "is-active" : ""} onClick={() => setLetterSpacing((current) => ({ ...current, unit: "em" }))}>em</button></div>
    <label className="css-range">Letter Spacing <input type="range" min="-5" max="20" step={letterSpacing.unit === "em" ? "0.01" : "1"} value={letterSpacing.value} onChange={(event) => setLetterSpacing((current) => ({ ...current, value: Number(event.target.value) }))} /><span>{letterSpacing.value}{letterSpacing.unit}</span></label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderTextWrap = () => <>
    <label>White Space<select value={wrap.whiteSpace} onChange={(event) => setWrap((current) => ({ ...current, whiteSpace: event.target.value }))}>{["normal", "nowrap", "pre", "pre-wrap", "pre-line", "break-spaces"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Text Overflow<select value={wrap.overflow} onChange={(event) => setWrap((current) => ({ ...current, overflow: event.target.value }))}>{["visible", "hidden", "ellipsis", "clip"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="css-range">Container Width <input type="range" min="160" max="720" value={wrap.width} onChange={(event) => setWrap((current) => ({ ...current, width: Number(event.target.value) }))} /><span>{wrap.width}px</span></label>
    <label className="css-range">Line Height <input type="range" min="1" max="2.4" step="0.1" value={wrap.lineHeight} onChange={(event) => setWrap((current) => ({ ...current, lineHeight: Number(event.target.value) }))} /><span>{wrap.lineHeight}</span></label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderWritingMode = () => <>
    <div className="css-preset-buttons">{[["English LTR", "horizontal-tb", "ltr", "mixed"], ["Arabic RTL", "horizontal-tb", "rtl", "mixed"], ["Japanese Vertical", "vertical-rl", "ltr", "upright"], ["Mongolian Script", "vertical-lr", "ltr", "mixed"]].map(([label, mode, direction, orientation]) => <button key={label} onClick={() => setWriting({ mode, direction: direction as "ltr" | "rtl", orientation })}>{label}</button>)}</div>
    <label>Writing Mode<select value={writing.mode} onChange={(event) => setWriting((current) => ({ ...current, mode: event.target.value }))}>{["horizontal-tb", "vertical-rl", "vertical-lr", "sideways-rl", "sideways-lr"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Direction<select value={writing.direction} onChange={(event) => setWriting((current) => ({ ...current, direction: event.target.value as "ltr" | "rtl" }))}>{["ltr", "rtl"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Text Orientation<select value={writing.orientation} onChange={(event) => setWriting((current) => ({ ...current, orientation: event.target.value }))}>{["mixed", "upright", "sideways"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <textarea value={text} onChange={(event) => setText(event.target.value)} />
  </>;

  const renderTypographyControls = () => active.includes("Type Scale") ? renderTypeScale() : active.includes("Font-Face") ? renderFontFace() : active.includes("Font Stack") ? renderFontStack() : active.includes("Line Clamp") ? renderLineClamp() : active.includes("Letter Spacing") ? renderLetterSpacing() : active.includes("Text Wrap") ? renderTextWrap() : active.includes("Writing Mode") ? renderWritingMode() : renderTextEffects();
  const renderAnimationTimingControls = () => <>
    <label className="css-range">Duration <input type="range" min="100" max="5000" step="100" value={animation.duration} onChange={(event) => setAnimation((current) => ({ ...current, duration: Number(event.target.value) }))} /><span>{animation.duration}ms</span></label>
    <label className="css-range">Delay <input type="range" min="0" max="3000" step="100" value={animation.delay} onChange={(event) => setAnimation((current) => ({ ...current, delay: Number(event.target.value) }))} /><span>{animation.delay}ms</span></label>
    <div className="css-field-row"><label>Timing<select value={animation.timing} onChange={(event) => setAnimation((current) => ({ ...current, timing: event.target.value }))}>{["ease", "ease-in", "ease-out", "ease-in-out", "linear", bezierValue].map((item) => <option key={item}>{item}</option>)}</select></label><label>Iterations<select value={animation.iteration} onChange={(event) => setAnimation((current) => ({ ...current, iteration: event.target.value }))}>{["1", "2", "3", "5", "10", "infinite"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="css-field-row"><label>Direction<select value={animation.direction} onChange={(event) => setAnimation((current) => ({ ...current, direction: event.target.value }))}>{["normal", "reverse", "alternate", "alternate-reverse"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Fill Mode<select value={animation.fillMode} onChange={(event) => setAnimation((current) => ({ ...current, fillMode: event.target.value }))}>{["none", "forwards", "backwards", "both"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
  </>;

  const renderAnimationGenerator = () => <>
    <div className="css-preset-buttons">{["fadeIn", "fadeOut", "slideInLeft", "slideInRight", "slideInUp", "slideInDown", "bounce", "pulse", "spin", "shake", "zoomIn", "zoomOut"].map((name) => <button key={name} className={animation.name === name ? "is-active" : ""} onClick={() => setAnimation((current) => ({ ...current, name }))}>{name}</button>)}</div>
    <label>Preview text<input value={text} onChange={(event) => setText(event.target.value)} /></label>
    {renderAnimationTimingControls()}
  </>;

  const renderKeyframeAnimator = () => <>
    <div className="css-preset-buttons">{animationLab.keyframes.map((frame, index) => <button key={index} className={animationLab.selectedKeyframe === index ? "is-active" : ""} onClick={() => setAnimationLab((current) => ({ ...current, selectedKeyframe: index }))}>{frame.offset}%</button>)}<button onClick={() => setAnimationLab((current) => ({ ...current, keyframes: [...current.keyframes, { offset: 50, x: 40, y: -20, scale: 1, rotate: 0, opacity: 1 }], selectedKeyframe: current.keyframes.length }))}>+ Add</button></div>
    <label className="css-range">Offset <input type="range" min="0" max="100" value={selectedKeyframe.offset} onChange={(event) => updateSelectedKeyframe("offset", Number(event.target.value))} /><span>{selectedKeyframe.offset}%</span></label>
    <label className="css-range">Translate X <input type="range" min="-160" max="160" value={selectedKeyframe.x} onChange={(event) => updateSelectedKeyframe("x", Number(event.target.value))} /><span>{selectedKeyframe.x}px</span></label>
    <label className="css-range">Translate Y <input type="range" min="-120" max="120" value={selectedKeyframe.y} onChange={(event) => updateSelectedKeyframe("y", Number(event.target.value))} /><span>{selectedKeyframe.y}px</span></label>
    <label className="css-range">Scale <input type="range" min="0.2" max="2" step="0.01" value={selectedKeyframe.scale} onChange={(event) => updateSelectedKeyframe("scale", Number(event.target.value))} /><span>{selectedKeyframe.scale}</span></label>
    <label className="css-range">Rotate <input type="range" min="-180" max="180" value={selectedKeyframe.rotate} onChange={(event) => updateSelectedKeyframe("rotate", Number(event.target.value))} /><span>{selectedKeyframe.rotate}deg</span></label>
    <label className="css-range">Opacity <input type="range" min="0" max="1" step="0.01" value={selectedKeyframe.opacity} onChange={(event) => updateSelectedKeyframe("opacity", Number(event.target.value))} /><span>{selectedKeyframe.opacity}</span></label>
    {renderAnimationTimingControls()}
  </>;

  const renderTransitionGenerator = () => <>
    <div className="css-preset-buttons">{["all", "opacity", "transform", "color", "background-color", "width", "height", "margin", "padding", "border"].map((item) => <button key={item} className={animationLab.transitionProperty === item ? "is-active" : ""} onClick={() => setAnimationLab((current) => ({ ...current, transitionProperty: item }))}>{item}</button>)}</div>
    {renderAnimationTimingControls()}
    <button className="css-secondary" onClick={() => setAnimationLab((current) => ({ ...current, transitionActive: !current.transitionActive }))}>Animate Preview</button>
  </>;

  const renderTransformGenerator = () => <>
    <label className="css-range">Rotate <input type="range" min="-180" max="180" value={animationLab.transformRotate} onChange={(event) => setAnimationLab((current) => ({ ...current, transformRotate: Number(event.target.value) }))} /><span>{animationLab.transformRotate}deg</span></label>
    <label className="css-range">Scale X <input type="range" min="0.1" max="2" step="0.01" value={animationLab.scaleX} onChange={(event) => setAnimationLab((current) => ({ ...current, scaleX: Number(event.target.value) }))} /><span>{animationLab.scaleX}</span></label>
    <label className="css-range">Scale Y <input type="range" min="0.1" max="2" step="0.01" value={animationLab.scaleY} onChange={(event) => setAnimationLab((current) => ({ ...current, scaleY: Number(event.target.value) }))} /><span>{animationLab.scaleY}</span></label>
    <div className="css-field-row"><label>Translate X<input type="number" value={animationLab.translateX} onChange={(event) => setAnimationLab((current) => ({ ...current, translateX: Number(event.target.value) }))} /></label><label>Translate Y<input type="number" value={animationLab.translateY} onChange={(event) => setAnimationLab((current) => ({ ...current, translateY: Number(event.target.value) }))} /></label></div>
    <label className="css-range">Skew X <input type="range" min="-60" max="60" value={animationLab.skewX} onChange={(event) => setAnimationLab((current) => ({ ...current, skewX: Number(event.target.value) }))} /><span>{animationLab.skewX}deg</span></label>
    <label className="css-range">Skew Y <input type="range" min="-60" max="60" value={animationLab.skewY} onChange={(event) => setAnimationLab((current) => ({ ...current, skewY: Number(event.target.value) }))} /><span>{animationLab.skewY}deg</span></label>
    <label className="css-range">Perspective <input type="range" min="0" max="1200" value={animationLab.perspective} onChange={(event) => setAnimationLab((current) => ({ ...current, perspective: Number(event.target.value) }))} /><span>{animationLab.perspective}px</span></label>
  </>;

  const renderThreeDTransform = () => <>
    {(["rotateX", "rotateY", "rotateZ", "translateZ", "perspective3d", "scale3d"] as const).map((key) => <label className="css-range" key={key}>{key} <input type="range" min={key === "scale3d" ? "0.2" : key === "perspective3d" ? "200" : key === "translateZ" ? "-240" : "-180"} max={key === "scale3d" ? "2" : key === "perspective3d" ? "1600" : key === "translateZ" ? "240" : "180"} step={key === "scale3d" ? "0.01" : "1"} value={animationLab[key]} onChange={(event) => setAnimationLab((current) => ({ ...current, [key]: Number(event.target.value) }))} /><span>{animationLab[key]}{key === "scale3d" ? "" : key === "perspective3d" || key === "translateZ" ? "px" : "deg"}</span></label>)}
  </>;

  const renderPerspectiveGenerator = () => <>
    <label className="css-range">Perspective <input type="range" min="200" max="1600" value={animationLab.perspective3d} onChange={(event) => setAnimationLab((current) => ({ ...current, perspective3d: Number(event.target.value) }))} /><span>{animationLab.perspective3d}px</span></label>
    <label className="css-range">Origin X <input type="range" min="0" max="100" value={animationLab.perspectiveOriginX} onChange={(event) => setAnimationLab((current) => ({ ...current, perspectiveOriginX: Number(event.target.value) }))} /><span>{animationLab.perspectiveOriginX}%</span></label>
    <label className="css-range">Origin Y <input type="range" min="0" max="100" value={animationLab.perspectiveOriginY} onChange={(event) => setAnimationLab((current) => ({ ...current, perspectiveOriginY: Number(event.target.value) }))} /><span>{animationLab.perspectiveOriginY}%</span></label>
    {renderThreeDTransform()}
  </>;

  const renderBezierEditor = () => <>
    <div className="css-bezier-board"><i style={{ left: `${animationLab.bezier[0] * 100}%`, bottom: `${animationLab.bezier[1] * 100}%` }} /><i style={{ left: `${animationLab.bezier[2] * 100}%`, bottom: `${animationLab.bezier[3] * 100}%` }} /></div>
    {([0, 1, 2, 3] as const).map((index) => <label className="css-range" key={index}>P{index < 2 ? "1" : "2"} {index % 2 ? "Y" : "X"}<input type="range" min={index % 2 ? "-1" : "0"} max={index % 2 ? "2" : "1"} step="0.01" value={animationLab.bezier[index]} onChange={(event) => setAnimationLab((current) => ({ ...current, bezier: current.bezier.map((value, i) => i === index ? Number(event.target.value) : value) }))} /><span>{animationLab.bezier[index]}</span></label>)}
  </>;

  const renderEasingEditor = () => <>
    <div className="css-preset-buttons">{[["ease", [0.25, 0.1, 0.25, 1]], ["ease-in", [0.42, 0, 1, 1]], ["ease-out", [0, 0, 0.58, 1]], ["ease-in-out", [0.42, 0, 0.58, 1]], ["bounce-ish", [0.34, 1.56, 0.64, 1]]].map(([label, values]) => <button key={label as string} onClick={() => setAnimationLab((current) => ({ ...current, bezier: values as number[] }))}>{label as string}</button>)}</div>
    {renderBezierEditor()}
  </>;

  const renderScrollSnapGenerator = () => <>
    <label>Snap Axis<select value={animationLab.snapAxis} onChange={(event) => setAnimationLab((current) => ({ ...current, snapAxis: event.target.value }))}>{["x", "y", "both"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-segmented"><button className={animationLab.snapStrictness === "mandatory" ? "is-active" : ""} onClick={() => setAnimationLab((current) => ({ ...current, snapStrictness: "mandatory" }))}>Mandatory</button><button className={animationLab.snapStrictness === "proximity" ? "is-active" : ""} onClick={() => setAnimationLab((current) => ({ ...current, snapStrictness: "proximity" }))}>Proximity</button></div>
    <label>Snap Align<select value={animationLab.snapAlign} onChange={(event) => setAnimationLab((current) => ({ ...current, snapAlign: event.target.value }))}>{["start", "center", "end"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>Padding X<input type="number" value={animationLab.snapPaddingX} onChange={(event) => setAnimationLab((current) => ({ ...current, snapPaddingX: Number(event.target.value) }))} /></label><label>Margin X<input type="number" value={animationLab.snapMarginX} onChange={(event) => setAnimationLab((current) => ({ ...current, snapMarginX: Number(event.target.value) }))} /></label></div>
  </>;

  const renderScrollTimelineGenerator = () => <>
    <label>Timeline Name<input value={animationLab.timelineName} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineName: event.target.value }))} /></label>
    <div className="css-field-row"><label>Source<select value={animationLab.timelineSource} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineSource: event.target.value }))}>{["root", "nearest", "self"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Axis<select value={animationLab.timelineAxis} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineAxis: event.target.value }))}>{["block", "inline", "x", "y"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <label>Property<select value={animationLab.timelineProperty} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineProperty: event.target.value }))}>{["opacity", "scale", "translate", "rotate"].map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="css-field-row"><label>From<input value={animationLab.timelineFrom} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineFrom: event.target.value }))} /></label><label>To<input value={animationLab.timelineTo} onChange={(event) => setAnimationLab((current) => ({ ...current, timelineTo: event.target.value }))} /></label></div>
  </>;

  const renderTypingEffectGenerator = () => <>
    <label>Text Content<input value={text} onChange={(event) => setText(event.target.value)} /></label>
    <label className="css-range">Duration <input type="range" min="500" max="8000" step="100" value={animationLab.typingDuration} onChange={(event) => setAnimationLab((current) => ({ ...current, typingDuration: Number(event.target.value) }))} /><span>{animationLab.typingDuration}ms</span></label>
    <label className="css-range">Font Size <input type="range" min="14" max="72" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><span>{fontSize}px</span></label>
    <div className="css-field-row"><label>Text Color<input type="color" value={animationLab.typingColor} onChange={(event) => setAnimationLab((current) => ({ ...current, typingColor: event.target.value }))} /></label><label>Background<input type="color" value={animationLab.typingBackground} onChange={(event) => setAnimationLab((current) => ({ ...current, typingBackground: event.target.value }))} /></label></div>
    <label className="css-check"><input type="checkbox" checked={animationLab.typingBlink} onChange={(event) => setAnimationLab((current) => ({ ...current, typingBlink: event.target.checked }))} />Blinking cursor</label>
  </>;

  const renderLoaderGenerator = () => <>
    <div className="css-preset-buttons">{["ring", "dual", "dots", "bars", "pulse", "bouncing"].map((item) => <button key={item} className={animationLab.loaderStyle === item ? "is-active" : ""} onClick={() => setAnimationLab((current) => ({ ...current, loaderStyle: item }))}>{item}</button>)}</div>
    <label className="css-range">Size <input type="range" min="20" max="120" value={animationLab.loaderSize} onChange={(event) => setAnimationLab((current) => ({ ...current, loaderSize: Number(event.target.value) }))} /><span>{animationLab.loaderSize}px</span></label>
    <label className="css-range">Speed <input type="range" min="300" max="3000" step="100" value={animation.duration} onChange={(event) => setAnimation((current) => ({ ...current, duration: Number(event.target.value) }))} /><span>{animation.duration}ms</span></label>
    <label>Color<input type="color" value={animationLab.loaderColor} onChange={(event) => setAnimationLab((current) => ({ ...current, loaderColor: event.target.value }))} /></label>
  </>;

  const updateShape = (key: keyof typeof shape, value: string | number | boolean) => setShape((current) => ({ ...current, [key]: value }));
  const renderRadiusControls = () => <>
    <div className="css-segmented"><button className={shape.radiusMode === "uniform" ? "is-active" : ""} onClick={() => updateShape("radiusMode", "uniform")}>Uniform</button><button className={shape.radiusMode === "individual" ? "is-active" : ""} onClick={() => updateShape("radiusMode", "individual")}>Individual</button></div>
    {shape.radiusMode === "uniform" ? <label className="css-range">Radius <input type="range" min="0" max="120" value={shape.radius} onChange={(event) => updateShape("radius", Number(event.target.value))} /><span>{shape.radius}px</span></label> : <div className="css-field-row"><label>Top left<input type="number" value={shape.topLeft} onChange={(event) => updateShape("topLeft", Number(event.target.value))} /></label><label>Top right<input type="number" value={shape.topRight} onChange={(event) => updateShape("topRight", Number(event.target.value))} /></label><label>Bottom right<input type="number" value={shape.bottomRight} onChange={(event) => updateShape("bottomRight", Number(event.target.value))} /></label><label>Bottom left<input type="number" value={shape.bottomLeft} onChange={(event) => updateShape("bottomLeft", Number(event.target.value))} /></label></div>}
    <div className="css-preset-buttons">{[["None", 0], ["Rounded", 12], ["Card", 18], ["Pill", 999], ["Circle", 80], ["Bottom Only", 24]].map(([label, value]) => <button key={label as string} onClick={() => setShape((current) => ({ ...current, radiusMode: "uniform", radius: value as number, bottomLeft: value as number, bottomRight: value as number, topLeft: label === "Bottom Only" ? 0 : value as number, topRight: label === "Bottom Only" ? 0 : value as number }))}>{label as string}</button>)}</div>
  </>;

  const renderBorderControls = () => <>
    <label className="css-range">Width <input type="range" min="0" max="24" value={shape.borderWidth} onChange={(event) => updateShape("borderWidth", Number(event.target.value))} /><span>{shape.borderWidth}px</span></label>
    <div className="css-field-row"><label>Style<select value={shape.borderStyle} onChange={(event) => updateShape("borderStyle", event.target.value)}>{["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Color<input type="color" value={shape.borderColor} onChange={(event) => updateShape("borderColor", event.target.value)} /></label></div>
    <label className="css-range">Radius <input type="range" min="0" max="80" value={shape.radius} onChange={(event) => updateShape("radius", Number(event.target.value))} /><span>{shape.radius}px</span></label>
  </>;

  const renderOutlineControls = () => <>
    <label className="css-range">Width <input type="range" min="1" max="18" value={shape.outlineWidth} onChange={(event) => updateShape("outlineWidth", Number(event.target.value))} /><span>{shape.outlineWidth}px</span></label>
    <label className="css-range">Offset <input type="range" min="-12" max="32" value={shape.outlineOffset} onChange={(event) => updateShape("outlineOffset", Number(event.target.value))} /><span>{shape.outlineOffset}px</span></label>
    <div className="css-field-row"><label>Style<select value={shape.outlineStyle} onChange={(event) => updateShape("outlineStyle", event.target.value)}>{["solid", "dashed", "dotted", "double"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Color<input type="color" value={shape.outlineColor} onChange={(event) => updateShape("outlineColor", event.target.value)} /></label></div>
  </>;

  const renderClipPathControls = () => <>
    <div className="css-preset-buttons">{["circle", "ellipse", "inset", "diamond", "pentagon", "hexagon", "star", "chevron"].map((item) => <button key={item} className={shape.clipShape === item ? "is-active" : ""} onClick={() => updateShape("clipShape", item)}>{item}</button>)}</div>
    <label className="css-range">Inset / Round <input type="range" min="0" max="36" value={shape.clipInset} onChange={(event) => updateShape("clipInset", Number(event.target.value))} /><span>{shape.clipInset}%</span></label>
    <div className="css-field-row"><label>Fill<input type="color" value={colors[0]} onChange={(event) => setColors((current) => [event.target.value, ...current.slice(1)])} /></label><label>Accent<input type="color" value={colors[1]} onChange={(event) => setColors((current) => current.map((item, index) => index === 1 ? event.target.value : item))} /></label></div>
  </>;

  const renderTriangleControls = () => <>
    <div className="css-segmented">{(["up", "right", "down", "left"] as const).map((item) => <button key={item} className={shape.triangleDirection === item ? "is-active" : ""} onClick={() => updateShape("triangleDirection", item)}>{item}</button>)}</div>
    <label className="css-range">Width <input type="range" min="40" max="260" value={shape.triangleWidth} onChange={(event) => updateShape("triangleWidth", Number(event.target.value))} /><span>{shape.triangleWidth}px</span></label>
    <label className="css-range">Height <input type="range" min="40" max="240" value={shape.triangleHeight} onChange={(event) => updateShape("triangleHeight", Number(event.target.value))} /><span>{shape.triangleHeight}px</span></label>
    <label>Color<input type="color" value={shape.borderColor} onChange={(event) => updateShape("borderColor", event.target.value)} /></label>
  </>;

  const renderObjectFitControls = () => <>
    <div className="css-preset-buttons">{["fill", "contain", "cover", "none", "scale-down"].map((item) => <button key={item} className={shape.objectFit === item ? "is-active" : ""} onClick={() => updateShape("objectFit", item)}>{item}</button>)}</div>
    <div className="css-preset-buttons">{["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"].map((item) => <button key={item} className={shape.objectPosition === item ? "is-active" : ""} onClick={() => updateShape("objectPosition", item)}>{item}</button>)}</div>
  </>;

  const renderScrollbarControls = () => <>
    <label className="css-range">Size <input type="range" min="4" max="24" value={shape.scrollbarSize} onChange={(event) => updateShape("scrollbarSize", Number(event.target.value))} /><span>{shape.scrollbarSize}px</span></label>
    <label className="css-range">Radius <input type="range" min="0" max="999" value={shape.scrollbarRadius} onChange={(event) => updateShape("scrollbarRadius", Number(event.target.value))} /><span>{shape.scrollbarRadius}px</span></label>
    <div className="css-field-row"><label>Thumb<input type="color" value={shape.scrollbarThumb} onChange={(event) => updateShape("scrollbarThumb", event.target.value)} /></label><label>Track<input type="color" value={shape.scrollbarTrack} onChange={(event) => updateShape("scrollbarTrack", event.target.value)} /></label></div>
  </>;

  const renderShapeControls = () => active.includes("Border Generator") ? renderBorderControls() : active.includes("Outline") ? renderOutlineControls() : active.includes("Clip-path") ? renderClipPathControls() : active.includes("Triangle") ? renderTriangleControls() : active.includes("Object Fit") ? renderObjectFitControls() : active.includes("Scrollbar") ? renderScrollbarControls() : renderRadiusControls();
  const renderAnimationControls = () => active.includes("Keyframe") ? renderKeyframeAnimator() : active.includes("Transition") ? renderTransitionGenerator() : active === "CSS Transform Generator" ? renderTransformGenerator() : active.includes("3D Transform") ? renderThreeDTransform() : active.includes("Perspective") ? renderPerspectiveGenerator() : active.includes("Bezier") ? renderBezierEditor() : active.includes("Easing") ? renderEasingEditor() : active.includes("Scroll Snap") ? renderScrollSnapGenerator() : active.includes("Scroll Timeline") ? renderScrollTimelineGenerator() : active.includes("Typing") ? renderTypingEffectGenerator() : active.includes("Loader") ? renderLoaderGenerator() : renderAnimationGenerator();
  const renderShadowPreview = () => {
    const shadowValue = shadowCss(shadow).replace("box-shadow: ", "").replace(";", "");
    const textShadowValue = textShadowCss(textShadowLayers).replace("text-shadow: ", "").replace(";", "");
    const maskValue = mask.shape === "stripe" ? `linear-gradient(45deg, #000 0 ${mask.size}%, transparent ${mask.size + mask.feather}% 100%)` : mask.shape === "diamond" ? "linear-gradient(45deg, transparent 28%, #000 30% 70%, transparent 72%)" : `radial-gradient(${mask.shape === "circle" ? "circle" : "ellipse"}, #000 ${mask.size}%, transparent ${mask.size + mask.feather}%)`;
    const glassRgb = hexToRgb(glass.color);
    const neumorphismShadow = `${neumorphism.shape === "pressed" ? "inset " : ""}${neumorphism.distance}px ${neumorphism.distance}px ${neumorphism.blur}px rgba(0, 0, 0, ${(neumorphism.intensity / 100).toFixed(2)}), ${neumorphism.shape === "pressed" ? "inset " : ""}-${neumorphism.distance}px -${neumorphism.distance}px ${neumorphism.blur}px rgba(255, 255, 255, 0.75)`;
    if (active.includes("Text Shadow")) return <div className="css-text-shadow-preview" style={{ fontSize, textShadow: textShadowValue }}>{text || "Shadow"}</div>;
    if (active.includes("Glass")) return <div className="css-glass-stage"><div className="css-glass-card" style={{ background: `rgba(${glassRgb.r}, ${glassRgb.g}, ${glassRgb.b}, ${glass.opacity / 100})`, backdropFilter: `blur(${glass.blur}px) saturate(${glass.saturate}%)`, WebkitBackdropFilter: `blur(${glass.blur}px) saturate(${glass.saturate}%)`, borderRadius: glass.radius, borderWidth: glass.borderWidth, borderColor: `rgba(${glassRgb.r}, ${glassRgb.g}, ${glassRgb.b}, ${glass.borderOpacity / 100})`, filter: `brightness(${glass.brightness}%)` }}><strong>Glass Effect</strong><span>blur, opacity, border</span></div></div>;
    if (active.includes("Backdrop")) return <div className="css-backdrop-stage"><div className="css-backdrop-card" style={{ backdropFilter: filterValue(effectFilters), WebkitBackdropFilter: filterValue(effectFilters) }}>Backdrop Filter Preview</div></div>;
    if (active.includes("Neumorphism")) return <div className="css-neumorphism-stage" style={{ background: neumorphism.background }}><div className="css-neumorphism-card" style={{ width: neumorphism.size, height: neumorphism.size, borderRadius: neumorphism.radius, background: neumorphism.background, boxShadow: neumorphismShadow }}>Neumorphism</div></div>;
    if (active.includes("Blend")) return <div className="css-blend-stage" style={{ background: blend.background }}><div className={blend.target === "Circle" ? "css-blend-circle" : "css-blend-shape"} style={{ background: blend.foreground, mixBlendMode: blend.mode as CSSProperties["mixBlendMode"] }}>{blend.target === "Text Overlay" ? "Blend" : ""}</div></div>;
    if (active.includes("Mask")) return <div className="css-mask-preview"><div style={{ background: mask.color, maskImage: maskValue, WebkitMaskImage: maskValue }} /></div>;
    if (active.includes("Filter")) return <div className="css-filter-card" style={{ filter: filterValue(effectFilters) }}><strong>CSS Filters</strong><span>Live Preview</span><i /></div>;
    return <div className="css-shadow-box" style={{ boxShadow: shadowValue }}>{active.includes("Multi-Layer") ? "Layered" : "Preview Box"}</div>;
  };


  const renderLayoutPreview = () => {
    const calcValue = `calc(${layout.calcA}${layout.calcAUnit} ${layout.calcOp} ${layout.calcB}${layout.calcBUnit})`;
    const clampValue = `clamp(${layout.clampMin}${layout.clampMinUnit}, ${layout.clampPreferred}${layout.clampPreferredUnit} + ${layout.clampBase}${layout.clampBaseUnit}, ${layout.clampMax}${layout.clampMaxUnit})`;
    const itemCount = active.includes("Grid Layout") ? layout.gridColumns * layout.gridRows : active.includes("Flex") ? layout.itemCount : 6;
    if (active.includes("Columns")) return <div className="css-layout-preview css-columns-preview" style={{ columnCount: layout.columnCount, columnWidth: layout.columnWidth, columnGap: layout.columnGap, columnRule: layout.columnRule === "none" ? undefined : layout.columnRule }}>{text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Use this preview to tune readable CSS columns."}</div>;
    if (active.includes("Container") || active.includes("Media")) {
      const isContainer = active.includes("Container");
      const feature = isContainer ? layout.queryFeature : layout.mediaFeature;
      const value = isContainer ? layout.queryValue : layout.mediaValue;
      const unit = isContainer ? layout.queryUnit : layout.mediaUnit;
      const previewWidth = isContainer ? layout.queryPreviewWidth : layout.mediaPreviewWidth;
      const previewHeight = 220;
      const measured = feature.includes("height") ? previewHeight : previewWidth;
      const activeQuery = feature.startsWith("min") ? measured >= value : measured <= value;
      return <div className="css-layout-preview css-query-preview"><div className="css-query-shell" style={{ width: Math.min(previewWidth, 720) }}><div className="css-query-card"><strong>{isContainer ? "Container Content" : "Responsive Preview"}</strong><span>{feature}: {value}{unit}</span><em className={activeQuery ? "is-active" : ""}>{activeQuery ? "Active" : "Inactive"}</em></div></div></div>;
    }
    if (active.includes("Calc")) return <div className="css-layout-preview css-calc-preview"><span className="css-calc-bar" style={{ width: calcValue }}>width: {calcValue}</span></div>;
    if (active.includes("Clamp")) return <div className="css-layout-preview css-clamp-preview"><strong style={{ fontSize: clampValue }}>Responsive typography scales smoothly.</strong></div>;
    if (active.includes("Aspect")) return <div className="css-layout-preview css-aspect-preview"><div className="css-aspect-box" style={{ aspectRatio: `${layout.aspectW} / ${layout.aspectH}`, width: layout.aspectWidth }}><strong>{layout.aspectW}:{layout.aspectH}</strong><span>aspect ratio</span></div></div>;
    if (active.includes("Overflow")) return <div className="css-layout-preview css-overflow-preview"><div className="css-overflow-box" style={{ width: layout.overflowWidth, height: layout.overflowHeight, overflow: layout.overflow as CSSProperties["overflow"], overflowX: layout.overflowX as CSSProperties["overflowX"], overflowY: layout.overflowY as CSSProperties["overflowY"] }}>{(text || Array.from({ length: 12 }, (_, index) => `Line ${index + 1}: overflow preview content stays inside the preview box with a deliberately long horizontal segment ${"0123456789".repeat(8)}.`).join("\n"))}</div></div>;
    if (active.includes("Flex")) return <div className="css-layout-preview css-flex-playground" style={{ flexDirection: layout.flexDirection as CSSProperties["flexDirection"], justifyContent: layout.justifyContent, alignItems: layout.alignItems, flexWrap: layout.flexWrap as CSSProperties["flexWrap"], gap: grid.gap }}>{Array.from({ length: itemCount }, (_, index) => <span className="css-layout-item" key={index}>Item {index + 1}</span>)}</div>;
    return <div className="css-layout-preview css-grid-preview" style={{ gridTemplateColumns: active.includes("Grid Layout") ? `repeat(${layout.gridColumns}, ${layout.equalTracks ? "1fr" : "minmax(120px, 1fr)"})` : grid.columns, gridTemplateRows: active.includes("Grid Layout") ? `repeat(${layout.gridRows}, ${layout.equalTracks ? "1fr" : "auto"})` : grid.rows, gap: grid.gap, justifyItems: grid.justifyItems, alignItems: grid.alignItems, justifyContent: grid.justifyContent, alignContent: grid.alignContent }}>{Array.from({ length: itemCount }, (_, index) => <span className="css-layout-item" key={index}>Item {index + 1}</span>)}</div>;
  };

  const renderLoaderPreview = () => {
    if (animationLab.loaderStyle === "dots") return <div className="css-loader-demo css-loader-dots" style={{ color: animationLab.loaderColor, fontSize: animationLab.loaderSize / 3 }}><i /><i /><i /></div>;
    if (animationLab.loaderStyle === "bars") return <div className="css-loader-demo css-loader-bars" style={{ color: animationLab.loaderColor, height: animationLab.loaderSize }}><i /><i /><i /></div>;
    if (animationLab.loaderStyle === "pulse") return <div className="css-loader-demo css-loader-pulse" style={{ width: animationLab.loaderSize, height: animationLab.loaderSize, background: animationLab.loaderColor }} />;
    if (animationLab.loaderStyle === "bouncing") return <div className="css-loader-demo css-loader-bounce" style={{ color: animationLab.loaderColor }}><i /><i /><i /></div>;
    return <div className={`css-loader-demo ${animationLab.loaderStyle === "dual" ? "css-loader-dual" : "css-loader-ring"}`} style={{ width: animationLab.loaderSize, height: animationLab.loaderSize, borderColor: `${animationLab.loaderColor}33`, borderTopColor: animationLab.loaderColor }} />;
  };

  const renderAnimationPreview = () => {
    if (active.includes("Transition")) return <div className="css-animation-stage"><div className={`css-transition-demo ${animationLab.transitionActive ? "is-active" : ""}`} style={{ transition: `${animationLab.transitionProperty} ${animation.duration}ms ${animation.timing} ${animation.delay}ms`, background: colors[0] }}>Hover</div></div>;
    if (active === "CSS Transform Generator") return <div className="css-animation-stage"><div className="css-transform-demo" style={{ transform: transformValue, transformOrigin: `${animationLab.originX}% ${animationLab.originY}%` }}>Transform</div></div>;
    if (active.includes("3D Transform")) return <div className="css-animation-stage css-3d-stage" style={{ perspective: animationLab.perspective3d }}><div className="css-3d-demo" style={{ transform: transform3dValue }}>3D</div></div>;
    if (active.includes("Perspective")) return <div className="css-animation-stage css-3d-stage" style={{ perspective: animationLab.perspective3d, perspectiveOrigin: `${animationLab.perspectiveOriginX}% ${animationLab.perspectiveOriginY}%` }}><div className="css-3d-demo" style={{ transform: `rotateX(${animationLab.rotateX}deg) rotateY(${animationLab.rotateY}deg) translateZ(${animationLab.translateZ}px)` }}>3D Element</div></div>;
    if (active.includes("Bezier") || active.includes("Easing")) return <div className="css-animation-stage css-easing-stage"><div className="css-bezier-board"><i style={{ left: `${animationLab.bezier[0] * 100}%`, bottom: `${animationLab.bezier[1] * 100}%` }} /><i style={{ left: `${animationLab.bezier[2] * 100}%`, bottom: `${animationLab.bezier[3] * 100}%` }} /></div><div className="css-easing-track"><span style={{ animationTimingFunction: bezierValue, animationDuration: `${animation.duration}ms` }} /></div><code>{bezierValue}</code></div>;
    if (active.includes("Scroll Snap")) return <div className="css-animation-stage"><div className="css-scroll-snap-demo" style={{ scrollSnapType: `${animationLab.snapAxis} ${animationLab.snapStrictness}`, scrollPadding: `${animationLab.snapPaddingY}px ${animationLab.snapPaddingX}px`, flexDirection: animationLab.snapAxis === "y" ? "column" : "row" }}>{Array.from({ length: 6 }, (_, index) => <span key={index} style={{ scrollSnapAlign: animationLab.snapAlign, scrollMargin: `${animationLab.snapMarginY}px ${animationLab.snapMarginX}px` }}>Item {index + 1}</span>)}</div></div>;
    if (active.includes("Scroll Timeline")) return <div className="css-animation-stage"><div className="css-scroll-timeline-demo"><p>Scroll to preview timeline</p><span style={{ opacity: animationLab.timelineProperty === "opacity" ? Number(animationLab.timelineTo) || 1 : 1, transform: animationLab.timelineProperty === "scale" ? `scale(${animationLab.timelineTo})` : animationLab.timelineProperty === "rotate" ? `rotate(${animationLab.timelineTo}deg)` : animationLab.timelineProperty === "translate" ? `translateY(${animationLab.timelineTo}px)` : undefined }}>Element</span></div></div>;
    if (active.includes("Typing")) return <div className="css-animation-stage" style={{ background: animationLab.typingBackground }}><div className="css-typing-demo" style={{ fontSize, color: animationLab.typingColor, borderRightWidth: animationLab.typingCursor, borderRightColor: animationLab.typingColor, animationDuration: `${animationLab.typingDuration}ms`, width: `${Math.max(text.length, 1)}ch` }}>{text}</div></div>;
    if (active.includes("Loader")) return <div className="css-animation-stage">{renderLoaderPreview()}</div>;
    if (active.includes("Keyframe")) return <div className="css-animation-stage"><div className="css-keyframe-demo" style={{ animation: `custom-motion ${animation.duration}ms ${animation.timing} ${animation.delay}ms ${animation.iteration} ${animation.direction} ${animation.fillMode}` }}>Keyframes</div></div>;
    return <div className="css-animation-stage"><div className="css-animated-box" style={{ animation: `${animation.name} ${animation.duration}ms ${animation.timing} ${animation.delay}ms ${animation.iteration} ${animation.direction} ${animation.fillMode}` }}>{text || "Element"}</div></div>;
  };
  const renderShapePreview = () => {
    if (active.includes("Object Fit")) return <div className="css-object-fit-stage"><img alt="Object fit preview" style={{ objectFit: shape.objectFit as CSSProperties["objectFit"], objectPosition: shape.objectPosition }} src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80" /><span>object-fit: {shape.objectFit}</span></div>;
    if (active.includes("Scrollbar")) {
      const scrollbarPreviewStyle = {
        scrollbarColor: `${shape.scrollbarThumb} ${shape.scrollbarTrack}`,
        scrollbarWidth: shape.scrollbarSize <= 8 ? "thin" : "auto",
        "--scrollbar-size": `${shape.scrollbarSize}px`,
        "--scrollbar-thumb": shape.scrollbarThumb,
        "--scrollbar-track": shape.scrollbarTrack,
        "--scrollbar-radius": `${shape.scrollbarRadius}px`,
      } as CSSProperties & Record<`--${string}`, string>;
      return <div className="css-scrollbar-stage"><div style={scrollbarPreviewStyle}>{Array.from({ length: 12 }, (_, index) => <p key={index}>Scrollable content row {index + 1} keeps the preview bounded while the generated scrollbar CSS stays copy-ready.</p>)}</div></div>;
    }
    if (active.includes("Triangle")) return <div className="css-triangle-stage"><div className="css-triangle-preview" style={trianglePreviewBorder as CSSProperties} /></div>;
    if (active.includes("Clip-path")) return <div className="css-clip-stage"><div className="css-clip-preview" style={{ clipPath: shapeClipPath, WebkitClipPath: shapeClipPath, background: gradientValue("linear", angle, colors) }}><span>{shape.clipShape}</span></div></div>;
    if (active.includes("Outline")) return <div className="css-shape-card" style={{ outline: `${shape.outlineWidth}px ${shape.outlineStyle} ${shape.outlineColor}`, outlineOffset: shape.outlineOffset, borderRadius: shape.radius }}>Outline</div>;
    if (active.includes("Border Generator")) return <div className="css-shape-card" style={{ border: `${shape.borderWidth}px ${shape.borderStyle} ${shape.borderColor}`, borderRadius: shape.radius }}>Border</div>;
    return <div className="css-shape-card" style={{ borderRadius: borderRadiusCss(shapeRadius).replace("border-radius: ", "").replace(";", "") }}>Preview Box</div>;
  };
  const previewStyle = collectionId === "color-tools" ? { background: active.includes("Palette") || active.includes("Scheme") ? gradientValue("linear", 135, colors) : hex, color: foreground } : collectionId === "gradients-patterns" ? { background: active.includes("Pattern") || active.includes("Noise") ? `radial-gradient(${colors[0]} 1px, transparent 1px)` : gradientValue(active.includes("Conic") ? "conic" : active.includes("Mesh") ? "radial" : gradientType, angle, colors), backgroundSize: active.includes("Pattern") || active.includes("Noise") ? "18px 18px" : undefined } : {};  const isTextEffect = active.includes("Text Effects") || active === "CSS Text Effects";
  const typographyPreviewStyle: CSSProperties = {
    fontFamily: active.includes("Font Stack") ? fontStack.primary : fontFamily,
    fontSize: active.includes("Line Clamp") || active.includes("Text Wrap") || active.includes("Writing Mode") ? 18 : fontSize,
    fontWeight,
    letterSpacing: active.includes("Letter Spacing") ? `${letterSpacing.value}${letterSpacing.unit}` : undefined,
    whiteSpace: active.includes("Text Wrap") ? wrap.whiteSpace as CSSProperties["whiteSpace"] : undefined,
    overflow: active.includes("Text Wrap") ? (wrap.overflow === "visible" ? "visible" : "hidden") : undefined,
    textOverflow: active.includes("Text Wrap") ? wrap.overflow : undefined,
    WebkitLineClamp: active.includes("Line Clamp") ? lineClamp.lines : undefined,
    WebkitBoxOrient: active.includes("Line Clamp") ? "vertical" : undefined,
    display: active.includes("Line Clamp") ? "-webkit-box" : undefined,
    writingMode: active.includes("Writing Mode") ? writing.mode as CSSProperties["writingMode"] : undefined,
    direction: active.includes("Writing Mode") ? writing.direction : undefined,
    textOrientation: active.includes("Writing Mode") ? writing.orientation as CSSProperties["textOrientation"] : undefined,
    background: isTextEffect ? gradientValue("linear", angle, colors) : undefined,
    WebkitBackgroundClip: isTextEffect ? "text" : undefined,
    color: isTextEffect ? "transparent" : undefined,
  };

  return <section className={`css-tool-workbench css-tool-workbench--${collectionId}`} style={collectionId === "shapes-borders" ? { maxHeight: "100%", overflowY: "auto", overscrollBehavior: "contain" } : undefined}>
    <div className="data-format-tabs css-tool-tabs" role="tablist" style={{ flex: "0 0 auto", flexWrap: "wrap", overflow: "visible", overflowX: "visible", overflowY: "visible", whiteSpace: "normal" }}>{tabs[collectionId].map((name) => <button key={name} style={{ flex: "0 1 auto" }} className={active === name ? "is-active" : ""} onClick={() => setActive(name)}>{name}</button>)}</div>
    <div className="css-tool-intro"><div><h2>{activeTitle}</h2></div></div>
    <div className="css-tool-grid" style={collectionId === "shapes-borders" ? { overflow: "visible" } : undefined}>
      <div className="css-control-panel">
        {collectionId === "color-tools" ? renderColorControls() : collectionId === "gradients-patterns" ? renderGradientControls() : collectionId === "shadows-effects" ? renderShadowControls() : collectionId === "layout-tools" ? renderLayoutControls() : collectionId === "typography" ? renderTypographyControls() : collectionId === "shapes-borders" ? renderShapeControls() : renderAnimationControls()}
      </div>
      <div className="css-preview-column">
        <div className="css-tool-preview" style={previewStyle}>
          {collectionId === "shadows-effects" && renderShadowPreview()}
          {collectionId === "layout-tools" && renderLayoutPreview()}
          {collectionId === "animations" && renderAnimationPreview()}
          {collectionId === "shapes-borders" && renderShapePreview()}
          {collectionId === "typography" && <div className={active.includes("Type Scale") ? "css-type-scale-preview" : active.includes("Font-Face") ? "css-font-face-preview" : active.includes("Writing Mode") ? "css-writing-preview" : "css-typography-preview"} style={typographyPreviewStyle}><strong>{active.includes("Type Scale") ? "--text-4xl" : text}</strong><small>{active.includes("Font-Face") ? "@font-face preview" : active.includes("Writing Mode") ? "Writing mode preview" : "Typography preview"}</small></div>}
          {(collectionId === "color-tools" || collectionId === "gradients-patterns") && <div className="css-preview-card"><strong>{activeTitle}</strong><span>Preview</span></div>}
        </div>
        <div className="css-code-output"><div><strong>CSS Output</strong><button onClick={() => copy(css, setCopied)}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy Code"}</button></div><pre>{css}</pre></div>
        {collectionId === "color-tools" && <div className="css-format-grid">{Object.entries(colorData).filter(([key]) => key !== "cssVariables").map(([key, value]) => <code key={key}><span>{key.toUpperCase()}</span>{value}</code>)}</div>}
      </div>
    </div>
  </section>;
}
