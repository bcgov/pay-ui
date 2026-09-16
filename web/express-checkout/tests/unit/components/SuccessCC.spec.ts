import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SuccessCC from '~/components/success/SuccessCC.vue'
import { usePaymentLinkStore } from '~/stores/paymentLink'

const { downloadReceipt, downloadReceiptByToken } = vi.hoisted(() => ({
  downloadReceipt: vi.fn(),
  downloadReceiptByToken: vi.fn()
}))
mockNuxtImport('usePayLink', () => () => ({
  downloadReceipt,
  downloadReceiptByToken
}) as unknown as ReturnType<typeof usePayLink>)

async function clickDownload(seed: (store: ReturnType<typeof usePaymentLinkStore>) => void) {
  const wrapper = await mountSuspended(SuccessCC, {
    props: { invoiceId: 42, invoiceCreatedOn: '2026-09-08T12:00:00Z', amountFormatted: '$25.00' }
  })
  seed(usePaymentLinkStore())
  await wrapper.find('button').trigger('click')
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('SuccessCC download', () => {
  beforeEach(() => {
    downloadReceipt.mockReset().mockResolvedValue(new Blob(['pdf']))
    downloadReceiptByToken.mockReset().mockResolvedValue(new Blob(['pdf']))
  })

  it('reads the receipt through the token when there is no account to read as', async () => {
    // The point of the guest path — /payment-requests/{id}/receipts would 401.
    await clickDownload((store) => {
      store.setToken('tok-123')
      store.setAccount(null)
    })

    expect(downloadReceiptByToken).toHaveBeenCalledWith('tok-123', expect.any(String))
    expect(downloadReceipt).not.toHaveBeenCalled()
  })

  it('reads the receipt by invoice id once an account has been selected', async () => {
    await clickDownload((store) => {
      store.setToken('tok-123')
      store.setAccount(9999)
    })

    expect(downloadReceipt).toHaveBeenCalledWith(42, expect.any(String))
    expect(downloadReceiptByToken).not.toHaveBeenCalled()
  })
})
