export interface PaymentData {
  accountName?: string | null
  folioNumber?: string | null
  initiatedBy?: string | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  totalTransactionAmount: number
}

export interface TransactionData {
  invoiceId: number | null | undefined
  transactionDate: string | null | undefined
  invoiceReferenceId: string | null | undefined
  invoiceStatusCode: string | null | undefined
  invoiceCreatedOn: string | null | undefined
  transactionAmount: number
  applicationName: string | null | undefined
  applicationType: string | null | undefined
  businessIdentifier: string | null | undefined
  applicationDetails: Detail[] | null | undefined
  routingSlip: string | null | undefined
  latestRefundId: number | null | undefined
  latestRefundStatus: string | null | undefined
  partialRefundable: boolean | undefined
  fullRefundable: boolean | undefined
}

export interface NormalizedPartialRefundLine {
  paymentLineItemId: number | null
  statutoryFeeAmount: number | null
  futureEffectiveFeeAmount: number | null
  priorityFeeAmount: number | null
  serviceFeeAmount: number | null
}

export interface RefundRequest {
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
  partialRefundLines: NormalizedPartialRefundLine[] | null
}

export enum RefundType {
  FULL_REFUND = 'Full Refund',
  PARTIAL_REFUND = 'Partial Refund'
}

export interface RefundLineItem {
  id: number | null
  description: string | null
  filingFees?: number | null
  serviceFees?: number | null
  priorityFees?: number | null
  total?: number | null
  futureEffectiveFees?: number | null
  filingFeesRequested?: number | string | null
  serviceFeesRequested?: number | string | null
  priorityFeesRequested?: number | string | null
  futureEffectiveFeesRequested?: number | string | null
  refundEntireItemRequested?: boolean | null
}

export interface RefundFormData {
  refundType: RefundType | null
  refundLineItems: RefundLineItem[] | null
  totalRefundAmount: number | null
  refundMethod: string | null
  notificationEmail: string | null
  reasonsForRefund: string | null
  staffComment: string | null
  requestedBy: string | null
  requestedTime: string | null
  decisionBy: string | null
  decisionTime: string | null
}

export enum RefundRequestStage {
  REQUEST_FORM = 'Request Form',
  DATA_VALIDATED = 'DATA Validated'
}

export interface TransactionViewState {
  dataLoading: number
  paymentData: PaymentData
  transactionData: TransactionData
  refundHistoryData: []
  refundRequestData: RefundRequestResult
  refundFormData: RefundFormData
  refundLineItems: RefundLineItem[]
  refundFormStage: RefundRequestStage
  refundMethods: []
  previousRefundedAmount: number
  isProcessing: boolean
  invoicePaymentMethod: string | null
  invoiceProduct: string | null
}
