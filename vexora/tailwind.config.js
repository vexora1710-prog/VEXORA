export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      ink: '#010d17',
      navy: '#071b2d',
      violet: '#8ad8ff',
      cyan: '#d7fbff',
      azure: '#6ed7ff'
    },
    fontFamily: { display: ['"Space Grotesk"', 'system-ui', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'] }
  } },
  plugins: []
}
