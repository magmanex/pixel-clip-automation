// Audio settings. Files live in public/ and are referenced via staticFile().
// ponytail: placeholder bgm.mp3 is a plain tone — replace public/bgm.mp3 with a real track.

export const BGM_FILE: string | null = "bgm.mp3"; // null = no background music
export const BGM_VOLUME = 0.25;

export const DEFAULT_SFX = "pop.mp3"; // played when a message appears
export const SFX_VOLUME = 0.7;
