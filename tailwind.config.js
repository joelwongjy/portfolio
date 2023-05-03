/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      height: {
        128: "32rem",
      },
      boxShadow: {
        'card': '0 4px 40px -8px rgba(20, 20, 20, 0.12)',
      }
    },
  },
  plugins: [
    require("prettier-plugin-tailwindcss"),
    require("@tailwindcss/line-clamp"),
  ],
};
