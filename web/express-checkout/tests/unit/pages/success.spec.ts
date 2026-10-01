import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import SuccessPage from '~/pages/pay/[token]/success.vue'
import { usePaymentLinkStore } from '~/stores/paymentLink'

const { getInvoiceByToken } = vi.hoisted(() => ({ getInvoiceByToken: vi.fn() }))
mockNuxtImport('usePayLink', () => () => ({
  redeem: vi.fn(),
  getInvoice: vi.fn(),
  getInvoiceByToken,
  createTransactionByToken: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  changePaymentMethod: vi.fn(),
  downloadReceipt: vi.fn(),
  downloadReceiptByToken: vi.fn(),
  downloadInvoice: vi.fn(),
  downloadEftInstructions: vi.fn()
}) as unknown as ReturnType<typeof usePayLink>)

describe('success.vue — EFT', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getInvoiceByToken.mockReset()
  })

  it('routes an EFT invoice to the EFT pending screen', async () => {
    const store = usePaymentLinkStore()
    store.setInvoice({ id: 1, total: 25, paymentMethod: 'EFT' })

    const wrapper = await mountSuspended(SuccessPage)

    expect(wrapper.text()).toContain('Payment Pending')
    expect(wrapper.text()).toContain('Electronic Funds Transfer')
    expect(wrapper.text()).toContain('$25.00')
  })

  it('does not route a PAD invoice to the EFT screen', async () => {
    const store = usePaymentLinkStore()
    store.setInvoice({ id: 1, total: 25, paymentMethod: 'PAD' })

    const wrapper = await mountSuspended(SuccessPage)

    expect(wrapper.text()).toContain('Payment in Progress')
  })
})
