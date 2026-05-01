import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        milestone: {
          navy: "#07111F",
          sidebar: "#081523",
          blue: "#1769FF",
          green: "#36A852",
          amber: "#F8B400",
          red: "#EA4335",
          bg: "#F6F8FB",
          line: "#DFE6EF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
