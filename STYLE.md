# STYLE.md — the look, locked (P2.5 #A3a)

The art target is the **"Until Then" game** aesthetic (see the subway reference). This file
is the contract every sprite/background conforms to. Lock it BEFORE automation — gens drift
without a fixed spec. If you change something here, regenerate affected assets to match.

Companion file: `palette.json` (the master colors). Everything quantizes to it.

## The four locks (these are what make it read as one cohesive, hand-made world)

### 1. Resolution — high pixel art, NOT tiny
- **Character**: ~220 px tall on the 1080×1920 frame, drawn on a virtual pixel grid of
  ~**192 px tall source** (full body, ~7.5 heads — realistic anime proportions, NOT chibi).
- **Background**: painted at a **640×360 virtual canvas**, then nearest-neighbor scaled to
  1920×1080+ region. Coarse, visible pixel grid — but detailed (signage, handrails, seats).
- One global "pixel size": ~3 screen px per art pixel. Characters and backgrounds share it
  so they belong to the same world. Never mix grid sizes in one scene.

### 2. Palette — limited + cohesive (see `palette.json`)
- Realistic, slightly muted daylight set: denim blues, olive/army green, mustard yellow,
  warm skin, white, greys, purple seats, teal + magenta signage accents.
- Every asset is **quantized to `palette.json`** as the last gen step. No off-palette pixels.
- Max ~4 shades per material (light / mid / shadow / deep). Shade by ramp, not by blur.

### 3. Outline — selective, dark-not-black
- Silhouette gets a 1px outline in `#1b1b26` (near-black blue), NOT pure `#000`.
- Interior detail uses shading ramps + sparse darker lines, anime-style — don't outline
  every internal shape. Outline reads the form; shading reads the volume.

### 4. Shading & light — soft cool daylight + depth
- Single soft key light (cool white, slight warm bounce). Gentle bloom on windows/lights.
- **Depth of field is part of the look**: foreground figures blurred, the focal character(s)
  sharp, background detailed but slightly hazed (`haze` overlay). The renderer does the blur
  (per-actor `blur`/`depth` in the story scene) — sprites themselves are drawn sharp.
- Cast a soft contact shadow under each standing character.

## Identity rule (the hard problem — #A3b)
A character is ONE person across every emotion/pose. Pin identity with an approved
**character sheet** (turnaround + expression row); all emotion variants are edits of that
sheet, never independent re-rolls. Same hair shape, face geometry, outfit, palette slots.

## Non-skippable cleanup (#A3d)
Gen output is a ~90% draft. A human (or pixel-editor pass) fixes stray pixels, eyes/hands,
broken outline, and confirms on-palette BEFORE the sprite is "approved". Skipping this is
exactly what makes AI pixel art look AI. Manual-only sprites are always valid.

## Render-side notes (already supported)
- Sprites: transparent PNG, drawn sharp, `imageRendering: pixelated` (engine handles scale).
- `story` scene: `bgImage` (painted background), characters with `pos`, `flip`; speaker
  brightens + emotion-swaps, others dim. Add `blur`/`depth` for the reference's DoF look.
