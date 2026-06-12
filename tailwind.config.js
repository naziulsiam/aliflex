/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0f',
        surface:    '#15151c',
        surface2:   '#1f1f29',
        surface3:   '#2a2a36',
        border:     '#2a2a36',
        primary:    '#e50914',
        'primary-dark': '#b20710',
        muted:      '#8b8b97',
        text:       '#f5f5f7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition:  '1000px 0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        shimmer:  'shimmer 1.8s infinite linear',
        'fade-up': 'fade-up 0.4s ease-out both',
        pulse:     'pulse 1.5s ease-in-out infinite',
      },
      backgroundImage: {
        'hero-scrim': 'linear-gradient(to top, #0b0b0f 0%, #0b0b0f 15%, transparent 55%)',
      },
    },
  },
  plugins: [],
};
