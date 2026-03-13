/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3A6B',
          50: '#E8EEF7',
          100: '#C5D3E9',
          200: '#8FAACF',
          300: '#5981B5',
          400: '#2E6DB4',
          500: '#1B3A6B',
          600: '#162F56',
          700: '#102340',
          800: '#0B182B',
          900: '#050C15',
        },
        sky: '#4A9FDF',
        emerald: {
          retirement: '#1D9E75',
        },
        amber: {
          retirement: '#E85D04',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
