/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aastra: {
          black: '#161616',
          charcoal: '#242424',
          slate: '#4A4A4A',
          gray: '#8A8D91',
          silver: '#D4D6D9',
          pearl: '#F6F6F5',
          paper: '#FCFCFB',
          gold: '#C9A227',
          'gold-light': '#DFBD4A',
          'gold-dark': '#9E7D17',
          'gold-tint': '#FAF6E8',
        },
      },
      fontFamily: {
        serif: ['"Montserrat"', '"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Montserrat"', '"Inter"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        classic: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
        elevated: '0 4px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
