import { z } from 'zod'

export function getNonRequiredAddressSchema() {
  const t = useNuxtApp().$i18n.t
  return z.object({
    street: z.string().max(50, t('connect.validation.maxChars', 50)).optional(),
    streetAdditional: z.string().max(50, t('connect.validation.maxChars', 50)).optional(),
    city: z.string().max(40, t('connect.validation.maxChars', 40)).optional(),
    region: z.string().max(2, t('connect.validation.maxChars', 2)).optional(),
    postalCode: z.string().max(15, t('connect.validation.maxChars', 15)).optional(),
    country: z.string().optional(),
    locationDescription: z.string().max(80, t('connect.validation.maxChars', 80)).optional()
  })
}

export function getRequiredAddressSchema() {
  const t = useNuxtApp().$i18n.t
  return z.object({
    street: z.string().min(1, t('validation.fieldRequired')).max(50, t('connect.validation.maxChars', 50)),
    streetAdditional: z.string().max(50, t('connect.validation.maxChars', 50)).optional(),
    city: z.string().min(1, t('validation.fieldRequired')).max(40, t('connect.validation.maxChars', 40)),
    region: z.string().min(1, t('validation.fieldRequired')).max(2, t('connect.validation.maxChars', 2)),
    postalCode: z.string().min(1, t('validation.fieldRequired')).max(15, t('connect.validation.maxChars', 15)),
    country: z.string().min(1, t('validation.fieldRequired')),
    // Old deliveryInstructions field is now locationDescription
    locationDescription: z.string().max(80, t('connect.validation.maxChars', 80)).optional()
  })
}

export function getRoutingSlipAddressSchema() {
  const t = useNuxtApp().$i18n.t
  const nonReqSchema = getNonRequiredAddressSchema()
  return z.object({
    name: z.string().max(90, t('connect.validation.maxChars', 90)),
    address: nonReqSchema
  })
}

export function getRefundRequestFormSchema() {
  const t = useNuxtApp().$i18n.t
  const addressSchema = getRequiredAddressSchema()
  return z.object({
    name: z.string().min(1, t('validation.fieldRequired')),
    address: addressSchema,
    chequeAdvice: z.string().max(40, t('connect.validation.maxChars', 40)).optional()
  })
}
