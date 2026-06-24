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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0A7E5A",
          dark: "#085041",
          light: "#E8F5F0",
        },
        dark: {
          DEFAULT: "#111827",
          secondary: "#1F2937",
        },
        cta: {
          DEFAULT: "#F48221",
          hover: "#E06B10",
        },
        gray: {
          DEFAULT: "#374151",
          mid: "#6B7280",
          light: "#E5E7EB",
        },
        bg: "#F9FAFB",
      },
    },
  },
  plugins: [],
};
export default config;
