// Pure coordinate math for canvas drag (Phase 3), kept out of the React layer so it
// has a runnable check. Converts a screen-space drag delta into new composition-space
// actor coords for a StoryScene actor.
//
// StoryScene places an actor at: left = pos%, x = horizontal px offset (grows RIGHT),
// bottom = 470 - y (so y grows UP). The Studio canvas is scaled: k = screen px per
// composition px (derived from the sprite's rendered width vs its 560px comp width).
//
// Run check: node --no-warnings --experimental-strip-types src/dragMath.ts --selftest

export type Coords = { x: number; y: number };

export const dragToCoords = (start: Coords, deltaScreen: { dx: number; dy: number }, k: number): Coords => ({
  x: Math.round(start.x + deltaScreen.dx / k),
  y: Math.round(start.y - deltaScreen.dy / k), // screen-down is negative comp-y
});

// k from the dragged element's on-screen size vs its known composition size.
export const canvasScale = (rectWidth: number, compWidth: number, actorScale: number): number =>
  rectWidth / (compWidth * actorScale);

if (process.argv?.includes("--selftest")) {
  // k = 0.5 → 100 screen px = 200 comp px.
  const a = dragToCoords({ x: 0, y: 0 }, { dx: 100, dy: 0 }, 0.5);
  console.assert(a.x === 200 && a.y === 0, "right drag adds comp-x", a);

  // dragging DOWN (dy +100) lowers the actor → comp-y decreases.
  const b = dragToCoords({ x: 10, y: 50 }, { dx: 0, dy: 100 }, 0.5);
  console.assert(b.x === 10 && b.y === -150, "down drag subtracts comp-y", b);

  // k from a 560px sprite shown 280px wide at scale 1 → 0.5.
  console.assert(canvasScale(280, 560, 1) === 0.5, "canvasScale 1x");
  // same sprite at scale 2 shows 560px wide → k still 0.5.
  console.assert(canvasScale(560, 560, 2) === 0.5, "canvasScale 2x");

  console.log("selftest: ok");
}
