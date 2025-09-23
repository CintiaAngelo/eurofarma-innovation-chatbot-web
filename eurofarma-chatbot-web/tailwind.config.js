/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'eurofarma-darkblue': '#00274C',
        'eurofarma-blue': '#11296B',
        'eurofarma-light': '#EDEDED',
        'eurofarma-yellow': '#FFDB57',
        'eurofarma-gold': '#FFCB05',
      }
    },
  },
  plugins: [],
}