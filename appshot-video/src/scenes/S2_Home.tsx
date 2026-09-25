import { Img, staticFile } from "remotion";
import {
  AmbientBackground,
  AnimatedCursor,
  BrowserFrame,
  Caption,
} from "../components";
import { appConfig } from "../app-config";

const VIEW_W = 1440;
const VIEW_H = 810;

export const S2_Home: React.FC = () => {
  const { brand } = appConfig;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <AmbientBackground brand={brand} variant="light" />
      <div className="relative z-10">
        <BrowserFrame url="fixly.tech" delay={4} scale={0.82} variant="light">
          <div style={{ width: VIEW_W, height: VIEW_H, overflow: "hidden" }}>
            <Img
              src={staticFile("screenshots/home.png")}
              style={{ width: VIEW_W, height: VIEW_H, objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </BrowserFrame>
        <AnimatedCursor
          keyframes={[
            { frame: 25, x: 1100, y: 220 },
            { frame: 55, x: 720, y: 390, click: true },
            { frame: 95, x: 720, y: 470 },
            { frame: 125, x: 720, y: 470, click: true },
          ]}
        />
      </div>
      <Caption
        text="בקשה אחת. מקצוען מותאם"
        delay={10}
        maxWidth={1200}
        fontSize={40}
      />
    </div>
  );
};
