import type { Config } from "tailwindcss";

const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: "var(--background)",
      surface: "var(--surface)",
      border: "var(--border)",
      primary: "var(--primary)",
      secondary: "var(--secondary)",
      "on-accent": "var(--on-accent)",
      accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)", light: "var(--accent-light)" },
      danger: { DEFAULT: "var(--danger)", foreground: "var(--on-danger)" },
      // Muted status pairs are the semantic colors permitted by the team rules.
      status: {
        slate: { light: "var(--status-slate-light)", dark: "var(--status-slate-dark)" },
        blue: { light: "var(--status-blue-light)", dark: "var(--status-blue-dark)" },
        amber: { light: "var(--status-amber-light)", dark: "var(--status-amber-dark)" },
        green: { light: "var(--status-green-light)", dark: "var(--status-green-dark)" },
        orange: { light: "var(--status-orange-light)", dark: "var(--status-orange-dark)" },
        red: { light: "var(--status-red-light)", dark: "var(--status-red-dark)" },
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
