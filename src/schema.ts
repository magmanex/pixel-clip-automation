import type { SkinName } from "./skins";

export const FPS = 30;
export const WIDTH = 1080; // YouTube Short vertical
export const HEIGHT = 1920;

export type Message = {
  side: "left" | "right";
  name?: string;
  text: string;
  // sfx filename in public/sfx/ when this message appears.
  // omit = use default pop; "" or null = silent.
  sfx?: string | null;
  // #4 timing overrides (seconds). delaySec = extra pause before this message
  // starts typing (comedy beat). typingSec = how long the "..." shows (0 = skip).
  delaySec?: number;
  typingSec?: number;
};

export type ChatHeader = {
  name: string;
  // avatar image in public/ (e.g. "avatars/mom.png"); omitted = initial circle.
  avatar?: string;
  subtitle?: string; // e.g. "online", "พิมพ์อยู่..."
};

// #5 transition played when ENTERING this scene (between prev scene and this one).
// First scene's transition is ignored. "cut" = no transition (hard cut).
export type Transition = {
  type: "fade" | "slide" | "wipe" | "cut";
  durationSec?: number;
  direction?: "from-left" | "from-right" | "from-top" | "from-bottom";
};

// Fields common to every scene.
type SceneBase = {
  durationSec: number;
  transition?: Transition;
};

export type ChatScene = SceneBase & {
  type: "chat";
  title?: string;
  header?: ChatHeader;
  messages: Message[];
  skin?: SkinName; // #7 look; omit = whatsapp
};

// #6 intro hook / outro card. Same shape for both — full-screen centered text.
export type CardScene = SceneBase & {
  type: "card";
  title: string;
  subtitle?: string;
  emoji?: string;
  cta?: string; // call to action, e.g. "กดติดตามด้วยน้า 🔔"
  background?: string; // CSS color; default dark
};

export type Scene = ChatScene | CardScene;

export const DEFAULT_TRANSITION: Transition = { type: "fade" };
const DEFAULT_TRANSITION_SEC = 0.5;

export const sceneFrames = (s: Scene) => Math.round(s.durationSec * FPS);

// Effective transition entering scene i (null for the first scene).
export const sceneTransition = (s: Scene, i: number): Transition | null =>
  i === 0 ? null : s.transition ?? DEFAULT_TRANSITION;

// Frames a transition overlaps (0 for none/cut). TransitionSeries shortens the
// timeline by this much per transition, so total must subtract it.
export const transitionFrames = (t: Transition | null) =>
  !t || t.type === "cut" ? 0 : Math.round((t.durationSec ?? DEFAULT_TRANSITION_SEC) * FPS);

export const totalFrames = (scenes: Scene[]) =>
  scenes.reduce(
    (n, s, i) => n + sceneFrames(s) - transitionFrames(sceneTransition(s, i)),
    0,
  );
