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

export const S4_Professionals: React.FC = () => {
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
      <AmbientBackground brand={brand} variant="light" />
      <div style={{ position: "relative", zIndex: 10 }}>
        <BrowserFrame
          url="fixly.tech/professionals"
          delay={4}
          scale={0.82}
          variant="light"
        >
          <div style={{ width: VIEW_W, height: VIEW_H, overflow: "hidden" }}>
            <Img
              src={staticFile("screenshots/professionals.png")}
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
            { frame: 18, x: 720, y: 240 },
            { frame: 45, x: 980, y: 320, click: true },
            { frame: 85, x: 860, y: 320, click: true },
            { frame: 120, x: 720, y: 240 },
          ]}
        />
      </div>
      <Caption
        text="חיפוש לפי תחום ואזור"
        delay={8}
        maxWidth={1200}
        fontSize={40}
      />
    </AbsoluteFill>
  );
};
