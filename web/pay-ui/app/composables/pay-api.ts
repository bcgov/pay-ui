import type { RoutingSlipComments, UpdateCommentsParams,
  RoutingSlipCommentResponse, CancelRoutingSlipInvoiceResponse,
  UpdateRoutingSlipRefundResponse, SearchRoutingSlipResponse, LinkedRoutingSlips,
  FilingType, GetFeeRequestParams } from '~/interfaces/routing-slip'

export const usePayApi = () => {
  const { $payApi } = useNuxtApp()

  async function getCodes<T>(codeType: string): Promise<T[]> {
    const res = await $payApi<{ codes: T[] }>(`/codes/${codeType}`)
    return res.codes
  }

  async function getRoutingSlip(routingNumber: string): Promise<RoutingSlip | undefined> {
    return $payApi(`/fas/routing-slips/${routingNumber}`)
  }

  async function postRoutingSlip(payload: CreateRoutingSlipPayload): Promise<RoutingSlip> {
    return $payApi('/fas/routing-slips', {
      method: 'POST',
      body: payload
    })
  }

  async function postLinkRoutingSlip(body: LinkRoutingSlipParams): Promise<void> {
    return $payApi('/fas/routing-slips/links', {
      method: 'POST',
      body
    })
  }

  async function postSearchRoutingSlip(body: RoutingSlipSearchParams): Promise<{ items: RoutingSlip[] }> {
    return $payApi<{ items: RoutingSlip[] }>('/fas/routing-slips/queries', {
      method: 'POST',
      body
    })
  }

  async function createRoutingSlip(
    routingSlipRequest: RoutingSlip
  ): Promise<RoutingSlip> {
    return $payApi<RoutingSlip>('/fas/routing-slips', { method: 'POST', body: routingSlipRequest })
  }

  async function adjustRoutingSlip(
    payments: Payment[],
    routingSlipNumber: string
  ): Promise<RoutingSlip> {
    const payload = {
      status: SlipStatus.CORRECTION,
      payments: payments
    }
    return $payApi<RoutingSlip>(
      `/fas/routing-slips/${routingSlipNumber}?action=${PatchActions.UPDATE_STATUS}`,
      { method: 'PATCH', body: payload })
  }

  async function updateRoutingSlipStatus(
    code: string,
    routingSlipNumber: string
  ): Promise<RoutingSlip> {
    return $payApi<RoutingSlip>(
      `/fas/routing-slips/${routingSlipNumber}?action=updateStatus`,
      { method: 'PATCH', body: { status: code } }
    )
  }

  async function updateRoutingSlipRefundStatus(
    code: string,
    routingSlipNumber: string
  ): Promise<RoutingSlip | null> {
    try {
      const response = await $payApi(
        `/fas/routing-slips/${routingSlipNumber}?action=updateRefundStatus`,
        { method: 'PATCH', body: { refund_status: code } }
      )
      if (response) {
        return response
      }
      return null
    } catch (error) {
      console.error('Routing slip refund status update failed', error)
      throw error
    }
  }

  async function getRoutingSlipComments(
    slipNumber: string
  ): Promise<RoutingSlipComments> {
    const response = await $payApi<RoutingSlipComments>(
      `/fas/routing-slips/${slipNumber}/comments`
    )
    return response
  }

  async function updateRoutingSlipComments(
    data: UpdateCommentsParams,
    slipNumber: string
  ): Promise<RoutingSlipCommentResponse | null> {
    try {
      const response = await $payApi<RoutingSlipCommentResponse>(
        `/fas/routing-slips/${slipNumber}/comments`,
        { method: 'POST', body: data }
      )
      if (response) {
        return response
      }
      return null
    } catch (error) {
      console.error('Failed to update routing slip comments', error)
      throw error
    }
  }

  async function updateRoutingSlipRefund(
    details: string,
    routingSlipNumber: string
  ): Promise<UpdateRoutingSlipRefundResponse> {
    return $payApi<UpdateRoutingSlipRefundResponse>(
      `/fas/routing-slips/${routingSlipNumber}/refunds`,
      { method: 'POST', body: details }
    )
  }

  async function getSearchRoutingSlip(
    searchParams: SearchRoutingSlipParams
  ): Promise<SearchRoutingSlipResponse> {
    return $payApi<SearchRoutingSlipResponse>(
      '/fas/routing-slips/queries',
      { method: 'POST', body: searchParams }
    )
  }

  async function saveLinkRoutingSlip(
    linkRoutingSlip: LinkRoutingSlipParams
  ): Promise<void> {
    return $payApi(
      '/fas/routing-slips/links',
      { method: 'POST', body: linkRoutingSlip }
    )
  }

  async function getLinkedRoutingSlips(
    routingSlipNumber: string
  ): Promise<LinkedRoutingSlips | undefined> {
    return $payApi<LinkedRoutingSlips>(
      `/fas/routing-slips/${routingSlipNumber}/links`,
      { method: 'GET' }
    )
  }

  async function getDailyReport(
    selectedDate: string,
    type: string = 'application/pdf'
  ): Promise<Blob> {
    const headers = {
      Accept: type
    }
    return $payApi(
      `/fas/routing-slips/${selectedDate}/reports`,
      { method: 'POST', headers }
    )
  }

  async function getSearchFilingType(
    searchParams: string
  ): Promise<FilingType[]> {
    return $payApi<FilingType[]>(
      `/fees/schedules?description=${searchParams}`,
      { method: 'GET' }
    )
  }

  // TODO: fix type
  async function getFeeByCorpTypeAndFilingType(
    getFeeRequestParams: GetFeeRequestParams
  ): Promise<FeeResponse> {
    const requestParams = commonUtil.createQueryParams(getFeeRequestParams.requestParams)
    return $payApi(
      `/fees/${getFeeRequestParams.corpTypeCode}/${getFeeRequestParams.filingTypeCode}?${requestParams}`,
      { method: 'GET' }
    )
  }

  async function saveManualTransactions(
    transactions: TransactionParams
  ): Promise<Invoice> {
    return $payApi(
      '/payment-requests',
      { method: 'POST', body: transactions }
    )
  }

  async function cancelRoutingSlipInvoice(
    invoiceId: number
  ): Promise<CancelRoutingSlipInvoiceResponse> {
    return $payApi<CancelRoutingSlipInvoiceResponse>(
      `/payment-requests/${invoiceId}/refunds`,
      { method: 'POST' }
    )
  }

  return {
    getCodes,
    getRoutingSlip,
    postRoutingSlip,
    postLinkRoutingSlip,
    postSearchRoutingSlip,
    createRoutingSlip,
    adjustRoutingSlip,
    updateRoutingSlipStatus,
    updateRoutingSlipRefundStatus,
    getRoutingSlipComments,
    updateRoutingSlipComments,
    updateRoutingSlipRefund,
    getSearchRoutingSlip,
    saveLinkRoutingSlip,
    getLinkedRoutingSlips,
    getDailyReport,
    getSearchFilingType,
    getFeeByCorpTypeAndFilingType,
    saveManualTransactions,
    cancelRoutingSlipInvoice
  }
}
