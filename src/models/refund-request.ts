import { DataOptions } from 'vuetify'
import { StatementListItem } from '@/models/statement'

export interface RefundRequestFilterParams {
  isActive?: boolean
  pageNumber: number
  pageLimit: number
  filterPayload: {
    refundStatus?: string
    requestedBy?: string
    requestedStartDate?:string
    requestedEndDate?:string
    refundReason?: string
    transactionAmount?: number
    refundAmount?: number
    paymentMethod?: string
    refundMethod?: string
  }
}

export interface PartialRefundLine {
  paymentLineItemId: number
  statutoryFeeAmount: number
  futureEffectiveFeeAmount: number
  priorityFeeAmount: number
  serviceFeeAmount: number
}

export interface RefundRequestResult {
  invoiceId?: number
  refundId?: number
  refundStatus?: string
  refundType: string
  refundMethod: string
  notificationEmail: string
  refundReason: string
  staffComment: string
  requestedBy: string
  requestedDate: string
  declineReason: string
  decisionBy: string
  decisionDate: string
  refundAmount: number
  partialRefundLines: PartialRefundLine[]
}

export interface RefundRequestListResponse {
  items?: RefundRequestResult[]
  limit?: number
  page?: number
  total?: number
  statusTotal?:number
}

export interface RefundRequestState {
  items: RefundRequestResult[]
  total: number
  statusTotal:number
  loading: boolean
  filters: RefundRequestFilterParams
  actionDropdown: any[]
  tableDataOptions: DataOptions
  clearFiltersTrigger: number
  showDatePicker: boolean
  dateRangeSelected: boolean
  dateRangeText: string
  dateRangeReset: number
  startDate: string
  endDate: string
}
