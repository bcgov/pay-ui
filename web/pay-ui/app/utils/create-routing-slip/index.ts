import { z } from 'zod'
import { DateTime } from 'luxon'

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

export function createRoutingSlipPayload(data: RoutingSlipSchema): CreateRoutingSlipPayload {
  const payments = []

  for (const uuid in data.payment.paymentItems) {
    const item = data.payment.paymentItems[uuid]!

    payments.push({
      chequeReceiptNumber: item.identifier,
      paidAmount: parseFloat(item.amountCAD) || 0,
      paidUsdAmount: parseFloat(item.amountUSD) || 0,
      paymentDate: DateTime.fromISO(item.date).toFormat('yyyy-MM-dd'),
      paymentMethod: data.payment.paymentType
    })
  }

  return {
    contactName: data.address.name,
    mailingAddress: data.address.address,
    number: data.details.id,
    paymentAccount: {
      accountName: data.details.entity
    },
    routingSlipDate: DateTime.fromISO(data.details.date).toFormat('yyyy-MM-dd'),
    payments
  }
}
