// Lowercase keys so these merge with Nuxt's built-in route rules instead of duplicating headers.
// Content-Security-Policy is set at runtime from NUXT_CSP_EXTRA by server/middleware/csp.ts.
const securityHeaders = {
  'access-control-allow-origin': '*',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'x-xss-protection': '1; mode=block',
  'cache-control': 'private, no-cache, no-store, must-revalidate',
  'pragma': 'no-cache',
  'referrer-policy': 'no-referrer',
  'feature-policy': 'microphone \'self\'',
  'strict-transport-security': 'max-age=31536000;'
}

// Nitro route rules match paths, not extensions, so the long-lived cache is applied per static asset folder
const longCache = { headers: { 'cache-control': 'public,max-age=31536000' } }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'BC Business Registry FAS'
    }
  },

  ssr: true,

  // Auth is browser-only (keycloak-js, token in memory, no cookie), so the server cannot render
  // authenticated pages; they are served as an SPA shell. Server routes (/pay-proxy) are unaffected.
  // Opt a route into SSR here only if it renders without the user's token.
  // Headers mirror the previous Firebase Hosting config (firebase.json).
  routeRules: {
    '/**': { ssr: false, headers: securityHeaders },
    '/_nuxt/**': longCache,
    '/css/**': longCache,
    '/js/**': longCache,
    '/fonts/**': longCache,
    '/img/**': longCache,
    '/BCGovLogo/**': longCache,
    '/favicon.ico': longCache,
    // Build manifest (json) must not be cached, so clients pick up new deployments
    '/_nuxt/builds/**': { headers: { 'cache-control': 'no-cache, no-store, must-revalidate' } }
  },

  devtools: { enabled: false },

  compatibilityDate: '2025-09-19',

  modules: ['@nuxt/test-utils/module'],

  extends: ['@sbc-connect/nuxt-pay', '@sbc-connect/nuxt-forms'],

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

  css: ['~/assets/scss/global.scss'],

  vite: {
    server: {
      watch: {
        usePolling: true
      }
    }
  },

  runtimeConfig: {
    // Server-only (NUXT_PAY_API_URL, NUXT_X_API_KEY); never serialized to the browser
    payApiUrl: '',
    xApiKey: '',
    // Full Content-Security-Policy header value (NUXT_CSP_EXTRA), set by server/middleware/csp.ts
    cspExtra: '',
    public: {
      // Browser calls pay-api through the server proxy so the API key stays on the server
      payApiUrl: '/pay-proxy',
      version: `Pay UI v${process.env.npm_package_version || ''}`,
      playwright: process.env.playwright === 'true',
      isPreviewBuild: process.env.NUXT_PUBLIC_IS_PREVIEW_BUILD === 'true'
    }
  }
})
