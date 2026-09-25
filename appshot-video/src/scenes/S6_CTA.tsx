import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
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
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <AmbientBackground brand={brand} variant="dark" />
      <div className="relative z-10 flex flex-col items-center gap-7">
        <AppIcon
          src={appConfig.app.icon}
          size={88}
          glow
          glowColor={`${brand.accent ?? brand.primary}55`}
        />
        <div style={{ fontSize: 56, fontWeight: 900, color: "#FFFFFF" }}>
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
          }}
        >
          התחילו בחינם
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
          {appConfig.app.url}
        </div>
      </div>
      <Caption
        text="Fixly — תחזוקה חכמה"
        delay={6}
        maxWidth={1200}
        fontSize={40}
      />
    </div>
  );
};
