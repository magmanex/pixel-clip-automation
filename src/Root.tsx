import { Composition } from "remotion";
import scenes from "../scenes.json";
import { Short } from "./Video";
import { FPS, WIDTH, HEIGHT, totalFrames, Scene } from "./schema";

// #10 batch: one composition per clips/*.json (id "Clip-<name>"), plus the
// default "Short" from scenes.json. Drop a JSON file in clips/ → new comp.
// require.context is a webpack feature (Remotion's bundler); not in Node types.
const ctx = (require as unknown as { context: (d: string, r: boolean, re: RegExp) => { keys: () => string[]; (k: string): unknown } }).context("../clips", false, /\.json$/);
const clips = ctx.keys().map((k) => ({
  id: "Clip-" + k.replace(/^\.\//, "").replace(/\.json$/, ""),
  data: ctx(k) as Scene[],
}));

const dims = { fps: FPS, width: WIDTH, height: HEIGHT };

export const RemotionRoot: React.FC = () => {
  const data = scenes as Scene[];
  return (
    <>
      <Composition id="Short" component={Short} durationInFrames={totalFrames(data)} defaultProps={{ scenes: data }} {...dims} />
      {clips.map((c) => (
        <Composition key={c.id} id={c.id} component={Short} durationInFrames={totalFrames(c.data)} defaultProps={{ scenes: c.data }} {...dims} />
      ))}
    </>
  );
};
