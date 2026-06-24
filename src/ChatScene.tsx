import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ChatHeader, Message, ChatScene as ChatSceneData } from "./schema";
import { SKINS, Skin } from "./skins";
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

const Header: React.FC<{ header: ChatHeader; skin: Skin }> = ({ header, skin }) => (
  <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 24, padding: "0 4px 28px", borderBottom: `2px solid ${skin.headerBorder}`, marginBottom: 28 }}>
    {header.avatar ? (
      <Img src={staticFile(header.avatar)} style={{ width: 96, height: 96, borderRadius: 48, objectFit: "cover" }} />
    ) : (
      <div style={{ width: 96, height: 96, borderRadius: 48, background: skin.avatarBg, color: skin.avatarColor, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[...header.name][0] ?? "?"}
      </div>
    )}
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ color: skin.nameColor, fontSize: 46, fontWeight: 600 }}>{header.name}</div>
      {header.subtitle && <div style={{ color: skin.subColor, fontSize: 30 }}>{header.subtitle}</div>}
    </div>
  </div>
);

const Bubble: React.FC<{ isRight: boolean; skin: Skin; children: React.ReactNode }> = ({ isRight, skin, children }) => (
  <div
    style={{
      background: isRight ? skin.rightBubble : skin.leftBubble,
      color: isRight ? skin.rightText : skin.leftText,
      fontSize: 46,
      lineHeight: 1.3,
      padding: "22px 30px",
      borderRadius: skin.radius,
      borderBottomRightRadius: skin.tail && isRight ? 6 : skin.radius,
      borderBottomLeftRadius: skin.tail && !isRight ? 6 : skin.radius,
    }}
  >
    {children}
  </div>
);

const TypingDots: React.FC<{ skin: Skin }> = ({ skin }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 14, padding: "30px 34px" }}>
      {[0, 1, 2].map((d) => {
        const o = interpolate((frame + d * 5) % 18, [0, 9, 18], [0.3, 1, 0.3]);
        return <div key={d} style={{ width: 18, height: 18, borderRadius: 9, background: skin.typingDot, opacity: o }} />;
      })}
    </div>
  );
};

export const ChatScene: React.FC<{ scene: ChatSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = timeline(scene.messages, fps);
  const skin = SKINS[scene.skin ?? "whatsapp"];

  return (
    <AbsoluteFill style={{ background: skin.appBg, padding: 60, fontFamily: "sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {scene.header && <Header header={scene.header} skin={skin} />}
      {scene.title && (
        <div style={{ flex: "none", color: skin.titleColor, fontSize: 44, textAlign: "center", marginBottom: 30 }}>
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
                <div style={{ color: skin.senderColor, fontSize: 28, margin: isRight ? "0 8px 4px 0" : "0 0 4px 8px", textAlign: isRight ? "right" : "left" }}>
                  {m.name}
                </div>
              )}
              {typing ? (
                <Bubble isRight={isRight} skin={skin}><TypingDots skin={skin} /></Bubble>
              ) : (
                <Bubble isRight={isRight} skin={skin}>{m.text}</Bubble>
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
