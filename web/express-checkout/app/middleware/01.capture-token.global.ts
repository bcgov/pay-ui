/**
 * Captures the payment link token from any /pay/[token]/... URL into the store
 * before the auth global middleware kicks in (order 00). If the user is not
 * yet authenticated, they'll be redirected to Keycloak — the token has to be
 * in the store so we can resume the flow after login.
 */
export default defineNuxtRouteMiddleware((to) => {
  const token = to.params?.token
  if (typeof token !== 'string' || !token) { return }

  const store = usePaymentLinkStore()
  if (store.token !== token) {
    // Different token means a different invoice — reset the previous flow.
    store.$reset()
    store.setToken(token)
  }
})
