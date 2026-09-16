import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalizedGeneric } from 'vue-router'
import middleware from '~/middleware/01.capture-token.global'
import { usePaymentLinkStore } from '~/stores/paymentLink'

function createRoute(params: Record<string, unknown> = {}) {
  return { params } as unknown as RouteLocationNormalizedGeneric
}

const from = {} as RouteLocationNormalizedGeneric

describe('01.capture-token.global middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does nothing when no token param is present', () => {
    const store = usePaymentLinkStore()
    store.setToken('existing')
    middleware(createRoute(), from)
    expect(store.token).toBe('existing')
  })

  it('does nothing when token param is empty', () => {
    const store = usePaymentLinkStore()
    store.setToken('existing')
    middleware(createRoute({ token: '' }), from)
    expect(store.token).toBe('existing')
  })

  it('does nothing when token param is not a string', () => {
    const store = usePaymentLinkStore()
    store.setToken('existing')
    middleware(createRoute({ token: ['a', 'b'] }), from)
    expect(store.token).toBe('existing')
  })

  it('captures the token when none is stored', () => {
    const store = usePaymentLinkStore()
    middleware(createRoute({ token: 'new-token' }), from)
    expect(store.token).toBe('new-token')
  })

  it('is a no-op when the incoming token matches the stored token', () => {
    const store = usePaymentLinkStore()
    store.setToken('same-token')
    store.setAccount(99)
    middleware(createRoute({ token: 'same-token' }), from)
    expect(store.token).toBe('same-token')
    expect(store.selectedAccountId).toBe(99)
  })

  it('resets the store and stores the new token when it differs', () => {
    const store = usePaymentLinkStore()
    store.setToken('old-token')
    store.setAccount(42)
    store.setMethod('PAD')

    middleware(createRoute({ token: 'new-token' }), from)

    expect(store.token).toBe('new-token')
    expect(store.selectedAccountId).toBeNull()
    expect(store.paymentMethod).toBeNull()
  })
})
