import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        milestone: {
          navy: "#07111F",
          sidebar: "#0B1929",
          blue: "#1769FF",
          "blue-dim": "#EEF3FF",
          green: "#36A852",
          "green-dim": "#E8F5EC",
          amber: "#F8B400",
          "amber-dim": "#FFF8E1",
          red: "#EA4335",
          "red-dim": "#FEE8E6",
          bg: "#EEF2F7",
          line: "#E2E8F0",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-lg": "0 4px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)",
        "card-xl": "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "blue-glow": "0 4px 20px rgba(23,105,255,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
