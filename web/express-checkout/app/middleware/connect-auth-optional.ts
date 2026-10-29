/**
 * Auth for pages that both signed-in and anonymous payers can reach.
 *
 * Same as `connect-auth`, minus the redirect to login when there is no session — an
 * anonymous payer holding a payment link is allowed through, and the page decides what
 * to render for them.
 *
 * Signed-in users still get the terms-of-use gate. Two branches from `connect-auth` are
 * deliberately absent: the zero-account / `finalRedirect` handling only fires on the
 * login and ToU pages themselves, and the Playwright block force-authenticates the
 * session, which would defeat the point of a route that exists to serve guests.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useConnectAuth()
  const rtc = useRuntimeConfig().public
  const localePath = useLocalePath()
  const service = useConnectAuthService()

  if (!isAuthenticated.value) {
    return
  }

  const res = await service.getAuthUserProfile().catch(() => undefined)
  if (!res?.userTerms.isTermsOfUseAccepted) {
    const query = { ...to.query }
    if (!query.return) {
      query.return = `${rtc.baseUrl}${to.fullPath.slice(1)}`
    }
    return navigateTo({ path: localePath('/auth/terms-of-use'), query })
  }
})
