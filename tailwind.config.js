export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        red:    { DEFAULT: '#0A0A0A', dark: '#333333', light: '#2373F4' },
        dark:   { DEFAULT: '#111112', 2: '#18181A', 3: '#222224' },
        chrome: { DEFAULT: '#F4F4F5', dim: '#8A8A90' },
        surface:'#2A2A2D',
      },
      fontFamily: {
        sans:  ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Sora', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
