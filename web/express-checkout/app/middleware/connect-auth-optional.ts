/**
 * Auth for pages that both signed-in and anonymous payers can reach.
 *
 * Same as `connect-auth`, minus the redirect to login when there is no session — an
 * anonymous payer holding a payment link is allowed through, and the page decides what
 * to render for them.
 *
 * Signed-in users still get the terms-of-use gate. The zero-account / `finalRedirect`
 * branch in `connect-auth` only fires on the login and ToU pages themselves, so it has
 * nothing to do here and is deliberately left out.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useConnectAuth()
  const rtc = useRuntimeConfig().public
  const localePath = useLocalePath()
  const service = useConnectAuthService()

  if (isAuthenticated.value) {
    const res = await service.getAuthUserProfile().catch(() => undefined)
    if (!res?.userTerms.isTermsOfUseAccepted) {
      const query = { ...to.query }
      if (!query.return) {
        query.return = `${rtc.baseUrl}${to.fullPath.slice(1)}`
      }
      return navigateTo({ path: localePath('/auth/terms-of-use'), query })
    }
  }

  if (rtc.playwright) {
    const { $connectAuth } = useNuxtApp()
    const { currentAccount } = storeToRefs(useConnectAccountStore())

    $connectAuth.tokenParsed = {
      firstname: 'TestFirst',
      lastname: 'TestLast',
      name: 'TestFirst TestLast',
      username: 'testUsername',
      email: 'testEmail@test.com',
      sub: 'test',
      loginSource: 'IDIR',
      realm_access: { roles: ['public_user'] }
    }
    $connectAuth.authenticated = true

    if (rtc.playwrightFetchTestAccount) {
      await useConnectAccountStore().loadUserAccounts(true)
    } else {
      currentAccount.value = {
        id: 1,
        label: 'Playwright',
        accountStatus: AccountStatus.ACTIVE,
        accountType: AccountType.PREMIUM,
        type: UserSettingsType.ACCOUNT,
        urlorigin: '',
        urlpath: ''
      }
    }
  }
})
