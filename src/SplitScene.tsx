import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SplitScene as SplitSceneData, SplitPanel } from "./schema";

// #8 Two-panel split. Each panel slides in from its outer edge, then holds.
const Panel: React.FC<{ panel: SplitPanel; from: "left" | "right" | "top" | "bottom" }> = ({ panel, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18 } });
  const off = (1 - p) * 100; // percent off-screen at start
  const axis =
    from === "left" ? `translateX(${-off}%)` :
    from === "right" ? `translateX(${off}%)` :
    from === "top" ? `translateY(${-off}%)` :
    `translateY(${off}%)`;

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        background: panel.background ?? "#0b141a",
        transform: axis,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 50,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {panel.image && (
        <Img src={staticFile(panel.image)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {panel.emoji && <div style={{ fontSize: 140, position: "relative" }}>{panel.emoji}</div>}
      {panel.title && <div style={{ color: "#fff", fontSize: 64, fontWeight: 800, lineHeight: 1.2, position: "relative", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>{panel.title}</div>}
      {panel.subtitle && <div style={{ color: "#e9edef", fontSize: 40, position: "relative", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>{panel.subtitle}</div>}
    </div>
  );
};

export const SplitScene: React.FC<{ scene: SplitSceneData }> = ({ scene }) => {
  const vertical = scene.direction === "vertical";
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: vertical ? "column" : "row", fontFamily: "sans-serif" }}>
      <Panel panel={scene.panels[0]} from={vertical ? "top" : "left"} />
      <Panel panel={scene.panels[1]} from={vertical ? "bottom" : "right"} />
    </AbsoluteFill>
  );
};
