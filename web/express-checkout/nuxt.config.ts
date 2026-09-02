// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  modules: [
    '@nuxt/test-utils/module'
  ],

  extends: [
    '@sbc-connect/nuxt-business-base'
  ],

  css: [
    '~/assets/css/main.css'
  ],

  router: {
    options: {
      scrollBehaviorType: 'smooth'
    }
  },

  routeRules: {
    '/': { redirect: '/en-CA' }
  },

  imports: {
    dirs: [
      'stores',
      'composables',
      'enums',
      'interfaces',
      'types',
      'utils'
    ]
  },

  i18n: {
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
    ],
    langDir: 'locales'
  },

  compatibilityDate: '2025-12-09',

  runtimeConfig: {
    public: {
      version: `Pay UI v${process.env.npm_package_version || ''}`,
      playwright: process.env.playwright === 'true'
    }
  },

  typescript: {
    tsConfig: {
      exclude: [
        '../../business-registry-dashboard/**',
        '../../corps/**',
        '../../person-roles/**',
        '../../registry-home/**',
        '../../../packages/layers/base/tests/**'
      ]
    }
  }
})
