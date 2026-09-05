/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#D9EED6',
          primary: '#28B110',
          dark: '#1B1E1A',
          forest: '#145907',
          50: '#f0fdf4',
          100: '#D9EED6',
          500: '#28B110',
          600: '#145907',
          700: '#0e4104',
        },
      },
    },
  },
  plugins: [],
}
