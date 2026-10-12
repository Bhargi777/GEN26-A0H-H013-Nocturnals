import type { Config } from "tailwindcss";

const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: "#EBEEF7",
      surface: "#FFFFFF",
      border: "#E2E8F0",
      primary: "#0F172A",
      secondary: "#475569",
      accent: { DEFAULT: "#A9244A", hover: "#8A1B3B", light: "#FBEAF0" },
      // Muted status pairs are the semantic colors permitted by the team rules.
      status: {
        slate: { light: "#F1F5F9", dark: "#334155" },
        blue: { light: "#EFF6FF", dark: "#1E40AF" },
        amber: { light: "#FFFBEB", dark: "#92400E" },
        green: { light: "#F0FDF4", dark: "#166534" },
        orange: { light: "#FFF7ED", dark: "#9A3412" },
        red: { light: "#FEF2F2", dark: "#991B1B" },
      },
    },
    fontFamily: { sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"] },
    fontSize: {
      body: ["14px", { lineHeight: "20px" }],
      section: ["16px", { lineHeight: "24px", fontWeight: "600" }],
      title: ["20px", { lineHeight: "28px", fontWeight: "600" }],
    },
    borderRadius: { none: "0", DEFAULT: "6px", control: "6px", card: "8px", full: "9999px" },
    spacing: {
      0: "0", 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px",
      6: "24px", 7: "28px", 8: "32px", 9: "36px", 10: "40px", 11: "44px",
      12: "48px", 14: "56px", 16: "64px", 20: "80px", 24: "96px", 32: "128px",
      40: "160px", 48: "192px", 64: "256px", 80: "320px", 96: "384px",
    },
    boxShadow: { none: "none" },
  },
  plugins: [],
} satisfies Config;

export default config;
