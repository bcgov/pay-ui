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

    const payment: {
      chequeReceiptNumber: string
      paidAmount: number
      paidUsdAmount: number
      paymentDate?: string
      paymentMethod: PaymentTypes.CASH | PaymentTypes.CHEQUE
    } = {
      chequeReceiptNumber: item.identifier,
      paidAmount: parseFloat(item.amountCAD) || 0,
      paidUsdAmount: parseFloat(item.amountUSD) || 0,
      paymentMethod: data.payment.paymentType
    }

    if (data.payment.paymentType === PaymentTypes.CHEQUE) {
      // Confirmed using UTC time.
      payment.paymentDate = DateTime.fromISO(item.date).setZone('UTC').toFormat('yyyy-MM-dd')
    }

    payments.push(payment)
  }

  const hasContactName = !!data.address.name?.trim()
  const address = data.address.address
  const hasMailingAddress = !!address && (
    !!address.street?.trim()
    || !!address.city?.trim()
    || !!address.region?.trim()
    || !!address.postalCode?.trim()
    || !!address.country?.trim()
    || !!address.streetAdditional?.trim()
    || !!address.locationDescription?.trim()
  )

  const payload: CreateRoutingSlipPayload = {
    number: data.details.id,
    paymentAccount: {
      accountName: data.details.entity
    },
    // Confirmed using UTC time.
    routingSlipDate: DateTime.fromISO(data.details.date).setZone('UTC').toFormat('yyyy-MM-dd'),
    payments
  }

  if (hasContactName) {
    payload.contactName = data.address.name
  }

  if (hasMailingAddress) {
    payload.mailingAddress = {
      ...address,
      deliveryInstructions: address.locationDescription
    }
  }

  return payload
}
