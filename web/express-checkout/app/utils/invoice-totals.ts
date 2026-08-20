import type { PayInvoice } from '~/stores/paymentLink'

/**
 * Subtotal shown on the checkout page.
 *
 * Prefers summing the invoice's `line_items` (authoritative source):
 *   filing + priority + future-effective + service fees, minus waived fees.
 *
 * Falls back to backing GST + PST out of `invoice.total` when there are no
 * line items — some partner-created invoices land without an itemised
 * breakdown until pay-api enriches them.
 */
export function calculateSubtotal(invoice?: PayInvoice | null): number {
  const items = invoice?.line_items ?? []
  if (items.length > 0) {
    return items.reduce((sum, l) => sum
      + (Number(l.filing_fees) || 0)
      + (Number(l.priority_fees) || 0)
      + (Number(l.future_effective_fees) || 0)
      + (Number(l.service_fees) || 0)
      - (Number(l.waived_fees) || 0), 0)
  }
  const total = Number(invoice?.total ?? 0)
  const gst = Number(invoice?.gst ?? 0)
  const pst = items.reduce((s, l) => s + (Number(l.pst) || 0), 0)
  return total - gst - pst
}

/** Sum of `pst` across the invoice's line items. Zero when there are none. */
export function calculatePstTotal(invoice?: PayInvoice | null): number {
  const items = invoice?.line_items ?? []
  return items.reduce((s, l) => s + (Number(l.pst) || 0), 0)
}
