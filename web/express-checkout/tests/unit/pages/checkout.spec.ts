import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CheckoutPage from '~/pages/pay/[token]/checkout.vue'
import { usePaymentLinkStore } from '~/stores/paymentLink'
import type { AccountPaymentInfo, PayInvoice } from '~/stores/paymentLink'

const { changePaymentMethod, downloadEftInstructions } = vi.hoisted(() => ({
  changePaymentMethod: vi.fn(),
  downloadEftInstructions: vi.fn()
}))
mockNuxtImport('usePayLink', () => () => ({
  redeem: vi.fn(),
  getInvoice: vi.fn(),
  getInvoiceByToken: vi.fn(),
  createTransactionByToken: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  changePaymentMethod,
  downloadReceipt: vi.fn(),
  downloadReceiptByToken: vi.fn(),
  downloadInvoice: vi.fn(),
  downloadEftInstructions
}) as unknown as ReturnType<typeof usePayLink>)

const { getAccountPaymentInfo, getOrgAuthorizations, updateOrgToOnlineBanking } = vi.hoisted(() => ({
  getAccountPaymentInfo: vi.fn(),
  getOrgAuthorizations: vi.fn(),
  updateOrgToOnlineBanking: vi.fn()
}))
vi.mock('~/composables/useAccount', () => ({
  useAccount: () => ({
    getAccountPaymentInfo,
    getOrgAuthorizations,
    updateOrgToOnlineBanking,
    verifyPadInfo: vi.fn(),
    updateOrgPadInfo: vi.fn(),
    getPadTermsOfUse: vi.fn()
  })
}))

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateTo)

function invoice(overrides: Partial<PayInvoice> = {}): PayInvoice {
  return { id: 100, total: 25, paymentMethod: 'DIRECT_PAY', ...overrides }
}

function eftAccountInfo(overrides: Partial<AccountPaymentInfo> = {}): AccountPaymentInfo {
  return { id: 1, paymentMethod: 'EFT', cfsAccount: { paymentMethod: 'EFT' }, ...overrides }
}

// Don't create a separate Pinia here — mountSuspended's component won't see it.
function seed(invoiceOverrides: Partial<PayInvoice>, accountInfo: AccountPaymentInfo) {
  const store = usePaymentLinkStore()
  store.setToken('tok-1')
  store.setAccount(42)
  store.setInvoice(invoice(invoiceOverrides))
  getAccountPaymentInfo.mockResolvedValue(accountInfo)
  return store
}

async function mountCheckout() {
  const wrapper = await mountSuspended(CheckoutPage)
  // Flush onMounted's pad.load() call.
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('checkout.vue — EFT', () => {
  beforeEach(() => {
    usePaymentLinkStore().$reset()
    changePaymentMethod.mockReset()
    downloadEftInstructions.mockReset().mockResolvedValue(new Blob(['pdf']))
    getAccountPaymentInfo.mockReset()
    getOrgAuthorizations.mockReset().mockResolvedValue({ roles: [] })
    updateOrgToOnlineBanking.mockReset()
    navigateTo.mockReset()
  })

  it('shows only the EFT option when the account is EFT-bound, even though the invoice is not', async () => {
    seed({ paymentMethod: 'DIRECT_PAY' }, eftAccountInfo())

    const wrapper = await mountCheckout()

    expect(wrapper.text()).toContain('Electronic Funds Transfer')
    expect(wrapper.text()).not.toContain('Credit Card')
    expect(wrapper.text()).not.toContain('Pre-Authorized Debit')
  })

  it('shows the switchable CC/OB/PAD list for a non-EFT account', async () => {
    seed({ paymentMethod: 'DIRECT_PAY' }, { id: 1, paymentMethod: 'DIRECT_PAY' })

    const wrapper = await mountCheckout()

    expect(wrapper.text()).toContain('Credit Card')
    expect(wrapper.text()).not.toContain('Electronic Funds Transfer')
  })

  it('patches the invoice to EFT on confirm when the invoice is not already EFT', async () => {
    seed({ paymentMethod: 'DIRECT_PAY' }, eftAccountInfo())
    changePaymentMethod.mockResolvedValue(invoice({ paymentMethod: 'EFT' }))

    const wrapper = await mountCheckout()
    await wrapper.find('button').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(changePaymentMethod).toHaveBeenCalledWith(100, 'EFT')
    expect(navigateTo).toHaveBeenCalledWith(expect.stringContaining('/success'))
  })

  it('does not patch when the invoice is already EFT', async () => {
    seed({ paymentMethod: 'EFT' }, eftAccountInfo())

    const wrapper = await mountCheckout()
    await wrapper.find('button').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(changePaymentMethod).not.toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith(expect.stringContaining('/success'))
  })

  it('downloads the EFT instructions PDF when the link is clicked', async () => {
    seed({ paymentMethod: 'EFT' }, eftAccountInfo())

    const wrapper = await mountCheckout()
    await wrapper.find('a').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(downloadEftInstructions).toHaveBeenCalled()
  })

  it('shows an error if the EFT instructions download fails', async () => {
    seed({ paymentMethod: 'EFT' }, eftAccountInfo())
    downloadEftInstructions.mockRejectedValue({ data: { message: 'boom' } })

    const wrapper = await mountCheckout()
    await wrapper.find('a').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('boom')
  })
})
