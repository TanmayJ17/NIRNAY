/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        surface: '#F8F9FA',
        white: '#FFFFFF',
        border: '#E5E7EB',
        'border-dark': '#D1D5DB',

        /* Primary accent */
        primary: '#1D4ED8',
        'primary-hover': '#1E40AF',

        /* Text */
        'text-primary': '#0F172A',
        'text-secondary': '#475467',
        'text-muted': '#9CA3AF',

        /* Semantic — marker colors */
        'status-green': '#16A34A',
        'status-amber': '#D97706',
        'status-red': '#DC2626',
        'status-green-bg': '#DCFCE7',
        'status-amber-bg': '#FEF3C7',
        'status-red-bg': '#FEE2E2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
      },
      spacing: {
        /* 8px base rhythm already default in Tailwind */
      },
    },
  },
  plugins: [],
};
