export interface CreateRoutingSlipPayload {
  contactName: string // address.name
  mailingAddress: Partial<ConnectAddress>
  number: string // routing slip id
  paymentAccount: {
    accountName: string // entity number
  }
  routingSlipDate: string
  payments: Array<{
    chequeReceiptNumber: string
    paidAmount: number
    paidUsdAmount: number
    paymentDate: string
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
  allowedStatuses?: SlipStatus[]
  refundStatus?: string
}
