import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Caption: React.FC<{
  text: string;
  delay?: number;
  fontSize?: number;
  maxWidth?: number;
}> = ({ text, delay = 0, fontSize = 44, maxWidth = 820 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerEnter = spring({
    frame,
    fps,
    delay,
    config: { mass: 0.8, damping: 14, stiffness: 100 },
  });

  const words = text.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        paddingBottom: 160,
        opacity: containerEnter,
        transform: `translateY(${(1 - containerEnter) * 15}px)`,
      }}
    >
      <div
        style={{
          borderRadius: 16,
          padding: "20px 40px",
          background: "rgba(45, 45, 45, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          maxWidth,
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontWeight: 600,
            lineHeight: 1.25,
            color: "#FFFFFF",
            fontSize,
            fontFamily: "Heebo, system-ui, sans-serif",
            margin: 0,
            direction: "rtl",
          }}
        >
          {words.map((word, i) => {
            const wordEnter = spring({
              frame,
              fps,
              delay: delay + 3 + i * 1.5,
              config: { mass: 0.3, damping: 12, stiffness: 150 },
            });

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: wordEnter,
                  transform: `translateY(${(1 - wordEnter) * 8}px)`,
                  marginInline: "0.15em",
                }}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};
