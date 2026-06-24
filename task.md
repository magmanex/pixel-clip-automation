# Task / Roadmap

Single source of truth for what's done and what's next. Update this file whenever a task
changes status. Order = priority (ship videos fast → 10k subscriber goal).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Done
- [x] Remotion render-first MVP (scenes.json → MP4, 1080×1920)
- [x] Chat scene: left/right bubbles, staggered pop-in
- [x] Audio: per-message SFX + looping BGM (config.ts)
- [x] #1 Scroll when chat overflows (bottom-anchored, oldest clips off top)
- [x] #2 Typing indicator ("...") before each message appears
- [x] #3 Chat header (name + avatar/initial + subtitle + divider)
- [x] #4 Per-message timing: delaySec (beat) + typingSec (override) in scenes.json

## P0 — make current output postable
(all done — output is postable)

## P1 — variety so videos aren't samey
- [x] #5 Transitions between scenes (fade/slide/wipe/cut, per-scene, default fade)
- [x] #6 Intro hook + outro card (type "card": emoji/title/subtitle/cta)
- [x] #7 Chat skins (LINE / IG / Messenger looks) — `skin` field on chat scene, palettes in `src/skins.ts`

## P2 — scene types from original vision
- [x] #8 Split left/right scene — type "split", two panels (image/emoji/text), slide in from edges; `src/SplitScene.tsx`
- [x] #9 On-top overlay scene (image/video + chat) — type "overlay" + `media` field; ChatScene renders media behind a scrim (reuses chat timeline)

## P3 — scale / workflow
- [x] #10 Batch render multiple clips — drop a JSON in `clips/`, get a `Clip-<name>` composition; `npm run render:all` renders every clip to `out/<name>.mp4`
- [~] #11 Editor GUI
  - [x] AI-generated JSON: `PROMPT.md` is the schema contract to feed any AI → save as
    `public/scenes.json` (active video) or `clips/*.json` (batch).
  - [x] Double-click-to-edit: data lives in `public/scenes.json`, loaded via
    `calculateMetadata`. In Studio, double-click a chat bubble → modal → edits persist
    back to the file (`@remotion/studio` writeStaticFile). Studio-only (no leak in render).
    See `src/EditLayer.tsx`.
  - [x] Clip props form: batch clips keep the Zod schema form for live tweaks.
  - [ ] Full drag-drop timeline GUI (reorder/add/delete scenes, edit cards/splits) —
    still YAGNI; current double-click + JSON covers editing.
