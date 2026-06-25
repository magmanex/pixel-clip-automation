// #15 One-shot pipeline: validate → render → thumb → meta → (publish).
// Fails fast on any step. Glue over the steps that already exist; #14 upload is the
// one step that needs YOUR Google OAuth, so it's a handoff, not a silent no-op.
//
// Usage: npm run ship -- <name>
//          name "video" (default) = active video  → comp "Short",       out/video.mp4
//          any other name         = a batch clip   → comp "Clip-<name>", out/<name>.mp4

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2] ?? "video";
const isActive = name === "video";
const comp = isActive ? "Short" : `Clip-${name}`;
const out = isActive ? "video" : name;
const mp4 = `out/${out}.mp4`;
const metaSrc = isActive ? "public/scenes.meta.json" : `clips/${name}.meta.json`;

const run = (cmd, env) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
};

// thumbFrame from the sidecar if present, else the thumb script's own default.
let thumbFrame;
if (existsSync(join(root, metaSrc))) {
  try { thumbFrame = JSON.parse(readFileSync(join(root, metaSrc), "utf8")).thumbFrame; } catch { /* validated later by `meta` */ }
}

run("npm run check");
run(`npx remotion render ${comp} ${mp4}`);
run(`npx remotion still ${comp} out/${out}.thumb.png --frame=${thumbFrame ?? 30}`);
run(`node --no-warnings --experimental-strip-types scripts/meta.mjs ${name}`);

// #14 publish — needs a YouTube OAuth token. Hand off instead of faking success.
const publish = join(root, "scripts/publish.mjs");
if (existsSync(publish)) {
  run(`node --no-warnings --experimental-strip-types scripts/publish.mjs ${name}`);
} else {
  console.log(`\n✓ built: ${mp4}  +  out/${out}.thumb.png  +  out/${out}.meta.json`);
  console.log(`⏭  publish (#14) not wired — upload manually, or add scripts/publish.mjs (needs Google OAuth).`);
}
