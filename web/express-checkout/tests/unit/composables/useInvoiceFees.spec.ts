import { useInvoiceFees } from '~/composables/useInvoiceFees'
import type { PayInvoice, PayInvoiceLineItem } from '~/stores/paymentLink'

function invoice(overrides: Partial<PayInvoice> = {}): PayInvoice {
  return { id: 1, ...overrides }
}

function lineItem(overrides: Partial<PayInvoiceLineItem> = {}): PayInvoiceLineItem {
  return { ...overrides }
}

describe('useInvoiceFees', () => {
  describe('lineBaseFee', () => {
    it('sums filing + priority + future-effective, minus waived', () => {
      const { lineBaseFee } = useInvoiceFees(() => null)
      expect(lineBaseFee(lineItem({
        filing_fees: 30,
        priority_fees: 5,
        future_effective_fees: 10,
        waived_fees: 3
      }))).toBe(42)
    })

    it('treats missing numeric fields as 0', () => {
      const { lineBaseFee } = useInvoiceFees(() => null)
      expect(lineBaseFee(lineItem({ filing_fees: 40 }))).toBe(40)
      expect(lineBaseFee(lineItem({}))).toBe(0)
    })

    it('excludes service fees from the line base', () => {
      const { lineBaseFee } = useInvoiceFees(() => null)
      expect(lineBaseFee(lineItem({ filing_fees: 30, service_fees: 1.5 }))).toBe(30)
    })

    it('coerces string values to numbers', () => {
      const { lineBaseFee } = useInvoiceFees(() => null)
      expect(lineBaseFee(lineItem({
        filing_fees: '20' as unknown as number,
        priority_fees: '1.5' as unknown as number
      }))).toBe(21.5)
    })
  })

  describe('serviceFees', () => {
    it('is 0 when invoice is null or empty', () => {
      expect(useInvoiceFees(() => null).serviceFees.value).toBe(0)
      expect(useInvoiceFees(() => undefined).serviceFees.value).toBe(0)
      expect(useInvoiceFees(() => invoice()).serviceFees.value).toBe(0)
    })

    it('prefers invoice.service_fees when set', () => {
      const { serviceFees } = useInvoiceFees(() => invoice({
        service_fees: 1.5,
        line_items: [lineItem({ service_fees: 99 })] // ignored
      }))
      expect(serviceFees.value).toBe(1.5)
    })

    it('sums line_items[].service_fees when top-level is missing', () => {
      const { serviceFees } = useInvoiceFees(() => invoice({
        line_items: [
          lineItem({ service_fees: 1.5 }),
          lineItem({ service_fees: 2 }),
          lineItem({})
        ]
      }))
      expect(serviceFees.value).toBe(3.5)
    })

    it('is reactive to the getter result', () => {
      const state = ref<PayInvoice | null>(null)
      const { serviceFees } = useInvoiceFees(() => state.value)
      expect(serviceFees.value).toBe(0)
      state.value = invoice({ service_fees: 4.25 })
      expect(serviceFees.value).toBe(4.25)
    })
  })

  describe('total', () => {
    it('returns invoice.total, coerced to a number', () => {
      expect(useInvoiceFees(() => invoice({ total: 351.5 })).total.value).toBe(351.5)
      expect(useInvoiceFees(() => invoice({ total: '100' as unknown as number })).total.value).toBe(100)
    })

    it('is 0 when total is missing or invoice is null', () => {
      expect(useInvoiceFees(() => null).total.value).toBe(0)
      expect(useInvoiceFees(() => invoice()).total.value).toBe(0)
    })
  })
})
