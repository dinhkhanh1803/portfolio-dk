import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { transformSync } from "next/dist/build/swc/index.js";

const cssModuleUrl = `data:text/javascript,${encodeURIComponent(`
const styles = new Proxy({}, { get: (_target, key) => String(key) });
export default styles;
`)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith(".module.css")) {
      return { shortCircuit: true, url: cssModuleUrl };
    }

    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const unresolved = new URL(specifier, context.parentURL);
      if (!extname(fileURLToPath(unresolved))) {
        for (const suffix of [".ts", ".tsx", ".js", ".mjs"]) {
          const candidate = `${fileURLToPath(unresolved)}${suffix}`;
          if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
        }
      }
    }

    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const filename = fileURLToPath(url);
      const source = readFileSync(filename, "utf8");
      const transformed = transformSync(source, {
        filename,
        jsc: {
          parser: { syntax: "typescript", tsx: url.endsWith(".tsx") },
          target: "es2022",
          transform: { react: { runtime: "automatic" } },
        },
        module: { type: "es6" },
        sourceMaps: false,
      });
      return { format: "module", shortCircuit: true, source: transformed.code };
    }

    return nextLoad(url, context);
  },
});
