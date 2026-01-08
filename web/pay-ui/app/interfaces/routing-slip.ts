import type { Address } from './address'
import type { Invoice } from './invoice'
import type { PaymentTypes } from '~/enums/payment-types'
import type { SlipStatus } from '~/enums/slip-status'

export interface CreateRoutingSlipPayload {
  contactName?: string
  mailingAddress?: Partial<Address>
  number: string
  paymentAccount: {
    accountName: string
  }
  routingSlipDate: string
  payments: Array<{
    chequeReceiptNumber: string
    paidAmount: number
    paidUsdAmount: number
    paymentDate?: string
    paymentMethod: PaymentTypes.CASH | PaymentTypes.CHEQUE
  }>
}

export interface Payment {
  id?: number
  chequeReceiptNumber?: string
  paymentMethod?: string
  paymentDate?: string
  paidAmount?: number
  createdBy?: string
  isRoutingSlip?: boolean
  paymentSystem?: string // FAS incase of this app
  receiptNumber?: number
  statusCode?: string
  paidUsdAmount?: number // For payments paid is USD
}

// Each Routing Slip is tied to an account - PayBC
export interface AccountInfo {
  accountName?: string
  name?: string
  billable?: boolean
  paymentMethod?: string
}

export interface RefundRequestDetails {
  name?: string
  mailingAddress?: Address
  chequeAdvice?: string
}

export interface Refund {
  details?: RefundRequestDetails
  id?: number
  reason?: string
  requestedBy?: string
  requestedDate?: string
}

export interface RoutingSlip {
  id?: number
  number: string
  paymentAccount?: AccountInfo
  payments?: Payment[]
  routingSlipDate?: string
  createdBy?: string
  createdOn?: string
  total?: number
  remainingAmount?: number
  refundAmount?: number
  invoices?: Invoice[]
  status: string
  createdName?: string
  parentNumber?: string
  refunds?: Refund[]
  totalUsd?: number
  allowedStatuses?: SlipStatus[]
  refundStatus?: string
  mailingAddress?: Address
  contactName?: string
}

// update as needed
export interface RoutingSlipSearchParams {
  routingSlipNumber: string
}

// From Payment.ts
export interface CorpTypeCode {
  code?: string
  description?: string
  isOnlineBankingAllowed?: boolean
  product: string
}

export interface FilingTypeCode {
  code?: string
  description?: string
}

export interface FilingType {
  corpTypeCode?: CorpTypeCode
  fee?: string
  feeScheduleId?: number
  feeStartDate?: Date
  filingTypeCode?: FilingTypeCode
  futureEffectiveFee?: string
  priorityFee?: number
  serviceFee?: number
}

export interface FilingTypeResponse {
  items: FilingType[]
}

export interface GetFeeRequestParams {
  corpTypeCode: string
  filingTypeCode: string
  requestParams: {
    quantity?: number
    priority?: boolean
    futureEffective?: boolean
  }
}

export interface BusinessInfo {
  corpType?: string
  businessIdentifier?: string
}

export interface FilingTypes {
  filingTypeCode?: string
  futureEffective?: boolean
  priority?: boolean
  quantity?: number
}

export interface TransactionParams {
  businessInfo: BusinessInfo
  filingInfo: {
    filingTypes: FilingTypes[]
  }
  accountInfo: {
    routingSlip: string | undefined
  }
}

// From RoutingSlip.ts
export interface RoutingSlipDetails {
  number: string
  routingSlipDate?: string
  total?: number
}

export interface RoutingSlipAddress {
  contactName?: string
  mailingAddress?: Address
}

export interface LinkRoutingSlipParams {
  childRoutingSlipNumber: string
  parentRoutingSlipNumber: string
}

export interface LinkedRoutingSlips {
  children?: RoutingSlip[]
  parent?: RoutingSlip
}

export interface ManualTransactionDetails {
  // we would need the key that we can use during iterator (v-for)
  key: number
  quantity?: number
  referenceNumber?: string
  total: number
  futureEffective: boolean
  priority: boolean
  filingType?: FilingType
  availableAmountForManualTransaction: number
}

export interface GetRoutingSlipRequestPayload {
  routingSlipNumber: string
}

export interface AdjustRoutingSlipChequeParams {
  chequeNum: string
  paymentIndex: number
}

export interface AdjustRoutingSlipAmountParams {
  amount: number
  paymentIndex: number
  isRoutingSlipPaidInUsd: boolean
}

export interface SearchRoutingSlipParams {
  page?: number
  limit?: number
  routingSlipNumber?: string | null
  receiptNumber?: string | null
  accountName?: string | null
  initiator?: string | null
  dateFilter?: { startDate: string | null, endDate: string | null }
  status?: string | null
  refundStatus?: string | null
  businessIdentifier?: string | null
  chequeReceiptNumber?: string | null
  remainingAmount?: string | null
}

export interface Comment {
  comment: string
  submitterDisplayName: string
  timestamp: string
}

export interface RoutingSlipComments {
  comments: Comment[] | Array<{ comment: Comment }>
}

export interface UpdateCommentsParams {
  comment: {
    businessId: string | undefined
    comment: string
  }
}

export interface RoutingSlipCommentResponse {
  comment: string
  id: number
  routingSlipNumber: string
  submitterDisplayName: string
  timestamp: string
}

export interface CancelRoutingSlipInvoiceResponse {
  message: string
  refundId: number
  refundAmount: number
  isPartialRefund: boolean
}

export interface UpdateRoutingSlipRefundResponse {
  message: string
}

export interface SearchRoutingSlipResponse {
  items: RoutingSlip[]
  total: number
}

export interface FeeResponse {
  total: number
  [key: string]: unknown
}
