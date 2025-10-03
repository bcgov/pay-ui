import { z } from 'zod'

export function getRoutingSlipDateSchema() {
  return z.preprocess(
    v => (v === null ? '' : v),
    z.string().min(1, 'Cheque date is required')
  )
}

export function getRoutingSlipAmountSchema() {
  return z.string()
    .min(1, 'Paid Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Paid Amount can only be up to 2 decimal places' })
}

export function getRoutingSlipPaymentItemSchema() {
  return z.object({
    uuid: z.string(),
    amountCAD: getRoutingSlipAmountSchema(),
    amountUSD: z.string(),
    identifier: z.string().min(1, 'A Receipt number is required'),
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
