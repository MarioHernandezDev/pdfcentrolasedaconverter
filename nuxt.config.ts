export default defineNuxtConfig({
  compatibilityDate: '2026-09-29',
  devServer: {
    port: 3001
  },
  nitro: {
    // Runtime Node serverless de Vercel. Necesario (no vercel-edge): el
    // pipeline usa fs/tmpdir, node:crypto y pdf-lib, que requieren Node.
    preset: 'vercel'
  },
  runtimeConfig: {
    // Solo accesible en el servidor. En produccion se sobreescribe con la
    // variable de entorno NUXT_ACCESS_PASSWORD (ver .env.example).
    accessPassword: 'centrolasedacreacionpdf1234'
  },
  modules: [['@nuxtjs/tailwindcss', { cssPath: '~/assets/css/main.css' }]],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Centro Laseda | Estandarización documental',
      meta: [
        {
          name: 'description',
          content: 'Herramienta interna para estandarización de documentos.'
        }
      ]
    }
  }
})