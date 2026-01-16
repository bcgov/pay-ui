import type { ShortNameType } from '@/utils/constants'

export interface EFTShortnameResponse {
  id: number
  shortName: string
  shortNameType: ShortNameType
  lastPaymentReceivedDate?: string
  creditsRemaining: number
  linkedAccountsCount: number
  refundStatus?: string
  shortNameId?: number
}

export interface LinkedShortNameItem {
  accountBranch: string | null
  accountId: string
  accountName: string
  amountOwing: number
  casSupplierNumber: string | null
  casSupplierSite: string | null
  cfsAccountStatus: string | null
  createdOn: string
  email: string | null
  id: number
  shortName: string
  shortNameId: number
  shortNameType: string
  statementId: number | null
  statusCode: string
}

export interface LinkedShortNameResponse {
  items: LinkedShortNameItem[]
  limit: number
  page: number
  stateTotal: number
  total: number
}

export interface LinkedShortNameState {
  results: LinkedShortNameItem[]
  totalResults: number
  filters: {
    isActive: boolean
    pageNumber: number
    pageLimit: number
    filterPayload: LinkedShortNameFilterPayload
  }
  loading: boolean
}

export interface ShortNameSummaryState {
  results: EFTShortnameResponse[]
  totalResults: number
  filters: {
    isActive: boolean
    pageNumber: number
    pageLimit: number
    filterPayload: ShortNameFilterPayload
  }
  loading: boolean
  actionDropdown: boolean[]
  options: Record<string, unknown>
  shortNameLookupKey: number
  clearFiltersTrigger: number
  selectedShortName: EFTShortnameResponse | Record<string, never>
  accountLinkingErrorDialogTitle: string
  accountLinkingErrorDialogText: string
  isShortNameLinkingDialogOpen: boolean
  highlightIndex: number
}

export interface ShortNameFilterPayload {
  shortName: string
  shortNameType: ShortNameType
  creditsRemaining: string
  linkedAccountsCount: string
  paymentReceivedStartDate: string
  paymentReceivedEndDate: string
}

export interface LinkedShortNameFilterPayload {
  shortName: string
  shortNameType: string
  accountName: string
  accountNumber: string
  branchName: string
  amountOwing: string
  statementId: string
}

export interface EftTableSettings {
  filterPayload: ShortNameFilterPayload | LinkedShortNameFilterPayload | null
  pageNumber: number
}

export interface ShortNameHistoryItem {
  id?: number
  historicalId?: number
  transactionDate: string
  createdOn?: string
  transactionType: string
  amount: number
  shortNameBalance?: number
  creditsRemaining?: number
  statementNumber?: number | null
  relatedStatementNumber?: number | null
  invoiceId?: number | null
  isProcessing?: boolean
  isReversible?: boolean
  eftRefundId?: number | null
  shortNameRefundId?: number | null
  eftRefundMethod?: string
  refundMethod?: string
  eftRefundChequeStatus?: string | null
  refundStatus?: string
  status?: string
  depositDate?: string
  paymentDate?: string
  refundAmount?: number
  comment?: string | null
  accountBranch?: string | null
  accountId?: string | null
  accountName?: string | null
  shortNameId?: number
}

export interface ShortNameHistoryResponse {
  items: ShortNameHistoryItem[]
  limit: number
  page: number
  total: number
}

export interface ShortNameHistoryState {
  results: ShortNameHistoryItem[]
  totalResults: number
  loading: boolean
}
