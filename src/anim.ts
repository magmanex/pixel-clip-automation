// Pure frame-picker for cycling a multi-frame pixel sprite (tiny idle/blink/cry loops).
// Kept separate from React so it has a runnable check.
//
// localFrame = the current frame inside the scene (Remotion Sequence-local).
// compFps    = composition fps (30 here). animFps = how fast the sprite cycles.
// count      = number of frames. Returns which frame index to show (0 for a static sprite).
//
// Run check: node --no-warnings --experimental-strip-types src/anim.ts --selftest

export const frameIndex = (localFrame: number, compFps: number, animFps: number, count: number): number => {
  if (count <= 1) return 0;
  const framesPerStep = Math.max(1, Math.round(compFps / animFps)); // hold each art frame this many comp frames
  return Math.floor(localFrame / framesPerStep) % count;
};

if (process.argv?.includes("--selftest")) {
  // 30fps comp, 6fps anim → 5 comp frames per art frame.
  console.assert(frameIndex(0, 30, 6, 3) === 0, "frame 0 → 0");
  console.assert(frameIndex(4, 30, 6, 3) === 0, "frame 4 still 0");
  console.assert(frameIndex(5, 30, 6, 3) === 1, "frame 5 → 1");
  console.assert(frameIndex(10, 30, 6, 3) === 2, "frame 10 → 2");
  console.assert(frameIndex(15, 30, 6, 3) === 0, "frame 15 wraps → 0");
  // a single-frame (static) sprite never moves.
  console.assert(frameIndex(999, 30, 6, 1) === 0, "1 frame stays 0");
  console.log("selftest: ok");
}
