import { interpolate, useCurrentFrame, Easing } from "remotion";

export type CursorKeyframe = {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
};

export const AnimatedCursor: React.FC<{
  keyframes: CursorKeyframe[];
  visible?: boolean;
}> = ({ keyframes, visible = true }) => {
  const frame = useCurrentFrame();

  if (!visible || keyframes.length === 0) return null;

  let x = keyframes[0].x;
  let y = keyframes[0].y;
  let clicking = false;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const curr = keyframes[i];
    const next = keyframes[i + 1];

    if (frame >= curr.frame && frame <= next.frame) {
      x = interpolate(frame, [curr.frame, next.frame], [curr.x, next.x], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      y = interpolate(frame, [curr.frame, next.frame], [curr.y, next.y], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      if (next.click && frame >= next.frame - 3) clicking = true;
      break;
    }

    if (frame > next.frame) {
      x = next.x;
      y = next.y;
    }
  }

  const scale = clicking ? 0.85 : 1;

  return (
    <div
      style={{
        pointerEvents: "none",
        position: "absolute",
        zIndex: 50,
        left: x,
        top: y,
        transform: `scale(${scale})`,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {clicking && (
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "rgba(33, 150, 243, 0.4)",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
};
