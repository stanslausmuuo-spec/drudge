import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--paper)",
          dark: "var(--paper-dark)",
          inset: "var(--paper-inset)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        vermillion: {
          DEFAULT: "var(--vermillion)",
          dim: "var(--vermillion-dim)",
        },
        moss: {
          DEFAULT: "var(--moss)",
          dim: "var(--moss-dim)",
        },
        ochre: {
          DEFAULT: "var(--ochre)",
          dim: "var(--ochre-dim)",
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
