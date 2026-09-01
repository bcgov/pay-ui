export interface PayInvoiceLineItem {
  description?: string
  total?: number
  filingFees?: number
  priorityFees?: number
  futureEffectiveFees?: number
  serviceFees?: number
  waivedFees?: number
  /** Optional quantity metadata used to render the Fee Summary subtitle
   *  ("× {quantity} {quantityDesc}"). pay-api's InvoiceSchema surfaces these
   *  for line items that come from a fee code with a per-unit rate. */
  quantity?: number
  quantityDesc?: string
}

/** Pay-api's payment-request DTO. Fields we read are typed; extra fields land
 *  under the index signature. Note: the redemption endpoint returns camelCase
 *  (not the snake_case InvoiceSchema you'd see in db-facing docs). */
export interface PayInvoice {
  id: number
  total?: number
  paid?: number
  serviceFees?: number
  paymentMethod?: string // e.g. 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING' | 'CC'
  lineItems?: PayInvoiceLineItem[]
  /** pay-api returns invoice creation timestamp as ISO 8601 — used as the
   *  `filingDateTime` when POSTing to /receipts to generate the invoice PDF. */
  createdOn?: string
  [key: string]: unknown
}

export type PaymentMethodCode = 'CC' | 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING'

export type CfsAccountStatus
  = | 'ACTIVE'
    | 'INACTIVE'
    | 'PENDING'
    | 'PENDING_PAD_ACTIVATION'
    | 'FREEZE'

export interface AccountCfsInfo {
  cfsAccountNumber?: string
  paymentMethod?: PaymentMethodCode
  status?: CfsAccountStatus
  // pay-api returns bank fields on PAD-configured accounts. The account number
  // is masked with 'X's (only the last MASK_LEN digits preserved). Transit and
  // institution numbers are returned in full.
  bankAccountNumber?: string
  bankInstitutionNumber?: string
  bankTransitNumber?: string
}

export interface AccountPaymentInfo {
  id?: number
  paymentMethod?: PaymentMethodCode
  cfsAccount?: AccountCfsInfo
  [key: string]: unknown
}

export const usePaymentLinkStore = defineStore('express-checkout-payment-link', () => {
  const token = ref<string | null>(null)
  const invoice = ref<PayInvoice | null>(null)
  const selectedAccountId = ref<number | null>(null)
  const paymentMethod = ref<PaymentMethodCode | null>(null)
  const accountInfo = ref<AccountPaymentInfo | null>(null)

  function setToken(value: string | null) {
    token.value = value
  }

  function setInvoice(value: PayInvoice | null) {
    invoice.value = value
    if (value?.paymentMethod && !paymentMethod.value) {
      paymentMethod.value = value.paymentMethod as PaymentMethodCode
    }
  }

  function setAccount(id: number | null) {
    selectedAccountId.value = id
  }

  function setMethod(m: PaymentMethodCode | null) {
    paymentMethod.value = m
  }

  function setAccountInfo(info: AccountPaymentInfo | null) {
    accountInfo.value = info
  }

  function $reset() {
    token.value = null
    invoice.value = null
    selectedAccountId.value = null
    paymentMethod.value = null
    accountInfo.value = null
  }

  return {
    token,
    invoice,
    selectedAccountId,
    paymentMethod,
    accountInfo,
    setToken,
    setInvoice,
    setAccount,
    setMethod,
    setAccountInfo,
    $reset
  }
}, {
  persist: true // survives auth login round-trip via sessionStorage
})
