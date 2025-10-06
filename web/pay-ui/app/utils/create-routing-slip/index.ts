import { z } from 'zod'

export * from './address'
export * from './details'
export * from './payment'

export function getRoutingSlipSchema() {
  return z.object({
    details: getRoutingSlipDetailsSchema(),
    payment: getRoutingSlipPaymentSchema(),
    address: getRoutingSlipAddressSchema()
  })
}

export function createEmptyPaymentItem(): RoutingSlipPaymentItem {
  return { uuid: crypto.randomUUID(), amountCAD: '', amountUSD: '', identifier: '', date: '' }
}

export function createEmptyCRSState(): RoutingSlipSchema {
  const initialPaymentItem = createEmptyPaymentItem()

  return {
    details: {
      id: '',
      date: getToday().toISO() as string,
      entity: ''
    },
    payment: {
      paymentType: PaymentTypes.CHEQUE,
      paymentItems: {
        [initialPaymentItem.uuid]: initialPaymentItem
      },
      isUSD: false
    },
    address: {
      name: '',
      address: {
        street: '',
        streetAdditional: '',
        city: '',
        region: '',
        postalCode: '',
        country: '',
        locationDescription: ''
      }
    }
  }
}
