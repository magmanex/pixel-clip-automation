// Pixel-art post-process: downscale to the style's virtual grid (nearest-neighbor) and
// snap every pixel to the master palette (palette.json) — STYLE.md #A3c step "pixelate +
// quantize", the step that kills an AI image's off-palette noise. Provider-independent;
// run it on any source PNG (ComfyUI output, a commission, anything).
//
//   node scripts/quantize.mjs <in.png> <out.png> [--height=192]
//   node scripts/quantize.mjs --selftest
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// flatten palette.json (skip "_" meta keys) into a flat [r,g,b][] list.
export const loadPalette = (file = join(ROOT, "palette.json")) => {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const out = [];
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_") || !Array.isArray(v)) continue;
    for (const hex of v) out.push(hexToRgb(hex));
  }
  return out;
};

// nearest palette color by squared euclidean distance in RGB.
export const nearest = (r, g, b, palette) => {
  let best = palette[0], bestD = Infinity;
  for (const c of palette) {
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
};

export async function quantize(input, output, { height = 192, palette = loadPalette() } = {}) {
  // nearest-neighbor downscale to the virtual grid (coarse pixels), keep alpha.
  const img = sharp(input).resize({ height, kernel: "nearest", fit: "inside" }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // 4 (RGBA)
  for (let i = 0; i < data.length; i += ch) {
    if (data[i + 3] < 128) { data[i + 3] = 0; continue; } // transparent stays transparent
    const [r, g, b] = nearest(data[i], data[i + 1], data[i + 2], palette);
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png().toFile(output);
  return { width: info.width, height: info.height };
}

async function selftest() {
  const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
  // a color closest to red must snap to exactly red.
  const got = nearest(240, 12, 8, palette);
  if (got.join() !== "255,0,0") throw new Error(`nearest failed: ${got}`);
  // off-palette grey snaps to the closest of the three primaries (green here is nearest to 100,150,100).
  const g2 = nearest(100, 150, 100, palette);
  if (g2.join() !== "0,255,0") throw new Error(`nearest failed2: ${g2}`);
  // palette.json loads and is non-empty.
  const p = loadPalette();
  if (p.length < 10) throw new Error(`palette too small: ${p.length}`);
  console.log(`ok — ${p.length} palette colors, nearest() correct`);
}

// CLI — only when run directly, not when imported (e.g. by gen-char.mjs).
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === "--selftest") {
    selftest().catch((e) => { console.error(e.message); process.exit(1); });
  } else if (args.filter((a) => !a.startsWith("--")).length >= 2) {
    const [inp, out] = args.filter((a) => !a.startsWith("--"));
    const h = Number((args.find((a) => a.startsWith("--height=")) || "=192").split("=")[1]);
    quantize(inp, out, { height: h }).then((d) =>
      console.log(`quantized → ${out} (${d.width}×${d.height}). DRAFT — run #A3d cleanup before approving.`),
    ).catch((e) => { console.error(e.message); process.exit(1); });
  } else {
    console.log("usage: node scripts/quantize.mjs <in.png> <out.png> [--height=192] | --selftest");
  }
}
