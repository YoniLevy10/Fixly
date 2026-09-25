import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AmbientBackground, AppIcon, Caption, FadeIn } from "../components";
import { appConfig } from "../app-config";

export const S1_Hook: React.FC = () => {
  const { brand } = appConfig;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    delay: 0,
    config: { mass: 0.8, damping: 14, stiffness: 120 },
  });

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <AmbientBackground brand={brand} variant="dark" />
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 24}px)`,
        }}
      >
        <AppIcon
          src={appConfig.app.icon}
          size={96}
          glow
          glowColor={`${brand.accent ?? brand.primary}66`}
        />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Fixly
            <span style={{ color: brand.accent ?? "#f97d10" }}>.</span>
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 28,
              fontWeight: 600,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            {appConfig.app.tagline}
          </div>
        </div>
        <FadeIn delay={18} direction="up">
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 8,
            }}
          >
            {["Bamakor → Fixly", "התאמה לפי ביצועים", "מעקב עד סיום"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </FadeIn>
      </div>
      <Caption
        text="תחזוקה חכמה, ביצוע אמיתי"
        delay={8}
        maxWidth={1200}
        fontSize={40}
      />
    </div>
  );
};
