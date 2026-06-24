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

export type Scene = {
  type: "chat";
  title?: string;
  header?: ChatHeader;
  durationSec: number;
  messages: Message[];
};

export const sceneFrames = (s: Scene) => Math.round(s.durationSec * FPS);
export const totalFrames = (scenes: Scene[]) =>
  scenes.reduce((n, s) => n + sceneFrames(s), 0);
