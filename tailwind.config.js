/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Driven by --accent-rgb CSS variable set by accentStore.ts
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        // Driven by CSS custom properties — switch automatically in light/dark mode
        "app-bg":           "var(--bg-base)",
        "app-card":         "var(--bg-elevated)",
        "app-surface":      "var(--bg-surface)",
        "app-surface-hover":"var(--bg-surface-hover)",
        // Configurable highlight colours — driven by highlightStore.ts
        "hl-card":  "var(--hl-card)",
        "hl-row":   "var(--hl-row)",
        "hl-menu":  "var(--hl-menu)",
        "hl-queue": "var(--hl-queue)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
}
