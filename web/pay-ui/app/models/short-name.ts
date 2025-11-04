export interface LinkedShortNameFilterParams {
  isActive: boolean
  pageNumber: number
  pageLimit: number
  filterPayload: {
    accountName?: string
    shortName?: string
    accountBranch?: string
    accountId?: string
    state: ShortNameStatus
    accountIdList?: string
  }
}

export interface LinkedShortNameResults {
  accountName?: string
  shortName?: string
  accountBranch?: string
  accountId?: string
  id: number
}

export interface ShortNameSummaryFilterParams {
  isActive?: boolean
  pageNumber?: number
  pageLimit?: number
  filterPayload: {
    shortName?: string
    shortNameId?: string
    creditsRemaining?: string
    linkedAccountsCount?: string
    paymentReceivedStartDate?: string
    paymentReceivedEndDate?: string
  }
}

export interface ShortNameSummaryResults {
  shortName?: string
  transactionDate?: string
  depositAmount?: number
  id: number
}

export interface ShortNameDetails {
  shortName: string
  creditsRemaining?: number
  linkedAccountsCount: number
  lastPaymentReceivedDate: Date
  refundStatus: string
}

export interface EFTRefund {
  id: number
  casSupplierNumber?: string
  casSupplierSite?: string
  comment?: string
  createdBy?: string
  createdName?: string
  createdOn?: Date
  declineReason?: string
  refundAmount?: number
  refundEmail?: string
  shortnameId?: number
  status?: string
  updatedBy?: string
  updatedName?: string
  updatedOn?: Date
  chequeStatus?: string
  refundMethod?: string
  entityName?: string
  street?: string
  streetAdditional?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  deliveryInstructions?: string
}
