import { z } from "zod";
import raw from "../public/characters.json";

// #A1 character cast registry. public/characters.json: each char = name + a sprite
// set keyed by emotion. Scenes reference characterId instead of raw image paths so a
// recurring character keeps a consistent look (and can swap emotion per beat — #A4).
export const characterSchema = z.object({
  name: z.string(),
  // emotion -> a sprite path, OR an array of frame paths for a tiny animation loop
  // (idle/blink/cry). "neutral" = fallback. A single string = a static sprite.
  sprites: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});
export const charactersSchema = z.record(z.string(), characterSchema);
export type Character = z.infer<typeof characterSchema>;

export const CHARACTERS = charactersSchema.parse(raw);

const framesOf = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

// All frames for a characterId+emotion (1 entry = static sprite). Falls back to neutral.
export const spriteFramesFor = (characterId?: string, emotion?: string): string[] => {
  if (!characterId) return [];
  const c = CHARACTERS[characterId];
  if (!c) return [];
  const v = c.sprites[emotion ?? "neutral"] ?? c.sprites.neutral;
  return framesOf(v);
};

// #A2 resolve a characterId (+ optional emotion) to a single sprite path (first frame).
// Falls back to the neutral sprite when the emotion is missing; undefined if no char.
export const spriteFor = (characterId?: string, emotion?: string): string | undefined =>
  spriteFramesFor(characterId, emotion)[0];

export const characterName = (characterId?: string): string | undefined =>
  characterId ? CHARACTERS[characterId]?.name : undefined;
