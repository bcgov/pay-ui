import { log } from '../utils/logger'

let warned = false

// The full Content-Security-Policy comes from NUXT_CSP_EXTRA (loaded from vault) so it can change without a rebuild
export default defineEventHandler((event) => {
  const policy = useRuntimeConfig(event).cspExtra?.trim()
  if (policy) {
    setResponseHeader(event, 'content-security-policy', policy)
  } else if (!warned) {
    warned = true
    log('WARNING', 'NUXT_CSP_EXTRA is not set; responses are served without a Content-Security-Policy')
  }
})
