export const useCreateRoutingSlipStore = defineStore('create-routing-slip-store', () => {
  const payApi = usePayApi()
  const localePath = useLocalePath()
  const t = useNuxtApp().$i18n.t
  const toast = useToast()

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

  // TODO: maybe move to composable once 'view routing slip' is complete
  async function createRoutingSlip() {
    try {
      loading.value = true
      const payload = createRoutingSlipPayload(state)
      const res = await payApi.postRoutingSlip(payload)
      await navigateTo(localePath(`/view-routing-slip/${res.number}`))
    } catch (e) {
      // TODO: maybe more descriptive error messages ?
      const status = getErrorStatus(e)
      toast.add({
        description: t('error.createRoutingSlip.generic', { status: status ? `${status}: ` : '' }),
        icon: 'i-mdi-alert',
        color: 'error',
        progress: false
      })
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
    reviewMode.value = false
  }

  return {
    state,
    isCheque,
    totalCAD,
    reviewMode,
    loading,
    addCheque,
    removeCheque,
    resetPaymentState,
    resetUSDAmounts,
    createRoutingSlip,
    $reset
  }
})
