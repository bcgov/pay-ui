export const useCreateRoutingSlipStore = defineStore('create-routing-slip-store', () => {
  const localePath = useLocalePath()
  const payApi = usePayApi()

  const state = reactive<RoutingSlipSchema>(createEmptyCRSState())
  const loading = ref<boolean>(false)
  const reviewMode = ref<boolean>(false)

  const isCheque = computed<boolean>(() => state.payment.paymentType === PaymentTypes.CHEQUE)

  const totalCAD = computed<string>(() => Object.values(state.payment.paymentItems)
    .reduce((total, item) => {
      const amount = Number(item?.amountCAD) || 0
      return total + amount
    }, 0).toFixed(2)
  )

  function addCheque() {
    const newItem = createEmptyPaymentItem()
    state.payment.paymentItems[newItem.uuid] = newItem
  }

  function removeCheque(uuid: string) {
    /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
    delete state.payment.paymentItems[uuid]
  }

  function resetPaymentState() {
    const newItem = createEmptyPaymentItem()
    state.payment.isUSD = false
    state.payment.paymentItems = { [newItem.uuid]: newItem }
  }

  function resetUSDAmounts() {
    for (const uuid in state.payment.paymentItems) {
      const item = state.payment.paymentItems[uuid]
      if (item) {
        item.amountUSD = ''
      }
    }
  }

  async function createRoutingSlip() {
    try {
      loading.value = true
      const payload = createRoutingSlipPayload(state)
      const res = await payApi.postRoutingSlip(payload)
      await navigateTo(localePath(`/view-routing-slip/${res.number}`))
    } catch (e) {
      // TODO: handle errors
      console.error(e)
    } finally {
      loading.value = false
      $reset()
    }
  }

  function $reset() {
    const newState = createEmptyCRSState()
    state.details = newState.details
    state.payment = newState.payment
    state.address = newState.address
    loading.value = false
  }

  return {
    state,
    isCheque,
    totalCAD,
    reviewMode,
    addCheque,
    removeCheque,
    resetPaymentState,
    resetUSDAmounts,
    createRoutingSlip,
    $reset
  }
})
