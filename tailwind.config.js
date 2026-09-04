/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Where Tailwind should look for used classes
    "./src/**/*.{js,jsx}", // Also look in JavaScript and JSX files in the src folder
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF6FF', // Lightest shade
          100: '#D5E8FF',
          200: '#AAD1FF',
          300: '#80BAFF',
          400: '#5AA3FF',
          500: '#4A90E2', // Main primary color
          600: '#3A73C5',
          700: '#2B56A8',
          800: '#1C398A',
          900: '#0D1C6D', // Darkest shade
        },
        secondary: {
          50: '#EAFAF2',
          100: '#D5F5E5',
          200: '#ABEBCB',
          300: '#80E1B1',
          400: '#56D797',
          500: '#2ECC71', // Main secondary color
          600: '#25A55A',
          700: '#1C7E44',
          800: '#13572E',
          900: '#0A2B17',
        },
        accent: {
          50: '#FFF5F0',
          100: '#FFEBD8',
          200: '#FFD7B2',
          300: '#FFC38C',
          400: '#FFAF66',
          500: '#FF9966', // Main accent color
          600: '#E67452',
          700: '#CC4F3F',
          800: '#B3292B',
          900: '#991417',
        },
        neutral: {
          50: '#F9FAFC',
          100: '#F1F3F9',
          200: '#E3E8F0',
          300: '#D5DCE7',
          400: '#C7D1DE',
          500: '#B9C5D5',
          600: '#8E9CAF',
          700: '#637389',
          800: '#384A63',
          900: '#0D213D', // Dark neutral tone
        },
      },

      // Custom font families
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Default sans-serif
        display: ['Montserrat', 'sans-serif'], // Used for headlines
      },

      // Custom box shadows
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.08)', // Light shadow for cards
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.12)', // Hover effect shadow for cards
      },

      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out', // Fade in effect
        'slide-up': 'slideUp 0.4s ease-out', // Slide-up effect
      },

      // Keyframe animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [], // No plugins currently in use
}
