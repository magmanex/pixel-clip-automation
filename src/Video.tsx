import { Fragment, useEffect, useState } from "react";
import { AbsoluteFill, Audio, staticFile, watchStaticFile, getRemotionEnvironment } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { ChatScene } from "./ChatScene";
import { CardScene } from "./CardScene";
import { SplitScene } from "./SplitScene";
import { StoryScene } from "./StoryScene";
import { EditProvider } from "./EditLayer";
import { SceneList } from "./SceneList";
import { DragLayer } from "./DragLayer";
import { Scene, Transition, sceneFrames, sceneTransition, transitionFrames } from "./schema";
import { sceneTrackName } from "./sceneLabel";
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
      <TransitionSeries from={-19}>
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
              <TransitionSeries.Sequence durationInFrames={sceneFrames(scene)} name={sceneTrackName(scene, i)}>
                {scene.type === "card" ? (
                  <CardScene scene={scene} />
                ) : scene.type === "split" ? (
                  <SplitScene scene={scene} />
                ) : scene.type === "story" ? (
                  <StoryScene scene={scene} sceneIndex={i} />
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
// Re-fetches the file when it changes (e.g. after an edit) so the preview updates
// live without a manual refresh. Initial data comes from calculateMetadata (props).
const SRC = "scenes.json";
export const EditableShort: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const [data, setData] = useState(scenes);
  useEffect(() => setData(scenes), [scenes]);
  useEffect(() => {
    if (getRemotionEnvironment().isRendering) return;
    const { cancel } = watchStaticFile(SRC, () => {
      fetch(staticFile(SRC)).then((r) => r.json()).then(setData).catch(() => {});
    });
    return cancel;
  }, []);
  return (
    <EditProvider src={SRC}>
      <SceneList src={SRC} />
      <DragLayer src={SRC} />
      <Short scenes={data} />
    </EditProvider>
  );
};
