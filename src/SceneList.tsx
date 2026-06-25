import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRemotionEnvironment, staticFile, watchStaticFile } from "remotion";
import { writeStaticFile } from "@remotion/studio";
import { Scene } from "./schema";
import { sceneContent } from "./sceneLabel";

// #11 Editor Phase 1 — Studio-only scene list: reorder / duplicate / delete
// scenes and edit each scene's durationSec, writing back to public/<src>. This is
// the "rearrange tracks" pain point — Remotion's own timeline is read-only.
//
// Same Studio-only contract as EditLayer: gated by isRendering so nothing ships in
// the MP4, portaled to document.body so it sits above the Studio's canvas overlay.
// ponytail: ↑/↓ buttons instead of drag-and-drop — covers reorder in a fraction of
// the code. Upgrade to HTML5 drag (draggable + onDragOver) only if buttons feel slow.

export const SceneList: React.FC<{ src: string }> = ({ src }) => {
  const active = !getRemotionEnvironment().isRendering;
  const [open, setOpen] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);

  // Load + keep in sync with the file (so external edits and our own writes show).
  useEffect(() => {
    if (!active) return;
    const load = () => fetch(staticFile(src)).then((r) => r.json()).then(setScenes).catch(() => {});
    load();
    const { cancel } = watchStaticFile(src, load);
    return cancel;
  }, [active, src]);

  if (!active) return null;

  // All mutations go through here: apply to a copy, persist whole file.
  const commit = async (next: Scene[]) => {
    setScenes(next);
    await writeStaticFile({ filePath: src, contents: JSON.stringify(next, null, 2) });
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= scenes.length) return;
    const next = [...scenes];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const duplicate = (i: number) => {
    const next = [...scenes];
    next.splice(i + 1, 0, JSON.parse(JSON.stringify(scenes[i])));
    commit(next);
  };
  const remove = (i: number) => commit(scenes.filter((_, k) => k !== i));
  const setDuration = (i: number, v: number) => {
    if (!Number.isFinite(v) || v <= 0) return;
    const next = scenes.map((s, k) => (k === i ? { ...s, durationSec: v } : s));
    commit(next);
  };

  return createPortal(
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999998, fontFamily: "sans-serif" }}>
      <button onClick={() => setOpen((o) => !o)} style={toggleBtn}>
        {open ? "✕ ปิด" : "☰ Scenes"}
      </button>
      {open && (
        <div style={panel}>
          {scenes.map((s, i) => (
            <div key={i} style={row}>
              <span style={idx}>{i + 1}</span>
              <span style={typeTag}>{s.type}</span>
              <span style={name} title={sceneContent(s)}>{sceneContent(s)}</span>
              <input
                type="number"
                step={0.5}
                min={0.5}
                value={s.durationSec}
                onChange={(e) => setDuration(i, Number(e.target.value))}
                style={dur}
                title="durationSec"
              />
              <span style={{ color: "#888", fontSize: 11 }}>s</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={iconBtn} title="ขึ้น">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === scenes.length - 1} style={iconBtn} title="ลง">↓</button>
              <button onClick={() => duplicate(i)} style={iconBtn} title="ทำซ้ำ">⧉</button>
              <button onClick={() => remove(i)} style={{ ...iconBtn, color: "#e66" }} title="ลบ">✕</button>
            </div>
          ))}
          {scenes.length === 0 && <div style={{ color: "#888", padding: 8 }}>ไม่มี scene</div>}
        </div>
      )}
    </div>,
    document.body,
  );
};

const toggleBtn: React.CSSProperties = { background: "#005c4b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer", fontWeight: 600 };
const panel: React.CSSProperties = { marginTop: 8, background: "#1b2730", border: "1px solid #2e3d47", borderRadius: 10, padding: 8, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "4px 2px", borderBottom: "1px solid #25323b" };
const idx: React.CSSProperties = { color: "#7aa", width: 18, textAlign: "right", fontSize: 12 };
const typeTag: React.CSSProperties = { color: "#8cd", fontSize: 11, width: 52 };
const name: React.CSSProperties = { color: "#dde", fontSize: 12, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const dur: React.CSSProperties = { width: 52, background: "#0e1419", color: "#fff", border: "1px solid #2e3d47", borderRadius: 5, padding: "3px 5px", fontSize: 12 };
const iconBtn: React.CSSProperties = { background: "#26333d", color: "#cde", border: "none", borderRadius: 5, width: 24, height: 24, cursor: "pointer", fontSize: 13 };
