// Model for storing invoice of a routing slip
import type { LineItem } from './line-item'

export interface Reference {
  id?: number
  invoiceNumber?: string
  statusCode?: string
}

export interface Detail {
  label?: string
  value?: string
}

export interface Invoice {
  businessIdentifier?: string
  corpTypeCode?: string
  createdBy?: string
  createdOn?: string
  createdName?: string
  id?: number
  lineItems?: LineItem[]
  detail?: Detail[]
  paid?: number
  paymentAccount?: {
    accountId?: string
    accountName?: string
    billable?: boolean
  }
  folioNumber?: string
  paymentMethod?: string
  references?: Reference[]
  refund?: number
  routingSlip?: string
  serviceFees?: string
  statusCode?: string
  total?: number
  details?: Detail[]
}

export interface InvoiceList {
  consInvNumber?: string
  invoiceNumber: string
  invoices: Invoice[]
  paymentMethod: string
  paymentSystem: string
  statusCode: string
  invoiceAmount: number
  paidAmount: number
}

export interface InvoiceListResponse {
  items: InvoiceList[]
  limit: number
  page: number
  total: number
}

// For displaying transaction data table
export interface InvoiceDisplay {
  createdOn?: string
  invoiceNumber?: string
  statusCode?: string
  total?: number
  createdName?: string
  createdBy?: string
  description?: string[]
  id?: number
}
