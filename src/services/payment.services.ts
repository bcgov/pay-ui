import { EFTShortnameResponse, EFTTransactionFilterParams, EFTTransactionListResponse } from '@/models/eft-transaction'
import { EftRefundRequest, RefundRequest } from '@/models/refund'
import { LinkedShortNameFilterParams, ShortNameSummaryFilterParams } from '@/models/short-name'
import { ShortNameLinkStatus } from '@/util/constants'
import { TransactionFilter, TransactionFilterParams, TransactionListResponse } from '@/models/transaction'
import {
  StatementFilterParams,
  StatementListResponse
} from '@/models/statement'

import { AxiosPromise } from 'axios'
import ConfigHelper from '@/util/config-helper'
import { axios } from '@/util/http-util'
import { Invoice } from '@/models/Invoice'
import { RefundRequestFilterParams, RefundRequestListResponse, RefundRequestResult } from '@/models/refund-request'

export default class PaymentService {
  static getTransactions (accountId: number, filterParams: TransactionFilterParams, viewAll = false): AxiosPromise<TransactionListResponse> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }
    if (viewAll) params.append('viewAll', `${viewAll}`)

    const url = `${ConfigHelper.getPayAPIURL()}/accounts/${accountId}/payments/queries`
    return axios.post(url, { ...filterParams.filterPayload, excludeCounts: true }, { params })
  }

  static getTransactionReports (accountId: number, filterParams: TransactionFilter): AxiosPromise<any> {
    const headers = {
      Accept: 'text/csv'
    }
    const url = `${ConfigHelper.getPayAPIURL()}/accounts/${accountId}/payments/reports`
    return axios.post(url, filterParams, { headers, responseType: 'blob' as 'json' })
  }

  static postShortnamePaymentAction (shortNameId: string, bodyParams: any): AxiosPromise<void> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}/payment`
    return axios.post(url, bodyParams)
  }

  static unlinkShortNameAccount (shortNameId: string, shortNameLinkId: string): AxiosPromise<EFTShortnameResponse> {
    const body = {
      statusCode: ShortNameLinkStatus.INACTIVE
    }
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}/links/${shortNameLinkId}`
    return axios.patch(url, body)
  }

  static getEFTShortName (shortNameId: string): AxiosPromise<EFTShortnameResponse> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}`)
  }

  static patchEFTShortName (shortNameId: string, body: any): AxiosPromise<EFTShortnameResponse> {
    return axios.patch(`${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}`, body)
  }

  static getEFTShortNameSummaries (filterParams: ShortNameSummaryFilterParams, viewAll = false): AxiosPromise<any> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }
    if (viewAll) {
      params.append('viewAll', `${viewAll}`)
    }

    this.appendFilterPayloadParams(params, filterParams)

    return axios.get(`${ConfigHelper.getPayAPIURL()}/eft-shortnames/summaries?${params.toString()}`)
  }

  static getEFTShortnameSummary (shortNameId: string | number): AxiosPromise<EFTShortnameResponse> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/summaries?shortNameId=${shortNameId}`
    return axios.get(url)
  }

  static postShortNameLink (shortNameId: string, accountId: string): AxiosPromise<EFTShortnameResponse> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}/links`
    const body = {
      accountId: accountId
    }
    return axios.post(url, body)
  }

  static searchEFTAccounts (searchText: string): AxiosPromise<any> {
    const params = new URLSearchParams({
      searchText: searchText
    })

    return axios.get(`${ConfigHelper.getPayAPIURL()}/accounts/search/eft?${params.toString()}`)
  }

  static getEFTShortNames (filterParams: LinkedShortNameFilterParams | ShortNameSummaryFilterParams, viewAll = false): AxiosPromise<any> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }
    if (viewAll) {
      params.append('viewAll', `${viewAll}`)
    }
    this.appendFilterPayloadParams(params, filterParams)

    return axios.get(`${ConfigHelper.getPayAPIURL()}/eft-shortnames?${params.toString()}`)
  }

  static getEFTShortNameLinks (shortNameId: number): AxiosPromise<any> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}/links`)
  }

  static getEFTShortnameHistory (shortNameId: string, filterParams: EFTTransactionFilterParams): AxiosPromise<EFTTransactionListResponse> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }

    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/${shortNameId}/history`
    return axios.get(url, { params })
  }

  static getEFTRefund (eftRefundId: number): AxiosPromise<EFTShortnameResponse> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/shortname-refund/${eftRefundId}`
    return axios.get(url)
  }

  static patchEFTRefund (eftRefundId: number, body: any): AxiosPromise<EFTShortnameResponse> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/shortname-refund/${eftRefundId}`
    return axios.patch(url, body)
  }

  static refundEFT (refundPayload: EftRefundRequest): AxiosPromise<any> {
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/shortname-refund`
    return axios.post(url, refundPayload)
  }

  static getEFTRefunds (filterParams): AxiosPromise<any> {
    const params = new URLSearchParams()
    if (filterParams.statuses) {
      params.append('statuses', filterParams.statuses.toString())
    }
    if (filterParams.shortNameId) {
      params.append('shortNameId', filterParams.shortNameId.toString())
    }
    const url = `${ConfigHelper.getPayAPIURL()}/eft-shortnames/shortname-refund`
    return axios.get(url, { params })
  }

  static getInvoice (invoiceId: string, accountId: number): AxiosPromise<Invoice> {
    const headers = accountId ? { 'Account-Id': accountId } : {}
    return axios.get(`${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}`, { headers: headers })
  }

  static getInvoiceComposite (invoiceId: string): AxiosPromise<Invoice> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}/composite`)
  }

  static getInvoiceRefundHistory (invoiceId: string): AxiosPromise<RefundRequestListResponse> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/refunds?invoiceId=${invoiceId}`)
  }

  static getRefundRequest (refundId: string): AxiosPromise<RefundRequestResult> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/refunds/${refundId}`)
  }

  static patchRefundRequest (invoiceId: number, refundId: number, body: any): AxiosPromise<RefundRequestResult> {
    const url = `${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}/refunds/${refundId}`
    return axios.patch(url, body)
  }

  static refundInvoice (invoiceId: string, refundPayload: RefundRequest): AxiosPromise<any> {
    const url = `${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}/refunds`
    return axios.post(url, refundPayload)
  }

  static getStatementsList (accountId: string | number, filterParams: StatementFilterParams): AxiosPromise<StatementListResponse> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }
    this.appendFilterPayloadParams(params, filterParams)

    const url = `${ConfigHelper.getPayAPIURL()}/accounts/${accountId}/statements`
    return axios.get(url, { params })
  }

  static appendFilterPayloadParams (params: URLSearchParams, filterParams: any) {
    if (filterParams.filterPayload) {
      for (const [key, value] of Object.entries(filterParams.filterPayload)) {
        if (value) {
          params.append(key, value.toString())
        }
      }
    }
  }

  static getStatementsSummary (accountId: string | number): AxiosPromise<any> {
    const url = `${ConfigHelper.getPayAPIURL()}/accounts/${accountId}/statements/summary`
    return axios.get(url)
  }

  static postReceipt (invoiceId: number, accountId: string, invoiceCreatedOn: string): AxiosPromise<any> {
    const url = `${ConfigHelper.getPayAPIURL()}/payment-requests/${invoiceId}/receipts`
    const headers = {
      Accept: 'application/pdf',
      'Account-Id': accountId
    }
    const body = {
      filingDateTime: invoiceCreatedOn
    }
    return axios.post(url, body, { headers, responseType: 'blob' as 'json' })
  }

  static getRefundRequests (filterParams: RefundRequestFilterParams): AxiosPromise<any> {
    const params = new URLSearchParams()
    if (filterParams.pageNumber) {
      params.append('page', filterParams.pageNumber.toString())
    }
    if (filterParams.pageLimit) {
      params.append('limit', filterParams.pageLimit.toString())
    }
    this.appendFilterPayloadParams(params, filterParams)

    return axios.get(`${ConfigHelper.getPayAPIURL()}/refunds?${params.toString()}`)
  }
}
