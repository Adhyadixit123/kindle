/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kindle: {
          cream: '#F5F1E8',
          sepia: '#E8DCC8',
          dark: '#1A1A1A',
          text: '#333333'
        }
      }
    },
  },
  plugins: [],
}
