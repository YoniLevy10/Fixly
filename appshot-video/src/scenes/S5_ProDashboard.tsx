import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  AmbientBackground,
  AnimatedCursor,
  BrowserFrame,
  Caption,
} from "../components";
import { appConfig } from "../app-config";

const VIEW_W = 1440;
const VIEW_H = 810;

export const S5_ProDashboard: React.FC = () => {
  const { brand } = appConfig;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AmbientBackground brand={brand} variant="medium" />
      <div style={{ position: "relative", zIndex: 10 }}>
        <BrowserFrame
          url="fixly.tech/pro/dashboard"
          delay={4}
          scale={0.82}
          variant="light"
        >
          <div style={{ width: VIEW_W, height: VIEW_H, overflow: "hidden" }}>
            <Img
              src={staticFile("screenshots/pro-dashboard.png")}
              style={{
                width: VIEW_W,
                height: VIEW_H,
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          </div>
        </BrowserFrame>
        <AnimatedCursor
          keyframes={[
            { frame: 20, x: 720, y: 400 },
            { frame: 55, x: 720, y: 520, click: true },
            { frame: 100, x: 720, y: 400 },
          ]}
        />
      </div>
      <Caption
        text="דשבורד Pro לניהול בקשות"
        delay={8}
        maxWidth={1200}
        fontSize={40}
      />
    </AbsoluteFill>
  );
};
