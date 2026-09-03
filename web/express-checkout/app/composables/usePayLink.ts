import type { PayInvoice } from '../stores/paymentLink'

/**
 * Thin wrapper over $payApi for the express-checkout payment-link flow.
 */
export function usePayLink() {
  const { $payApi } = useNuxtApp()

  /**
   * POST /payment-links/{token}/redemption — binds the invoice behind the token
   * to the caller's auth account and returns the invoice DTO. Idempotent for
   * the account that first claimed the link.
   */
  async function redeem(token: string, accountId: number): Promise<PayInvoice> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<PayInvoice>(
      `/payment-links/${token}/redemption`,
      {
        method: 'POST',
        headers: {
          'Account-Id': String(accountId)
        }
      }
    )
  }

  /**
   * GET /payment-requests/{invoiceId} — refresh a single invoice's DTO
   * (status, paid, total, paymentMethod, cfsAccount, …).
   * Used after PayBC return so the success
   * screen shows the settled amount/method
   */
  async function getInvoice(invoiceId: number, accountId?: number | null): Promise<PayInvoice> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<PayInvoice>(
      `/payment-requests/${invoiceId}`,
      {
        method: 'GET',
        headers: accountId ? { 'Account-Id': String(accountId) } : undefined
      }
    )
  }

  /**
   * POST /payment-requests/{id}/transactions — same call auth-web makes.
   * pay-api takes payReturnUrl, appends `/{invoiceId}/transaction/{txnId}`,
   * and hands the whole thing to PayBC as the callback URL.
   * clientSystemUrl is what the return page forwards the user to on success.
   */
  async function createTransaction(
    invoiceId: number,
    opts: { clientSystemUrl: string, payReturnUrl: string }
  ): Promise<{ id: number, paySystemUrl?: string, statusCode?: string }> {
    return await ($payApi as ReturnType<typeof $fetch.create>)(
      `/payment-requests/${invoiceId}/transactions`,
      {
        method: 'POST',
        body: opts
      }
    )
  }

  /**
   * PATCH /payment-requests/{id}/transactions/{txnId} — the return-page call.
   * Passes the full callback URL (window.location.href) so pay-api can extract
   * PayBC's query params and reconcile the transaction. Returns final status.
   */
  async function updateTransaction(
    invoiceId: number,
    txnId: number | string,
    payResponseUrl: string
  ): Promise<{
    statusCode: string
    clientSystemUrl?: string
    paySystemReasonCode?: string
    [k: string]: unknown
  }> {
    return await ($payApi as ReturnType<typeof $fetch.create>)(
      `/payment-requests/${invoiceId}/transactions/${txnId}`,
      {
        method: 'PATCH',
        body: { payResponseUrl }
      }
    )
  }

  /**
   * PATCH /payment-requests/{invoiceId} — switches the invoice's payment method.
   * pay-api limits this to CREATED invoices with methods in {CC, DIRECT_PAY,
   * ONLINE_BANKING, PAD}; EFT is not switchable via this endpoint.
   */
  async function changePaymentMethod(
    invoiceId: number,
    method: 'CC' | 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING'
  ): Promise<PayInvoice> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<PayInvoice>(
      `/payment-requests/${invoiceId}`,
      {
        method: 'PATCH',
        body: { paymentInfo: { methodOfPayment: method } }
      }
    )
  }

  /**
   * POST /payment-requests/{invoiceId}/receipts — post-payment receipt PDF.
   * Same call sbc-auth's `payment.services.ts:postReceipt` makes: sends
   * `filingDateTime` (from invoice.createdOn) and requests application/pdf.
   * Use for the CC "Download Receipt" button on the success page.
   */
  async function downloadReceipt(invoiceId: number, filingDateTime: string): Promise<Blob> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<Blob>(
      `/payment-requests/${invoiceId}/receipts`,
      {
        method: 'POST',
        headers: { Accept: 'application/pdf' },
        body: { filingDateTime, isRefund: false },
        responseType: 'blob'
      }
    )
  }

  /**
   * POST /payment-requests/{invoiceId}/reports — pre-payment invoice PDF.
   * Same call sbc-auth's `payment.services.ts:downloadOBInvoice` makes: empty
   * body, requests application/pdf. Use for the OB "Download Invoice" button
   * on the Payment Pending page.
   */
  async function downloadInvoice(invoiceId: number): Promise<Blob> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<Blob>(
      `/payment-requests/${invoiceId}/reports`,
      {
        method: 'POST',
        headers: { Accept: 'application/pdf' },
        body: {},
        responseType: 'blob'
      }
    )
  }

  return {
    redeem,
    getInvoice,
    createTransaction,
    updateTransaction,
    changePaymentMethod,
    downloadReceipt,
    downloadInvoice
  }
}
