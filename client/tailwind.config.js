/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        cosmicBg: '#ffffff',
        cosmicCard: 'rgba(255, 255, 255, 0.82)',
        cosmicBorder: 'rgba(99, 102, 241, 0.12)',
        cosmicBorderGlow: 'rgba(99, 102, 241, 0.28)',
        cosmicGold: '#d97706',
        cosmicAccent: '#8b5cf6',
        cosmicNeon: '#6366f1',
      }
    },
  },
  plugins: [],
}
