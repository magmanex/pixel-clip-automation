// #A3c character gen pipeline — local ComfyUI.
//   npm run gen:char -- <id> "<prompt>" [--emotion=happy] [--seed=N] [--dry-run]
//
// Flow: patch pipeline/workflow.api.json (prompt + style suffix + seed) → POST to ComfyUI
// /prompt → poll → download the image → quantize to palette.json (STYLE.md) → write
// public/characters/<id>-<emotion>.png. Output is a DRAFT: run the #A3d cleanup pass
// (fix eyes/hands/outline, confirm on-palette, pin identity to the char sheet) before
// treating a sprite as approved. Identity (#A3b): pass --ref of the approved char sheet
// once your workflow has an IP-Adapter image node (set refImageNodeId in config.json).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { quantize } from "./quantize.mjs";
import { cutout } from "./cutout.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.slice(2).split("="); return [k, v ?? true];
}));
const [id, prompt] = args.filter((a) => !a.startsWith("--"));

const cfg = JSON.parse(readFileSync(join(ROOT, "pipeline/config.json"), "utf8"));
const COMFY = process.env.COMFYUI_URL ?? cfg.comfyUrl ?? "http://127.0.0.1:8188"; // env wins, else jef from config
const wf = JSON.parse(readFileSync(join(ROOT, "pipeline/workflow.api.json"), "utf8"));
for (const k of Object.keys(wf)) if (k.startsWith("_")) delete wf[k]; // strip comment keys; ComfyUI treats every key as a node

// #A7 per-character prompt preset (optional sidecar). preset.prompt = stable identity,
// CLI prompt = per-gen detail; one of the two must be present.
const promptsPath = join(ROOT, "pipeline/prompts.json");
const presets = existsSync(promptsPath) ? JSON.parse(readFileSync(promptsPath, "utf8")) : {};
const preset = presets[id] ?? {};
const basePrompt = [preset.prompt, prompt].filter(Boolean).join(", ");
if (!id || !basePrompt) {
  console.error('usage: npm run gen:char -- <id> "<prompt>" [--emotion=happy] [--seed=N] [--ref=sheet.png] [--ref-weight=0.8] [--tol=32] [--keep-bg] [--dry-run]');
  console.error('   bg: npm run gen:bg   -- <id> "<prompt>" [--seed=N] [--dry-run]   (#A8: landscape scene → public/bg/<id>.png, no cutout)');
  console.error('(prompt may be "" when pipeline/prompts.json has a preset for <id>)');
  process.exit(1);
}
const emotion = flags.emotion ?? "neutral";
const isScene = !!flags.scene; // #A8 background instead of character: scene trigger, landscape, no cutout

// patch the workflow. character: identity+detail+emotion+charStyle. scene: detail+sceneStyle (no emotion).
const fullPrompt = isScene
  ? `${basePrompt}, ${cfg.sceneStyleSuffix}`
  : `${basePrompt}, ${emotion} expression, ${cfg.styleSuffix}`;
wf[cfg.promptNodeId].inputs.text = fullPrompt;
if (cfg.negativeNodeId && wf[cfg.negativeNodeId]) {
  wf[cfg.negativeNodeId].inputs.text = [
    wf[cfg.negativeNodeId].inputs.text, isScene ? cfg.sceneNegativeExtra : cfg.negativeExtra, preset.negative,
  ].filter(Boolean).join(", ");
}
if (isScene && cfg.latentNodeId && wf[cfg.latentNodeId]) {
  wf[cfg.latentNodeId].inputs.width = cfg.sceneWidth;
  wf[cfg.latentNodeId].inputs.height = cfg.sceneHeight;
}
const seed = flags.seed !== undefined ? Number(flags.seed) : Math.floor(Math.random() * 1e15);
wf[cfg.seedNodeId].inputs.seed = seed;

const quantizeHeight = isScene ? cfg.sceneQuantizeHeight : cfg.quantizeHeight;
const outPath = isScene
  ? join(ROOT, "public/bg", `${id}.png`)
  : join(ROOT, "public/characters", `${id}-${emotion}.png`);
mkdirSync(dirname(outPath), { recursive: true });

if (flags["dry-run"]) {
  console.log(`DRY RUN — would POST to ${COMFY}/prompt`);
  console.log(`prompt: ${fullPrompt}`);
  if (flags.ref) console.log(`ref: ${flags.ref} (IPAdapter ${cfg.ipadapterFile} @ ${flags["ref-weight"] ?? cfg.ipWeight})`);
  const cut = isScene || flags["keep-bg"] ? "keep-bg, " : "cutout + ";
  console.log(`seed: ${seed}  →  ${outPath} (${isScene ? `scene ${cfg.sceneWidth}×${cfg.sceneHeight}, ` : ""}${cut}quantized to ${quantizeHeight}px)`);
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// #A3b identity: upload the reference sheet to ComfyUI, then inject the IPAdapter chain
// (model loader → clip-vision loader → load image → apply) and rewire the KSampler's MODEL
// input through it. Returns nothing; mutates wf. Filenames/ids come from pipeline/config.json.
async function applyRef(wf, refPath) {
  const buf = readFileSync(refPath);
  const fd = new FormData();
  fd.append("image", new Blob([buf]), `ref-${id}.png`);
  fd.append("overwrite", "true");
  const up = await fetch(`${COMFY}/upload/image`, { method: "POST", body: fd });
  if (!up.ok) throw new Error(`ComfyUI /upload/image ${up.status}: ${await up.text()}`);
  const { name, subfolder } = await up.json();
  const imageRef = subfolder ? `${subfolder}/${name}` : name;
  const weight = flags["ref-weight"] !== undefined ? Number(flags["ref-weight"]) : cfg.ipWeight;

  wf.ip_model = { class_type: "IPAdapterModelLoader", inputs: { ipadapter_file: cfg.ipadapterFile } };
  wf.ip_clipvision = { class_type: "CLIPVisionLoader", inputs: { clip_name: cfg.clipVisionName } };
  wf[cfg.refImageNodeId] = { class_type: "LoadImage", inputs: { image: imageRef } };
  wf.ip_apply = { class_type: "IPAdapterAdvanced", inputs: {
    model: wf[cfg.seedNodeId].inputs.model, // current MODEL source (the checkpoint)
    ipadapter: ["ip_model", 0], image: [cfg.refImageNodeId, 0], clip_vision: ["ip_clipvision", 0],
    weight, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "V only",
  } };
  wf[cfg.seedNodeId].inputs.model = ["ip_apply", 0]; // route the sampler through IPAdapter
  return { imageRef, weight };
}

async function main() {
  // #A3b — pin identity to a reference sheet (must exist on the ComfyUI host's models).
  if (flags.ref) {
    const { weight } = await applyRef(wf, flags.ref);
    console.log(`ref: ${flags.ref} (IPAdapter weight ${weight})`);
  }

  // queue the job
  const q = await fetch(`${COMFY}/prompt`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: wf }),
  });
  if (!q.ok) throw new Error(`ComfyUI /prompt ${q.status}: ${await q.text()} (is ComfyUI running at ${COMFY}?)`);
  const { prompt_id } = await q.json();
  process.stdout.write(`queued ${prompt_id} `);

  // poll history for outputs
  let image;
  for (let i = 0; i < 600; i++) {
    await sleep(1000); process.stdout.write(".");
    const h = await fetch(`${COMFY}/history/${prompt_id}`).then((r) => r.json());
    const entry = h[prompt_id];
    if (entry?.outputs) {
      for (const node of Object.values(entry.outputs))
        if (node.images?.length) { image = node.images[0]; break; }
      if (image) break;
    }
  }
  if (!image) throw new Error("timed out waiting for ComfyUI output");

  // download the raw image
  const url = `${COMFY}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder ?? "")}&type=${image.type ?? "output"}`;
  const raw = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  const rawPath = join(ROOT, "pipeline", `_raw-${id}-${emotion}.png`);
  writeFileSync(rawPath, raw);
  console.log(` got ${image.filename}`);

  // #A6 cutout — knock the solid bg out to transparent BEFORE quantize. Scenes ARE the bg, so
  // they keep it (--scene implies keep-bg); characters skip only with --keep-bg.
  let quantizeSrc = rawPath;
  if (!isScene && !flags["keep-bg"]) {
    const cutPath = join(ROOT, "pipeline", `_cut-${id}-${emotion}.png`);
    const { removed } = await cutout(rawPath, cutPath, { tol: flags.tol !== undefined ? Number(flags.tol) : 32 });
    console.log(`cutout: removed ${removed} bg px`);
    quantizeSrc = cutPath;
  }

  // quantize → palette (the #A3c "kill off-palette noise" step)
  await quantize(quantizeSrc, outPath, { height: quantizeHeight });
  const where = isScene ? "Reference it as a story background (background/bgImage)." : "Then add it to public/characters.json.";
  console.log(`\n→ ${outPath}\nDRAFT. Run #A3d cleanup (on-palette, fix artifacts) before approving. ${where}`);
}

main().catch((e) => { console.error("\n" + e.message); process.exit(1); });
