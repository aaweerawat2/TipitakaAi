/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Orange (Buddhist color)
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Paper tones for reader
        paper: {
          white: '#FFFFFF',
          cream: '#FFFBF0',
          sepia: '#F4ECD8',
          dark: '#1C1917',
        },
        // Text colors
        text: {
          primary: '#1C1917',
          secondary: '#57534E',
          tertiary: '#A8A29E',
          light: '#FAFAF9',
        },
        // Accent colors
        accent: {
          gold: '#D4A574',
          bronze: '#8B7355',
          sage: '#9CAF88',
        },
      },
      fontFamily: {
        sans: ['NotoSansThai', 'Sarabun', 'System'],
        serif: ['NotoSerifThai', 'Georgia', 'serif'],
        mono: ['FiraCode', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '18px' }],
        'sm': ['14px', { lineHeight: '21px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '27px' }],
        'xl': ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '36px' }],
        '3xl': ['30px', { lineHeight: '45px' }],
        '4xl': ['36px', { lineHeight: '54px' }],
      },
      spacing: {
        // Custom spacing for Thai text readability
        'reading-1': '4px',
        'reading-2': '8px',
        'reading-3': '12px',
        'reading-4': '16px',
        'reading-5': '20px',
        'reading-6': '24px',
      },
      lineHeight: {
        'relaxed-thai': '2.0',  // Better for Thai text
        'loose-thai': '2.5',
      },
    },
  },
  plugins: [],
};
