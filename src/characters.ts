import { z } from "zod";
import raw from "../public/characters.json";

// #A1 character cast registry. public/characters.json: each char = name + a sprite
// set keyed by emotion. Scenes reference characterId instead of raw image paths so a
// recurring character keeps a consistent look (and can swap emotion per beat — #A4).
export const characterSchema = z.object({
  name: z.string(),
  sprites: z.record(z.string(), z.string()), // emotion -> public/ path. "neutral" = fallback.
});
export const charactersSchema = z.record(z.string(), characterSchema);
export type Character = z.infer<typeof characterSchema>;

export const CHARACTERS = charactersSchema.parse(raw);

// #A2 resolve a characterId (+ optional emotion) to a sprite path under public/.
// Falls back to the neutral sprite when the emotion is missing; undefined if no char.
export const spriteFor = (characterId?: string, emotion?: string): string | undefined => {
  if (!characterId) return undefined;
  const c = CHARACTERS[characterId];
  if (!c) return undefined;
  return c.sprites[emotion ?? "neutral"] ?? c.sprites.neutral;
};

export const characterName = (characterId?: string): string | undefined =>
  characterId ? CHARACTERS[characterId]?.name : undefined;
