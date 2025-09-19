export default defineNuxtRouteMiddleware(async () => {
  const { $config, $connectAuth } = useNuxtApp()
  if ($config.public.playwright) {
    // Set fake authentication during playwright runs
    const account = useConnectAccountStore()
    const { currentAccount } = storeToRefs(account)
    // Set values for test mocks
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
})
