import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 10px 30px rgba(26, 32, 44, 0.14)",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        wave: "wave 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
