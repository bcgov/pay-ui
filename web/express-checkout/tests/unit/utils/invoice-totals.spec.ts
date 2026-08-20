import { calculateSubtotal, calculatePstTotal } from '~/utils/invoice-totals'
import type { PayInvoice, PayInvoiceLineItem } from '~/stores/paymentLink'

function invoice(overrides: Partial<PayInvoice> = {}): PayInvoice {
  return { id: 1, ...overrides }
}

function lineItem(overrides: Partial<PayInvoiceLineItem> = {}): PayInvoiceLineItem {
  return { ...overrides }
}

describe('calculateSubtotal', () => {
  it('returns 0 when invoice is null or undefined', () => {
    expect(calculateSubtotal(null)).toBe(0)
    expect(calculateSubtotal(undefined)).toBe(0)
  })

  it('sums filing + priority + future-effective + service fees across line items', () => {
    const inv = invoice({
      line_items: [
        lineItem({ filing_fees: 30, priority_fees: 5, future_effective_fees: 10, service_fees: 1.5 }),
        lineItem({ filing_fees: 20, service_fees: 2 })
      ]
    })
    expect(calculateSubtotal(inv)).toBe(68.5)
  })

  it('subtracts waived fees from the line-item sum', () => {
    const inv = invoice({
      line_items: [lineItem({ filing_fees: 100, waived_fees: 25 })]
    })
    expect(calculateSubtotal(inv)).toBe(75)
  })

  it('treats missing / undefined line-item fees as 0', () => {
    const inv = invoice({
      line_items: [lineItem({ filing_fees: 40 })]
    })
    expect(calculateSubtotal(inv)).toBe(40)
  })

  it('coerces string fee values to numbers', () => {
    const inv = invoice({
      line_items: [
        // pay-api occasionally serialises numeric fields as strings
        lineItem({ filing_fees: '30' as unknown as number, service_fees: '1.5' as unknown as number })
      ]
    })
    expect(calculateSubtotal(inv)).toBe(31.5)
  })

  it('ignores invoice.total when line items are present', () => {
    const inv = invoice({
      total: 9999,
      gst: 500,
      line_items: [lineItem({ filing_fees: 30 })]
    })
    expect(calculateSubtotal(inv)).toBe(30)
  })

  it('falls back to total − gst when there are no line items', () => {
    const inv = invoice({ total: 100, gst: 5 })
    expect(calculateSubtotal(inv)).toBe(95)
  })

  it('returns 0 in the fallback when total and gst are unset', () => {
    expect(calculateSubtotal(invoice())).toBe(0)
    expect(calculateSubtotal(invoice({ line_items: [] }))).toBe(0)
  })
})

describe('calculatePstTotal', () => {
  it('returns 0 when invoice is null / undefined / has no line items', () => {
    expect(calculatePstTotal(null)).toBe(0)
    expect(calculatePstTotal(undefined)).toBe(0)
    expect(calculatePstTotal(invoice())).toBe(0)
    expect(calculatePstTotal(invoice({ line_items: [] }))).toBe(0)
  })

  it('sums pst across line items, treating missing values as 0', () => {
    const inv = invoice({
      line_items: [
        lineItem({ pst: 2 }),
        lineItem({}),
        lineItem({ pst: 3.5 })
      ]
    })
    expect(calculatePstTotal(inv)).toBe(5.5)
  })

  it('coerces string pst values to numbers', () => {
    const inv = invoice({
      line_items: [lineItem({ pst: '4.25' as unknown as number })]
    })
    expect(calculatePstTotal(inv)).toBe(4.25)
  })
})
