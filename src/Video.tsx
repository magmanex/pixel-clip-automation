import { Fragment } from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { ChatScene } from "./ChatScene";
import { CardScene } from "./CardScene";
import { SplitScene } from "./SplitScene";
import { EditProvider } from "./EditLayer";
import { Scene, Transition, sceneFrames, sceneTransition, transitionFrames } from "./schema";
import { BGM_FILE, BGM_VOLUME } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentation = (t: Transition): TransitionPresentation<any> => {
  switch (t.type) {
    case "slide":
      return slide({ direction: t.direction ?? "from-right" });
    case "wipe":
      return wipe({ direction: t.direction ?? "from-right" });
    default:
      return fade();
  }
};

export const Short: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b141a" }}>
      {BGM_FILE && <Audio src={staticFile(BGM_FILE)} volume={BGM_VOLUME} loop />}
      <TransitionSeries>
        {scenes.map((scene, i) => {
          const t = sceneTransition(scene, i);
          const frames = transitionFrames(t);
          return (
            <Fragment key={i}>
              {t && frames > 0 && (
                <TransitionSeries.Transition
                  presentation={presentation(t)}
                  timing={linearTiming({ durationInFrames: frames })}
                />
              )}
              <TransitionSeries.Sequence durationInFrames={sceneFrames(scene)}>
                {scene.type === "card" ? (
                  <CardScene scene={scene} />
                ) : scene.type === "split" ? (
                  <SplitScene scene={scene} />
                ) : (
                  <ChatScene scene={scene} sceneIndex={i} />
                )}
              </TransitionSeries.Sequence>
            </Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// Same as Short, but wrapped so chat bubbles are double-click editable in Studio,
// persisting to public/scenes.json (#11). Used only by the "Short" composition.
export const EditableShort: React.FC<{ scenes: Scene[] }> = (props) => (
  <EditProvider src="scenes.json">
    <Short {...props} />
  </EditProvider>
);
