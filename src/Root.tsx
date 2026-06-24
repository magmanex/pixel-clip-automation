import { Composition, staticFile } from "remotion";
import { Short, EditableShort } from "./Video";
import { FPS, WIDTH, HEIGHT, totalFrames, Scene, sceneSchema, shortSchema } from "./schema";

// #10 batch: one composition per clips/*.json (id "Clip-<name>"), plus the
// editable "Short" loaded from public/scenes.json. Drop a JSON in clips/ → new comp.
// require.context is a webpack feature (Remotion's bundler); not in Node types.
const ctx = (require as unknown as { context: (d: string, r: boolean, re: RegExp) => { keys: () => string[]; (k: string): unknown } }).context("../clips", false, /\.json$/);
const clips = ctx.keys().map((k) => ({
  id: "Clip-" + k.replace(/^\.\//, "").replace(/\.json$/, ""),
  data: ctx(k) as Scene[],
}));

const dims = { fps: FPS, width: WIDTH, height: HEIGHT };
const SCENES_FILE = "scenes.json"; // under public/; editable in Studio (#11)

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Active video: data lives in public/scenes.json so Studio can write edits
          back to it (double-click a bubble). Loaded at runtime via calculateMetadata. */}
      <Composition
        id="Short"
        component={EditableShort}
        durationInFrames={1}
        defaultProps={{ scenes: [] as Scene[] }}
        calculateMetadata={async () => {
          const raw = await fetch(staticFile(SCENES_FILE)).then((r) => r.json());
          const scenes = sceneSchema.array().parse(raw);
          return { durationInFrames: totalFrames(scenes), props: { scenes } };
        }}
        {...dims}
      />
      {/* #10 batch clips: static props, editable via the Studio props form. */}
      {clips.map((c) => (
        <Composition key={c.id} id={c.id} component={Short} schema={shortSchema} durationInFrames={totalFrames(c.data)} defaultProps={{ scenes: c.data }} {...dims} />
      ))}
    </>
  );
};
