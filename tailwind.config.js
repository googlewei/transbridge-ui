/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-ring': 'pulse-ring 1.25s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '50%': { transform: 'scale(1)', opacity: 0.4 },
          '100%': { transform: 'scale(1.2)', opacity: 0 }
        }
      }
    },
  },
  plugins: [],
} 