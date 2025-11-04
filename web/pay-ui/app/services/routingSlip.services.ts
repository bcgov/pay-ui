import type { GetFeeRequestParams, Payment, TransactionParams } from '@/models/Payment'
import type { LinkRoutingSlipPrams } from '@/models/RoutingSlip'
import type { AxiosResponse } from 'axios'
import CommonUtils from '@/utils/common-util'
import ConfigHelper from '@/utils/config-helper'
import axios from '@/utils/http-util'
import { PatchActions, SlipStatus } from '@/utils/constants'

interface UpdateCommentsParams {
  comment: {
    businessId: string | undefined
    comment: string
  }
}

async function getRoutingSlip(
  routingNumber: string,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.get(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingNumber}`,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function createRoutingSlip(
  routingSlipRequest: RoutingSlip,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getFasAPIURL()}/routing-slips`,
    routingSlipRequest,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function adjustRoutingSlip(
  payments: Payment[],
  routingSlipNumber: string
): Promise<AxiosResponse> {
  const payload = {
    status: SlipStatus.CORRECTION,
    payments: payments
  }
  return axios.patch(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingSlipNumber}?action=${PatchActions.UPDATE_STATUS}`,
    payload
  )
}

async function updateRoutingSlipStatus(
  code: string,
  routingSlipNumber: string
): Promise<AxiosResponse> {
  return axios.patch(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingSlipNumber}?action=updateStatus`,
    { status: code }
  )
}

async function updateRoutingSlipRefundStatus(
  code: string,
  routingSlipNumber: string
): Promise<AxiosResponse | null> {
  try {
    const response = await axios.patch(
      `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingSlipNumber}?action=updateRefundStatus`,
      { refund_status: code }
    )
    if (response?.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('Routing slip refund status update failed', error)
    throw error
  }
}

async function updateRoutingSlipComments(
  data: UpdateCommentsParams,
  slipNumber: string
): Promise<AxiosResponse | null> {
  try {
    const response = await axios.post(
      `${ConfigHelper.getFasAPIURL()}/routing-slips/${slipNumber}/comments`,
      data
    )
    if (response?.data) {
      return response.data
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
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingSlipNumber}/refunds`,
    details
  )
}

async function getSearchRoutingSlip(
  searchParams: RoutingSlip,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/queries`,
    searchParams,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function saveLinkRoutingSlip(
  linkRoutingSlip: LinkRoutingSlipPrams,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/links`,
    linkRoutingSlip,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function getLinkedRoutingSlips(
  routingSlipNumber: string,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.get(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${routingSlipNumber}/links`,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function getDailyReport(
  selectedDate: string,
  type: string = 'application/pdf',
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  const headers = {
    Accept: type
  }
  return axios.post(
    `${ConfigHelper.getFasAPIURL()}/routing-slips/${selectedDate}/reports`,
    {},
    {
      headers,
      responseType: 'blob' as 'json',
      showGlobalLoader: showGlobalLoader
    }
  )
}

async function getSearchFilingType(
  searchParams: string,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.get(
    `${ConfigHelper.getPayAPIURL()}/fees/schedules?description=${searchParams}`,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function getFeeByCorpTypeAndFilingType(
  getFeeRequestParams: GetFeeRequestParams,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  const requestParams = CommonUtils.createQueryParams(getFeeRequestParams.requestParams)
  const url = `${ConfigHelper.getPayAPIURL()}/fees/${getFeeRequestParams.corpTypeCode}/`
    + `${getFeeRequestParams.filingTypeCode}?${requestParams}`
  return axios.get(
    url,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function saveManualTransactions(
  transactions: TransactionParams,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getPayAPIURL()}/payment-requests`,
    transactions,
    { showGlobalLoader: showGlobalLoader }
  )
}

async function cancelRoutingSlipInvoice(
  invoiceId: number,
  showGlobalLoader: boolean = false
): Promise<AxiosResponse> {
  return axios.post(
    `${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}/refunds`,
    { showGlobalLoader: showGlobalLoader }
  )
}

export default {
  getRoutingSlip,
  createRoutingSlip,
  adjustRoutingSlip,
  updateRoutingSlipStatus,
  updateRoutingSlipRefundStatus,
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
