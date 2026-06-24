import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { getRemotionEnvironment, staticFile } from "remotion";
import { writeStaticFile } from "@remotion/studio";

// Edit chat text in the Studio preview: double-click a bubble → modal → saves
// back to the source JSON in public/.
//
// Two Studio quirks this works around:
//  - The Studio draws an SVG selection overlay (pointer-events) on top of the
//    canvas, so onClick handlers on our elements never fire. We listen for
//    `dblclick` on window in the capture phase instead, and hit-test bubbles by
//    their data-edit-* attributes + bounding rect.
//  - Anything rendered inside the composition is also under that overlay, so the
//    modal is portaled to document.body (above the overlay, fully interactive).
//
// Disabled during the actual headless render (isRendering), so nothing ships in
// the MP4. src = path under public/ (e.g. "scenes.json").

type EditReq = { sceneIndex: number; msgIndex: number; text: string };

export const EditProvider: React.FC<{ src?: string; children: ReactNode }> = ({ src, children }) => {
  const [req, setReq] = useState<EditReq | null>(null);
  const [draft, setDraft] = useState("");
  const active = !getRemotionEnvironment().isRendering && !!src;

  useEffect(() => {
    if (!active) return;
    const onDbl = (e: MouseEvent) => {
      const els = [...document.querySelectorAll<HTMLElement>("[data-edit-scene]")].reverse();
      const hit = els.find((el) => {
        const r = el.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      const text = hit.dataset.editText ?? "";
      setReq({ sceneIndex: Number(hit.dataset.editScene), msgIndex: Number(hit.dataset.editMsg), text });
      setDraft(text);
    };
    window.addEventListener("dblclick", onDbl, true);
    return () => window.removeEventListener("dblclick", onDbl, true);
  }, [active]);

  const save = async () => {
    if (!req || !src) return;
    const data = await fetch(staticFile(src)).then((r) => r.json());
    data[req.sceneIndex].messages[req.msgIndex].text = draft;
    await writeStaticFile({ filePath: src, contents: JSON.stringify(data, null, 2) });
    setReq(null);
  };

  return (
    <>
      {children}
      {req &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, fontFamily: "sans-serif" }}>
            <div style={{ background: "#fff", padding: 28, borderRadius: 14, width: 560, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>แก้ข้อความ</div>
              <textarea
                value={draft}
                autoFocus
                rows={4}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") setReq(null); }}
                style={{ fontSize: 22, padding: 12, borderRadius: 8, border: "2px solid #ccc", color: "#111", fontFamily: "sans-serif", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setReq(null)} style={btn("#888")}>ยกเลิก</button>
                <button onClick={save} style={btn("#005c4b")}>บันทึก (⌘↵)</button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

const btn = (bg: string): React.CSSProperties => ({ background: bg, color: "#fff", border: "none", fontSize: 18, padding: "10px 22px", borderRadius: 999, cursor: "pointer" });
