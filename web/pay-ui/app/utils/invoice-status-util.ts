export const invoiceStatusDisplay = {
  [InvoiceStatus.APPROVED]: 'Processing',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
  [InvoiceStatus.COMPLETED]: 'Completed',
  [InvoiceStatus.CREATED]: 'Created',
  [InvoiceStatus.CREDITED]: 'Credited',
  [InvoiceStatus.DELETED]: 'Deleted',
  [InvoiceStatus.DELETE_ACCEPTED]: 'Deleted',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.PAID]: 'Completed',
  [InvoiceStatus.PARTIAL]: 'Partial Paid',
  // Frontend only
  [InvoiceStatus.PENDING]: 'Pending',
  [InvoiceStatus.REFUNDED]: 'Refunded',
  [InvoiceStatus.REFUND_REQUESTED]: 'Refund Requested',
  [InvoiceStatus.SETTLEMENT_SCHEDULED]: 'Non-sufficient Funds',
  // Update Revenue rarely happens and are intermediate states
  [InvoiceStatus.UPDATE_REVENUE_ACCOUNT]: 'Processing',
  [InvoiceStatus.UPDATE_REVENUE_ACCOUNT_REFUND]: 'Refunded',
  // Frontend only
  [InvoiceStatus.PARTIALLY_CREDITED]: 'Partially Credited',
  [InvoiceStatus.PARTIALLY_REFUNDED]: 'Partially Refunded'
}

export const PaymentStatusList = [
  { label: invoiceStatusDisplay[InvoiceStatus.CANCELLED], value: InvoiceStatus.CANCELLED },
  { label: invoiceStatusDisplay[InvoiceStatus.PAID], value: InvoiceStatus.PAID },
  { label: invoiceStatusDisplay[InvoiceStatus.CREATED], value: InvoiceStatus.CREATED },
  { label: invoiceStatusDisplay[InvoiceStatus.CREDITED], value: InvoiceStatus.CREDITED },
  { label: invoiceStatusDisplay[InvoiceStatus.PENDING], value: InvoiceStatus.PENDING },
  { label: invoiceStatusDisplay[InvoiceStatus.APPROVED], value: InvoiceStatus.APPROVED },
  { label: invoiceStatusDisplay[InvoiceStatus.REFUNDED], value: InvoiceStatus.REFUNDED },
  { label: invoiceStatusDisplay[InvoiceStatus.REFUND_REQUESTED], value: InvoiceStatus.REFUND_REQUESTED },
  // These are FE only on the backend they are PAID
  { label: invoiceStatusDisplay[InvoiceStatus.PARTIALLY_CREDITED], value: InvoiceStatus.PARTIALLY_CREDITED },
  { label: invoiceStatusDisplay[InvoiceStatus.PARTIALLY_REFUNDED], value: InvoiceStatus.PARTIALLY_REFUNDED }
]

export const getInvoiceStatusDisplayName = (status: string): string => {
  return invoiceStatusDisplay[status as InvoiceStatus] || status
}
