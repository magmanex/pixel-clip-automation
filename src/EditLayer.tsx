import { createContext, useContext, useState, ReactNode } from "react";
import { AbsoluteFill, getRemotionEnvironment, staticFile } from "remotion";
import { writeStaticFile } from "@remotion/studio";

// Double-click a chat bubble in Studio → modal to edit that message's text,
// persisted back to the source JSON in public/. Studio-only: in render/player
// the provider is a passthrough, so nothing ships in the MP4.

type EditReq = { sceneIndex: number; msgIndex: number; text: string };
const Ctx = createContext<(r: EditReq) => void>(() => {});
export const useEditor = () => useContext(Ctx);

// src = path under public/ (e.g. "scenes.json"). Omit/non-studio = editing off.
export const EditProvider: React.FC<{ src?: string; children: ReactNode }> = ({ src, children }) => {
  const [req, setReq] = useState<EditReq | null>(null);
  const [draft, setDraft] = useState("");

  // Disable only during the actual headless render (isStudio is unreliable in the
  // preview iframe; isRendering is true only when rendering the MP4). So the modal
  // works in the Studio preview but never ships in output.
  if (getRemotionEnvironment().isRendering || !src) return <>{children}</>;

  const open = (r: EditReq) => { setReq(r); setDraft(r.text); };
  const save = async () => {
    if (!req) return;
    const data = await fetch(staticFile(src)).then((r) => r.json());
    data[req.sceneIndex].messages[req.msgIndex].text = draft;
    await writeStaticFile({ filePath: src, contents: JSON.stringify(data, null, 2) });
    setReq(null);
  };

  return (
    <Ctx.Provider value={open}>
      {children}
      {req && (
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 36, borderRadius: 18, width: 800, display: "flex", flexDirection: "column", gap: 18, fontFamily: "sans-serif" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#111" }}>แก้ข้อความ</div>
            <textarea
              value={draft}
              autoFocus
              rows={4}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") setReq(null); }}
              style={{ fontSize: 34, padding: 18, borderRadius: 10, border: "2px solid #ccc", color: "#111", fontFamily: "sans-serif", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
              <button onClick={() => setReq(null)} style={btn("#888")}>ยกเลิก</button>
              <button onClick={save} style={btn("#005c4b")}>บันทึก (⌘↵)</button>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </Ctx.Provider>
  );
};

const btn = (bg: string): React.CSSProperties => ({ background: bg, color: "#fff", border: "none", fontSize: 28, padding: "14px 30px", borderRadius: 999, cursor: "pointer" });
