import { z } from 'zod'

export * from './address'
export * from './details'
export * from './payment'

export function createEmptyPaymentItem(): RoutingSlipPaymentItem {
  return { uuid: crypto.randomUUID(), amountCAD: '', amountUSD: '', identifier: '', date: '' }
}

export function getRoutingSlipSchema() {
  return z.object({
    details: getRoutingSlipDetailsSchema(),
    payment: getRoutingSlipPaymentSchema(),
    address: getRoutingSlipAddressSchema()
  })
}
