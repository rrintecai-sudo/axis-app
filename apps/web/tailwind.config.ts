import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        card: '#111111',
        border: '#1F1F1F',
        accent: '#6366F1',
      },
    },
  },
  plugins: [],
} satisfies Config;
