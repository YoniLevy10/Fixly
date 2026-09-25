import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AmbientBackground, AppIcon, Caption } from "../components";
import { appConfig } from "../app-config";

export const S6_CTA: React.FC = () => {
  const { brand } = appConfig;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonEnter = spring({
    frame,
    fps,
    delay: 20,
    config: { mass: 1.2, damping: 14, stiffness: 90 },
  });
  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.96, 1.04]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AmbientBackground brand={brand} variant="dark" />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <AppIcon
          src={appConfig.app.icon}
          size={88}
          glow
          glowColor={`${brand.accent ?? brand.primary}55`}
        />
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: "Heebo, system-ui, sans-serif",
          }}
        >
          Fixly
          <span style={{ color: brand.accent ?? "#f97d10" }}>.</span>
        </div>
        <div
          style={{
            opacity: buttonEnter,
            transform: `scale(${pulse})`,
            padding: "18px 52px",
            borderRadius: 14,
            background: brand.accent ?? brand.primary,
            fontSize: 24,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "Heebo, system-ui, sans-serif",
          }}
        >
          התחילו בחינם
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.65)",
            fontWeight: 600,
            fontFamily: "Heebo, system-ui, sans-serif",
          }}
        >
          {appConfig.app.url}
        </div>
      </div>
      <Caption
        text="Fixly — תחזוקה חכמה"
        delay={6}
        maxWidth={1200}
        fontSize={40}
      />
    </AbsoluteFill>
  );
};
