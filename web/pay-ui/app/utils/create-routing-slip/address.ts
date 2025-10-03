import { z } from 'zod'

export function getRoutingSlipAddressSchema() {
  const t = useNuxtApp().$i18n.t
  const nonReqSchema = getNonRequiredAddressSchema()
  return z.object({
    name: z.string().max(90, t('connect.validation.maxChars', 90)),
    address: nonReqSchema
  })
}
