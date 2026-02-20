export interface RefundRequestFilterPayload {
  invoiceId: string
  refundStatus: string
  requestedBy: string
  requestedStartDate: string
  requestedEndDate: string
  refundReason: string
  transactionAmount: string
  refundAmount: string
  paymentMethod: string
  refundMethod: string
}

export interface RefundRequestFilterParams {
  isActive: boolean
  pageNumber: number
  pageLimit: number
  filterPayload: RefundRequestFilterPayload
}

export interface PartialRefundLine {
  paymentLineItemId: number
  description?: string
  statutoryFeeAmount: number
  futureEffectiveFeeAmount: number
  priorityFeeAmount: number
  serviceFeeAmount: number
}

export interface RefundRequestResult {
  invoiceId: number | null
  refundId: number | null
  refundStatus: string | null
  refundType: string | null
  refundMethod: string | null
  notificationEmail: string | null
  refundReason: string | null
  staffComment: string | null
  requestedBy: string | null
  requestedDate: string | null
  declineReason: string | null
  decisionBy: string | null
  decisionDate: string | null
  refundAmount: number | null
  transactionAmount: number | null
  paymentMethod: string | null
  partialRefundLines: PartialRefundLine[]
}

export interface RefundRequestListResponse {
  items: RefundRequestResult[]
  limit: number
  page: number
  total: number
  statusTotal: number
}

export interface RefundRequestState {
  results: RefundRequestResult[]
  totalResults: number
  stateTotal: number
  loading: boolean
  filters: RefundRequestFilterParams
  actionDropdown: boolean[]
  options: Record<string, unknown>
  clearFiltersTrigger: number
  showDatePicker: boolean
  dateRangeSelected: boolean
  dateRangeText: string
  dateRangeReset: number
  startDate: string
  endDate: string
}

export interface RefundRequestsTableSettings {
  filterPayload: RefundRequestFilterPayload | null
  pageNumber: number
}

export interface RefundRevenueType {
  paymentLineItemId: number
  refundAmount: number
  refundType: string
}
