import type { AppConfig } from "./config";

export const appConfig: AppConfig = {
  app: {
    name: "Fixly",
    tagline: "רשת ביצוע לתחזוקה ובעלי מקצוע בישראל",
    icon: "icon.png",
    platform: "web",
    url: "fixly.tech",
  },
  brand: {
    primary: "#112e5f",
    primaryLight: "#dbe7f5",
    background: "#f2f4f7",
    surface: "#ffffff",
    textPrimary: "#0f1729",
    textSecondary: "#414c62",
    success: "#1ea465",
    danger: "#dc2626",
    accent: "#f97d10",
  },
  video: {
    fps: 30,
    width: 1920,
    height: 1080,
    browser: "chrome-desktop",
    backgroundMusic: "music/upbeat-corporate.mp3",
    backgroundMusicVolume: 0.28,
  },
};
