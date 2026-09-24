/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#131315',
        'surface-container-lowest': '#0e0e10',
        'surface-container-low': '#1b1b1d',
        'surface-container': '#1f1f22',
        'surface-container-high': '#242427',
        'surface-container-highest': '#333237',
        outline: '#4a423d',
        'outline-variant': '#2e2d33',
        primary: '#d97746',
        'primary-bright': '#f08d5b',
        'primary-container': '#ffdbcc',
        'on-surface': '#f4f3f0',
        'on-surface-variant': '#a8a5a0',
        'on-surface-dim': '#545663',
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        lg: '0.5rem',       // 8px
        xl: '0.75rem',      // 12px
        full: '9999px',
      },
    },
  },
  plugins: [],
}
