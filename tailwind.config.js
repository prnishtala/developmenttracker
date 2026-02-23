/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7faf2',
          100: '#edf5df',
          500: '#4f772d',
          600: '#3f6324'
        },
        accent: '#f4a259',
        warm: '#f8f3e9'
      }
    }
  },
  plugins: []
};
