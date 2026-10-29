/**
 * Returns `value` only if it is an http(s) URL on one of `allowedOrigins`; otherwise `fallback`.
 * Guards redirect targets taken from query params against `javascript:` URLs and open redirects.
 */
export function getSafeRedirectUrl(value: unknown, allowedOrigins: string[], fallback: string): string {
  if (typeof value !== 'string' || !value || allowedOrigins.length === 0) {
    return fallback
  }
  try {
    const url = new URL(value, allowedOrigins[0])
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    return isHttp && allowedOrigins.includes(url.origin) ? url.href : fallback
  } catch {
    return fallback
  }
}

/** Origins the app may redirect to: the current page origin and the configured base URL. */
export function getAppOrigins(baseUrl?: string): string[] {
  const origins = import.meta.client ? [window.location.origin] : []
  try {
    if (baseUrl) {
      origins.push(new URL(baseUrl).origin)
    }
  } catch {
    // ignore malformed baseUrl
  }
  return origins
}
