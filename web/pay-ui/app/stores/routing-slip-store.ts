import type {
  AccountInfo, LinkedRoutingSlips, RoutingSlip, RoutingSlipDetails,
  RoutingSlipAddress, Payment, SearchRoutingSlipParams, SearchFilterState
} from '~/interfaces/routing-slip'
import type { getSearchRoutingSlipTableHeaders } from '@/utils/constants'
import { PaymentTypes } from '@/enums/payment-types'
import type { RoutingSlipSchema } from '~/types/create-routing-slip'
import { createEmptyCRSState, createEmptyPaymentItem } from '~/utils/create-routing-slip'

const defaultParams: SearchRoutingSlipParams = {
  page: 1,
  limit: 50
}

export const defaultFilters: SearchFilterState = {
  routingSlipNumber: null,
  receiptNumber: null,
  accountName: null,
  createdName: null,
  dateFilter: { startDate: null, endDate: null },
  status: null,
  refundStatus: null,
  businessIdentifier: null,
  chequeReceiptNumber: null,
  remainingAmount: null
}

// This is in a store because it's used across the app in various components.
export const useRoutingSlipStore = defineStore('routing-slip-store', () => {
  const store = reactive({
    routingSlip: {} as RoutingSlip,
    linkedRoutingSlips: undefined as LinkedRoutingSlips | undefined,
    routingSlipDetails: {} as RoutingSlipDetails | undefined,
    routingSlipAddress: {} as RoutingSlipAddress | undefined,
    accountInfo: {} as AccountInfo | undefined,
    chequePayment: [] as Payment[] | undefined,
    cashPayment: {} as Payment | undefined,
    isPaymentMethodCheque: true as boolean | undefined,
    isAmountPaidInUsd: false,
    searchRoutingSlipResult: [] as RoutingSlip[],
    searchRoutingSlipParams: defaultParams as SearchRoutingSlipParams,
    searchRoutingSlipTableHeaders: [] as ReturnType<typeof getSearchRoutingSlipTableHeaders>,
    searchFilters: { ...defaultFilters } as SearchFilterState,
    searchColumnVisibility: {} as Record<string, boolean>,
    routingSlipBeforeEdit: {} as RoutingSlip
  })

  return {
    store
  }
})

export const useCreateRoutingSlipStore = defineStore('create-routing-slip-store', () => {
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
    $reset
  }
})
