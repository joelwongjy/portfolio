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
        description:
          "inset 0 0 0.5px 1px hsla(0, 0%,  100%, 0.075), 0 0 0 1px hsla(0, 0%, 0%, 0.05),0 0.3px 0.4px hsla(0, 0%, 0%, 0.02),0 0.9px 1.5px hsla(0, 0%, 0%, 0.045),0 3.5px 6px hsla(0, 0%, 0%, 0.09)",
        glow: "inset 0 0 1px rgb(0 0 0/11%)",
        framerdark: "rgba(255, 255, 255, 0.1) 0px 1px 1px 0px inset",
        framerlight: "rgba(0, 0, 0, 0.1) 0px 2px 2px 0px",
      },
      backgroundImage: {
        framerDark:
          "linear-gradient(345deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)",
        framerLight:
          "linear-gradient(345deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)",
      },
    },
  },
  plugins: [require("prettier-plugin-tailwindcss")],
};
