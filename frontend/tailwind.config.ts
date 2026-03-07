import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        telesur: {
          blue: "#1B0A91",
          "blue-light": "#2A1CB3",
          "blue-dark": "#120065",
          yellow: "#FFD200",
          "yellow-light": "#FFE04D",
          "yellow-dark": "#E6BD00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
