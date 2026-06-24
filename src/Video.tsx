import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { ChatScene } from "./ChatScene";
import { Scene, sceneFrames } from "./schema";
import { BGM_FILE, BGM_VOLUME } from "./config";

// ponytail: Series = hard cuts between scenes. Want fade/slide?
// swap to <TransitionSeries> from @remotion/transitions (npm i @remotion/transitions).
export const Short: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b141a" }}>
      {BGM_FILE && (
        <Audio src={staticFile(BGM_FILE)} volume={BGM_VOLUME} loop />
      )}
      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={sceneFrames(scene)}>
            <ChatScene scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
