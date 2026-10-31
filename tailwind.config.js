/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media', // follows the system (spec: light/dark following the system)
  theme: {
    extend: {
      colors: {
        brand: { 50: '#ecfdf3', 100: '#d1fae0', 200: '#a7f0c4', 400: '#34c77b', 500: '#16a34a', 600: '#15803d', 700: '#166534', 800: '#14532d', 900: '#0f3d21' },
        kcal: { DEFAULT: '#f97316', soft: '#ffedd5', ink: '#c2410c' },
        water: { DEFAULT: '#2563eb', soft: '#dbeafe', ink: '#1d4ed8' },
        ink: { DEFAULT: '#0f1a14', 2: '#4b5a52', 3: '#6b7a72' }, // 3 = 4.6:1 on white (AA)
        canvas: '#f4f5f4',
        night: { DEFAULT: '#0b0f0d', card: '#151b18', line: '#232c27' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: { card: '0 1px 2px rgba(15,26,20,.05), 0 4px 16px rgba(15,26,20,.05)' },
      keyframes: { wave: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } }, shimmer: { '100%': { transform: 'translateX(100%)' } } },
      animation: { wave: 'wave 6s linear infinite', shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
