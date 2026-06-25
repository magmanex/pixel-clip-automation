// #13 Resolve + validate a clip's publish metadata, write it next to the mp4.
//
// Usage: npm run meta -- <name>     <name>.meta.json → out/<name>.meta.json
//          name "video" (default) = the active video → public/scenes.meta.json
//          any other name          = a batch clip   → clips/<name>.meta.json
//        node scripts/meta.mjs --selftest
//
// Validates through the SAME metaSchema the schema file exports, so a bad sidecar
// fails here instead of at upload time. ponytail: a copy + a schema check, nothing more.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { metaSchema } from "../src/schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Where the sidecar for a given clip name lives.
const sidecarPath = (name) =>
  name === "video"
    ? join(root, "public/scenes.meta.json")
    : join(root, "clips", `${name}.meta.json`);

// Validate raw JSON text → { meta } or throws with a readable message.
function parseMeta(label, raw) {
  const r = metaSchema.safeParse(JSON.parse(raw));
  if (!r.success) {
    throw new Error(`${label}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  return r.data;
}

function selftest() {
  const ok = parseMeta("ok", JSON.stringify({ title: "Hi", tags: ["a"] }));
  console.assert(ok.title === "Hi", "valid meta parses");

  let threw = false;
  try { parseMeta("noTitle", JSON.stringify({ description: "x" })); } catch { threw = true; }
  console.assert(threw, "missing title should fail");

  threw = false;
  try { parseMeta("longTitle", JSON.stringify({ title: "x".repeat(101) })); } catch { threw = true; }
  console.assert(threw, "title over 100 chars should fail");

  console.log("selftest: ok");
}

if (process.argv.includes("--selftest")) {
  selftest();
  process.exit(0);
}

const name = process.argv[2] ?? "video";
const out = name === "video" ? "video" : name;
const src = sidecarPath(name);
if (!existsSync(src)) {
  console.error(`✗ no metadata sidecar at ${src.replace(root + "/", "")}\n  create it with at least a "title".`);
  process.exit(1);
}

const meta = parseMeta(name, readFileSync(src, "utf8"));
mkdirSync(join(root, "out"), { recursive: true });
const dest = join(root, "out", `${out}.meta.json`);
writeFileSync(dest, JSON.stringify(meta, null, 2));
console.log(`✓ ${dest.replace(root + "/", "")} — "${meta.title}"`);
