/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28B110',
          hover: '#145907',
          light: '#D9EED6',
          dark: '#1B1E1A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAF8',
          subtle: '#F1F6F0',
          dark: '#1B1E1A',
          tint: '#D9EED6',
        },
        ink: {
          heading: '#1B1E1A',
          body: '#2D352C',
          muted: '#5C6B5B',
          faint: '#8D9E8C',
          forest: '#145907',
        },
        line: {
          subtle: '#E5EFE3',
          DEFAULT: '#D9EED6',
          dark: '#262D25',
        },
        onchain: {
          DEFAULT: '#28B110',
          light: '#D9EED6',
          border: '#B7E3B2',
        },
        brand: {
          light: '#D9EED6',
          primary: '#28B110',
          dark: '#1B1E1A',
          forest: '#145907',
          50: '#F4FAF3',
          100: '#D9EED6',
          200: '#C1E5BC',
          300: '#90D487',
          400: '#5AC34E',
          500: '#28B110',
          600: '#1FA00B',
          700: '#145907',
          800: '#0F4405',
          900: '#1B1E1A',
        },
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.04)',
        hover: '0 8px 24px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
