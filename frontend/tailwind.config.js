/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#E7E4D9',
          raised: '#F7F5EF',
          dim: '#DBD7C8',
        },
        ink: {
          DEFAULT: '#15171A',
          soft: '#5B5C54',
          faint: '#8C8C80',
        },
        line: '#C9C4B2',
        flag: {
          DEFAULT: '#D8591C',
          soft: '#F3E0CE',
        },
        confirm: {
          DEFAULT: '#2454C7',
          soft: '#DCE4F7',
        },
        alert: {
          DEFAULT: '#A82B22',
          soft: '#F3DBD6',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-1': ['clamp(2.75rem, 5vw + 1rem, 6rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'display-2': ['clamp(2rem, 3vw + 1rem, 3.25rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        stamp: '3px 3px 0 0 #15171A',
        'stamp-sm': '2px 2px 0 0 #15171A',
        lift: '0 18px 40px -20px rgba(21, 23, 26, 0.35)',
      },
      keyframes: {
        'bar-lift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'redact-in': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        blink: {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'redact-loop': {
          '0%, 8%': { transform: 'scaleX(0)' },
          '40%, 70%': { transform: 'scaleX(1)' },
          '92%, 100%': { transform: 'scaleX(0)' },
        },
      },
      animation: {
        blink: 'blink 1.1s steps(1) infinite',
        'redact-loop': 'redact-loop 2.6s ease-stamp infinite',
      },
      transitionTimingFunction: {
        stamp: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
};
