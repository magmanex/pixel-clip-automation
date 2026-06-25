import { useEffect } from "react";
import { getRemotionEnvironment, staticFile } from "remotion";
import { writeStaticFile } from "@remotion/studio";
import { dragToCoords, canvasScale } from "./dragMath";

// #11 Editor Phase 3 — drag a story actor on the canvas to set its x/y, Vegas-style.
// StoryScene marks each actor wrapper with data-drag-* attributes; we listen for
// mousedown on those (capture phase, like EditLayer — the Studio overlay eats normal
// onClick), follow the cursor during the drag, then write the new x/y back to the
// scene file on release. Studio-only (isRendering gate), so nothing ships in the MP4.
//
// ponytail: position only (x/y). Scale/appear-timing are separate knobs; add when this
// proves out. Coordinate math lives in dragMath.ts with a selftest.

const SPRITE_COMP_WIDTH = 560; // StoryScene <Img> width in composition px
const DRAG_THRESHOLD = 3; // px of movement before it counts as a drag, not a click

export const DragLayer: React.FC<{ src: string }> = ({ src }) => {
  const active = !getRemotionEnvironment().isRendering;

  useEffect(() => {
    if (!active) return;

    const onDown = (e: MouseEvent) => {
      const el = [...document.querySelectorAll<HTMLElement>("[data-drag-actor]")]
        .reverse()
        .find((node) => {
          const r = node.getBoundingClientRect();
          return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        });
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();

      const sceneIndex = Number(el.dataset.dragScene);
      const actorIndex = Number(el.dataset.dragActor);
      const start = { x: Number(el.dataset.dragX ?? 0), y: Number(el.dataset.dragY ?? 0) };
      const actorScale = Number(el.dataset.dragScale ?? 1);
      const k = canvasScale(el.getBoundingClientRect().width, SPRITE_COMP_WIDTH, actorScale);
      const startMouse = { x: e.clientX, y: e.clientY };
      const original = el.style.transform;

      const onMove = (m: MouseEvent) => {
        const dx = m.clientX - startMouse.x;
        const dy = m.clientY - startMouse.y;
        // live feedback: shift in comp px so it tracks the cursor on the scaled canvas.
        el.style.transform = `translate(${dx / k}px, ${dy / k}px) ${original}`;
      };

      const onUp = async (u: MouseEvent) => {
        window.removeEventListener("mousemove", onMove, true);
        window.removeEventListener("mouseup", onUp, true);
        el.style.transform = original; // file reload repositions properly
        const dx = u.clientX - startMouse.x;
        const dy = u.clientY - startMouse.y;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return; // a click, not a drag
        const coords = dragToCoords(start, { dx, dy }, k);
        const data = await fetch(staticFile(src)).then((r) => r.json());
        const actor = data[sceneIndex]?.characters?.[actorIndex];
        if (!actor) return;
        actor.x = coords.x;
        actor.y = coords.y;
        await writeStaticFile({ filePath: src, contents: JSON.stringify(data, null, 2) });
      };

      window.addEventListener("mousemove", onMove, true);
      window.addEventListener("mouseup", onUp, true);
    };

    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [active, src]);

  return null;
};
