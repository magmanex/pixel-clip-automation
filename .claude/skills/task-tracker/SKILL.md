---
name: task-tracker
description: Read and maintain task.md, the project roadmap and status tracker for this repo. Use at the start of any work session to see what's done and what's next, and whenever a task changes status (todo → in progress → done) so task.md stays accurate. Trigger words include "task", "roadmap", "what's next", "อ่าน task", "อัพเดท task", "/task-tracker".
---

# task-tracker

`task.md` (repo root) is the single source of truth for what's done and what's next,
ordered by priority. Keep it accurate.

## On starting work
1. Read `task.md`.
2. Pick the highest-priority `[ ]` (or continue a `[~]`) unless the user says otherwise.
3. Mark the task `[~]` (in progress) before editing code.

## When a task changes
- Started: `[ ]` → `[~]`
- Finished: `[~]` → `[x]`, and move it into the `## Done` section.
- New work discovered: add a `[ ]` line under the right priority bucket (P0 highest).

## Rules
- One line per task, keep the `#N` id stable so it can be referenced.
- Status edits are surgical — don't rewrite the whole file.
- Don't duplicate detail that lives in code or CLAUDE.md; task.md tracks *status*, not design.

## Capture reusable knowledge as skills (token efficiency)
When you find a path, command sequence, or fact you expect to use again or repeat,
**create or update a skill immediately** — don't wait. Repeated re-derivation wastes tokens.
- Recurring within this project → add it to the relevant skill (or "Quick facts" below).
- A distinct reusable workflow → make a new skill under `.claude/skills/<name>/SKILL.md`
  with a clear `name` + `description` so it auto-triggers.
- Keep entries terse; one fact per line. Prune anything that goes stale.

## Quick facts (avoid re-deriving — saves tokens)
- Composition id is `Short`; vertical 1080×1920, 30fps. Constants in `src/schema.ts`.
- `public/scenes.json` is the active video (loaded via `calculateMetadata`, Studio-editable).
  `clips/*.json` → batch comps `Clip-<name>` (`npm run render:all`). Both are the contract.
- Scene types (discriminated union in `schema.ts`): `chat`, `overlay`, `card`, `split`,
  `story`. Add a type = union member + component + branch in `src/Video.tsx`.
- Verify cheaply, in order: `npx tsc --noEmit` → `npx remotion still Short out/x.png --frame=N`
  (or `Clip-<name>`) → Read the PNG. Use a **still**, not a full render, to check layout.
- Frame math: `totalFrames()` subtracts transition overlaps, so a scene's start frame is NOT
  the naive sum of prior durations. To land mid-scene N, render a still and nudge the frame.
- Transitions return incompatible generic types; `presentation()` in Video.tsx is annotated
  `TransitionPresentation<any>` on purpose — don't "fix" it.

### Pixel-art characters & gen pipeline (P2.5)
- Characters: `public/characters.json` (id → name + sprite-per-emotion). Resolve with
  `spriteFor(id, emotion)` in `src/characters.ts`. Scenes use `characterId`, not raw paths.
  Sprites render `imageRendering: pixelated`. Placeholder SVGs in `public/characters/` for now.
- Look is locked in `STYLE.md` + `palette.json` (the master palette). Gen quantizes to it.
- Gen: `COMFYUI_URL=http://100.80.197.8:8188 npm run gen:char -- <id> "<prompt>" --emotion=<e>`
  → patches `pipeline/workflow.api.json` (config in `pipeline/config.json`) → ComfyUI →
  quantize → `public/characters/<id>-<emotion>.png`. `--dry-run` to inspect without calling.
- ComfyUI on **jef** (Mac mini M4, MPS): `ssh snowonyx@100.80.197.8`, repo
  `~/sdev/private/comfyui`. Control it from THIS repo (don't hand-write ssh/nohup):
  `npm run comfy:status|start|stop|restart|log` (wraps jef's `comfyctl.sh`). Checkpoint =
  Public-Prompts-Pixel-Model.ckpt (SD1.5, trigger `pixelsprite` char / `16bitscene` scene).
- gen-char/gen-bg default to jef via `comfyUrl` in `pipeline/config.json` — NO `COMFYUI_URL=`
  prefix needed (env still overrides). Just `npm run gen:char -- ...` / `npm run gen:bg -- ...`.
- ComfyUI API gotcha: every top-level key in the workflow JSON is treated as a node —
  `_`-prefixed comment keys must be stripped before POST (gen-char does this).
- `quantize.mjs` + `cutout.mjs` exports are importable; CLIs guarded by `import.meta.url` main
  check (don't remove — importing would run the CLI). Both have `--selftest`.
- #A6 bg cutout (DONE): `scripts/cutout.mjs` border-seeded flood-fill chroma-key (sharp, no ML).
  gen-char runs it before quantize; `--keep-bg` skips, `--tol=N` (default 32) tunes edge bleed.
- #A3b identity (DONE): gen-char `--ref=<sheet>` [`--ref-weight=N`, default 0.8] uploads the
  sheet (`POST /upload/image`) + injects IPAdapter chain, rewires KSampler MODEL. Base workflow
  stays plain txt2img w/o `--ref`. Config: `ipadapterFile`/`clipVisionName`/`refImageNodeId`/
  `ipWeight`. jef has `custom_nodes/ComfyUI_IPAdapter_plus` (UNDERSCORES) + `ip-adapter_sd15`
  (models/ipadapter) + `CLIP-ViT-H-14...` (models/clip_vision). `IPAdapterAdvanced.weight_type`
  must be `linear` (not `standard`). Restart ComfyUI after adding custom_nodes to load them.
- Full setup in `PIPELINE.md`. Remaining gaps: prompt drift #A7 (gens stack 2 figures / ignore
  colors), background gen #A8, wire approved art #A9.
