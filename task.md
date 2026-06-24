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
- [ ] #5 Transitions between scenes (@remotion/transitions: fade/slide)
- [ ] #6 Intro hook card + outro (subscribe CTA)
- [ ] #7 Chat skins (LINE / IG / Messenger looks)

## P2 — scene types from original vision
- [ ] #8 Split left/right scene
- [ ] #9 On-top overlay scene (image/video + chat)

## P3 — scale / workflow
- [ ] #10 Batch render multiple clips (multiple compositions)
- [ ] #11 Drag-drop editor GUI — ONLY when JSON becomes painful (YAGNI until then)
