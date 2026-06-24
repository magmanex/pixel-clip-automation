// #7 Chat skins: per-scene look (LINE / IG / Messenger / WhatsApp-ish default).
// Pure presentation — colors + bubble shape. ChatScene reads these; scenes.json
// picks one via the "skin" field (omit = whatsapp).

export type SkinName = "whatsapp" | "line" | "ig" | "messenger";

export type Skin = {
  appBg: string; // scene background
  rightBubble: string;
  rightText: string;
  leftBubble: string;
  leftText: string;
  headerBorder: string;
  nameColor: string; // header name
  subColor: string; // header subtitle
  avatarBg: string;
  avatarColor: string;
  senderColor: string; // per-message name above bubble
  typingDot: string;
  titleColor: string;
  radius: number;
  tail: boolean; // small clipped corner on the sender's side (WhatsApp look)
};

export const SKINS: Record<SkinName, Skin> = {
  whatsapp: {
    appBg: "#0b141a",
    rightBubble: "#005c4b", rightText: "#e9edef",
    leftBubble: "#1f2c34", leftText: "#e9edef",
    headerBorder: "#1f2c34",
    nameColor: "#e9edef", subColor: "#7d8b95",
    avatarBg: "#005c4b", avatarColor: "#e9edef",
    senderColor: "#7d8b95", typingDot: "#8aa", titleColor: "#8aa",
    radius: 26, tail: true,
  },
  line: {
    appBg: "#8cabd9", // LINE default wallpaper blue
    rightBubble: "#06c755", rightText: "#ffffff",
    leftBubble: "#ffffff", leftText: "#111111",
    headerBorder: "rgba(0,0,0,0.12)",
    nameColor: "#1a1a1a", subColor: "#3a4a5a",
    avatarBg: "#06c755", avatarColor: "#ffffff",
    senderColor: "#2a3a4a", typingDot: "#888888", titleColor: "#13335a",
    radius: 22, tail: false,
  },
  ig: {
    appBg: "#000000",
    rightBubble: "#3797f0", rightText: "#ffffff",
    leftBubble: "#262626", leftText: "#ffffff",
    headerBorder: "#262626",
    nameColor: "#ffffff", subColor: "#a8a8a8",
    avatarBg: "#3797f0", avatarColor: "#ffffff",
    senderColor: "#a8a8a8", typingDot: "#888888", titleColor: "#a8a8a8",
    radius: 30, tail: false,
  },
  messenger: {
    appBg: "#ffffff",
    rightBubble: "#0084ff", rightText: "#ffffff",
    leftBubble: "#e4e6eb", leftText: "#050505",
    headerBorder: "#e4e6eb",
    nameColor: "#050505", subColor: "#65676b",
    avatarBg: "#0084ff", avatarColor: "#ffffff",
    senderColor: "#65676b", typingDot: "#999999", titleColor: "#65676b",
    radius: 30, tail: false,
  },
};
