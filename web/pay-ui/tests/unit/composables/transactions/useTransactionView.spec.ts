import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useTransactionView } from '~/composables/transactions/useTransactionView'
import CommonUtils from '~/utils/common-util'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', original => () => {
  const overrides: Record<PropertyKey, unknown> = {
    $payApi: vi.fn(),
    $payApiWithErrorHandling: mockPayApi
  }
  return new Proxy(original(), {
    get: (target, key, receiver) => key in overrides ? overrides[key] : Reflect.get(target, key, receiver)
  })
})

describe('useTransactionView', () => {
  beforeEach(() => {
    mockPayApi.mockReset()
  })

  it('getInvoiceComposite returns the response or null', async () => {
    mockPayApi.mockResolvedValueOnce({ id: 5 })
    const { getInvoiceComposite } = useTransactionView()
    expect(await getInvoiceComposite(5)).toEqual({ id: 5 })
    expect(mockPayApi).toHaveBeenCalledWith('/payment-requests/5/composite', { method: 'GET' })
    mockPayApi.mockResolvedValueOnce(undefined)
    expect(await getInvoiceComposite(6)).toBeNull()
  })

  it('getInvoiceRefundHistory queries by invoice id', async () => {
    mockPayApi.mockResolvedValueOnce({ refunds: [] })
    const { getInvoiceRefundHistory } = useTransactionView()
    expect(await getInvoiceRefundHistory(7)).toEqual({ refunds: [] })
    expect(mockPayApi).toHaveBeenCalledWith('/refunds?invoiceId=7', { method: 'GET' })
    mockPayApi.mockResolvedValueOnce(undefined)
    expect(await getInvoiceRefundHistory(7)).toBeNull()
  })

  it('getRefundRequest fetches a refund by id', async () => {
    mockPayApi.mockResolvedValueOnce({ refundId: 9 })
    const { getRefundRequest } = useTransactionView()
    expect(await getRefundRequest(9)).toEqual({ refundId: 9 })
    expect(mockPayApi).toHaveBeenCalledWith('/refunds/9', { method: 'GET' })
    mockPayApi.mockResolvedValueOnce(null)
    expect(await getRefundRequest(9)).toBeNull()
  })

  it('patchRefundRequest sends PATCH with body', async () => {
    mockPayApi.mockResolvedValueOnce(undefined)
    const { patchRefundRequest } = useTransactionView()
    await patchRefundRequest(1, 2, { status: 'APPROVED' } as never)
    expect(mockPayApi).toHaveBeenCalledWith('/payment-requests/1/refunds/2', {
      method: 'PATCH',
      body: { status: 'APPROVED' }
    })
  })

  it('refundInvoice sends POST with body', async () => {
    mockPayApi.mockResolvedValueOnce(undefined)
    const { refundInvoice } = useTransactionView()
    await refundInvoice(3, { reason: 'x' } as never)
    expect(mockPayApi).toHaveBeenCalledWith('/payment-requests/3/refunds', {
      method: 'POST',
      body: { reason: 'x' }
    })
  })

  describe('downloadReceipt', () => {
    it('logs and skips when invoiceId is missing', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { downloadReceipt } = useTransactionView()
      await downloadReceipt({} as never)
      expect(err).toHaveBeenCalledWith('Cannot download receipt: invoiceId is missing')
      expect(mockPayApi).not.toHaveBeenCalled()
    })

    it('posts for a blob and triggers a file download', async () => {
      const blob = new Blob(['pdf'])
      mockPayApi.mockResolvedValueOnce(blob)
      const dl = vi.spyOn(CommonUtils, 'fileDownload').mockImplementation(() => {})
      const { downloadReceipt } = useTransactionView()
      await downloadReceipt({ invoiceId: 42, invoiceCreatedOn: '2024-03-05T10:00:00' } as never)
      const [url, opts] = mockPayApi.mock.calls[0]!
      expect(url).toBe('/payment-requests/42/receipts')
      expect(opts.method).toBe('POST')
      expect(opts.responseType).toBe('blob')
      expect(opts.body.filingDateTime).toContain('2024')
      expect(dl).toHaveBeenCalledWith(blob, 'bcregistry-receipts-42.pdf', 'application/pdf')
    })
  })
})
