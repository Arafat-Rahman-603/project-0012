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
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          50: "#F5F5F0",
          100: "#E8E8E0",
          200: "#C8C8BC",
          300: "#A0A090",
          400: "#787868",
          500: "#505040",
          600: "#383830",
          700: "#282820",
          800: "#181810",
          900: "#0A0A0A",
        },
        amber: {
          DEFAULT: "#D4A017",
          50: "#FDF8E8",
          100: "#F9EEC4",
          200: "#F2D97A",
          300: "#E8C240",
          400: "#D4A017",
          500: "#B8860B",
          600: "#9A6F09",
          700: "#7A5807",
          800: "#5C4005",
          900: "#3D2A03",
        },
        cream: "#F8F6F0",
        parchment: "#EDE9DF",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
