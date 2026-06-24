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
