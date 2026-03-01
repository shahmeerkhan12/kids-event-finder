/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3c7',
          100: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        },
        accent: {
          50: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed'
        }
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
