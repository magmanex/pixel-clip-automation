import { Composition } from "remotion";
import scenes from "../scenes.json";
import { Short } from "./Video";
import { FPS, WIDTH, HEIGHT, totalFrames, Scene } from "./schema";

export const RemotionRoot: React.FC = () => {
  const data = scenes as Scene[];
  return (
    <Composition
      id="Short"
      component={Short}
      durationInFrames={totalFrames(data)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ scenes: data }}
    />
  );
};
