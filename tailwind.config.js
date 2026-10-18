export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        red:    { DEFAULT: '#DB3000', dark: '#B02500', light: '#F0603A' },
        dark:   { DEFAULT: '#111112', 2: '#18181A', 3: '#222224' },
        chrome: { DEFAULT: '#F0F0F0', dim: '#8A8A90' },
        surface:'#2A2A2D',
      },
      fontFamily: {
        sans:  ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
