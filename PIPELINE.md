# Character art pipeline (P2.5 #A3c) — local ComfyUI

Generate Until-Then-tier pixel sprites, conforming to `STYLE.md` + `palette.json`.
The renderer already consumes whatever PNG/SVG you register in `public/characters.json` —
this pipeline just produces the art.

> Output is always a **draft** (#A3d). The gen does ~90%; a human cleanup pass is
> non-skippable — that's what stops it reading as "AI pixel art".

## Current setup — ComfyUI on `jef` (already installed & validated)
- Host: **jef** (Mac mini M4, MPS) via tailscale → **`http://100.80.197.8:8188`**.
- Path: `/Users/snowonyx/sdev/private/comfyui` (uv venv, Python 3.12, torch 2.12 MPS).
- Checkpoint: `Public-Prompts-Pixel-Model.ckpt` (All-In-One-Pixel-Model, SD1.5).
  Trigger words: `pixelsprite` (character) / `16bitscene` (scene). 512×768 gen.
- gen-char/gen-bg default to this URL via `comfyUrl` in `pipeline/config.json` — no
  `COMFYUI_URL=` prefix needed (set the env var only to point at a different host).

Control the service from this repo (wraps `comfyctl.sh` on jef):
```bash
npm run comfy:status     # UP/DOWN + pid
npm run comfy:start      # idempotent; waits until the port answers (~30s boot)
npm run comfy:stop
npm run comfy:restart    # after a reboot or if it dies
npm run comfy:log        # tail comfy.log
```
The script lives on jef at `~/sdev/private/comfyui/comfyctl.sh` (`start|stop|restart|status|log`).

## Setting up on a different machine
1. Install **ComfyUI**, start it (`--listen` to expose on the network).
   Point `COMFYUI_URL` at it.
2. Drop a **pixel-art checkpoint/LoRA** in `models/checkpoints`. For **identity** across
   emotions (#A3b), add an **IP-Adapter** node conditioned on the approved character sheet.
3. ComfyUI dev mode → **Save (API Format)** → overwrite `pipeline/workflow.api.json`
   (the loader strips `_`-prefixed comment keys automatically).
4. Edit `pipeline/config.json` so node ids match (`promptNodeId`, `seedNodeId`,
   `saveNodePrefix`, `styleSuffix`). Add `refImageNodeId` once IP-Adapter is wired.

> Background cutout (#A6, done): SD paints the character on a **solid background**. gen-char
> runs `scripts/cutout.mjs` (border-seeded flood-fill chroma-key, `sharp`-only — no rembg) BEFORE
> quantize, so sprites come out transparent. Skip with `--keep-bg`; tune edge bleed with `--tol=N`
> (default 32). Standalone: `npm run cutout -- <in> <out>`. If gens ever get busy/scene
> backgrounds the flood-fill won't suffice — swap in rembg there.

## Usage
```bash
# dry run — see the patched prompt + target path, no ComfyUI call
npm run gen:char -- mali "thai girl, auburn hair, pink shirt" --emotion=happy --dry-run

# real run (ComfyUI must be up): generates → quantizes → public/characters/mali-happy.png
npm run gen:char -- mali "thai girl, auburn hair, pink shirt" --emotion=happy
npm run gen:char -- mali "..." --emotion=sad   --seed=12345   # reuse seed for consistency
```
The style suffix (from `STYLE.md`) is appended automatically. Loop over emotions to fill a
character's sprite set.

### Identity across emotions (#A3b, done) — `--ref`
Generate + approve ONE character sheet (a clean, full-body reference), then pass it as `--ref`
for every emotion so face/hair/outfit stay fixed:
```bash
npm run gen:char -- mali "thai girl" --emotion=neutral --seed=7        # 1) make the sheet
# approve pipeline/_raw-mali-neutral.png (or a hand-cleaned sheet), then:
npm run gen:char -- mali "thai girl" --emotion=angry --ref=pipeline/_raw-mali-neutral.png
npm run gen:char -- mali "thai girl" --emotion=sad   --ref=sheets/mali.png --ref-weight=0.7
```
`--ref` uploads the sheet to ComfyUI and injects an IPAdapter chain (`ip-adapter_sd15` +
`CLIP-ViT-H-14`, on jef under `models/ipadapter` + `models/clip_vision`); node id/filenames/
weight live in `pipeline/config.json`. Higher `--ref-weight` = stronger identity lock (default
0.8) but less prompt freedom. No `--ref` = plain txt2img (the base workflow is untouched).
One-time jef install: `custom_nodes/ComfyUI_IPAdapter_plus` (underscores) + the two models.

### Backgrounds (#A8) — `npm run gen:bg`
Painted pixel scenery for `story` `background`/`bgImage`. Swaps to the `16bitscene` style,
renders landscape (768×448), skips the bg-cutout, quantizes taller → `public/bg/<id>.png`:
```bash
npm run gen:bg -- park "city park with benches and trees, daytime" --seed=42
```
Scene size/style/negative live in `pipeline/config.json` (`scene*` keys).

## Post-process only (any source image)
`quantize.mjs` is provider-independent — run it on a commission, an asset-pack sprite,
or a manual draw to snap it onto the master palette:
```bash
npm run quantize -- input.png public/characters/mali-happy.png --height=192
node scripts/quantize.mjs --selftest    # sanity check
```

## After generating (the #A3d cleanup — required)
1. Open the draft in a pixel editor (Aseprite/Photopea).
2. Fix stray pixels, eyes/hands, broken outline; confirm every pixel is on `palette.json`.
3. Check identity against the character sheet (#A3b) — same face/hair/outfit.
4. Add the approved file to `public/characters.json` under the character's `sprites`.

## Workflow recommendation (the #A3c provider spike)
A general model + one text prompt fails identity. Use: pixel-art LoRA for the look +
IP-Adapter (reference = char sheet) for identity + the quantize step here to kill
off-palette noise. Decide LoRA/IP-Adapter combo in ComfyUI; this script stays the same.
```
