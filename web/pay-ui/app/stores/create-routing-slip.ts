export const useCreateRoutingSlipStore = defineStore('create-routing-slip-store', () => {
  const initialPaymentItem = createEmptyPaymentItem()

  const state = reactive<RoutingSlipSchema>({
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
  })

  return {
    state
  }
})
