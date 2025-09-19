// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  compatibilityDate: '2025-09-19',

  modules: ['@nuxt/test-utils/module'],

  extends: [
    '@sbc-connect/nuxt-pay',
    '@sbc-connect/nuxt-forms'
  ],

  imports: {
    dirs: ['interfaces', 'types', 'enums']
  },

  typescript: {
    includeWorkspace: true // required for ts to recognize autoimports/relative paths in test files
  },

  i18n: {
    langDir: 'locales',
    locales: [
      {
        name: 'English',
        code: 'en-CA',
        language: 'en-CA',
        dir: 'ltr',
        file: 'en-CA.ts'
      },
      {
        name: 'Français',
        code: 'fr-CA',
        language: 'fr-CA',
        dir: 'ltr',
        file: 'fr-CA.ts'
      }
    ]
  },

  runtimeConfig: {
    public: {
      version: `Person Roles UI v${process.env.npm_package_version || ''}`,
      playwright: process.env.playwright === 'true',
      fasWebUrl: ''
    }
  }
})
