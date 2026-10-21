import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // iOS dark system palette
        ios: {
          bg: "#000000",
          card: "#1c1c1e",
          card2: "#2c2c2e",
          sep: "#38383a",
          label: "#ffffff",
          label2: "rgba(235,235,245,0.6)",
          label3: "rgba(235,235,245,0.3)",
          blue: "#0a84ff",
          green: "#30d158",
          red: "#ff453a",
          orange: "#ff9f0a",
          yellow: "#ffd60a",
          purple: "#bf5af2",
          gray: "#8e8e93",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
