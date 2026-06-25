import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { frameIndex } from "./anim";

// Renders a pixel sprite that cycles through frame[] for a tiny animation (idle/blink/cry).
// A single-frame array is just a static sprite (frameIndex stays 0), so this is a drop-in
// for the old <Img>. animFps = cycle speed (6 = lively-but-calm for pixel art).
export const PixelSprite: React.FC<{ frames: string[]; animFps?: number; style?: React.CSSProperties }> = ({ frames, animFps = 6, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = frameIndex(frame, fps, animFps, frames.length);
  return <Img src={staticFile(frames[i])} style={{ imageRendering: "pixelated", ...style }} />;
};
