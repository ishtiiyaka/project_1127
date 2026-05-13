/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
      },
      colors: {
        accent: '#00ff41',
        'accent-dim': '#007a1f',
        surface: '#0a0a0a',
        border: '#1a1a1a',
        critical: '#ff3131',
        high: '#ff8c00',
        medium: '#ffd700',
        low: '#00bfff',
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 4px #00ff41' },
          '50%': { boxShadow: '0 0 12px #00ff41, 0 0 24px #007a1f' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        'scan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' },
        }
      }
    },
  },
  plugins: [],
}
