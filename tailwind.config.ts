import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./app.vue', './components/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Arial', 'sans-serif']
      },
      colors: {
        ink: '#202522',
        muted: '#707772',
        line: '#e5e8e5',
        canvas: '#f6f7f5',
        accent: '#52665b'
      }
    }
  }
}