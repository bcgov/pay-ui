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
  'feature-policy': "microphone 'self'",
  'strict-transport-security': 'max-age=31536000;'
}

// Nitro route rules match paths, not extensions, so the long-lived cache is applied per static asset folder
const longCache = { headers: { 'cache-control': 'public,max-age=31536000' } }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Registry Digital Services Express Checkout'
    }
  },

  ssr: true,

  // Auth is browser-only (keycloak-js, token in memory, no cookie), so the server cannot render
  // authenticated pages; they are served as an SPA shell. Server routes (/pay-proxy) are unaffected.
  // Opt a route into SSR here only if it renders without the user's token.
  // Only the landing pages qualify today ('/en-CA' and '/fr-CA' are static and safe to set to
  // `ssr: true`); the /pay/** pages need the browser session, so they must stay SPA.
  // Headers mirror the previous Firebase Hosting config (firebase.json).
  routeRules: {
    '/': { redirect: '/en-CA' },
    '/**': { ssr: false, headers: securityHeaders },
    '/_nuxt/**': longCache,
    '/css/**': longCache,
    '/js/**': longCache,
    '/fonts/**': longCache,
    '/img/**': longCache,
    '/BCGovLogo/**': longCache,
    '/favicon.ico': longCache,
    // Build manifest (json) must not be cached, so clients pick up new deployments
    '/_nuxt/builds/**': {
      headers: { 'cache-control': 'no-cache, no-store, must-revalidate' }
    }
  },

  devtools: { enabled: false },

  modules: ['@nuxt/test-utils/module'],

  extends: ['@sbc-connect/nuxt-pay'],

  css: ['~/assets/css/main.css'],

  router: {
    options: {
      scrollBehaviorType: 'smooth'
    }
  },

  imports: {
    dirs: ['stores', 'composables', 'enums', 'interfaces', 'types', 'utils']
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
    // Server-only (NUXT_PAY_API_URL, NUXT_X_API_KEY); never serialized to the browser
    payApiUrl: '',
    xApiKey: '',
    // Full Content-Security-Policy header value (NUXT_CSP_EXTRA)
    cspExtra: '',
    public: {
      // Browser calls pay-api through the server proxy so the API key stays on the server
      payApiUrl: '/pay-proxy',
      version: `Pay UI v${process.env.npm_package_version || ''}`,
      playwright: process.env.playwright === 'true'
    }
  }
})
