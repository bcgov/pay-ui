import { ShortNameType } from '@/utils/constants'

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
  dateRangeReset: number
  clearFiltersTrigger: number
  selectedShortName: EFTShortnameResponse | Record<string, never>
  showDatePicker: boolean
  dateRangeSelected: boolean
  dateRangeText: string
  accountLinkingErrorDialogTitle: string
  accountLinkingErrorDialogText: string
  isShortNameLinkingDialogOpen: boolean
  startDate: string
  endDate: string
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
