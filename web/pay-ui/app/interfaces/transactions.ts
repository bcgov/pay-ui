export interface TransactionFilter {
  accountName: string | null
  businessIdentifier: string | null
  createdBy: string | null
  createdName: string | null
  dateFilter: { startDate: string | null, endDate: string | null, isDefault: boolean }
  details: string | null
  folioNumber: string | null
  id: string | null
  invoiceNumber: string | null
  lineItems: string | null
  lineItemsAndDetails: string | null
  paymentMethod: string | null
  product: string | null
  statusCode: string | null
  excludeCount: boolean | null
}

export interface AppliedCredit {
  id: number
  amountApplied: number
  cfsIdentifier: string
  createdOn: Date
  creditId: number
  invoiceAmount: number
  invoiceNumber: string
}

export interface PartialRefund {
  id: number
  createdName: string
  createdBy: string
  paymentLineItemId: number
  refundType: string
  refundAmount: number
  createdOn: Date
  isCredit: boolean
}

export interface Transaction {
  businessIdentifier: string
  createdName: string
  createdOn: string
  details: { label: string, value: string }[] | null
  folioNumber: string
  id: number
  invoiceNumber: string
  lineItems: LineItem[]
  paid: number
  paymentAccount: {
    accountId: string
    accountName: string
    billable: boolean
  }
  paymentMethod: PaymentTypes
  product: Product
  refund: number
  statusCode: InvoiceStatus
  total: number
  updatedOn: string
  refundDate: string | null
  appliedCredits: AppliedCredit[] | null
  partialRefunds: PartialRefund[] | null
  partialRefundable: boolean | null
  fullRefundable: boolean | null
  latestRefundId: number | null
  latestRefundStatus: string | null
}

export interface TransactionFilterParams {
  isActive: boolean
  filterPayload: TransactionFilter
  pageNumber: number | null
  pageLimit: number | null
}

export interface TransactionListResponse {
  items: Transaction[]
  limit: number
  page: number
  hasMore: boolean
}

export interface TransactionState {
  filters: TransactionFilterParams
  loading: boolean
  results: Transaction[]
  totalResults: number
}
