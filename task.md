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

## P2.5 — pixel-art characters (the "pixel" in pixel-clip — core identity, not optional)
Today `avatar`/`image`/`media` are just static file paths someone drops in `public/`.
The original vision is pixel-art characters *acting out the situation*, not generic
stock images. This is the creative core and should land before the publish plumbing (P4).
Priority order = unblock the look first, automate generation second.

- [x] #A1 Character cast registry — `public/characters.json` (char id → name + sprite set
  keyed by emotion); loaded + resolved in `src/characters.ts` (`spriteFor`). Placeholder
  pixel sprite in `public/characters/`.
- [x] #A2 Wire sprites into render — `characterId` (+ optional `emotion`) on chat header,
  message, and split panel; resolves to sprite via `spriteFor`. `imageRendering: pixelated`.
### Quality bar: "Until Then" tier — viewer can't tell it's AI
Until Then = high-res, intentional pixel art: large expressive characters, clean pixel
grid, cohesive *limited* palette, and the SAME character recognizable across poses/emotions.
A single text→image call fails all four (noisy off-grid pixels, palette drift, identity
changes every gen). So the gen path is a real pipeline + a non-skippable human cleanup pass,
not one prompt. This is the highest-effort, highest-differentiation part of the project.

- [x] #A3a Style bible — `STYLE.md` + `palette.json` locked from the Until Then subway ref:
  ~192px full-body char (anime proportions, not chibi), 640×360 bg canvas, limited muted
  daylight palette, selective near-black outline, soft cool light + depth-of-field. All
  gens (#A3c) quantize to palette.json + conform to STYLE.md.
- [ ] #A3b Character sheet, not loose sprites — for each char, generate/draw ONE reference
  turnaround + expression sheet, approve it, treat it as the identity source. Needs the
  IP-Adapter node wired in ComfyUI (set `refImageNodeId` in pipeline/config.json), then
  `gen:char --ref=<sheet>`. (Human/creative step — not yet done.)
- [x] #A3c Gen pipeline — LOCAL ComfyUI, VALIDATED end-to-end. `npm run gen:char`
  (scripts/gen-char.mjs) patches the ComfyUI API workflow (prompt + STYLE.md suffix + seed)
  → POST /prompt → poll → download → quantize to palette.json. ComfyUI runs on **jef**
  (Mac mini M4, tailscale `100.80.197.8:8188`, MPS) at `/Users/snowonyx/sdev/private/comfyui`;
  checkpoint = All-In-One-Pixel-Model (SD1.5, trigger `pixelsprite`). Set
  `COMFYUI_URL=http://100.80.197.8:8188`. Real sprite generated (~55s/img). Setup in PIPELINE.md.
  NEXT: transparent background (gen puts char on solid bg — needs bg-removal before sprites
  drop into scenes) + IP-Adapter for identity (#A3b).
- [ ] #A3d Mandatory cleanup pass — documented as non-skippable in PIPELINE.md; the actual
  per-sprite human pixel-edit is done by the user after each gen. (Human step — not automatable.)
- [x] #A4 Per-message emotion → sprite swap — `emotion` on a message picks the matching
  sprite variant (shown beside the bubble), so the character reacts as beats land.
  (Quality of the sprites themselves still depends on #A3a–d.)
- [x] #A5 Situation scene with characters — `type: "story"` (`src/StoryScene.tsx`):
  pixel chars stand on a background (`background`/`bgImage`, `pos` left/center/right,
  `flip`), Until-Then visual-novel dialogue box advances one line at a time; speaker
  swaps emotion + brightens, others dim. `clips/story.json` = demo. Depth-of-field staging
  (Until Then ref look): per-actor `blur`/`scale`/`x`/`y` for blurred foreground + sharp
  focal pair. Sprite QUALITY (full-body, on-model) still depends on #A3b–d.

### NEXT SESSION — close the gaps so gen output is scene-ready (do in this order)
Pipeline runs end-to-end (#A3c) but raw output isn't usable in scenes yet. Ordered by
what unblocks the next thing. ComfyUI lives on jef — restart cmd in PIPELINE.md.

- [x] #A6 Transparent background — `scripts/cutout.mjs` (border-seeded flood-fill chroma-key,
  uses already-installed `sharp`, no rembg/ML dep). gen-char runs it BEFORE quantize (skip with
  `--keep-bg`, threshold `--tol=N` default 32). Connectivity-from-edge keeps interior pixels that
  match the bg color. Verified end-to-end on real SD output (343k bg px → transparent, char intact,
  no bg box). `npm run cutout -- <in> <out>` standalone; `node scripts/cutout.mjs --selftest`.
- [x] #A3b IP-Adapter identity — `--ref=<sheet>` pins a character across emotions. DONE:
  `ComfyUI_IPAdapter_plus` (underscores!) installed on jef + `ip-adapter_sd15.safetensors`
  (models/ipadapter) + `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` (models/clip_vision).
  gen-char `--ref` uploads the sheet (`POST /upload/image`) then INJECTS the IPAdapter chain
  (ip_model→ip_clipvision→ip_image→ip_apply, `IPAdapterAdvanced` weight_type `linear`) and
  rewires the KSampler MODEL through it — base workflow stays pure txt2img when no `--ref`.
  Params in config.json (`ipadapterFile`/`clipVisionName`/`refImageNodeId`/`ipWeight`),
  override per-gen with `--ref-weight=N`. Verified: ref's hair+outfit carried to a new seed.
  Workflow: gen+approve ONE char sheet, then `--ref=<sheet>` for every emotion.
- [x] #A7 Prompt quality — DONE. Sidecar `pipeline/prompts.json` (charId → `prompt`/`negative`);
  gen-char composes positive = `<preset.prompt> + <CLI prompt> + <emotion> + styleSuffix`,
  negative = `<base> + config.negativeExtra + preset.negative`. CLI prompt may be `""` when a
  preset exists. Fixed the big structural drift: SD1.5 pixel model was emitting 2-figure SPRITE
  SHEETS — `solo, single character, full-body, centered` in styleSuffix + an anti-spritesheet
  `negativeExtra` now yield one centered full-body char. Residual color drift (asked pink, got
  teal) is an SD1.5 limit — presets keep it consistent, #A3d cleanup fixes the rest.
- [x] #A8 Background generation — DONE. `npm run gen:bg -- <id> "<prompt>"` (= gen-char
  `--scene`): swaps to the `16bitscene` scene style, renders landscape (`sceneWidth/Height`
  768×448 in config), SKIPS the bg-cutout, quantizes taller (`sceneQuantizeHeight` 360) →
  `public/bg/<id>.png`. Verified: clean character-free pixel landscape. Use as `story` scene
  `background`/`bgImage`.
- [ ] #A9 Wire approved art into the registry + refresh demos — once #A6/#A3b produce clean
  on-model sprites, replace the placeholder SVGs in `public/characters.json` with the PNGs
  (run #A3d cleanup first), then re-render `clips/story.json` + `clips/borrow.json` to prove
  the Until Then look end-to-end. This is the "done" signal for P2.5.

### Animation + direction (added for craft/impact)
- [x] Multi-frame sprites — `characters.json` emotion can be a `string[]` of frames;
  `spriteFramesFor()` + `<PixelSprite>` (`src/anim.ts` cycler, `--selftest`) cycle them.
  Single string = static (back-compat). Wired into StoryScene actors.
- [x] Procedural tears — `cry: true` on a story actor → animated falling droplets
  (`Tear` in StoryScene, no art = never garbles). Used in `clips/mae-luuk.json` ending.
- [x] `director` skill — pacing/beat/transition-grammar pass on a drafted JSON
  (`.claude/skills/director/`). Tunes timing only, not story.
- [x] `story-to-scenes` skill + readable track `name`s (see #11 below).
- [x] First full clip — `clips/mae-luuk.json` (drama: นางพยาบาล+แม่). Two NEW
  IP-Adapter characters `nurse`/`mae` generated (presets in `pipeline/prompts.json`,
  registered in `characters.json` with neutral/sad/+), identity pinned via
  `--ref=<neutral>` (`--ref-weight=0.9` fixed a male-drift on mae-sad). Procedural
  emotion cues (don't lean on tiny pixel faces): tears (`cry`), shock screen-shake,
  idle breathing on all actors. Rendered `out/mae-luuk.mp4` (63s). Sprites are DRAFTS
  (#A3d cleanup still pending for final polish).
- [ ] Gen'd animation frames — multi-frame system ready; coherent gen'd frame-loops
  still need seed curation + IP-Adapter or they jitter. Procedural motion covers the
  common cases for now.

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
  - [x] Readable timeline tracks — optional `name` on every scene (schema) → shown as
    the `TransitionSeries.Sequence name` in the Studio timeline + Scene List panel via
    `src/sceneLabel.ts` (falls back to derived content, so tracks are never `<TS.Sequence>`).
  - [x] `story-to-scenes` skill — user narrates place/characters/events → schema-valid
    scenes JSON with a readable `name` per scene, validated by `npm run check`.
    `.claude/skills/story-to-scenes/`; `name` field documented in PROMPT.md.
  - [x] Editor Phase 1 — Studio-only Scene List panel (`src/SceneList.tsx`, mounted in
    `EditableShort`): ☰ button top-right → reorder (↑/↓), duplicate (⧉), delete (✕),
    edit `durationSec` inline. Writes whole `public/scenes.json` via `writeStaticFile`,
    gated by `isRendering` so nothing ships in the MP4. This is the "rearrange tracks"
    pain point (Remotion's own timeline is read-only).
  - [ ] Editor Phase 2 — Scene Inspector: click a scene → edit ALL fields (transition,
    skin, background, actor pos/emotion/x/y/scale/blur, add/del actor + dialogue line).
  - [~] Editor Phase 3 — canvas drag. DONE: drag a story actor on the Studio canvas to
    set its x/y (`src/DragLayer.tsx` + pure coord math `src/dragMath.ts` w/ `--selftest`;
    StoryScene actors carry `data-drag-*`, mounted in `EditableShort`). Works on `Short`
    (scenes.json) story scenes only — file-backed comp. TODO: scale handle + per-actor
    `appearAt` field + timeline strip for appear-timing.

## P4 — last mile: idea → uploaded Short (this is what "complete" means)
Render + edit are done. Framework is NOT complete until a finished clip reaches
YouTube without manual fiddling. Priority order = biggest velocity win first.

- [x] #12 Thumbnail per clip — `npm run thumb` (`remotion still Short out/thumb.png
  --frame=${THUMB_FRAME:-30}`); override frame with `THUMB_FRAME=N npm run thumb`.
- [x] #13 Metadata sidecar — `metaSchema` in schema.ts; sidecar `<name>.meta.json`
  (active video = `public/scenes.meta.json`). `npm run meta -- <name>` validates it
  through the schema and writes `out/<name>.meta.json` beside the mp4. Has `--selftest`.
- [ ] #14 YouTube upload script — `npm run publish -- <name>`: upload mp4 + thumb +
  meta via YouTube Data API (OAuth, resumable upload). **BLOCKED on YOUR Google
  OAuth** (Cloud project + token) — can't be built/tested without creds. `ship.mjs`
  already hands off to `scripts/publish.mjs` if it exists. This is the 10k-subs step.
- [~] #15 One-shot pipeline — `npm run ship -- <name>` = validate → render → thumb →
  meta → publish. `scripts/ship.mjs` DONE for the first four steps (verified end-to-end
  on the active video: 900-frame mp4 + thumb + meta). Publish step waits on #14.

## P5 — quality / polish (do only if output quality demands it)
- [x] #16 `npm run check` = `tsc --noEmit` + `scripts/check.mjs` runs the SAME zod
  schema over `public/scenes.json` + every `clips/*.json` (Node `--experimental-strip-types`
  loads schema.ts directly, no new dep). Bad/AI JSON fails loud before a 2-min render.
  Has `--selftest`.
- [ ] #17 BGM ducking — drop music volume while an SFX plays (mix clarity). YAGNI
  until a real video sounds muddy; Remotion `<Audio volume={f => ...}>` covers it.
- [ ] #18 Safe-area guides — Studio-only overlay marking YouTube's UI-occluded zones
  (bottom action bar, right buttons) so bubbles don't hide behind them.
