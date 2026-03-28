/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          ring: 'rgb(var(--surface-ring) / <alpha-value>)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        tealish: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      boxShadow: {
        glow: '0 20px 70px rgba(79, 70, 229, 0.18)',
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 24%), linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.75))',
        'hero-gradient-dark':
          'radial-gradient(circle at top left, rgba(99, 102, 241, 0.24), transparent 28%), radial-gradient(circle at top right, rgba(20, 184, 166, 0.2), transparent 24%), linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.82))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
