import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cssToTailwind,
  curlToFetch,
  dockerRunToCompose,
  figmaTokensToCss,
  htmlToJsx,
  jsonToGoStruct,
  jsonToTypeScript,
  jsonToZodSchema,
  sqlToTypeScript,
  svgToJsx,
} from "../app/tools/code-converter-engine.ts";

test("Code converter engine generates TypeScript, Zod, and Go from JSON", () => {
  const input = '{"id":1,"name":"Lan","active":true,"tags":["dev"],"profile":{"score":10}}';
  assert.match(jsonToTypeScript(input, "User"), /export interface User/);
  assert.match(jsonToTypeScript(input, "User"), /profile: UserProfile;/);
  assert.match(jsonToZodSchema(input, "User"), /export const UserSchema = z\.object/);
  assert.match(jsonToZodSchema(input, "User"), /tags: z\.array\(z\.string\(\)\)/);
  assert.match(jsonToGoStruct(input, "User"), /type User struct/);
  assert.match(jsonToGoStruct(input, "User"), /Profile UserProfile `json:"profile"`/);
});

test("Code converter engine converts SQL, HTML, SVG, and CSS", () => {
  const sql = "CREATE TABLE users (id integer primary key, email varchar(255) not null, active boolean, created_at timestamp);";
  assert.match(sqlToTypeScript(sql, "User"), /export interface User/);
  assert.match(sqlToTypeScript(sql, "User"), /email: string;/);
  assert.match(sqlToTypeScript(sql, "User"), /active\?: boolean;/);
  assert.match(htmlToJsx('<label class="field" for="email"><input tabindex="1" readonly></label>'), /className="field"/);
  assert.match(htmlToJsx('<label class="field" for="email"><input tabindex="1" readonly></label>'), /htmlFor="email"/);
  assert.match(svgToJsx('<svg stroke-width="2" fill-rule="evenodd"></svg>'), /strokeWidth="2"/);
  assert.match(svgToJsx('<svg stroke-width="2" fill-rule="evenodd"></svg>'), /fillRule="evenodd"/);
  assert.equal(cssToTailwind("display: flex; align-items: center; justify-content: space-between; padding: 1rem; color: #ffffff;"), "flex items-center justify-between p-4 text-white");
});

test("Code converter engine converts curl, docker run, and Figma tokens", () => {
  const fetchCode = curlToFetch("curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"Lan\"}'");
  assert.match(fetchCode, /fetch\("https:\/\/api\.example\.com\/users"/);
  assert.match(fetchCode, /method: "POST"/);
  assert.match(fetchCode, /"Content-Type": "application\/json"/);

  const compose = dockerRunToCompose("docker run -d --name web -p 8080:80 -e NODE_ENV=production nginx:alpine");
  assert.match(compose, /services:/);
  assert.match(compose, /web:/);
  assert.match(compose, /- "8080:80"/);
  assert.match(compose, /NODE_ENV: "production"/);

  const tokens = figmaTokensToCss('{"color":{"primary":{"value":"#147d7a"}},"spacing":{"md":{"value":"16px"}}}');
  assert.match(tokens, /--color-primary: #147d7a;/);
  assert.match(tokens, /--spacing-md: 16px;/);
});

test("Code converter workbench exposes all code converter tabs with raw samples", () => {
  const workbench = readFileSync(resolve("app/tools/code-converter-workbench.tsx"), "utf8");
  for (const label of ["JSON to TypeScript", "JSON to Zod Schema", "JSON to Go Struct", "SQL to TypeScript", "HTML to JSX", "SVG to JSX", "CSS to Tailwind", "cURL to Fetch", "Docker Run to Compose", "Figma Token Converter"]) {
    assert.match(workbench, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(workbench, /sample: string/);
  assert.match(workbench, /useState<CodeMode>\(tabs\[0\]!\.id\)/);
  assert.match(workbench, /setInput\(nextTab\.sample\)/);
});

test("Tools page routes code converters to dedicated workbench and keeps UTF-8 copy", () => {
  const page = readFileSync(resolve("app/tools/page.tsx"), "utf8");
  assert.match(page, /import CodeConverterWorkbench from "\.\/code-converter-workbench";/);
  assert.match(page, /activeCollection\.id === "code-converters" \? <CodeConverterWorkbench \/>/);
  assert.match(page, /"Docker Run to Compose"/);
  assert.match(page, /"Figma Token Converter"/);
  assert.match(page, /filter: "Lọc công cụ\.\.\."/);
  assert.doesNotMatch(page, /Ã|Â|â€|âŒ|á»|áº|Æ/);
});