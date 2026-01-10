// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'BC Business Registry FAS'
    }
  },

  ssr: false,

  devtools: { enabled: false },

  compatibilityDate: '2025-09-19',

  modules: [
    '@nuxt/test-utils/module'
  ],

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

  components: [
    '~/components',
    {
      path: '~/components/common',
      pathPrefix: false
    },
    {
      path: '~/components/eft',
      pathPrefix: false
    }
  ],

  i18n: {
    langDir: 'locales',
    strategy: 'no_prefix',
    defaultLocale: 'en-CA',
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

  css: [
    '~/assets/scss/global.scss'
  ],

  vite: {
    server: {
      watch: {
        usePolling: true
      }
    }
  },

  runtimeConfig: {
    public: {
      version: `Pay UI v${process.env.npm_package_version || ''}`,
      playwright: process.env.playwright === 'true'
    }
  }
})
