// Security headers, same as web/pay-ui (previously its firebase.json). Lowercase keys so these
// merge with Nuxt's built-in route rules. Content-Security-Policy comes from NUXT_CSP_EXTRA
// at runtime (server/middleware/00.csp.ts).
const securityHeaders = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'x-xss-protection': '1; mode=block',
  'cache-control': 'private, no-cache, no-store, must-revalidate',
  'pragma': 'no-cache',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000;'
}

// Nitro route rules match paths, not extensions, so the long-lived cache is applied per static asset folder
const longCache = { headers: { 'cache-control': 'public,max-age=31536000' } }

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Server-side rendered: login, access checks and warehouse queries all run on
  // the Nuxt server. The browser only gets rendered pages and a session cookie.
  ssr: true,

  devtools: { enabled: false },

  modules: [
    '@nuxt/test-utils/module'
  ],

  extends: [
    '@sbc-connect/nuxt-base'
  ],

  css: [
    '~/assets/css/main.css'
  ],

  routeRules: {
    '/**': { headers: securityHeaders },
    '/': { redirect: '/en-CA' },
    '/_nuxt/**': longCache,
    '/_fonts/**': longCache,
    '/favicon.ico': longCache,
    // Build manifest must not be cached, so clients pick up new deployments
    '/_nuxt/builds/**': { headers: { 'cache-control': 'no-cache, no-store, must-revalidate' } }
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
      }
    ],
    langDir: 'locales'
  },

  compatibilityDate: '2025-12-09',

  runtimeConfig: {
    // Server-only values. Never exposed to the browser.
    // Full Content-Security-Policy header value (NUXT_CSP_EXTRA), set by server/middleware/00.csp.ts
    cspExtra: '',
    // Comma-separated Keycloak realm roles allowed to use the app.
    allowedRoles: 'staff',
    // Keycloak client for the server-side login (public client + PKCE).
    // idpClientSecret is optional — only set it if the client is made confidential.
    idpClientid: '',
    idpClientSecret: '',
    idpHint: 'idir',
    session: {
      // At least 32 characters; encrypts the session cookie
      password: '',
      maxAgeSeconds: '3600'
    },
    warehouse: {
      // Cloud SQL connector (IAM auth) — used when instanceConnectionName is set
      instanceConnectionName: '',
      iamUser: '',
      // Plain connection — local development only (e.g. through cloud-sql-proxy)
      host: '',
      port: '5432',
      user: '',
      password: '',
      database: 'warehouse',
      statementTimeoutMs: '30000'
    },
    public: {
      // Same names as the other Connect apps (pay-ui, express-checkout)
      baseUrl: '',
      idpUrl: '',
      idpRealm: '',
      siteminderLogoutUrl: '',
      version: `PAY Insights v${process.env.npm_package_version || ''}`
    }
  }
})
