/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        /** Orange & white theme — primary actions and accents */
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        /** Page wash, cards, dividers */
        surface: {
          DEFAULT: '#fff7ed',
          card: '#ffffff',
          border: '#fdba74',
        },
      },
    },
  },
  plugins: [],
}
