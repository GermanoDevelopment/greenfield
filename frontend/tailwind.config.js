/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          subtle: '#F1F5F9',
        },
        ink: {
          heading: '#0F172A',
          body: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        line: {
          subtle: '#EEF2F6',
          DEFAULT: '#E2E8F0',
        },
        onchain: {
          DEFAULT: '#8B5CF6',
          light: '#F5F3FF',
          border: '#DDD6FE',
        },
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
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.04)',
        hover: '0 8px 24px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
