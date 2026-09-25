import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneWrap } from "./components";
import { appConfig } from "./app-config";
import { S1_Hook } from "./scenes/S1_Hook";
import { S2_Home } from "./scenes/S2_Home";
import { S3_QuickRequest } from "./scenes/S3_QuickRequest";
import { S4_Professionals } from "./scenes/S4_Professionals";
import { S5_ProDashboard } from "./scenes/S5_ProDashboard";
import { S6_CTA } from "./scenes/S6_CTA";

const scenes = [
  { component: S1_Hook, duration: 120 }, // 4s
  { component: S2_Home, duration: 210 }, // 7s
  { component: S3_QuickRequest, duration: 210 }, // 7s
  { component: S4_Professionals, duration: 180 }, // 6s
  { component: S5_ProDashboard, duration: 180 }, // 6s
  { component: S6_CTA, duration: 150 }, // 5s
];

export const TOTAL_DURATION = scenes.reduce((sum, s) => sum + s.duration, 0);

export const ProductDemo: React.FC = () => {
  let offset = 0;
  return (
    <AbsoluteFill style={{ background: "#0a1224" }}>
      {appConfig.video.backgroundMusic ? (
        <Audio
          src={staticFile(appConfig.video.backgroundMusic)}
          volume={appConfig.video.backgroundMusicVolume ?? 0.3}
        />
      ) : null}
      {scenes.map(({ component: Scene, duration }, i) => {
        const from = offset;
        offset += duration;
        const isFirst = i === 0;
        const isLast = i === scenes.length - 1;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <SceneWrap
              durationInFrames={duration}
              fadeIn={!isFirst}
              fadeOut={!isLast}
            >
              <Scene />
            </SceneWrap>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
