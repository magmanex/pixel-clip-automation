import { Scene } from "./schema";

// Readable name for a scene, used both as the Studio timeline track name (Video.tsx)
// and in the Scene List panel. Prefers the explicit `name` (set by the story-to-scenes
// skill); otherwise derives a label from the scene's content so a track is never just
// "<TS.Sequence>".

const derived = (s: Scene): string => {
  switch (s.type) {
    case "card":
      return `${s.emoji ?? "▪"} ${s.title}`;
    case "split":
      return `${s.panels[0].title ?? s.panels[0].emoji ?? "?"} | ${s.panels[1].title ?? s.panels[1].emoji ?? "?"}`;
    case "story":
      return s.dialogue[0]?.text ?? `${s.characters.length} ตัวละคร`;
    default: // chat / overlay
      return s.header?.name ?? s.title ?? s.messages[0]?.text ?? "แชท";
  }
};

// Content label (no index) — used by the Scene List panel's name column.
export const sceneContent = (s: Scene): string => s.name ?? derived(s);

// Full track name with 1-based position + type, for the Studio timeline.
export const sceneTrackName = (s: Scene, i: number): string => `${i + 1} · ${s.type} · ${sceneContent(s)}`;
