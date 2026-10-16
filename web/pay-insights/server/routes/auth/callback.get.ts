interface TokenResponse {
  access_token: string
}

/** Keycloak redirects here after login. Exchanges the code for tokens on the server. */
export default defineEventHandler(async (event) => {
  const { idpClientid, idpClientSecret } = useRuntimeConfig()
  const { code, state } = getQuery(event)

  const login = await useLoginSession(event)
  const { state: expectedState, verifier, returnTo } = login.data
  await login.clear()

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid login response' })
  }

  let user: InsightsUser
  try {
    const tokens = await $fetch<TokenResponse>(`${getIssuer()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: getAppUrl(event, '/auth/callback'),
        client_id: idpClientid,
        // Confidential client only; a public client (e.g. for local testing) uses PKCE alone
        ...(idpClientSecret ? { client_secret: idpClientSecret } : {}),
        code_verifier: verifier
      }).toString()
    })
    user = await userFromAccessToken(tokens.access_token)
  } catch (error) {
    console.error('[auth] token exchange failed', error)
    throw createError({ statusCode: 401, statusMessage: 'Login failed' })
  }

  const session = await useInsightsSession(event)
  await session.update({ user })

  return sendRedirect(event, safeReturnPath(returnTo))
})
