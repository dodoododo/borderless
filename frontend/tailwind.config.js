/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Inter', 'sans-serif'], // Font chính
        'mono': ['"IBM Plex Mono"', 'monospace'], // Font cho nhãn Passport Power
        'playfair': ['"Playfair Display"', 'serif'],
        'bodoni': ['"Bodoni Moda"', 'serif'],
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'cinzel': ['"Cinzel"', 'serif'],
      },
    },
  },
  plugins: [],
}