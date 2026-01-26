/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c5ff',
          400: '#8099ff',
          500: '#667eea',
          600: '#4d5fd1',
          700: '#3d4db8',
          800: '#2f3d9e',
          900: '#1f2b7a',
        },
        secondary: {
          500: '#764ba2',
        },
        brand: {
          DEFAULT: '#0f172a', /* slate-900 */
          light: '#334155',
          dark: '#020617',
          blue: '#4963bf', /* Extracted from logo */
          accent: '#00ffff' /* Extracted cyan accent */
        }
      },
    },
  },
  plugins: [],
}
