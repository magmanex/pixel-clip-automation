---
name: director
description: Direct an existing scenes JSON like a film editor — fix pacing, beats, emotional rhythm, transition language, and shot variety so a clip lands its emotion instead of feeling rushed. Tunes timing fields (durationSec, delaySec, holdSec, transition.durationSec) and emotion/staging, never the story content. Use after a clip is drafted and "feels off / rushed / flat / not impactful". Triggers "ผู้กำกับ", "จัดจังหวะ", "pacing", "ทำให้มืออาชีพ", "director", "/director".
---

# director

A clip can be correct yet feel amateur — beats rush, emotion has no room to land, every
cut is the same. This pass directs the timing and rhythm of an existing scenes JSON.
**Tune timing + staging only; don't rewrite the story** (that's `story-to-scenes`).

## What you change (data only)

- `durationSec` — a scene must outlast its content + the reader's beat. Emotional scenes
  need silence after the last line. Comedy punchlines need a held pause before the cut.
- `delaySec` — a beat of silence BEFORE a line/message. Dread, hesitation, loneliness.
- `holdSec` (story) — read/linger time AFTER a line finishes. The emotional payload sits here.
- `transition.durationSec` + `type` — the grammar of the edit (table below).
- `emotion` + story staging (`scale`/`blur`/`x`/`y`) — push in (bigger `scale`) on the
  emotional peak; blur the background to isolate the focal character.

## Pacing heuristics

- **Don't rush the peak.** The most important beat gets the LONGEST hold, not the shortest.
  A reveal/death/punchline needs 2.5–4s of `holdSec` or scene tail. Silence is the impact.
- **Breathe before impact.** Put `delaySec` 0.5–1.5s before a heavy line so it lands alone.
- **Contrast rhythm.** Fast section → slow section. If everything is the same speed it
  reads flat. Rushed setup is fine; never rush the payoff.
- **One idea per beat.** If a scene carries two emotional turns, split it or extend it.
- **Use silence.** `sfx: null` on a dramatic message (no pop) — quiet hits harder than a sound.
- **Title/card air.** A card needs ~0.8s for the title to fade in + ~1.5s to read. Min ~3s.

## Transition grammar

| type | feel | when | durationSec |
|------|------|------|-------------|
| `fade` | time passing, melancholy | drama, scene-to-scene in a sad arc | 0.8–1.2 (slow = heavier) |
| `cut` (transition `{"type":"cut"}`) | shock, hard reality | a reveal, a phone ringing, a slap | 0 (instant) |
| `slide` | energy, momentum, a new place | comedy, scene change with motion | 0.4–0.6 |
| `wipe` | playful, chapter break | lighter beats, "meanwhile" | 0.5–0.7 |

Drama default = slow `fade`, with ONE `cut` reserved for the hardest beat so it stands out.
Overusing `cut` kills its punch; overusing `slide` feels frantic.

## Process

1. Read the target JSON + skim how the components consume timing (`src/ChatScene.tsx`,
   `src/StoryScene.tsx` for the LEAD/HOLD/typing constants) so your numbers are realistic.
2. Walk scene by scene: name the intended emotion, then ask "does the timing give it room?"
   Note every rushed/flat beat.
3. Apply the timing/staging edits. Keep a one-line reason per change for the handback.
4. **Verify:** `npm run check`, then render a still or two at the peak beats
   (`npx remotion still Clip-<name> out/x.png --frame=N`) and look — confirm the emotional
   shot reads (close-up scale, blur, emotion sprite all correct).

## Boundaries

- Don't touch dialogue/story content, scene order, or characters unless the user asks.
- Don't edit renderer components (the LEAD/HOLD constants) unless the user explicitly wants
  a global pacing change — prefer per-scene `delaySec`/`holdSec`/`durationSec`.
