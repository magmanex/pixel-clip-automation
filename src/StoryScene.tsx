import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { StoryScene as StorySceneData, Actor, DialogueLine } from "./schema";
import { spriteFor, characterName } from "./characters";
import { SFX_VOLUME } from "./config";

// #A5 Until-Then style stage: pixel characters standing in a scene, visual-novel
// dialogue box advancing one line at a time. Speaker swaps emotion + steps forward;
// the others dim back.
const LEAD = 8;            // frames before the first line starts
const PER_CHAR = 1.1;      // typewriter frames per character
const REVEAL_MIN = 10, REVEAL_MAX = 70;
const HOLD = 42;           // default read time after a line finishes typing

type Line = { start: number; revealEnd: number; end: number };

const timeline = (dialogue: DialogueLine[], fps: number): Line[] => {
  const items: Line[] = [];
  let t = LEAD;
  for (const d of dialogue) {
    t += Math.round((d.delaySec ?? 0) * fps);
    const start = t;
    const reveal = Math.min(REVEAL_MAX, Math.max(REVEAL_MIN, Math.round(d.text.length * PER_CHAR)));
    const revealEnd = start + reveal;
    const hold = d.holdSec !== undefined ? Math.round(d.holdSec * fps) : HOLD;
    t = revealEnd + hold;
    items.push({ start, revealEnd, end: t });
  }
  return items;
};

const POS_X: Record<string, string> = { left: "22%", center: "50%", right: "78%" };

const Stand: React.FC<{ actor: Actor; sprite: string; active: boolean }> = ({ actor, sprite, active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18 } });
  const bob = active ? Math.sin((frame / fps) * Math.PI * 2) * 6 : 0; // gentle idle on speaker
  const scale = actor.scale ?? 1;
  // depth-of-field: explicit blur stages the actor (foreground/background); actors with a
  // set blur opt out of the speaker dim/brighten (they're scenery, not the focal pair).
  const blur = actor.blur ?? 0;
  const staged = actor.blur !== undefined;
  const dim = staged || active ? "none" : "brightness(0.7)";
  return (
    <div
      style={{
        position: "absolute",
        left: POS_X[actor.pos ?? "center"],
        bottom: 470 - (actor.y ?? 0), // sits above the dialogue box
        transform: `translateX(calc(-50% + ${actor.x ?? 0}px)) translateY(${(1 - intro) * 60 - bob}px) scale(${scale}) scaleX(${actor.flip ? -1 : 1})`,
        transformOrigin: "bottom center",
        opacity: staged ? 1 : active ? 1 : 0.55,
        filter: [blur ? `blur(${blur}px)` : "", dim].filter((s) => s && s !== "none").join(" ") || "none",
      }}
    >
      <Img src={staticFile(sprite)} style={{ width: 560, height: 560, imageRendering: "pixelated" }} />
    </div>
  );
};

export const StoryScene: React.FC<{ scene: StorySceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = timeline(scene.dialogue, fps);

  // current line = last one already started; nothing before the first line starts.
  let cur = -1;
  for (let i = 0; i < tl.length; i++) if (frame >= tl[i].start) cur = i;
  const line = cur >= 0 ? scene.dialogue[cur] : undefined;
  const lt = cur >= 0 ? tl[cur] : undefined;

  const speakerName = line ? (line.name ?? characterName(line.characterId)) : undefined;
  const shownText = line && lt
    ? line.text.slice(0, Math.round(interpolate(frame, [lt.start, lt.revealEnd], [0, line.text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))
    : "";
  const boxIn = lt ? spring({ frame: frame - lt.start, fps, config: { damping: 200 } }) : 0;

  return (
    <AbsoluteFill style={{ background: scene.background ?? "#11131a", fontFamily: "sans-serif", overflow: "hidden" }}>
      {scene.bgImage && (
        <Img src={staticFile(scene.bgImage)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}

      {/* characters: the one whose line is current is highlighted + swaps emotion */}
      {scene.characters.map((a, i) => {
        const active = !!line && line.characterId === a.characterId;
        const emotion = active ? (line!.emotion ?? a.emotion) : a.emotion;
        const sprite = spriteFor(a.characterId, emotion);
        if (!sprite) return null;
        return <Stand key={i} actor={a} sprite={sprite} active={active || !line} />;
      })}

      {/* visual-novel dialogue box */}
      {line && (
        <div
          style={{
            position: "absolute", left: 50, right: 50, bottom: 70,
            background: "rgba(15,17,24,0.92)", border: "4px solid rgba(255,255,255,0.85)",
            borderRadius: 28, padding: "46px 50px 54px", minHeight: 300,
            opacity: boxIn, transform: `translateY(${(1 - boxIn) * 30}px)`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {speakerName && (
            <div style={{
              position: "absolute", top: -34, left: 36,
              background: "#f4c89a", color: "#1a1a1a", fontWeight: 800, fontSize: 38,
              padding: "8px 26px", borderRadius: 14, border: "4px solid rgba(255,255,255,0.85)",
            }}>{speakerName}</div>
          )}
          <div style={{ color: "#f2f5fa", fontSize: 56, lineHeight: 1.4, fontWeight: 500 }}>
            {shownText}
            {lt && frame < lt.revealEnd && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>
        </div>
      )}

      {/* SFX when a line lands */}
      {scene.dialogue.map((d, i) =>
        d.sfx ? (
          <Sequence key={`sfx-${i}`} from={tl[i].start}>
            <Audio src={staticFile(`sfx/${d.sfx}`)} volume={SFX_VOLUME} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
