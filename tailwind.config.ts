import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef4fb",
          200: "#b8cfe8",
          300: "#8bb0d9",
          400: "#5d8fc7",
          500: "#3a6fad",
          600: "#2a5894",
          700: "#1e4278",
          800: "#152f57",
          900: "#0d1f3c",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
