/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Core UI Palette Tokens */
        canvas: '#F4F7FA',
        surface: '#FFFFFF',
        border: '#DDE5EE',
        ink: '#0F2A43',
        muted: '#5B6B7C',
        navy: '#0B2A4A',
        accent: '#1D6FB8',
        'accent-hover': '#185d9c',
        accentSoft: '#E8F1FA',
        water: '#4F9BD9',

        /* Backward-compatibility aliases mapped to strict tokens */
        'text-primary': '#0F2A43',
        'text-secondary': '#5B6B7C',
        'text-muted': '#5B6B7C',
        primary: '#1D6FB8',
        'primary-hover': '#185d9c',

        /* Semantic — Map Pins & Hazard-only Status */
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
    },
  },
  plugins: [],
};
