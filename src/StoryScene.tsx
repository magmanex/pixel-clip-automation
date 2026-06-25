import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { StoryScene as StorySceneData, Actor, DialogueLine } from "./schema";
import { spriteFramesFor, characterName } from "./characters";
import { PixelSprite } from "./PixelSprite";
import { SFX_VOLUME } from "./config";

// Procedural falling tear — a small droplet that slides down the face and fades, looping.
// No art needed (so it can never garble); used on a crying actor (actor.cry).
const Tear: React.FC<{ delay?: number; x?: number }> = ({ delay = 0, x = 0 }) => {
  const frame = useCurrentFrame();
  const period = 55;
  const t = (((frame - delay) % period) + period) % period / period;
  const y = interpolate(t, [0, 1], [0, 150]);
  const opacity = interpolate(t, [0, 0.12, 0.8, 1], [0, 0.95, 0.9, 0]);
  return (
    <div style={{
      position: "absolute", left: `calc(50% + ${x}px)`, top: 110,
      width: 16, height: 22, transform: `translate(-50%, ${y}px)`,
      borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%",
      background: "linear-gradient(#cfeaff, #6fb8ef)", opacity,
      boxShadow: "0 0 4px rgba(140,200,255,0.6)",
    }} />
  );
};

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

const Stand: React.FC<{ actor: Actor; frames: string[]; active: boolean; sceneIndex?: number; actorIndex: number }> = ({ actor, frames, active, sceneIndex, actorIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18 } });
  // idle life: speaker bobs (engaged), everyone else breathes slowly — no one stands frozen.
  const idle = active
    ? Math.sin((frame / fps) * Math.PI * 2) * 6
    : Math.sin((frame / fps) * Math.PI) * 2.5;
  const scale = actor.scale ?? 1;
  // depth-of-field: explicit blur stages the actor (foreground/background); actors with a
  // set blur opt out of the speaker dim/brighten (they're scenery, not the focal pair).
  const blur = actor.blur ?? 0;
  const staged = actor.blur !== undefined;
  const dim = staged || active ? "none" : "brightness(0.7)";
  return (
    <div
      // data-drag-* = handles for the Studio-only DragLayer (Phase 3); inert in render.
      data-drag-scene={sceneIndex}
      data-drag-actor={actorIndex}
      data-drag-x={actor.x ?? 0}
      data-drag-y={actor.y ?? 0}
      data-drag-scale={scale}
      style={{
        position: "absolute",
        left: POS_X[actor.pos ?? "center"],
        bottom: 470 - (actor.y ?? 0), // sits above the dialogue box
        transform: `translateX(calc(-50% + ${actor.x ?? 0}px)) translateY(${(1 - intro) * 60 - idle}px) scale(${scale}) scaleX(${actor.flip ? -1 : 1})`,
        transformOrigin: "bottom center",
        opacity: staged ? 1 : active ? 1 : 0.55,
        filter: [blur ? `blur(${blur}px)` : "", dim].filter((s) => s && s !== "none").join(" ") || "none",
        cursor: sceneIndex !== undefined ? "grab" : undefined,
      }}
    >
      <PixelSprite frames={frames} style={{ width: 560, height: 560 }} />
      {actor.cry && (
        <>
          <Tear x={-46} delay={0} />
          <Tear x={48} delay={28} />
        </>
      )}
    </div>
  );
};

export const StoryScene: React.FC<{ scene: StorySceneData; sceneIndex?: number }> = ({ scene, sceneIndex }) => {
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

  // Procedural shock cue: when the current line's emotion is "shock", shake the whole
  // frame for ~14f as it lands (reads far stronger than a tiny pixel face). Slight scale
  // hides the edges the shake would otherwise expose.
  const shake = (() => {
    if (!line || line.emotion !== "shock" || !lt) return { x: 0, y: 0, on: false };
    const s = frame - lt.start;
    if (s < 0 || s > 14) return { x: 0, y: 0, on: false };
    const amp = interpolate(s, [0, 14], [16, 0]);
    return { x: Math.sin(s * 1.7) * amp, y: Math.cos(s * 2.1) * amp * 0.6, on: true };
  })();

  return (
    <AbsoluteFill style={{ background: scene.background ?? "#11131a", fontFamily: "sans-serif", overflow: "hidden", transform: shake.on ? `translate(${shake.x}px, ${shake.y}px) scale(1.04)` : undefined }}>
      {scene.bgImage && (
        <Img src={staticFile(scene.bgImage)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}

      {/* characters: the one whose line is current is highlighted + swaps emotion */}
      {scene.characters.map((a, i) => {
        const active = !!line && line.characterId === a.characterId;
        const emotion = active ? (line!.emotion ?? a.emotion) : a.emotion;
        const frames = spriteFramesFor(a.characterId, emotion);
        if (frames.length === 0) return null;
        return <Stand key={i} actor={a} frames={frames} active={active || !line} sceneIndex={sceneIndex} actorIndex={i} />;
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
