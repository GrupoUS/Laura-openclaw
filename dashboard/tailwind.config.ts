import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        backlog:     { DEFAULT: '#6b7280', light: '#f3f4f6' },
        in_progress: { DEFAULT: '#3b82f6', light: '#eff6ff' },
        done:        { DEFAULT: '#22c55e', light: '#f0fdf4' },
        blocked:     { DEFAULT: '#ef4444', light: '#fef2f2' },
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
