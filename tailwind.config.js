/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        badge: "rgb(var(--badge) / <alpha-value>)",
      },
      zIndex: {
        100: "99999",
      },
    },
  },
  plugins: [],
};
