import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ChatHeader, Message, ChatScene as ChatSceneData } from "./schema";
import { DEFAULT_SFX, SFX_VOLUME } from "./config";

const LEAD = 10; // frames before the first message starts typing
const TYPING = 16; // default frames the "..." indicator shows before a message
const HOLD = 6; // frames pause after a bubble before the next one starts

// Build the timeline: when each message starts typing and when its bubble appears.
// #4: per-message delaySec (extra beat before typing) and typingSec (override "..." length).
const timeline = (messages: Message[], fps: number) => {
  const items: { typingStart: number; appear: number }[] = [];
  let t = LEAD;
  for (const m of messages) {
    t += Math.round((m.delaySec ?? 0) * fps);
    const typingDur = m.typingSec !== undefined ? Math.round(m.typingSec * fps) : TYPING;
    items.push({ typingStart: t, appear: t + typingDur });
    t = t + typingDur + HOLD;
  }
  return items;
};

const Header: React.FC<{ header: ChatHeader }> = ({ header }) => (
  <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 24, padding: "0 4px 28px", borderBottom: "2px solid #1f2c34", marginBottom: 28 }}>
    {header.avatar ? (
      <Img src={staticFile(header.avatar)} style={{ width: 96, height: 96, borderRadius: 48, objectFit: "cover" }} />
    ) : (
      <div style={{ width: 96, height: 96, borderRadius: 48, background: "#005c4b", color: "#e9edef", fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[...header.name][0] ?? "?"}
      </div>
    )}
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ color: "#e9edef", fontSize: 46, fontWeight: 600 }}>{header.name}</div>
      {header.subtitle && <div style={{ color: "#7d8b95", fontSize: 30 }}>{header.subtitle}</div>}
    </div>
  </div>
);

const Bubble: React.FC<{ isRight: boolean; children: React.ReactNode }> = ({ isRight, children }) => (
  <div
    style={{
      background: isRight ? "#005c4b" : "#1f2c34",
      color: "#e9edef",
      fontSize: 46,
      lineHeight: 1.3,
      padding: "22px 30px",
      borderRadius: 26,
      borderBottomRightRadius: isRight ? 6 : 26,
      borderBottomLeftRadius: isRight ? 26 : 6,
    }}
  >
    {children}
  </div>
);

const TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 14, padding: "30px 34px" }}>
      {[0, 1, 2].map((d) => {
        const o = interpolate((frame + d * 5) % 18, [0, 9, 18], [0.3, 1, 0.3]);
        return <div key={d} style={{ width: 18, height: 18, borderRadius: 9, background: "#8aa", opacity: o }} />;
      })}
    </div>
  );
};

export const ChatScene: React.FC<{ scene: ChatSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = timeline(scene.messages, fps);

  return (
    <AbsoluteFill style={{ padding: 60, fontFamily: "sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {scene.header && <Header header={scene.header} />}
      {scene.title && (
        <div style={{ flex: "none", color: "#8aa", fontSize: 44, textAlign: "center", marginBottom: 30 }}>
          {scene.title}
        </div>
      )}

      {/* Bottom-anchored: newest message sits at the bottom, older ones scroll
          off the top (clipped by overflow:hidden). No height measurement needed. */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 24, minHeight: 0 }}>
        {scene.messages.map((m, i) => {
          const { typingStart, appear } = tl[i];
          if (frame < typingStart) return null; // nothing yet
          const isRight = m.side === "right";
          const typing = frame < appear;
          const p = spring({ frame: frame - appear, fps, config: { damping: 14 } });
          return (
            <div
              key={i}
              style={{
                alignSelf: isRight ? "flex-end" : "flex-start",
                maxWidth: "75%",
                opacity: typing ? 1 : p,
                transform: typing ? undefined : `translateY(${(1 - p) * 30}px) scale(${0.9 + p * 0.1})`,
              }}
            >
              {m.name && !typing && (
                <div style={{ color: "#7d8b95", fontSize: 28, margin: isRight ? "0 8px 4px 0" : "0 0 4px 8px", textAlign: isRight ? "right" : "left" }}>
                  {m.name}
                </div>
              )}
              {typing ? (
                <Bubble isRight={isRight}><TypingDots /></Bubble>
              ) : (
                <Bubble isRight={isRight}>{m.text}</Bubble>
              )}
            </div>
          );
        })}
      </div>

      {/* SFX: one sound when each bubble appears (not during typing). Per-message
          override via "sfx" in scenes.json; "" or null = silent. Default in config.ts. */}
      {scene.messages.map((m, i) => {
        const file = m.sfx === undefined ? DEFAULT_SFX : m.sfx;
        if (!file) return null;
        return (
          <Sequence key={`sfx-${i}`} from={tl[i].appear}>
            <Audio src={staticFile(`sfx/${file}`)} volume={SFX_VOLUME} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
