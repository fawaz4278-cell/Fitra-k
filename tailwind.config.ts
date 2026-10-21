import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // iOS dark system palette, with deeper surfaces.
        ios: {
          bg: "#000000",
          card: "#111114",
          card2: "#1e1e23",
          sep: "#2a2a30",
          label: "#ffffff",
          label2: "rgba(235,235,245,0.62)",
          label3: "rgba(235,235,245,0.32)",
          blue: "#0a84ff",
          green: "#30d158",
          red: "#ff453a",
          orange: "#ff9f0a",
          yellow: "#ffd60a",
          purple: "#bf5af2",
          gray: "#8e8e93",
        },
        // One colour per area of the app, used for icons, rings and charts.
        tint: {
          kcal: "#34d399",
          weight: "#5ac8fa",
          ippt: "#ffb340",
          streak: "#ff7a2f",
          stash: "#c084fc",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "system-ui", "sans-serif"],
        rounded: ["ui-rounded", "SF Pro Rounded", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
