import type { PayInvoice, PayInvoiceLineItem } from '../stores/paymentLink'

/**
 * Fee helpers for pay-api invoices.
 *
 * `lineBaseFee` is stateless — pass a line item, get its base fee (filing +
 * priority + future-effective − waived, excludes service fees).
 *
 * `serviceFees` and `total` are reactive `computed`s tied to the invoice
 * getter you pass in. Pass a thunk (e.g. `() => store.invoice`) so the values
 * track store updates without you needing to re-invoke.
 */
export function useInvoiceFees(getInvoice: () => PayInvoice | null | undefined) {
  function lineBaseFee(line: PayInvoiceLineItem): number {
    return (Number(line.filingFees) || 0)
      + (Number(line.priorityFees) || 0)
      + (Number(line.futureEffectiveFees) || 0)
      - (Number(line.waivedFees) || 0)
  }

  // Prefer the invoice's top-level `serviceFees` when pay-api set it; fall
  // back to summing per-line values so the sidebar shows a non-zero fee even
  // for partner-created invoices that only itemise at the line level.
  const serviceFees = computed(() => {
    const inv = getInvoice()
    if (inv?.serviceFees != null) { return Number(inv.serviceFees) || 0 }
    return (inv?.lineItems ?? []).reduce(
      (s, l) => s + (Number(l.serviceFees) || 0), 0
    )
  })

  const total = computed(() => Number(getInvoice()?.total ?? 0))

  return { lineBaseFee, serviceFees, total }
}
