export interface PayInvoiceLineItem {
  description?: string
  total?: number
  filing_fees?: number
  priority_fees?: number
  future_effective_fees?: number
  service_fees?: number
  waived_fees?: number
  gst?: number
  statutory_fees_gst?: number
  service_fees_gst?: number
  pst?: number
}

export interface PayInvoiceReference {
  invoice_number?: string
  reference_number?: string
  status_code?: string
}

export interface PayInvoiceReceipt {
  receipt_number?: string
  receipt_date?: string
  receipt_amount?: number
}

/** Pay-api's invoice DTO uses snake_case (see InvoiceSchema data_keys). */
export interface PayInvoice {
  id: number
  total?: number
  paid?: number
  gst?: number
  service_fees?: number
  status_code?: string
  payment_method?: string // e.g. 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING' | 'CC'
  corp_type_code?: string
  business_identifier?: string
  payment_date?: string
  line_items?: PayInvoiceLineItem[]
  references?: PayInvoiceReference[]
  receipts?: PayInvoiceReceipt[]
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
  cfsPartyNumber?: string
  cfsSiteNumber?: string
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
    if (value?.payment_method && !paymentMethod.value) {
      paymentMethod.value = value.payment_method as PaymentMethodCode
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
