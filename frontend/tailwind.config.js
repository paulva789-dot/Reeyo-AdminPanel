/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        NightBlue: {
          sidebar: '#0b1329',
          bg: '#111827',
          card: '#1f2937',
        },
      },
    },
  },
  plugins: [],
};
