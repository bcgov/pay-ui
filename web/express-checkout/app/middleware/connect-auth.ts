/**
 * express-checkout override of the layer's `connect-auth` middleware.
 * Same behavior for auth + terms-of-use handling, but calls
 * `finalRedirect(to, false)` instead of `finalRedirect(to, true)` on the
 * post-login / post-ToU redirect.
 *
 * Why: with `manageAccount=true` the layer's finalRedirect pushes users to
 * `/auth/account/select` when they have multiple accounts. express-checkout already
 * has its own account picker at `/pay/[token]/account`, so we don't want the
 * double pick. Passing false skips the redirect and honors the `return` URL,
 * which brings the user back to `/pay/[token]` where our own flow takes over.
 *
 * Nuxt resolves middleware by directory path; this file at
 * `app/middleware/connect-auth.ts` in express-checkout overrides the same-named file
 * in `@sbc-connect/nuxt-auth` for this app only. Other apps (registry-home,
 * corps, person-roles) still see the layer's original behavior.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated } = useConnectAuth()
  const rtc = useRuntimeConfig().public
  const localePath = useLocalePath()
  const service = useConnectAuthService()
  const { finalRedirect } = useConnectAccountFlowRedirect()

  const isLoginPage = to.meta.connectLogin === true
  const isTosPage = to.meta.connectTosPage === true

  if (!isAuthenticated.value && !isLoginPage && !rtc.playwright) {
    const defaultReturn = `${rtc.baseUrl}${to.fullPath.slice(1)}`
    const returnUrl = (to.query.return && String(to.query.return)) || defaultReturn

    return navigateTo({
      path: localePath('/auth/login'),
      query: {
        ...to.query,
        return: returnUrl
      }
    })
  }

  if (isAuthenticated.value) {
    const res = await service.getAuthUserProfile().catch(() => undefined)
    const hasAccepted = res?.userTerms.isTermsOfUseAccepted
    if (!hasAccepted && !isTosPage) {
      const query = { ...to.query }
      if (!query.return) {
        query.return = `${rtc.baseUrl}${to.fullPath.slice(1)}`
      }
      return navigateTo({ path: localePath('/auth/terms-of-use'), query })
    } else if (hasAccepted && (isTosPage || isLoginPage)) {
      // Zero-accounts users still need the layer's onboarding — send them to
      // /auth/account/create explicitly. Once they finish, they'll have one
      // account (bypassAccounts=true in finalRedirect) and land on our page.
      const accountStore = useConnectAccountStore()
      if (accountStore.userAccounts.length === 0) {
        return navigateTo({
          path: localePath('/auth/account/create'),
          query: { ...to.query }
        })
      }
      // Otherwise: skip the /auth/account/select detour and honor the return
      // URL — express-checkout has its own picker at /pay/[token]/account.
      return finalRedirect(to, false)
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
      // allows each test to mock the account information with its own data
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
