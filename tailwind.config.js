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
      mono: [...defaultTheme.fontFamily.mono],
    },
    extend: {
      height: {
        128: "32rem",
        144: "36rem",
      },
      boxShadow: {
        card: "0 4px 40px -8px rgba(20, 20, 20, 0.12)",
        description: "0 10px 30px -15px rgba(20, 20, 20, 0.2)",
      },
    },
  },
  plugins: [require("prettier-plugin-tailwindcss")],
};
