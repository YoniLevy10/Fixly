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

export const S3_QuickRequest: React.FC = () => {
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
          url="fixly.tech/request/quick"
          delay={4}
          scale={0.82}
          variant="light"
        >
          <div style={{ width: VIEW_W, height: VIEW_H, overflow: "hidden" }}>
            <Img
              src={staticFile("screenshots/quick-request.png")}
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
            { frame: 20, x: 900, y: 260 },
            { frame: 50, x: 720, y: 300, click: true },
            { frame: 90, x: 720, y: 620 },
            { frame: 125, x: 720, y: 680, click: true },
          ]}
        />
      </div>
      <Caption
        text="3 מקצוענים — הראשון שמאשר"
        delay={10}
        maxWidth={1200}
        fontSize={40}
      />
    </AbsoluteFill>
  );
};
