// #A6 background cutout — SD paints the character on a SOLID bg; this knocks that bg out
// to transparent so sprites drop into story/split/chat scenes with no bg box. Runs BEFORE
// quantize (quantize already passes alpha<128 → transparent through, so once the bg is gone
// the rest of the pipeline just works).
//
// Method: border-seeded flood fill. Reference bg color = the most common border pixel; flood
// from every border pixel, including a neighbor only if it's within `tol` of that reference.
// Connectivity-from-the-edge means character-interior pixels that happen to match the bg color
// are NOT eaten (they aren't reachable from the border without crossing the outline).
// ponytail: solid-bg chroma-key, not ML. If gens ever get busy/scene backgrounds, swap in rembg.
//
//   node scripts/cutout.mjs <in.png> <out.png> [--tol=32]
//   node scripts/cutout.mjs --selftest
import sharp from "sharp";

const dist2 = (d, i, r, g, b) => (d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2;

export async function cutout(input, output, { tol = 32 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info; // ch === 4
  const removed = removeBg(data, w, h, ch, tol);
  await sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toFile(output);
  return { width: w, height: h, removed };
}

// In-place: set alpha=0 on every border-connected pixel within `tol` of the reference bg color.
// Returns the count of pixels cleared. Exported for the self-check.
export function removeBg(data, w, h, ch, tol) {
  const idx = (x, y) => (y * w + x) * ch;

  // reference bg = most common color among border pixels (quantized to 16-steps so near-dupes group).
  const counts = new Map();
  const key = (i) => ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
  const border = [];
  for (let x = 0; x < w; x++) { border.push(idx(x, 0)); border.push(idx(x, h - 1)); }
  for (let y = 0; y < h; y++) { border.push(idx(0, y)); border.push(idx(w - 1, y)); }
  let bestK = 0, bestN = -1, refI = border[0];
  for (const i of border) { const k = key(i); const n = (counts.get(k) ?? 0) + 1; counts.set(k, n); if (n > bestN) { bestN = n; bestK = k; refI = i; } }
  const [rr, rg, rb] = [data[refI], data[refI + 1], data[refI + 2]];
  const tol2 = tol * tol;

  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x; if (seen[p]) return; seen[p] = 1;
    if (dist2(data, p * ch, rr, rg, rb) <= tol2) stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  let removed = 0;
  while (stack.length) {
    const p = stack.pop();
    data[p * ch + 3] = 0; removed++;
    const x = p % w, y = (p / w) | 0;
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }
  void bestK;
  return removed;
}

async function selftest() {
  // 5×5: green bg, a 3×3 red block centered. The center red pixel shares NO color with bg,
  // but also embed a single bg-colored pixel INSIDE the block — it must survive (not edge-reachable).
  const w = 5, h = 5, ch = 4;
  const d = new Uint8Array(w * h * ch);
  const set = (x, y, r, g, b) => { const i = (y * w + x) * ch; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, 0, 200, 0); // green everywhere
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) set(x, y, 200, 0, 0); // red block
  set(2, 2, 0, 200, 0); // a green pixel trapped inside the red block

  const removed = removeBg(d, w, h, ch, 32);
  const alpha = (x, y) => d[(y * w + x) * ch + 3];
  if (alpha(0, 0) !== 0) throw new Error("border bg not removed");
  if (alpha(1, 1) !== 255) throw new Error("character pixel was eaten");
  if (alpha(2, 2) !== 255) throw new Error("trapped interior bg-colored pixel was eaten (connectivity broken)");
  if (removed !== w * h - 9) throw new Error(`expected ${w * h - 9} bg pixels removed, got ${removed}`);
  console.log(`ok — removed ${removed} bg pixels, kept the 3×3 character incl. trapped interior pixel`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === "--selftest") {
    selftest().catch((e) => { console.error(e.message); process.exit(1); });
  } else if (args.filter((a) => !a.startsWith("--")).length >= 2) {
    const [inp, out] = args.filter((a) => !a.startsWith("--"));
    const tol = Number((args.find((a) => a.startsWith("--tol=")) || "=32").split("=")[1]);
    cutout(inp, out, { tol }).then((r) =>
      console.log(`cutout → ${out} (${r.width}×${r.height}, removed ${r.removed} bg px). DRAFT — run #A3d cleanup before approving.`),
    ).catch((e) => { console.error(e.message); process.exit(1); });
  } else {
    console.log("usage: node scripts/cutout.mjs <in.png> <out.png> [--tol=32] | --selftest");
  }
}
