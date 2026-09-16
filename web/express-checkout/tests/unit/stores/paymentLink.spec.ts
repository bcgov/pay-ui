import { createPinia, setActivePinia } from 'pinia'
import { usePaymentLinkStore } from '~/stores/paymentLink'
import type { PayInvoice, AccountPaymentInfo } from '~/stores/paymentLink'

describe('usePaymentLinkStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with all state null', () => {
    const store = usePaymentLinkStore()
    expect(store.token).toBeNull()
    expect(store.invoice).toBeNull()
    expect(store.selectedAccountId).toBeNull()
    expect(store.paymentMethod).toBeNull()
    expect(store.accountInfo).toBeNull()
  })

  it('setToken updates token', () => {
    const store = usePaymentLinkStore()
    store.setToken('abc-123')
    expect(store.token).toBe('abc-123')
    store.setToken(null)
    expect(store.token).toBeNull()
  })

  it('setInvoice auto-populates paymentMethod when unset', () => {
    const store = usePaymentLinkStore()
    const invoice = { id: 1, paymentMethod: 'PAD' } as PayInvoice
    store.setInvoice(invoice)
    expect(store.invoice).toEqual(invoice)
    expect(store.paymentMethod).toBe('PAD')
  })

  it('setInvoice does not overwrite an existing paymentMethod', () => {
    const store = usePaymentLinkStore()
    store.setMethod('CC')
    store.setInvoice({ id: 1, paymentMethod: 'PAD' } as PayInvoice)
    expect(store.paymentMethod).toBe('CC')
  })

  it('setInvoice handles invoice without paymentMethod', () => {
    const store = usePaymentLinkStore()
    store.setInvoice({ id: 1 } as PayInvoice)
    expect(store.invoice).toEqual({ id: 1 })
    expect(store.paymentMethod).toBeNull()
  })

  it('setAccount / setMethod / setAccountInfo update their fields', () => {
    const store = usePaymentLinkStore()
    store.setAccount(42)
    store.setMethod('DIRECT_PAY')
    const info = { id: 9, paymentMethod: 'DIRECT_PAY' } as AccountPaymentInfo
    store.setAccountInfo(info)

    expect(store.selectedAccountId).toBe(42)
    expect(store.paymentMethod).toBe('DIRECT_PAY')
    expect(store.accountInfo).toEqual(info)
  })

  it('$reset clears all state', () => {
    const store = usePaymentLinkStore()
    store.setToken('tok')
    store.setInvoice({ id: 1, paymentMethod: 'CC' } as PayInvoice)
    store.setAccount(7)
    store.setAccountInfo({ id: 3 } as AccountPaymentInfo)

    store.$reset()

    expect(store.token).toBeNull()
    expect(store.invoice).toBeNull()
    expect(store.selectedAccountId).toBeNull()
    expect(store.paymentMethod).toBeNull()
    expect(store.accountInfo).toBeNull()
  })
})
