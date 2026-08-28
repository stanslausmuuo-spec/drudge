import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#e8dfd0",
          dark: "#d8ccb8",
          inset: "#ddd2c0",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          light: "#4a4a4a",
          muted: "#7a7a7a",
          faint: "#a8a8a8",
        },
        vermillion: {
          DEFAULT: "#c4392d",
          dim: "rgba(196, 57, 45, 0.12)",
        },
        moss: {
          DEFAULT: "#3f6858",
          dim: "rgba(63, 104, 88, 0.12)",
        },
        ochre: {
          DEFAULT: "#6a5a3a",
          dim: "rgba(106, 90, 58, 0.12)",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      animation: {
        "ink-settle": "ink-settle 0.6s cubic-bezier(0.23,1,0.32,1) forwards",
        "ink-diffuse": "ink-diffuse 24s ease-in-out infinite",
        "pulse-ink": "pulse-ink 2s ease-in-out infinite",
        "fade-in": "fade-in-up 0.4s ease-out forwards",
      },
      keyframes: {
        "ink-settle": {
          "0%": { opacity: "0", transform: "translateY(6px)", filter: "blur(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "ink-diffuse": {
          "0%, 100%": { opacity: "0.04", transform: "scale(1)" },
          "50%": { opacity: "0.06", transform: "scale(1.02)" },
        },
        "pulse-ink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
