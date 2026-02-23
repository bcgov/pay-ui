import CommonUtils from '@/utils/common-util'

export function useTransactionView() {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  async function getInvoiceComposite(invoiceId: number): Promise<Invoice | null> {
    const response = await $payApi<Invoice>(
      `/payment-requests/${invoiceId}/composite`,
      { method: 'GET' }
    )
    return response || null
  }

  async function getInvoiceRefundHistory(invoiceId: number): Promise<RefundRequestListResponse> {
    const response = await $payApi<RefundRequestListResponse>(
      `/refunds?invoiceId=${invoiceId}`,
      { method: 'GET' }
    )
    return response || null
  }

  async function getRefundRequest(refundId: number): Promise<RefundRequestResult> {
    const response = await $payApi<RefundRequestResult>(
      `/refunds/${refundId}`,
      { method: 'GET' }
    )
    return response || null
  }

  async function patchRefundRequest(invoiceId: number, refundId: number, body: never): Promise<void> {
    await $payApi(`/payment-requests/${invoiceId}/refunds/${refundId}`, {
      method: 'PATCH',
      body: body
    })
  }

  async function refundInvoice(invoiceId: number, body: never): Promise<void> {
    await $payApi(`/payment-requests/${invoiceId}/refunds`, {
      method: 'POST',
      body: body
    })
  }

  async function downloadReceipt(transactionData: TransactionData): Promise<void> {
    if (!transactionData.invoiceId) {
      console.error('Cannot download receipt: invoiceId is missing')
      return
    }

    const response = await $payApi<Blob>(
      `/payment-requests/${transactionData.invoiceId}/receipts`,
      {
        method: 'POST',
        body: {
          filingDateTime: CommonUtils.formatDisplayDate(transactionData.invoiceCreatedOn)
        },
        responseType: 'blob'
      }
    )

    const filename = `bcregistry-receipts-${transactionData.invoiceId}.pdf`
    CommonUtils.fileDownload(response, filename, 'application/pdf')
  }

  return {
    getInvoiceComposite,
    getInvoiceRefundHistory,
    getRefundRequest,
    patchRefundRequest,
    refundInvoice,
    downloadReceipt
  }
}
