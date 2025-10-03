import { z } from 'zod'

export function getRoutingSlipDateSchema() {
  const t = useNuxtApp().$i18n.t
  return z.preprocess(
    v => (v === null ? '' : v),
    z.string().min(1, t('validation.payment.chequeDate.required'))
  )
}

export function getRoutingSlipAmountSchema() {
  const t = useNuxtApp().$i18n.t
  return z.string()
    .min(1, t('validation.payment.paidAmount.required'))
    .regex(/^\d+(\.\d{1,2})?$/, { message: t('validation.payment.paidAmount.decimal') })
}

export function getRoutingSlipPaymentItemSchema() {
  const t = useNuxtApp().$i18n.t
  return z.object({
    uuid: z.string(),
    amountCAD: getRoutingSlipAmountSchema(),
    amountUSD: z.string(),
    identifier: z.string().min(1, t('validation.payment.receiptNumber.required')),
    date: z.string()
  })
}

export function getRoutingSlipPaymentSchema() {
  return z.object({
    paymentType: z.enum([
      PaymentTypes.CASH,
      PaymentTypes.CHEQUE
    ]),
    isUSD: z.boolean().default(false),
    paymentItems: z.record(z.string(), getRoutingSlipPaymentItemSchema())
  }).superRefine((data, ctx) => {
    for (const uuid in data.paymentItems) {
      if (data.isUSD) {
        const usdResult = getRoutingSlipAmountSchema().safeParse(data.paymentItems[uuid]?.amountUSD)
        if (!usdResult.success) {
          usdResult.error.issues.forEach((issue) => {
            ctx.addIssue({ ...issue, path: ['paymentItems', uuid, 'amountUSD'] })
          })
        }
      }

      if (data.paymentType === PaymentTypes.CHEQUE) {
        const dateResult = getRoutingSlipDateSchema().safeParse(data.paymentItems[uuid]?.date)
        if (!dateResult.success) {
          dateResult.error.issues.forEach((issue) => {
            ctx.addIssue({ ...issue, path: ['paymentItems', uuid, 'date'] })
          })
        }
      }
    }
  })
}
