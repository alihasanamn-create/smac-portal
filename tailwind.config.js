/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        smacPrimary: "#0B3D91",
        smacSecondary: "#1E88E5",
      },
    },
  },
  plugins: [],
};
