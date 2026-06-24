# AI prompt — generate a chat-story clip (scenes JSON)

Workflow:

1. Paste the prompt below + your story idea into any AI (Claude / GPT).
2. Save its output to one of:
   - `public/scenes.json` → the **`Short`** composition. Edit text by
     **double-clicking a bubble** in the Studio preview (saves back to this file).
   - `clips/<name>.json` → a **`Clip-<name>`** composition for batch render
     (`npm run render:all`); tweak via the right-hand **Props** form.
3. Preview / edit: `npm run dev` → pick the composition.
4. Render: `npm run render` (Short → `out/video.mp4`) or `npx remotion render Clip-<name> out/<name>.mp4`.

Remotion validates the JSON against the schema (`src/schema.ts`) when you open it
in Studio or render — bad fields surface there.

---

## Prompt (copy from here)

You generate data for a YouTube Shorts **chat-story** video (vertical 1080×1920,
30fps, no voice-over — the comedy is in the chat). Output **ONLY** a JSON array of
"scene" objects. No markdown, no prose, no comments.

A scene is one of four `type`s. All scenes have `durationSec` (number, seconds) and
an optional `transition`.

### type "card" — full-screen centered text (use for intro hook + outro CTA)
```
{ "type": "card", "durationSec": 2.5, "emoji": "😱",
  "title": "required string", "subtitle": "optional", "cta": "optional (outro call-to-action)",
  "background": "optional CSS color" }
```

### type "chat" — the main chat bubbles
```
{ "type": "chat", "durationSec": 6,
  "skin": "whatsapp" | "line" | "ig" | "messenger",   // optional, default whatsapp
  "header": { "name": "ชื่อแชท", "subtitle": "ออนไลน์", "avatar": "optional public/ image path" },
  "title": "optional small caption at top",
  "messages": [
    { "side": "left" | "right",          // left = other person, right = "us"
      "name": "optional sender label",
      "text": "the message text",
      "delaySec": 1,                      // optional: extra pause before this msg (comedy beat)
      "typingSec": 1.2,                   // optional: how long the "..." shows (0 = no typing dots)
      "sfx": "pop.mp3"                    // optional: omit = default pop; null = silent
    }
  ] }
```

### type "overlay" — same as "chat" but with a background image/video behind the bubbles
```
{ "type": "overlay", "durationSec": 4,
  "media": { "src": "public/ path", "kind": "image" | "video" },
  "header": {...}, "messages": [...] , "skin": ... }   // same fields as chat
```

### type "split" — two panels side by side (or top/bottom)
```
{ "type": "split", "durationSec": 2.5,
  "direction": "horizontal" | "vertical",   // optional, default horizontal (left|right)
  "panels": [
    { "background": "#1a2a6c", "emoji": "😎", "title": "เรา", "subtitle": "optional" },
    { "background": "#b21f1f", "emoji": "😤", "title": "เจ้านาย" }
  ] }   // exactly 2 panels; each can also use "image": "public/ path"
```

### transition (optional, on any scene — plays when ENTERING it; first scene ignores it)
```
"transition": { "type": "fade" | "slide" | "wipe" | "cut",
  "durationSec": 0.5,
  "direction": "from-left" | "from-right" | "from-top" | "from-bottom" }  // default fade
```

### Rules
- Keep it short and punchy — total ~20–45s. Front-load the hook (first 2s).
- Open with a `card` hook, end with a `card` CTA ("กดติดตามด้วยน้า" style).
- Use `delaySec`/`typingSec` for comic timing on the punchline message.
- Thai text is fine. Emojis encouraged.
- Only reference `media`/`avatar`/`image` files that exist in `public/`; otherwise omit them.

### Example output
```json
[
  { "type": "card", "durationSec": 2.5, "emoji": "😱", "title": "แชทหลุดโลก", "subtitle": "ที่จะทำให้คุณกุมขมับ" },
  { "type": "chat", "skin": "line", "durationSec": 6,
    "header": { "name": "เพื่อนซี้", "subtitle": "ออนไลน์" },
    "messages": [
      { "side": "left", "name": "เพื่อน", "text": "เฮ้ย ตื่นยัง" },
      { "side": "right", "name": "เรา", "text": "ตื่นสิ ทำไม" },
      { "side": "left", "name": "เพื่อน", "text": "วันนี้เสาร์ว่ะ" },
      { "side": "right", "name": "เรา", "text": "...แล้วกูใส่ชุดทำงานมาทำไม", "delaySec": 1, "typingSec": 1.2 }
    ] },
  { "type": "card", "durationSec": 3, "emoji": "🔔", "title": "ชอบคลิปนี้?", "subtitle": "มีแชทฮาๆ ทุกวัน", "cta": "กดติดตามด้วยน้า" }
]
```

Now generate scenes for this idea: <<YOUR STORY IDEA HERE>>
