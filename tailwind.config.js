/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"], // For all normal text
        code: ['"Fira Code"', "monospace"] // For code or special sections
      }
    }
  },
  plugins: []
}
