/**
 * Shared credit-card handoff to PayBC.
 *
 * Both the checkout submit flow and the "Pay by credit card" escape hatch on
 * the OB success page need to:
 *   1. flip the invoice's paymentInfo to DIRECT_PAY (idempotent if already set)
 *   2. create a fresh transaction with the app's return + client-system URLs
 *   3. hand the browser off to PayBC's hosted card form
 *
 * `handoff()` performs steps 1 and 2 and either navigates on the caller's
 * behalf (returns void) or returns `false` if pay-api didn't hand back a
 * paySystemUrl, so the caller can render a fallback path.
 */
export function useCcHandoff() {
  const payLink = usePayLink()
  const store = usePaymentLinkStore()
  const config = useRuntimeConfig().public as { baseUrl?: string }

  async function handoff(invoiceId: number): Promise<boolean> {
    if (store.invoice?.payment_method !== 'DIRECT_PAY') {
      const updated = await payLink.changePaymentMethod(invoiceId, 'DIRECT_PAY')
      store.setInvoice(updated)
      store.setMethod('DIRECT_PAY')
    }
    const baseUrl = String(config.baseUrl || '').replace(/\/$/, '')
    const payReturnUrl = `${baseUrl}/pay/return`
    const clientSystemUrl = `${baseUrl}/pay/${store.token}/success`
    const txn = await payLink.createTransaction(invoiceId, { clientSystemUrl, payReturnUrl })
    if (txn?.paySystemUrl) {
      window.location.assign(txn.paySystemUrl)
      return true
    }
    return false
  }

  return { handoff }
}
