// #16 Validate scene data BEFORE a 2-min render, so a bad/AI-generated JSON fails
// loud and fast instead of mid-render. Runs the SAME zod schema the renderer uses
// (src/schema.ts) — no duplicated/drifting validation. Node strips the TS types at
// load (--experimental-strip-types); zod's runtime code stays.
//
// Usage: npm run check            validate public/scenes.json + every clips/*.json
//        node scripts/check.mjs --selftest   sanity-check the validator itself
//
// ponytail: reads the schema directly instead of a CLI like ajv — zod is already a
// dependency and already the source of truth.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sceneSchema } from "../src/schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scenesArray = sceneSchema.array();

// Validate one file's contents. Returns an array of human-readable problems ([] = ok).
function validate(label, raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return [`${label}: not valid JSON — ${e.message}`];
  }
  const r = scenesArray.safeParse(json);
  if (r.success) return [];
  return r.error.issues.map((i) => `${label}: scene[${i.path.join(".")}] — ${i.message}`);
}

function selftest() {
  const ok = validate("ok", JSON.stringify([{ type: "card", durationSec: 2, title: "hi" }]));
  console.assert(ok.length === 0, "valid card should pass", ok);

  const badType = validate("badType", JSON.stringify([{ type: "nope", durationSec: 2 }]));
  console.assert(badType.length > 0, "unknown scene type should fail");

  const missing = validate("missing", JSON.stringify([{ type: "card", title: "no duration" }]));
  console.assert(missing.length > 0, "missing durationSec should fail");

  const notArray = validate("notArray", JSON.stringify({ type: "card", durationSec: 2, title: "x" }));
  console.assert(notArray.length > 0, "non-array root should fail");

  const badJson = validate("badJson", "{ not json");
  console.assert(badJson.length > 0, "malformed JSON should fail");

  console.log("selftest: ok");
}

if (process.argv.includes("--selftest")) {
  selftest();
  process.exit(0);
}

// Real run: scenes.json + all batch clips.
const files = [
  join(root, "public/scenes.json"),
  ...readdirSync(join(root, "clips"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(root, "clips", f)),
];

let problems = [];
for (const f of files) {
  const label = f.replace(root + "/", "");
  problems = problems.concat(validate(label, readFileSync(f, "utf8")));
}

if (problems.length) {
  console.error("✗ scene validation failed:\n" + problems.map((p) => "  " + p).join("\n"));
  process.exit(1);
}
console.log(`✓ ${files.length} scene file(s) valid`);
