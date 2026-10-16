import { createHash, randomBytes } from 'node:crypto'

/**
 * Starts the Keycloak login (authorization code + PKCE). If the user already has
 * a Keycloak session (e.g. from the sbc-auth staff dashboard), Keycloak returns
 * straight away without a login prompt.
 */
export default defineEventHandler(async (event) => {
  const { idpClientid, idpHint } = useRuntimeConfig()
  const state = randomBytes(16).toString('base64url')
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  const login = await useLoginSession(event)
  await login.update({ state, verifier, returnTo: safeReturnPath(getQuery(event).return) })

  const url = new URL(`${getIssuer()}/protocol/openid-connect/auth`)
  url.search = new URLSearchParams({
    client_id: idpClientid,
    response_type: 'code',
    scope: 'openid',
    redirect_uri: getAppUrl(event, '/auth/callback'),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...(idpHint ? { kc_idp_hint: idpHint } : {})
  }).toString()

  return sendRedirect(event, url.href)
})
