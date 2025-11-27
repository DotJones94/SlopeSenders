import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#05020f',
          900: '#070416',
          800: '#0b0820',
        },
        brand: {
          lavender: '#8c85ff',
        },
        copy: {
          soft: '#cfcfe1',
          muted: '#c5c4dc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        hero: '0 25px 60px rgba(0, 0, 0, 0.4)',
        shell: '0 30px 60px rgba(0, 0, 0, 0.45)',
        'shell-hover': '0 40px 70px rgba(0, 0, 0, 0.55)',
        card: '0 18px 40px rgba(0, 0, 0, 0.15)',
        pill: '0 14px 30px rgba(0, 0, 0, 0.35)',
        cta: '0 25px 70px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
