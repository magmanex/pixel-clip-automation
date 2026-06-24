import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { CardScene as CardSceneData } from "./schema";

// Full-screen centered card — used for intro hooks and outro CTAs (#6).
export const CardScene: React.FC<{ scene: CardSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 16 } });
  const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2); // gentle CTA pulse

  return (
    <AbsoluteFill
      style={{
        background: scene.background ?? "#0b141a",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        padding: 80,
        textAlign: "center",
      }}
    >
      {scene.emoji && (
        <div style={{ fontSize: 180, transform: `scale(${p})` }}>{scene.emoji}</div>
      )}
      <div
        style={{
          color: "#e9edef",
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1.2,
          opacity: p,
          transform: `translateY(${(1 - p) * 40}px)`,
        }}
      >
        {scene.title}
      </div>
      {scene.subtitle && (
        <div style={{ color: "#8aa", fontSize: 52, opacity: interpolate(frame, [6, 18], [0, 1], { extrapolateRight: "clamp" }) }}>
          {scene.subtitle}
        </div>
      )}
      {scene.cta && (
        <div
          style={{
            marginTop: 40,
            background: "#005c4b",
            color: "#fff",
            fontSize: 56,
            fontWeight: 700,
            padding: "28px 56px",
            borderRadius: 999,
            transform: `scale(${pulse})`,
          }}
        >
          {scene.cta}
        </div>
      )}
    </AbsoluteFill>
  );
};
