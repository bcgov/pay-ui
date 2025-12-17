import { Detail } from './Invoice'

export interface PaymentData {
  accountName: string | null
  folioNumber: string | null
  initiatedBy: string | null
  paymentMethod: string | null
  paymentStatus: string | null
  totalTransactionAmount: number
}

export interface TransactionData {
  invoiceId: number | null
  transactionDate: string | null
  invoiceReferenceId: string | null
  invoiceStatusCode: string | null
  invoiceCreatedOn: string | null
  transactionAmount: number
  applicationName: string | null
  applicationType: string | null
  businessIdentifier: string | null
  applicationDetails: Detail[] | null
  routingSlip: string | null
  latestRefundId: number | null
  latestRefundStatus: string | null
}

export interface PartialRefundLine {
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
  partialRefundLines: PartialRefundLine[] | null
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
