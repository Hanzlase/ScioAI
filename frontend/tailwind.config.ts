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
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        surface: {
          DEFAULT: "#ffffff",
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glass: "0 4px 24px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0,0,0,0.06)",
        "glass-md": "0 8px 32px rgba(99, 102, 241, 0.12), 0 2px 6px rgba(0,0,0,0.08)",
        "glass-lg": "0 20px 48px rgba(99, 102, 241, 0.16), 0 4px 12px rgba(0,0,0,0.08)",
        card: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(99,102,241,0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        dot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.3" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        wave: "wave 0.9s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        fadeUp: "fadeUp 0.4s ease-out forwards",
        scaleIn: "scaleIn 0.3s ease-out forwards",
        "dot-1": "dot 1.4s ease-in-out infinite",
        "dot-2": "dot 1.4s ease-in-out 0.2s infinite",
        "dot-3": "dot 1.4s ease-in-out 0.4s infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "brand-gradient": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        "accent-gradient": "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
      },
    },
  },
  plugins: [typography],
};

export default config;
