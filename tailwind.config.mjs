/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx.mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-Kanit)", ...defaultTheme.fontFamily.sans],
      },
      animation: {
        marquee: "marquee 25s linear infinite",
        bellShake: "bellShake 0.5s ease-in-out infinite 2s",
        slideDown: "slideDown 0.2s ease-out",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        bellShake: {
          "0%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(12deg)" },
          "30%": { transform: "rotate(-10deg)" },
          "45%": { transform: "rotate(6deg)" },
          "60%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(2deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
    screens: {
      xs: "320px", // เพิ่ม breakpoint สำหรับมือถือเล็กสุด
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};

export default config;
