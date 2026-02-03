import { PaymentTypes } from '@/util/constants'

export const paymentTypeDisplay = {
  [PaymentTypes.BCOL]: 'BC OnLine',
  [PaymentTypes.CASH]: 'Cash',
  [PaymentTypes.CHEQUE]: 'Cheque',
  [PaymentTypes.CREDIT_CARD]: 'Credit Card',
  [PaymentTypes.DIRECT_PAY]: 'Credit Card',
  [PaymentTypes.EFT]: 'Electronic Funds Transfer',
  [PaymentTypes.EJV]: 'Electronic Journal Voucher',
  [PaymentTypes.INTERNAL]: 'Routing Slip',
  [PaymentTypes.NO_FEE]: 'No Fee',
  [PaymentTypes.ONLINE_BANKING]: 'Online Banking',
  [PaymentTypes.PAD]: 'Pre-Authorized Debit',
  [PaymentTypes.CREDIT]: 'Account Credit'
}

export const getPaymentTypeDisplayName = (paymentType: string): string => {
  return paymentTypeDisplay[paymentType as PaymentTypes] || paymentType
}

export const PaymentMethodSelectItems = [
  { text: paymentTypeDisplay[PaymentTypes.BCOL], value: PaymentTypes.BCOL },
  { text: paymentTypeDisplay[PaymentTypes.CREDIT_CARD], value: PaymentTypes.CREDIT_CARD },
  { text: paymentTypeDisplay[PaymentTypes.EFT], value: PaymentTypes.EFT },
  { text: paymentTypeDisplay[PaymentTypes.EJV], value: PaymentTypes.EJV },
  { text: paymentTypeDisplay[PaymentTypes.ONLINE_BANKING], value: PaymentTypes.ONLINE_BANKING },
  { text: paymentTypeDisplay[PaymentTypes.PAD], value: PaymentTypes.PAD },
  { text: paymentTypeDisplay[PaymentTypes.CREDIT], value: PaymentTypes.CREDIT },
  { text: paymentTypeDisplay[PaymentTypes.INTERNAL], value: PaymentTypes.INTERNAL },
  { text: paymentTypeDisplay[PaymentTypes.NO_FEE], value: PaymentTypes.NO_FEE }
]
