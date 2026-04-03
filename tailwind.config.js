/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        dark: '#0F172A',
        card: '#1E293B',
        muted: '#94A3B8',
      },
    },
  },
  plugins: [],
}
