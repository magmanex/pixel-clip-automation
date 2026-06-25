---
name: story-to-scenes
description: Turn a spoken story (place, characters, events, punchline) into a valid scenes JSON for this Remotion chat-story project, with a readable `name` on every scene so the Studio timeline tracks are legible instead of "<TS.Sequence>". Use when the user narrates a situation and wants it built into a video. Triggers "เล่าเรื่อง", "สร้างวิดีโอจากเรื่อง", "สร้าง scene จากเนื้อเรื่อง", "story to scenes", "/story-to-scenes".
---

# story-to-scenes

User narrates a situation; you analyze it and write a schema-valid scenes JSON whose
tracks are **named so a human can read the timeline**. The whole point: replace
unreadable tracks (`<TS.Sequence>`, `<Img>`) with names like "ฉากเปิด: มุกตื่นสาย".

## Inputs — ask only for what's missing

If the user already gave enough, skip the questions and build. Otherwise collect:

- **สถานที่ / setting** — where it happens (drives `story` backgrounds + tone).
- **ตัวละคร** — who's in it. Reuse existing cast in `public/characters.json` by
  `characterId`; only invent a new one if the user clearly wants it (then note it
  needs art — see PIPELINE.md, you can't draw sprites).
- **เหตุการณ์ + มุก** — the beats and the punchline (the comedy lands at the end).
- **โทน / ความยาว** — funny/dramatic, and rough length (15–45s typical for a Short).
- **ปลายทาง** — active video (`public/scenes.json`) or a batch clip (`clips/<name>.json`).

## Build

1. **Read the contract.** `PROMPT.md` is the authoritative schema (scene types +
   fields). For pixel `story` scenes also skim `STYLE.md`. Check
   `public/characters.json` for available `characterId`s before referencing any.
2. **Structure the beats.** A Short is usually: intro `card` hook → 1–N body scenes
   (`chat` / `overlay` for messaging gags, `story` for pixel characters acting it out,
   `split` for reaction contrasts) → outro `card` CTA. Map each story beat to one scene.
3. **Write the JSON array** per `PROMPT.md`. Real, in-character Thai dialogue — not
   placeholders. Reference characters by `characterId`, never raw sprite paths.
4. **Name every scene.** Put a short readable `name` on EACH scene object:
   `"name": "<role>: <gist>"`, e.g. `"ฉากเปิด: มุกตื่นสายวันเสาร์"`, `"แชท: เพื่อนทวงเงิน"`,
   `"ฉากจบ: กดติดตาม"`. The renderer shows this as the track name in the Studio timeline
   (`src/sceneLabel.ts` → `TransitionSeries.Sequence name`). This is non-skippable —
   it's the reason this skill exists.
5. **Save** to the destination chosen above.

## Verify (do not skip)

- `npm run check` — runs `tsc --noEmit` + validates the JSON against the zod schema.
  Fix any reported error and re-run until it passes. Do NOT hand back invalid JSON.
- Optional eyeball: `npx remotion still Short out/preview.png --frame=N` (or
  `Clip-<name>`) and look at the PNG — far cheaper than a full render.

## Notes

- `name` is optional in the schema, but THIS skill always sets it — that's the deliverable.
- Don't invent sprite/image files. If a beat needs art that doesn't exist, say so and
  use a `card`/`chat` beat instead, or flag it for the gen pipeline (PIPELINE.md).
- Keep it data-only: edit JSON, never the renderer components, unless the user asks.
