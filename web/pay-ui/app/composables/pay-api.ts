import type { Comment, RoutingSlipComments, UpdateCommentsParams } from '~/interfaces/routing-slip'

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

  // TODO: fix type
  async function updateRoutingSlipRefundStatus(
    code: string,
    routingSlipNumber: string
  ): Promise<any> {
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

  // TODO: fix type
  async function updateRoutingSlipComments(
    data: UpdateCommentsParams,
    slipNumber: string
  ): Promise<any> {
    try {
      const response = await $payApi<RoutingSlip>(
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

  // TODO: fix type
  async function updateRoutingSlipRefund(
    details: string,
    routingSlipNumber: string
  ): Promise<any> {
    return $payApi(
      `/fas/routing-slips/${routingSlipNumber}/refunds`,
      { method: 'POST', body: details }
    )
  }

  // TODO: fix type
  async function getSearchRoutingSlip(
    searchParams: RoutingSlip
  ): Promise<any> {
    return $payApi(
      '/fas/routing-slips/queries',
      { method: 'POST', body: searchParams }
    )
  }

  // TODO: fix type
  async function saveLinkRoutingSlip(
    linkRoutingSlip: LinkRoutingSlipPrams
  ): Promise<any> {
    return $payApi(
      '/fas/routing-slips/links',
      { method: 'POST', body: linkRoutingSlip }
    )
  }

  // TODO: fix type
  async function getLinkedRoutingSlips(
    routingSlipNumber: string
  ): Promise<any> {
    return $payApi(
      `/fas/routing-slips/${routingSlipNumber}/links`,
      { method: 'GET' }
    )
  }

  // TODO: fix type
  async function getDailyReport(
    selectedDate: string,
    type: string = 'application/pdf'
  ): Promise<any> {
    const headers = {
      Accept: type
    }
    return $payApi(
      `/fas/routing-slips/${selectedDate}/reports`,
      { method: 'POST', headers }
    )
  }

  // TODO: fix type
  async function getSearchFilingType(
    searchParams: string
  ): Promise<any> {
    return $payApi(
      `/fees/schedules?description=${searchParams}`,
      { method: 'GET' }
    )
  }

  // TODO: fix type
  async function getFeeByCorpTypeAndFilingType(
    getFeeRequestParams: GetFeeRequestParams
  ): Promise<any> {
    const requestParams = CommonUtils.createQueryParams(getFeeRequestParams.requestParams)
    return $payApi(
      `/fees/${getFeeRequestParams.corpTypeCode}/${getFeeRequestParams.filingTypeCode}?${requestParams}`,
      { method: 'GET' }
    )
  }

  // TODO: fix type
  async function saveManualTransactions(
    transactions: TransactionParams
  ): Promise<any> {
    return $payApi(
      '/payment-requests',
      { method: 'POST', body: transactions }
    )
  }

  // TODO: fix type
  async function cancelRoutingSlipInvoice(
    invoiceId: number
  ): Promise<any> {
    return $payApi(
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
