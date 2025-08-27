import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-accent-yellow)',
        success: 'var(--color-accent-green)',
        info: 'var(--color-accent-blue)',
        danger: 'var(--color-danger-red)',
        background: {
          primary: 'var(--color-primary-bg)',
          card: 'var(--color-card-bg)',
          hover: 'var(--color-hover-bg)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        border: {
          dark: 'var(--color-border-dark)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '30': '7.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
