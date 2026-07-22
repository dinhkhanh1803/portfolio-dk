import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hexToRgb, rgbToHex, colorFormats, contrastRatio, gradientCss, shadowCss, gridCss, animationCss, typeScaleCss, fontFaceCss, fontStackCss, lineClampCss, letterSpacingCss, textWrapCss, writingModeCss, textEffectCss, textShadowCss, glassmorphismCss, backdropFilterCss, filterCss, neumorphismCss, mixBlendCss, maskCss, borderRadiusCss, borderCss, outlineCss, clipPathCss, triangleCss, objectFitCss, scrollbarCss } from "../app/tools/css-tools-engine.ts";

test("CSS color engine converts formats and contrast", () => {
  assert.deepEqual(hexToRgb("#3b82f6"), { r: 59, g: 130, b: 246 });
  assert.equal(rgbToHex(59, 130, 246), "#3b82f6");
  assert.equal(colorFormats("#3b82f6").rgb, "59, 130, 246");
  assert.ok(contrastRatio("#000000", "#ffffff") >= 21);
});

test("CSS generators create gradients, shadows, grids, and animations", () => {
  assert.match(gradientCss("linear", 135, ["#ff6b6b", "#ffd93d", "#6bcb77"]), /linear-gradient\(135deg/);
  assert.equal(shadowCss({ x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 10, inset: false }), "box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.10);");
  assert.match(gridCss({ columns: "repeat(3, 1fr)", rows: "auto", gap: 16, justifyItems: "start", alignItems: "stretch", justifyContent: "start", alignContent: "stretch" }), /grid-template-columns: repeat\(3, 1fr\)/);
  assert.match(animationCss({ name: "fadeIn", duration: 1000, delay: 0, timing: "ease", iteration: "1", direction: "normal", fillMode: "none" }), /@keyframes fadeIn/);
});


test("CSS typography generators create copy-ready CSS", () => {
  assert.match(typeScaleCss(16, 1.25, 6, 2, "rem"), /--text-4xl: 3\.815rem/);
  assert.match(fontFaceCss({ family: "MyFont", weight: "400", style: "normal", display: "swap", urls: { woff2: "https://example.com/font.woff2", woff: "https://example.com/font.woff" }, unicodeRange: "U+0025-00FF" }), /@font-face/);
  assert.match(fontStackCss("Inter", "sans-serif", true), /font-family: Inter, -apple-system, BlinkMacSystemFont/);
  assert.match(lineClampCss(3, true), /-webkit-line-clamp: 3/);
  assert.equal(letterSpacingCss(2, "px"), "letter-spacing: 2px;");
  assert.match(textWrapCss("pre-wrap", "ellipsis", 350, 1.5), /white-space: pre-wrap/);
  assert.match(writingModeCss("vertical-rl", "rtl", "upright"), /writing-mode: vertical-rl/);
  assert.match(textEffectCss("glitch", "DK Tools", 64, 700, "system-ui", 135, ["#667eea", "#764ba2"]), /text-shadow/);
});

test("CSS shadow and effects generators create dedicated copy-ready CSS", () => {
  assert.equal(textShadowCss([{ x: 0, y: 0, blur: 8, color: "#00e5ff" }, { x: 0, y: 0, blur: 20, color: "#0088ff" }]), "text-shadow: 0px 0px 8px #00e5ff, 0px 0px 20px #0088ff;");
  assert.match(glassmorphismCss({ blur: 20, opacity: 40, radius: 16, borderWidth: 1, borderOpacity: 50, color: "#ffffff", saturate: 180, brightness: 95 }), /backdrop-filter: blur\(20px\) saturate\(180%\)/);
  assert.match(backdropFilterCss({ blur: 5, brightness: 100, contrast: 110, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100, saturate: 100, sepia: 0 }), /backdrop-filter: blur\(5px\) brightness\(100%\) contrast\(110%\)/);
  assert.match(filterCss({ blur: 2, brightness: 120, contrast: 100, grayscale: 0, hueRotate: 15, invert: 0, opacity: 100, saturate: 130, sepia: 0 }), /filter: blur\(2px\) brightness\(120%\).*hue-rotate\(15deg\)/);
  assert.match(neumorphismCss({ background: "#e0e5ec", distance: 12, blur: 24, intensity: 15, radius: 20, size: 200, shape: "flat" }), /box-shadow: 12px 12px 24px/);
  assert.match(mixBlendCss("difference", "#ae6565", "#5c901d"), /mix-blend-mode: difference/);
  assert.match(maskCss("circle", 58, 2, "#8b5cf6"), /mask-image: radial-gradient\(circle/);
});
test("CSS tools workbench exposes all requested CSS groups with visual preview contracts", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const label of ["Color Format Converter", "CSS Gradient Generator", "Box Shadow Generator", "CSS Grid Generator", "CSS Animation Generator"]) assert.match(workbench, new RegExp(label));
  for (const klass of ["css-tool-workbench", "css-tool-preview", "css-code-output", "css-control-panel"]) assert.match(workbench, new RegExp(klass));
});
test("CSS tools workbench derives output from the active tab instead of collection only", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  assert.match(workbench, /active\.includes\("Name"\)/);
  assert.match(workbench, /active\.includes\("Border"\)/);
  assert.match(workbench, /active\.includes\("Glass"\)/);
  assert.match(workbench, /active\.includes\("Flex"\)/);
  assert.match(workbench, /active\.includes\("Typing"\)/);
});
test("Color tools implement dedicated workflows for each color tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const token of ["renderColorFormat", "renderColorNameFinder", "renderImageColorPicker", "renderContrastChecker", "renderContrastGrid", "renderPaletteAi", "renderSchemeGenerator"]) {
    assert.match(workbench, new RegExp(token));
  }
  assert.match(workbench, /type=\"file\"/);
  assert.match(workbench, /css-contrast-grid/);
  assert.match(workbench, /css-palette-cards/);
  assert.match(workbench, /css-upload-zone/);
});
test("Gradient tools implement dedicated workflows for every gradient and pattern tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const token of ["renderGradientGenerator", "renderConicGradient", "renderGradientMesh", "renderGradientBorder", "renderGradientText", "renderBackgroundPattern", "renderSvgPattern", "renderNoiseGenerator", "renderBlobGenerator"]) {
    assert.match(workbench, new RegExp(token));
  }
  assert.match(workbench, /css-mesh-preview/);
  assert.match(workbench, /css-blob-preview/);
  assert.match(workbench, /css-svg-export/);
});

test("Shadow and effects tools implement dedicated workflows for every tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const token of ["renderBoxShadow", "renderTextShadow", "renderMultiLayerShadow", "renderGlassmorphism", "renderBackdropFilter", "renderNeumorphism", "renderMixBlendMode", "renderMaskGenerator", "renderFilterGenerator"]) {
    assert.match(workbench, new RegExp(token));
  }
  for (const klass of ["css-neumorphism-stage", "css-filter-card", "css-blend-stage", "css-glass-card", "css-mask-preview", "css-text-shadow-preview"]) {
    assert.match(workbench, new RegExp(klass));
  }
});
test("CSS tools layout avoids fixed minimum columns that overflow the detail panel", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS tools overflow guard/);
  assert.match(css, /\.tools-main\.is-detail \.css-tool-grid\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.doesNotMatch(css, /css-tool-grid\{[^}]*minmax\(360px/);
});

test("Tools page routes CSS collections to dedicated CSS workbench and keeps UTF-8 copy", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /import CssToolsWorkbench from "\.\/css-tools-workbench";/);
  for (const id of ["color-tools", "gradients-patterns", "shadows-effects", "layout-tools", "animations", "typography", "shapes-borders"]) assert.match(page, new RegExp(`activeCollection\\.id === "${id}"`));
  assert.match(page, /L\u1ecdc c\u00f4ng c\u1ee5/);
  assert.doesNotMatch(page, /\u00c3\u0192|\u00c3\u201a|\u00c2|\u00e2\u20ac/);
});
test("Typography tools implement dedicated workflows for every tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  for (const label of ["CSS Text Effects", "CSS Type Scale Generator", "CSS Font-Face Generator", "CSS Font Stack Generator", "CSS Line Clamp Generator", "CSS Letter Spacing Generator", "Text Wrap Generator", "CSS Writing Mode Generator"]) {
    assert.match(workbench, new RegExp(label));
    assert.match(page, new RegExp(label));
  }
  for (const token of ["renderTextEffects", "renderTypeScale", "renderFontFace", "renderFontStack", "renderLineClamp", "renderLetterSpacing", "renderTextWrap", "renderWritingMode"]) {
    assert.match(workbench, new RegExp(token));
  }
  assert.match(page, /activeCollection\.id === "typography"/);
  assert.match(workbench, /css-type-scale-preview/);
  assert.match(workbench, /css-font-face-preview/);
  assert.match(workbench, /css-writing-preview/);
});



test("Animation tools implement dedicated workflows and live previews for every tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const token of ["renderAnimationGenerator", "renderKeyframeAnimator", "renderTransitionGenerator", "renderTransformGenerator", "renderThreeDTransform", "renderPerspectiveGenerator", "renderBezierEditor", "renderEasingEditor", "renderScrollSnapGenerator", "renderScrollTimelineGenerator", "renderTypingEffectGenerator", "renderLoaderGenerator", "renderAnimationPreview"]) {
    assert.match(workbench, new RegExp(token));
  }
  for (const token of ["animationLab", "bezierValue", "transformValue", "typingEffectCss", "loaderCss", "scroll-snap-type", "animation-timeline"]) {
    assert.match(workbench, new RegExp(token));
  }
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  for (const klass of ["css-animation-stage", "css-transition-demo", "css-transform-demo", "css-3d-demo", "css-bezier-board", "css-scroll-snap-demo", "css-scroll-timeline-demo", "css-typing-demo", "css-loader-demo"]) {
    assert.match(css, new RegExp(klass));
  }
});
test("Layout tools implement dedicated workflows and bounded previews for every tab", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  for (const token of ["renderGridGenerator", "renderGridLayoutBuilder", "renderFlexboxGenerator", "renderFlexPlayground", "renderColumnsGenerator", "renderContainerQuery", "renderMediaQuery", "renderCalcGenerator", "renderClampGenerator", "renderAspectRatio", "renderOverflowGenerator", "renderLayoutPreview"]) {
    assert.match(workbench, new RegExp(token));
  }
  for (const klass of ["css-layout-preview", "css-flex-playground", "css-columns-preview", "css-query-preview", "css-calc-preview", "css-clamp-preview", "css-aspect-preview", "css-overflow-preview"]) {
    assert.match(workbench, new RegExp(klass));
  }
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS layout tools dedicated previews/);
  assert.match(css, /\.css-overflow-preview\{[^}]*overflow:hidden/);
  assert.match(css, /\.css-overflow-box\{[^}]*max-height:100%/);
});
test("Shadow effect controls keep long range labels and color inputs from overlapping", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS shadow controls overlap guard/);
  assert.match(css, /\.tools-main\.is-detail \.css-range\{[^}]*grid-template-columns:minmax\(92px,auto\) minmax\(0,1fr\) minmax\(44px,auto\)/);
  assert.match(css, /\.css-control-panel input\[type=color\]\{[^}]*height:34px/);
  assert.match(css, /\.css-control-panel input\[type=color\]\{[^}]*padding:2px/);
});
test("detail pages use wrapped tabs instead of horizontal tab scrolling", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /Tools detail compact wrapped tabs/);
  assert.match(css, /\.tools-main\.is-detail \.tools-detail-header\{display:none\}/);
  assert.match(css, /\.tools-main\.is-detail :is\(\.data-format-tabs,\.encoding-tabs,\.crypto-tabs,\.css-tool-tabs,\.tool-tabs\)\{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.tools-main\.is-detail :is\(\.data-format-tabs,\.encoding-tabs,\.crypto-tabs,\.css-tool-tabs,\.tool-tabs\)\{[^}]*overflow-x:visible/);
  assert.match(css, /\.tools-main\.is-detail :is\(\.data-format-tabs,\.encoding-tabs,\.crypto-tabs,\.css-tool-tabs,\.tool-tabs\) button\{[^}]*flex:0 1 auto/);
});
test("CSS tool tabs force wrapped layout inline and detail header is not rendered", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(workbench, /style=\{\{ flex: "0 0 auto", flexWrap: "wrap", overflow: "visible", overflowX: "visible", overflowY: "visible", whiteSpace: "normal" \}\}/);
  assert.match(workbench, /style=\{\{ flex: "0 1 auto" \}\}/);
  assert.doesNotMatch(page, /<header className="tools-detail-header">/);
  assert.match(page, /className="tools-breadcrumb"/);
  assert.doesNotMatch(page, /<h1>\{activeCollection\.label\}<\/h1>/);
});
test("detail pages keep the original breadcrumb style while removing the large header", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /<div className="tools-breadcrumb"/);
  assert.match(page, /<strong>\{currentTool\}<\/strong>/);
  assert.doesNotMatch(page, /<header className="tools-detail-header">/);
  assert.match(css, /Tools detail mini breadcrumb/);
  assert.match(css, /\.tools-mini-breadcrumb\{[^}]*display:flex/);
});


test("CSS shapes and borders engine creates copy-ready CSS", () => {
  assert.equal(borderRadiusCss({ topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16, unit: "px" }), "border-radius: 16px 16px 16px 16px;");
  assert.match(borderCss({ width: 3, style: "dashed", color: "#3b82f6", radius: 12 }), /border: 3px dashed #3b82f6/);
  assert.match(outlineCss({ width: 2, style: "solid", color: "#f97316", offset: 6 }), /outline-offset: 6px/);
  assert.match(clipPathCss("hexagon", 12), /polygon\(25% 5%/);
  assert.match(triangleCss({ direction: "up", width: 120, height: 96, color: "#3b82f6" }), /border-bottom: 96px solid #3b82f6/);
  assert.equal(objectFitCss("cover", "center"), "object-fit: cover;\nobject-position: center;");
  assert.match(scrollbarCss({ size: 12, thumb: "#3b82f6", track: "#e5e7eb", radius: 999 }), /::-webkit-scrollbar-thumb/);
});

test("Shapes and borders tools implement dedicated workflows and bounded previews", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  for (const label of ["Border Radius Generator", "CSS Border Generator", "CSS Outline Generator", "Clip-path Generator", "CSS Clip-path Shapes", "CSS Triangle Generator", "CSS Object Fit Generator", "CSS Scrollbar Generator"]) {
    assert.match(workbench, new RegExp(label));
    assert.match(page, new RegExp(label));
  }
  for (const token of ["renderRadiusControls", "renderBorderControls", "renderOutlineControls", "renderClipPathControls", "renderTriangleControls", "renderObjectFitControls", "renderScrollbarControls", "renderShapePreview"]) assert.match(workbench, new RegExp(token));
  assert.match(workbench, /collectionId === "shapes-borders" \? \{ maxHeight: "100%", overflowY: "auto"/);
  assert.match(workbench, /collectionId === "shapes-borders" \? \{ overflow: "visible" \}/);
  assert.match(workbench, /style=\{\{ flex: "0 0 auto", flexWrap: "wrap"/);
  for (const klass of ["css-shape-card", "css-clip-stage", "css-triangle-stage", "css-object-fit-stage", "css-scrollbar-stage"]) assert.match(workbench, new RegExp(klass));
  assert.match(page, /activeCollection\.id === "shapes-borders"/);
});

test("Shapes and borders stylesheet keeps object fit and scrollbar previews bounded", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS shapes and borders dedicated previews/);
  assert.match(css, /\.css-object-fit-stage img\{[^}]*height:300px/);
  assert.match(css, /\.css-scrollbar-stage>div\{[^}]*max-height:230px/);
  assert.match(css, /\.css-scrollbar-stage>div::\-webkit-scrollbar/);
  assert.match(css, /:has\(\.css-tool-workbench--shapes-borders\)\{overflow-y:auto/);
  assert.match(css, /css-tool-workbench--shapes-borders \.css-tool-tabs\{display:grid!important;grid-template-columns:repeat\(4,minmax\(0,1fr\)\);flex:0 0 auto!important/);
  assert.match(css, /@media\(max-width:900px\)\{\.tools-main\.is-detail \.css-tool-workbench--shapes-borders \.css-tool-tabs\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});


test("CSS component generators implement all eight dedicated workflows", () => {
  const workbench = readFileSync(resolve("app/tools/css-tools-workbench.tsx"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  for (const label of ["CSS Button Generator", "CSS Neon Button Generator", "CSS Card Generator", "CSS Tooltip Generator", "CSS Toggle Switch", "CSS Cursor Generator", "CSS Pointer Events Generator", "CSS Accent Color Generator"]) {
    assert.match(workbench, new RegExp(label));
    assert.match(page, new RegExp(label));
  }
  for (const token of ["renderButtonGenerator", "renderNeonButton", "renderCardGenerator", "renderTooltipGenerator", "renderToggleSwitch", "renderCursorGenerator", "renderPointerEvents", "renderAccentColor", "renderComponentPreview"]) assert.match(workbench, new RegExp(token));
  assert.match(page, /activeCollection\.id === "component-generators"/);
});
test("CSS component generator previews stay responsive and bounded", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS component generator previews/);
  for (const klass of ["css-component-button-preview", "css-neon-button-preview", "css-component-card-preview", "css-tooltip-stage", "css-toggle-stage", "css-cursor-grid", "css-pointer-stage", "css-accent-preview"]) assert.match(css, new RegExp(klass));
  assert.match(css, /\.css-cursor-grid\{[^}]*grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\)/);
  assert.match(css, /\.css-component-stage\{[^}]*overflow:hidden/);
});
test("CSS Utilities implements five dedicated interactive tools", () => {
  const utilities = readFileSync(resolve("app/tools/css-utilities-workbench.tsx"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  for (const label of ["CSS Variable Generator", "CSS @supports Generator", "CSS Specificity Calculator", "CSS Box Model Visualizer", "Tailwind Config Generator"]) { assert.ok(utilities.includes(label)); assert.ok(page.includes(label)); }
  for (const token of ["renderVariableGenerator", "renderSupportsGenerator", "renderSpecificityCalculator", "renderBoxModelVisualizer", "renderTailwindConfigGenerator", "renderUtilitiesPreview", "specificityRows", "tailwindConfigOutput"]) assert.ok(utilities.includes(token));
  assert.match(page, /activeCollection\.id === "css-utilities"/);
});
test("CSS Utilities stylesheet keeps dense editors responsive and bounded", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /CSS utilities dedicated previews/);
  for (const klass of ["css-variables-preview", "css-specificity-list", "css-box-model-stage", "css-tailwind-preview", "css-supports-preview"]) assert.ok(css.includes(klass));
  assert.match(css, /\.css-box-model-stage\{[^}]*overflow:auto/);
  assert.match(css, /\.css-specificity-list\{[^}]*overflow:auto/);
  assert.match(css, /css-tool-workbench--css-utilities/);
});
test("CSS Box Model preview separates its legend from thin nested layers", () => {
  const utilities = readFileSync(resolve("app/tools/css-utilities-workbench.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(utilities, /className="css-box-model-legend"/);
  assert.match(utilities, /className="css-box-diagram"/);
  for (const layer of ["margin", "border", "padding", "content"]) assert.ok(utilities.includes('className="is-' + layer + '"'));
  assert.match(css, /\.css-box-model-legend\{[^}]*display:flex;[^}]*flex-wrap:wrap/);
  assert.match(css, /\.css-box-diagram\{[^}]*min-width:max-content/);
  assert.doesNotMatch(css, /\.css-box-model-stage span\{position:absolute/);
});
test("Tailwind config generator exposes expanded design tokens", () => {
  const utilities = readFileSync(resolve("app/tools/css-utilities-workbench.tsx"), "utf8");
  for (const group of ["fontSize", "spacing", "borderRadius", "boxShadow", "breakpoints"]) assert.ok(utilities.includes(group));
  for (const color of ["primary", "secondary", "accent", "neutral", "success", "warning", "danger", "info"]) assert.ok(utilities.includes(color));
  for (const breakpoint of ["sm", "md", "lg", "xl", "2xl"]) assert.ok(utilities.includes(breakpoint));
  assert.match(utilities, /className="css-tailwind-token-grid"/);
  assert.match(utilities, /is-tailwind-config/);
});
test("Tailwind generated config fills the available right column", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  assert.match(css, /\.css-tool-grid\.is-tailwind-config\{[^}]*align-items:stretch/);
  assert.match(css, /\.is-tailwind-config \.css-preview-column\{[^}]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(css, /\.is-tailwind-config \.css-code-output\{[^}]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(css, /\.is-tailwind-config \.css-code-output pre\{[^}]*max-height:none;[^}]*height:100%/);
  assert.match(css, /\.css-tailwind-token-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});test("desktop tool detail scrollbar stays inside the rounded panel", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /className="tools-detail-scroll"/);
  assert.match(css, /Detail workbench scrollbar stays inset inside the rounded panel/);
  assert.match(css, /@media\(min-width:761px\)\{\.is-tool-detail \.tools-main\.is-detail\{overflow:hidden\}\.is-tool-detail \.tools-main\{grid-template-rows:minmax\(0,1fr\)\}\.tools-detail-scroll\{[^}]*overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable/);
  assert.match(css, /\.tools-detail-scroll::-webkit-scrollbar\{width:10px\}/);
  assert.match(css, /\.tools-detail-scroll::-webkit-scrollbar-thumb\{[^}]*border-radius:999px/);
  assert.doesNotMatch(css, /Detail workbenches share one vertical scrolling contract/);
});
