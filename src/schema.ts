import { z } from "zod";

export const FPS = 30;
export const WIDTH = 1080; // YouTube Short vertical
export const HEIGHT = 1920;

// Scene/message shapes are zod schemas so Remotion Studio renders an editable
// props form (edit chat text live in the Studio). TS types are inferred below.

export const messageSchema = z.object({
  side: z.enum(["left", "right"]),
  name: z.string().optional(),
  text: z.string(),
  // sfx file in public/sfx/ when this message appears. omit = default pop; null = silent.
  sfx: z.string().nullable().optional(),
  // #4 timing (sec): delaySec = pause before typing (beat); typingSec = "..." length.
  delaySec: z.number().optional(),
  typingSec: z.number().optional(),
  // #A2/#A4 pixel-art speaker: characterId resolves to a sprite (characters.json);
  // emotion picks the variant so the character reacts as the beat lands.
  characterId: z.string().optional(),
  emotion: z.string().optional(),
});

export const chatHeaderSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(), // image in public/; omit = initial circle
  subtitle: z.string().optional(),
  characterId: z.string().optional(), // #A2 resolve avatar from characters.json instead
});

// #5 transition entering this scene. First scene's is ignored. "cut" = hard cut.
export const transitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "cut"]),
  durationSec: z.number().optional(),
  direction: z.enum(["from-left", "from-right", "from-top", "from-bottom"]).optional(),
});

// #9 background media for overlay scenes (image/video behind the chat).
export const mediaSchema = z.object({
  src: z.string(), // public/ path
  kind: z.enum(["image", "video"]).optional(), // default image
});

export const skinNameSchema = z.enum(["whatsapp", "line", "ig", "messenger"]); // #7

const baseFields = { durationSec: z.number(), transition: transitionSchema.optional() };

const chatFields = {
  ...baseFields,
  title: z.string().optional(),
  header: chatHeaderSchema.optional(),
  messages: z.array(messageSchema),
  skin: skinNameSchema.optional(),
  media: mediaSchema.optional(),
};
export const chatSceneSchema = z.object({ type: z.literal("chat"), ...chatFields });
export const overlaySceneSchema = z.object({ type: z.literal("overlay"), ...chatFields }); // #9

// #6 intro hook / outro card — full-screen centered text.
export const cardSceneSchema = z.object({
  type: z.literal("card"),
  ...baseFields,
  title: z.string(),
  subtitle: z.string().optional(),
  emoji: z.string().optional(),
  cta: z.string().optional(),
  background: z.string().optional(), // CSS color
});

// #8 split scene — two panels (image fill and/or centered emoji + text).
export const splitPanelSchema = z.object({
  background: z.string().optional(),
  image: z.string().optional(),
  characterId: z.string().optional(), // #A2 resolve panel image from characters.json
  emotion: z.string().optional(),
  emoji: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});
export const splitSceneSchema = z.object({
  type: z.literal("split"),
  ...baseFields,
  direction: z.enum(["horizontal", "vertical"]).optional(), // horizontal = left|right
  panels: z.tuple([splitPanelSchema, splitPanelSchema]),
});

// #A5 "story" scene — Until Then style: pixel characters standing in a scene with a
// visual-novel dialogue box at the bottom, advancing one line at a time. The speaking
// character swaps to the line's emotion; others dim.
export const actorSchema = z.object({
  characterId: z.string(),
  emotion: z.string().optional(), // resting emotion; a dialogue line can override it
  pos: z.enum(["left", "center", "right"]).optional(), // default center
  flip: z.boolean().optional(), // mirror horizontally (face the other actor)
  // depth-of-field staging (Until Then look): blur = px of foreground/background blur,
  // scale = size multiplier (>1 = closer/foreground), x/y = manual offset in px.
  blur: z.number().optional(),
  scale: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});
export const dialogueLineSchema = z.object({
  characterId: z.string().optional(), // who speaks → name label + emotion swap + highlight
  name: z.string().optional(), // override the speaker label (e.g. narrator)
  text: z.string(),
  emotion: z.string().optional(), // speaker's emotion for this line
  delaySec: z.number().optional(), // beat before the line starts
  holdSec: z.number().optional(), // read time after the text finishes typing
  sfx: z.string().nullable().optional(), // public/sfx/ file when the line lands
});
export const storySceneSchema = z.object({
  type: z.literal("story"),
  ...baseFields,
  background: z.string().optional(), // CSS color
  bgImage: z.string().optional(), // public/ image path (fills, behind characters)
  characters: z.array(actorSchema),
  dialogue: z.array(dialogueLineSchema),
});

export const sceneSchema = z.discriminatedUnion("type", [
  chatSceneSchema,
  overlaySceneSchema,
  cardSceneSchema,
  splitSceneSchema,
  storySceneSchema,
]);

// Props of the Short composition — the root the Studio form edits.
export const shortSchema = z.object({ scenes: z.array(sceneSchema) });

export type Message = z.infer<typeof messageSchema>;
export type ChatHeader = z.infer<typeof chatHeaderSchema>;
export type Transition = z.infer<typeof transitionSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type SkinName = z.infer<typeof skinNameSchema>;
export type ChatScene = z.infer<typeof chatSceneSchema> | z.infer<typeof overlaySceneSchema>;
export type CardScene = z.infer<typeof cardSceneSchema>;
export type SplitPanel = z.infer<typeof splitPanelSchema>;
export type SplitScene = z.infer<typeof splitSceneSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type DialogueLine = z.infer<typeof dialogueLineSchema>;
export type StoryScene = z.infer<typeof storySceneSchema>;
export type Scene = z.infer<typeof sceneSchema>;

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
