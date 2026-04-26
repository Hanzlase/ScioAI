import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#595959",
          700: "#404040",
          800: "#2d2d2d",
          900: "#1a1a1a",
          950: "#0d0d0d",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body:    ["var(--font-body)",    "sans-serif"],
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-md": "0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-lg": "0 12px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        inner:   "inset 0 1px 2px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        dot: {
          "0%, 80%, 100%": { transform: "scale(0.5)", opacity: "0.3" },
          "40%":           { transform: "scale(1)",   opacity: "1"   },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        shimmer:  "shimmer 1.8s linear infinite",
        fadeUp:   "fadeUp 0.4s ease-out forwards",
        "dot-1":  "dot 1.4s ease-in-out 0.0s infinite",
        "dot-2":  "dot 1.4s ease-in-out 0.2s infinite",
        "dot-3":  "dot 1.4s ease-in-out 0.4s infinite",
        pulse2:   "pulse2 2s ease-in-out infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
