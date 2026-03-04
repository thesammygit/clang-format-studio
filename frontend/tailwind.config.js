/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0d1117',
          surface: '#161b22',
          border: '#30363d',
          accent: '#388bfd',
          accentDim: '#1f4066',
          muted: '#8b949e',
          text: '#e6edf3',
          changed: '#f78166',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

