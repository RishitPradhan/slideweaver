/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hawkins: {
          bg: '#0b0c10',
          red: '#ff003c', /* Neon red */
          cyan: '#00e5ff', /* Electric blue */
          purple: '#3a0066', /* Dark purple */
          amber: '#ffc107', /* Dim Amber */
          text: '#e6e6e6',
        }
      },
      fontFamily: {
        stranger: ['"Rye"', '"Cinzel Decorative"', 'serif'],
        terminal: ['"VT323"', '"Share Tech Mono"', '"Press Start 2P"', 'monospace'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'vhs-glitch': 'vhs-glitch 2s infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'vhs-glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
