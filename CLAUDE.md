# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tasks — read first

**Always read `task.md` at the start of work** for the current roadmap and status, and
**update `task.md` whenever a task's status changes** (todo → in progress → done).

## What this is

A YouTube Shorts **chat-story** generator, inspired by channels นวล / Beluga: vertical
videos that replay funny fake chat conversations (left/right bubbles) with sound effects,
no voice-over. Owner is a developer, not an editor/artist — so the tool is code/data-driven,
not a GUI video editor.

Built on **Remotion** (React → MP4). Remotion owns the hard parts: timing, transitions,
audio mixing, MP4 export, and a live preview studio. We only write scene components + data.

## Commands

- `npm run dev` — Remotion Studio (live preview at localhost, edit + scrub frames)
- `npm run render` — render `out/video.mp4` (1080×1920, 30fps, ready for YouTube upload)
- `npm run render:all` — render every `clips/*.json` to `out/<name>.mp4`
- `npx remotion still Short out/frame.png --frame=N` — render a single frame to check layout fast
  (also `npx remotion still Clip-<name> ...` for a batch clip — far cheaper than a full render)
- `npx tsc --noEmit` — type-check (no test/lint setup in this repo)

Pixel-art character art (P2.5 — see PIPELINE.md):
- `npm run gen:char -- <id> "<prompt>" --emotion=<e> [--seed=N] [--dry-run]` — generate a
  sprite via ComfyUI, then quantize to `palette.json`. Needs `COMFYUI_URL` (jef:
  `COMFYUI_URL=http://100.80.197.8:8188`).
- `npm run quantize -- <in.png> <out.png> [--height=192]` — snap any image to the palette.
- `node scripts/quantize.mjs --selftest` — sanity-check the quantizer.

No separate ffmpeg needed — Remotion bundles it.

## Architecture

Data-first: `scenes.json` is the source of truth. Edit it to make a video; components just render it.

- `scenes.json` — array of scenes (the content you actually edit per video)
- `src/schema.ts` — `Scene`/`Message` types + `FPS/WIDTH/HEIGHT` + frame-math helpers (`sceneFrames`, `totalFrames`). Composition duration is computed from the data, so adding/removing scenes auto-resizes the video.
- `src/Root.tsx` — registers the `Short` composition, feeds it `scenes.json`
- `src/Video.tsx` — sequences scenes with `<Series>` (hard cuts)
- `src/ChatScene.tsx` — renders one chat scene; messages pop in staggered (`appearAt(i)` = when each message appears). Also handles `overlay` scenes (chat over background `media`).
- `src/CardScene.tsx` — full-screen intro/outro card (`type: "card"`).
- `src/SplitScene.tsx` — two-panel split (`type: "split"`).
- `src/StoryScene.tsx` — Until-Then situation scene (`type: "story"`): pixel characters stand on a background, visual-novel dialogue box advances one line at a time; speaker emotion-swaps + brightens, others dim. Supports depth-of-field staging (per-actor `blur`/`scale`/`x`/`y`).
- `src/skins.ts` — chat skin palettes (whatsapp/line/ig/messenger).
- `src/EditLayer.tsx` — Studio-only double-click bubble editing (writes back to `public/scenes.json`).
- `src/characters.ts` + `public/characters.json` — pixel-art cast registry; `spriteFor(id, emotion)` resolves a `characterId` (+ emotion) to a sprite path. Used by chat header/messages, split panels, and story actors.

Branching: `Video.tsx` switches on `scene.type` (`card` / `split` / `story` / else chat+overlay).
Flow: `scenes.json` → `Root` (composition) → `Video` (TransitionSeries of scenes) → per-type scene component → render/preview.

## Pixel-art characters & gen pipeline (P2.5 — the creative core)

The "pixel" in pixel-clip: recurring pixel-art characters that act out the story, targeting
the **Until Then** game look (see `STYLE.md`). Three pieces:

- **Registry** — `public/characters.json` (char id → name + sprite-per-emotion). Scenes
  reference `characterId`, never raw paths, so a character stays consistent across videos.
  Resolve with `spriteFor()` in `src/characters.ts`. Sprites render with `imageRendering: pixelated`.
- **Style lock** — `STYLE.md` + `palette.json` define the look ONCE (resolution, palette,
  outline, shading, proportions, depth-of-field). Every generated asset conforms; the gen
  pipeline quantizes to `palette.json` as its last step.
- **Gen pipeline** (`scripts/gen-char.mjs` + `scripts/quantize.mjs`, config in `pipeline/`) —
  patches a ComfyUI API workflow → generates → downloads → quantizes to the palette. ComfyUI
  runs on **jef** (Mac mini M4, MPS, tailscale `100.80.197.8:8188`). Full setup, restart
  command, and the current gaps (transparent bg, IP-Adapter identity) are in **PIPELINE.md**.
  Gen output is always a DRAFT — a human cleanup pass (#A3d) is non-skippable.

## Conventions

- Vertical 1080×1920 always (YouTube Shorts). Change in `schema.ts` if needed.
- Message timing is frame-based, derived from `FPS`. Use the helpers in `schema.ts`; don't hardcode frame counts elsewhere.
- Built (see `task.md` for status): chat scene with typing indicator + bottom-anchored scroll, header, per-message timing (`delaySec`/`typingSec`), audio (SFX per message + looping BGM in `config.ts`), and scene transitions (`@remotion/transitions` via `<TransitionSeries>`; per-scene `transition` field, default fade).
- Adding a scene type = new discriminated-union member in `schema.ts` + a component + a branch in `Video.tsx` (see `story`/`split` for the pattern). Built types: chat, overlay, card, split, story.
- Pixel-art: reference characters by `characterId` (+ optional `emotion`), not raw image paths — keeps the cast consistent and lets the gen pipeline / cleanup swap art without touching scenes. Conform all art to `STYLE.md` + `palette.json`.
- Not built yet (deliberate; `task.md`):
  - **P2.5 done**: cutout (#A6), IP-Adapter identity (#A3b), prompt presets (#A7), background gen (#A8). Remaining is the human cleanup (#A3d) + wiring approved art (#A9). See `task.md`.
  - **Drag-drop editor GUI**: intentionally deferred until the video output is proven. Keep `scenes.json` as the contract between any future editor and the renderer.
  - **Publish path (P4)**: thumbnail, metadata sidecar, YouTube upload, one-shot ship script.

## Workflow conventions

- **Review = read-only.** When asked to review, audit, or analyze (a diff, branch, file), do NOT
  edit/fix anything — return findings by severity with recommendations. Change code only when the
  ask is explicitly "fix"/"implement". (Use the `reviewer` skill for the merge gate.)
- **Git/PR.** Don't commit or push unless asked. When asked: branch off `main` (this repo merges
  via PR — see history), commit with a clear message, push, then `gh pr create`. If `gh` is
  missing, give the manual `…/pull/new/<branch>` URL instead.
- **Verify before "done."** This repo has no test suite, so prove changes the cheap way before
  declaring success: `npx tsc --noEmit`, then a single still (`npx remotion still <Comp> out/x.png
  --frame=N`) and look at the PNG — not a full render. Script logic (parsers, frame math, the
  cutout/quantize steps) ships with a runnable `--selftest`; run it. Don't claim a render works
  from code alone.
