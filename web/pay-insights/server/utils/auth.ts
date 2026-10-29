import type { H3Event } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'

export interface InsightsUser {
  sub: string
  username?: string
  name?: string
  roles: string[]
}

interface SessionData {
  user?: InsightsUser
}

interface LoginData {
  state?: string
  verifier?: string
  returnTo?: string
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

export function getIssuer(): string {
  const { idpUrl, idpRealm } = useRuntimeConfig().public
  return `${String(idpUrl).replace(/\/$/, '')}/realms/${idpRealm}`
}

export function getAppUrl(event: H3Event, path: string): string {
  const { baseUrl } = useRuntimeConfig().public
  const origin = baseUrl || getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  return new URL(path, origin).href
}

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${getIssuer()}/protocol/openid-connect/certs`))
  }
  return jwks
}

export function parseAllowedRoles(value: string): string[] {
  return value.split(',').map(role => role.trim()).filter(Boolean)
}

export function getRealmRoles(payload: JWTPayload): string[] {
  const realmAccess = payload.realm_access as { roles?: unknown } | undefined
  return Array.isArray(realmAccess?.roles) ? realmAccess.roles.map(String) : []
}

export function hasAllowedRole(roles: string[], allowedRoles: string[]): boolean {
  return roles.some(role => allowedRoles.includes(role))
}

/** Only allow redirects back to a path in this app (prevents open redirects). */
export function safeReturnPath(value: unknown): string {
  const path = typeof value === 'string' ? value : ''
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/'
}

/** Verifies a Keycloak access token (signature, issuer, expiry) and returns the user. */
export async function userFromAccessToken(token: string): Promise<InsightsUser> {
  const { payload } = await jwtVerify(token, getJwks(), { issuer: getIssuer() })
  return {
    sub: String(payload.sub),
    username: (payload.username ?? payload.preferred_username) as string | undefined,
    name: payload.name as string | undefined,
    roles: getRealmRoles(payload)
  }
}

/** Encrypted, HttpOnly session cookie holding the signed-in user. */
export function useInsightsSession(event: H3Event) {
  const { password, maxAgeSeconds } = useRuntimeConfig().session
  return useSession<SessionData>(event, {
    name: 'pay-insights-session',
    password,
    maxAge: Number(maxAgeSeconds),
    cookie: { httpOnly: true, secure: !import.meta.dev, sameSite: 'lax' }
  })
}

/** Short-lived cookie for the login round trip (state, PKCE verifier, return path). */
export function useLoginSession(event: H3Event) {
  return useSession<LoginData>(event, {
    name: 'pay-insights-login',
    password: useRuntimeConfig().session.password,
    maxAge: 600,
    cookie: { httpOnly: true, secure: !import.meta.dev, sameSite: 'lax' }
  })
}

/** Returns the signed-in user, or throws 401 (not signed in) / 403 (no allowed role). */
export async function requireInsightsUser(event: H3Event): Promise<InsightsUser> {
  const session = await useInsightsSession(event)
  const user = session.data.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!hasAllowedRole(user.roles, parseAllowedRoles(useRuntimeConfig().allowedRoles))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
