import { z } from 'zod'
import { FetchError } from 'ofetch'
import { FASErrorCode } from '~/enums/api-errors'

async function checkRoutingNumber(routingNumber: string): Promise<{ valid: boolean, message: string }> {
  const t = useNuxtApp().$i18n.t
  const payApi = usePayApi()
  const validResponse = { valid: true, message: '' }

  try {
    const res = await payApi.getRoutingSlip(routingNumber, { showErrorToast: false })
    if (res && res.id) {
      return { valid: false, message: t('validation.routingSlip.number.exists') }
    }
    return validResponse
  } catch (error) {
    if (error instanceof FetchError) {
      const status = error.response?.status
      const type = extractErrorType(error)
      if (status === 400 && type === FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS) {
        return { valid: false, message: t('validation.routingSlip.number.invalidApi') }
      }
    }
    return validResponse
  }
}

export function getRoutingSlipDetailsSchema() {
  const t = useNuxtApp().$i18n.t
  const dedupeRequest = createDedupedRequest()

  return z.object({
    id: z.string()
      .min(1, { message: t('validation.routingSlip.number.required') })
      .length(9, { message: t('validation.routingSlip.number.length') })
      .regex(/^\d+$/, { message: t('validation.routingSlip.number.numeric') }),
    date: z.string().min(1, t('validation.routingSlip.date.required')),
    entity: z.string().min(1, t('validation.routingSlip.entityNumber.required'))
  }).superRefine(async (data, ctx) => {
    if (data.id.length === 9) {
      // issue with duplicate requests when using async in superRefine
      const { valid, message } = await dedupeRequest.run(data.id, async () => checkRoutingNumber(data.id))

      if (!valid) {
        ctx.addIssue({
          code: 'custom',
          message,
          path: ['id']
        })
      }
    }
  })
}
