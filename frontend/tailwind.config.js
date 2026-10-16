/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ou: {
          blue: '#0054a6',
          dark: '#003a73',
          light: '#e6f0fa',
          accent: '#0083ca',
          gray: '#646464'
        }
      }
    },
  },
  plugins: [],
}
