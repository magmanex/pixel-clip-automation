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
- `scenes.json` (repo root) is the content + the contract. Scene types: `chat` and `card`
  (discriminated union in `schema.ts`). Add a scene type = union member + component +
  branch in `src/Video.tsx`.
- Verify cheaply, in order: `npx tsc --noEmit` → `npx remotion still Short out/x.png --frame=N`
  → Read the PNG. Use a **still**, not a full `npm run render`, to check layout — far cheaper.
- Frame math: `totalFrames()` subtracts transition overlaps, so a scene's start frame is NOT
  the naive sum of prior durations. To land mid-scene N, render a still and nudge the frame
  rather than computing it.
- Transitions return incompatible generic types; `presentation()` in Video.tsx is annotated
  `TransitionPresentation<any>` on purpose — don't "fix" it.
