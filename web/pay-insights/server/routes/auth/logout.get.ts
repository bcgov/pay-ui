/** Clears the app session and ends the Keycloak (and SiteMinder, for IDIR) session. */
export default defineEventHandler(async (event) => {
  const session = await useInsightsSession(event)
  await session.clear()

  const { idpClientid } = useRuntimeConfig()
  const { siteminderLogoutUrl } = useRuntimeConfig().public
  const appUrl = getAppUrl(event, '/')
  const redirectUri = siteminderLogoutUrl
    ? `${siteminderLogoutUrl}?returl=${encodeURIComponent(appUrl)}&retnow=1`
    : appUrl

  const url = new URL(`${getIssuer()}/protocol/openid-connect/logout`)
  url.search = new URLSearchParams({
    client_id: idpClientid,
    post_logout_redirect_uri: redirectUri
  }).toString()

  return sendRedirect(event, url.href)
})
