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
- `npx remotion still Short out/frame.png --frame=N` — render a single frame to check layout fast
- `npx tsc --noEmit` — type-check (no test/lint setup in this repo)

No separate ffmpeg needed — Remotion bundles it.

## Architecture

Data-first: `scenes.json` is the source of truth. Edit it to make a video; components just render it.

- `scenes.json` — array of scenes (the content you actually edit per video)
- `src/schema.ts` — `Scene`/`Message` types + `FPS/WIDTH/HEIGHT` + frame-math helpers (`sceneFrames`, `totalFrames`). Composition duration is computed from the data, so adding/removing scenes auto-resizes the video.
- `src/Root.tsx` — registers the `Short` composition, feeds it `scenes.json`
- `src/Video.tsx` — sequences scenes with `<Series>` (hard cuts)
- `src/ChatScene.tsx` — renders one chat scene; messages pop in staggered (`appearAt(i)` = when each message appears)

Flow: `scenes.json` → `Root` (composition) → `Video` (Series of scenes) → `ChatScene` (bubbles) → render/preview.

## Conventions

- Vertical 1080×1920 always (YouTube Shorts). Change in `schema.ts` if needed.
- Message timing is frame-based, derived from `FPS`. Use the helpers in `schema.ts`; don't hardcode frame counts elsewhere.
- Built (see `task.md` for status): chat scene with typing indicator + bottom-anchored scroll, header, per-message timing (`delaySec`/`typingSec`), audio (SFX per message + looping BGM in `config.ts`), and scene transitions (`@remotion/transitions` via `<TransitionSeries>`; per-scene `transition` field, default fade).
- Not built yet (deliberate; `task.md` P2/P3):
  - **Split-screen / on-top overlay scenes**: add new `type` values to `Scene` and a matching component, branch in `Video.tsx`.
  - **Drag-drop editor GUI**: intentionally deferred until the video output is proven. Keep `scenes.json` as the contract between any future editor and the renderer.
