import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { useCcHandoff } from '~/composables/useCcHandoff'
import { usePaymentLinkStore } from '~/stores/paymentLink'
import type { PayInvoice } from '~/stores/paymentLink'

// Stub the pay-api composable so tests don't touch real HTTP.
const changePaymentMethod = vi.fn()
const createTransaction = vi.fn()
vi.mock('~/composables/usePayLink', () => ({
  usePayLink: () => ({
    changePaymentMethod,
    createTransaction,
    redeem: vi.fn(),
    updateTransaction: vi.fn()
  })
}))

// Override the Nuxt auto-import for useRuntimeConfig so we can inject baseUrl.
mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { baseUrl: 'https://example.test/' }
}) as ReturnType<typeof useRuntimeConfig>)

// window.location.assign — swap so we can assert redirect target without navigating.
const assignSpy = vi.fn()
const originalLocation = window.location

describe('useCcHandoff', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: assignSpy }
    })
    assignSpy.mockClear()
    changePaymentMethod.mockReset()
    createTransaction.mockReset()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    })
  })

  it('patches the invoice to DIRECT_PAY when the current method differs', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-123')
    store.setInvoice({ id: 7, paymentMethod: 'ONLINE_BANKING' } as PayInvoice)

    changePaymentMethod.mockResolvedValueOnce({ id: 7, paymentMethod: 'DIRECT_PAY' })
    createTransaction.mockResolvedValueOnce({ id: 99, paySystemUrl: 'https://paybc.test/hosted/99' })

    const { handoff } = useCcHandoff()
    const result = await handoff(7)

    expect(changePaymentMethod).toHaveBeenCalledWith(7, 'DIRECT_PAY')
    expect(store.invoice?.paymentMethod).toBe('DIRECT_PAY')
    expect(store.paymentMethod).toBe('DIRECT_PAY')
    expect(result).toBe(true)
  })

  it('skips the changePaymentMethod call when the invoice is already DIRECT_PAY', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-123')
    store.setInvoice({ id: 7, paymentMethod: 'DIRECT_PAY' } as PayInvoice)

    createTransaction.mockResolvedValueOnce({ id: 99, paySystemUrl: 'https://paybc.test/hosted/99' })

    const { handoff } = useCcHandoff()
    await handoff(7)

    expect(changePaymentMethod).not.toHaveBeenCalled()
    expect(createTransaction).toHaveBeenCalledOnce()
  })

  it('passes the pay-return and client-system URLs derived from baseUrl + token', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-abc')
    store.setInvoice({ id: 5, paymentMethod: 'DIRECT_PAY' } as PayInvoice)

    createTransaction.mockResolvedValueOnce({ id: 1, paySystemUrl: 'https://paybc.test/1' })

    const { handoff } = useCcHandoff()
    await handoff(5)

    expect(createTransaction).toHaveBeenCalledWith(5, {
      payReturnUrl: 'https://example.test/pay/return',
      clientSystemUrl: 'https://example.test/pay/tok-abc/success'
    })
  })

  it('redirects to paySystemUrl and returns true when pay-api hands one back', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-123')
    store.setInvoice({ id: 7, paymentMethod: 'DIRECT_PAY' } as PayInvoice)

    createTransaction.mockResolvedValueOnce({ id: 1, paySystemUrl: 'https://paybc.test/hosted/1' })

    const { handoff } = useCcHandoff()
    const ok = await handoff(7)

    expect(assignSpy).toHaveBeenCalledWith('https://paybc.test/hosted/1')
    expect(ok).toBe(true)
  })

  it('returns false without redirecting when paySystemUrl is missing', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-123')
    store.setInvoice({ id: 7, paymentMethod: 'DIRECT_PAY' } as PayInvoice)

    createTransaction.mockResolvedValueOnce({ id: 1 })

    const { handoff } = useCcHandoff()
    const ok = await handoff(7)

    expect(assignSpy).not.toHaveBeenCalled()
    expect(ok).toBe(false)
  })

  it('propagates errors from pay-api so callers can surface them', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-123')
    store.setInvoice({ id: 7, paymentMethod: 'ONLINE_BANKING' } as PayInvoice)

    changePaymentMethod.mockRejectedValueOnce(new Error('boom'))

    const { handoff } = useCcHandoff()
    await expect(handoff(7)).rejects.toThrow('boom')
  })
})
