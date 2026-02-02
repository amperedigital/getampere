/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./deploy/**/*.{html,js}"],
  theme: {
    extend: {
        screens: {
            'short': { 'raw': '(max-height: 850px)' }
        },
        fontFamily: {
            // Replicating default stack plus current site fonts just in case, 
            // though these should be handled by standard classes if set up right.
            'geist': ['Geist', 'sans-serif'],
            'serif-italic': ['Newsreader', 'serif'],
        }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
}
