export interface StatementListItem {
  createdOn?: string
  frequency: string
  fromDate?: string
  id?: number
  isOverdue?: boolean
  isNew?: boolean
  toDate?: string
  paymentMethods?: string[]
}

export interface Statement {
  id?: number
  isInterimStatement?: boolean
  frequency: string
  fromDate: string
  toDate: string
  paymentMethods: string[]
}

export interface StatementsSummary {
  oldestDueDate?: string
  totalDue: number
}

export interface StatementFilterParams {
  pageNumber?: number
  pageLimit?: number
  filterPayload: {
    isOwing?: string
  }
}

export interface StatementListResponse {
  items: StatementListItem[]
  limit: number
  page: number
  total: number
}
