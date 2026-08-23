/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--app-font-sans)", "Manrope", "sans-serif"],
        mono: ["var(--app-font-mono)", "DM Mono", "monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
