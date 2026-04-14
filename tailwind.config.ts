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
        gold: {
          DEFAULT: "#FFAA33",
          light: "#FFD280",
          dark: "#E08A00",
        },
        charcoal: {
          DEFAULT: "#1F2937",
          light: "#374151",
          dark: "#111827",
        },
        cream: {
          DEFAULT: "#FFF6ED",
          dark: "#F5E6D3",
        },
        bronze: {
          DEFAULT: "#C68642",
          light: "#D9A55A",
          dark: "#A06830",
        },
      },
      fontFamily: {
        anton: ["Anton", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        impact: ["Impact", "Arial Narrow", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-gold": "linear-gradient(135deg, #FFAA33 0%, #C68642 100%)",
        "gradient-dark": "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
        "noise-texture": "url('/noise.png')",
      },
      boxShadow: {
        gold: "0 0 30px rgba(255, 170, 51, 0.3)",
        "gold-lg": "0 0 60px rgba(255, 170, 51, 0.4)",
        premium: "0 20px 60px rgba(0, 0, 0, 0.4)",
        card: "0 8px 32px rgba(0, 0, 0, 0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 170, 51, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 170, 51, 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
