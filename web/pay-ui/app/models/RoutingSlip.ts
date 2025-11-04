import type { FilingType, Payment } from './Payment'
import type { Address } from './Address'
import type { Invoice } from './Invoice'

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
// Class for storing values in CreateRoutingSlip component - for POST endpoint
export interface RoutingSlip {
  id?: number
  number?: string
  paymentAccount?: AccountInfo
  payments?: Payment[]
  routingSlipDate?: string
  createdBy?: string
  createdOn?: string
  total?: number
  remainingAmount?: number
  refundAmount?: number
  invoices?: Invoice[]
  status?: string
  createdName?: string
  parentNumber?: string
  refunds?: Refund[]
  totalUsd?: number
  allowedStatuses?: string[]
  refundStatus?: string
}

export interface RoutingSlipDetails {
  number?: string
  routingSlipDate?: string
}

export interface RoutingSlipAddress {
  contactName?: string
  mailingAddress?: Address
}

export interface LinkRoutingSlipPrams {
  childRoutingSlipNumber: string
  parentRoutingSlipNumber: string
}

export interface LinkedRoutingSlips {
  children?: RoutingSlip[]
  parent?: RoutingSlip
}

export interface ManualTransactionDetails {
  // we would need the key that we can use during iterator (v-for)
  key?: number
  quantity?: number
  referenceNumber?: string
  total?: number
  futureEffective?: boolean
  priority?: boolean
  filingType?: FilingType
  availableAmountForManualTransaction?: number
}

export interface GetRoutingSlipRequestPayload {
  routingSlipNumber: string | undefined
  showGlobalLoader?: boolean
}

export interface AdjustRoutingSlipChequePrams {
  chequeNum: string
  paymentIndex: number
}

export interface AdjustRoutingSlipAmountPrams {
  amount: number
  paymentIndex: number
  isRoutingSlipPaidInUsd: boolean
}
