import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verint: {
          purple: '#6B2FA0',
          'purple-dark': '#4A1870',
          'purple-deeper': '#2E0F47',
          'purple-light': '#9B59D2',
          'purple-pale': '#D4AEF0',
          'purple-bg': '#F5F0FA',
          'purple-mid': '#8540BB',
          white: '#FFFFFF',
          gray: '#F8F5FA',
          charcoal: '#2D2D3A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'verint-gradient': 'linear-gradient(135deg, #4A1870 0%, #6B2FA0 50%, #8540BB 100%)',
        'verint-gradient-light': 'linear-gradient(135deg, #F5F0FA 0%, #E8D8F8 100%)',
      },
      boxShadow: {
        'verint': '0 4px 24px rgba(107, 47, 160, 0.15)',
        'verint-lg': '0 8px 40px rgba(107, 47, 160, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
