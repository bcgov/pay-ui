import type { H3Event } from 'h3'

// Forwards /pay-proxy/<path> to the pay-api and adds the API key server-side,
// so the key is never exposed to the browser.

const ALLOWED_PREFIXES = ['api/v1/', 'api/v2/']
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
// Only these caller headers are forwarded; cookies, X-Forwarded-*, and any client X-Apikey are dropped
const FORWARDED_HEADERS = ['authorization', 'account-id', 'app-name', 'accept', 'accept-language', 'content-type']
// Anonymous payers (payment-link guests) have no session token, so without one only the
// routes of the guest flow are reachable; everything else needs a signed-in user.
const GUEST_PATHS = [
  /^api\/v[12]\/payment-links\/[^/]+$/,
  /^api\/v[12]\/payment-links\/[^/]+\/(transactions|receipts)$/,
  /^api\/v[12]\/payment-requests\/\d+\/transactions\/[^/]+$/
]
const BEARER = /^Bearer \S+$/
// Encoded dots/slashes and backslashes can be normalized into traversal by URL parsing
const UNSAFE_PATH = /%2e|%2f|%5c|\\/i

function resolveTarget(payApiUrl: string, rawPath: string, search: string): URL | undefined {
  if (UNSAFE_PATH.test(rawPath) || rawPath.split('/').some(s => s === '..' || s === '.')
    || !ALLOWED_PREFIXES.some(p => rawPath.startsWith(p))) {
    return undefined
  }
  const base = new URL(payApiUrl.replace(/\/?$/, '/'))
  const target = new URL(rawPath, base)
  // Re-check after URL normalization so the request cannot leave the configured base
  if (target.origin !== base.origin || !ALLOWED_PREFIXES.some(p => target.pathname.startsWith(base.pathname + p))) {
    return undefined
  }
  target.search = search
  return target
}

function forwardedHeaders(event: H3Event, xApiKey: string): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const name of FORWARDED_HEADERS) {
    const value = getRequestHeader(event, name)
    if (value) {
      headers[name] = value
    }
  }
  headers['x-apikey'] = xApiKey
  return headers
}

export default defineEventHandler(async (event) => {
  const { payApiUrl, xApiKey } = useRuntimeConfig(event)
  if (!payApiUrl) {
    throw createError({ statusCode: 502, statusMessage: 'pay-api URL is not configured' })
  }

  if (!ALLOWED_METHODS.has(event.method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const rawPath = getRouterParam(event, 'path') ?? ''
  const hasSession = BEARER.test(String(getRequestHeader(event, 'authorization') ?? ''))
  if (!hasSession && !GUEST_PATHS.some(p => p.test(rawPath))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const target = resolveTarget(payApiUrl, rawPath, getRequestURL(event).search)
  if (!target) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const raw = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)
    ? await readRawBody(event, false)
    : undefined
  const body = raw ? new Uint8Array(raw) : undefined

  return sendProxy(event, target.href, {
    fetchOptions: { method: event.method, body, headers: forwardedHeaders(event, xApiKey) }
  })
})
