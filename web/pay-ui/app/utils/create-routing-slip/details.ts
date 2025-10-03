import { z } from 'zod'

export function getRoutingSlipDetailsSchema() {
  const payApi = usePayApi()
  const dedupeRequest = createDedupedRequest()

  return z.object({
    id: z.string()
      .min(1, { message: 'A Routing Slip Number is required' })
      .length(9, { message: 'A Routing Slip Number must be 9 characters long' })
      .regex(/^\d+$/, { message: 'Valid Routing Slip Number is required' }),
    date: z.string().min(1, 'A Routing Slip Date is required'),
    entity: z.string().min(1, 'An Entity Number is required')
  }).superRefine(async (data, ctx) => {
    if (data.id.length === 9) {
      // issue with duplicate requests when using async in superRefine
      const { valid, message } = await dedupeRequest.run(data.id, async () => payApi.checkRoutingNumber(data.id))

      if (!valid) {
        ctx.addIssue({
          code: 'custom',
          message: message,
          path: ['id']
        })
      }
    }
  })
}
