import type {
  AdjustRoutingSlipAmountParams,
  AdjustRoutingSlipChequeParams,
  GetRoutingSlipRequestPayload,
  RoutingSlip
} from '~/interfaces/routing-slip'
import { SlipStatus } from '~/enums/slip-status'
import { PaymentTypes } from '~/enums/payment-types'
import CommonUtils from '~/utils/common-util'
import { useRoutingSlip } from './useRoutingSlip'

// Composable function to inject Props, options and values to PaymentInformation component
export const usePaymentInformation = (emit?: (event: 'paymentAdjusted') => void) => {
  const {
    adjustRoutingSlip,
    getRoutingSlip,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    updateRoutingSlipAmount,
    updateRoutingSlipChequeNumber
  } = useRoutingSlip()
  const { store } = useRoutingSlipStore()

  const route = useRoute()

  // UI control variables
  const isExpanded = ref<boolean>(false)
  const isEditable = ref<boolean>(false)

  // As per current business rule, a routingslip has one-to-one relation with payment method (Cash/Cheque)
  // Therefore, we can determine the payment method of the current routingslip from the first payment record
  const isPaymentCheque = computed(() => {
    const payments = store.routingSlip.payments
    // to prevent lazy load
    return payments && payments[0]?.paymentMethod === PaymentTypes.CHEQUE
  })

  const displayEditRoutingSlip = computed(() => {
    return !isEditable.value
      && isExpanded.value
      && store.routingSlip
      && store.routingSlip.payments
  })

  const enableEditRoutingSlip = computed(() => {
    return store.routingSlip.status && [SlipStatus.ACTIVE, SlipStatus.COMPLETE, SlipStatus.CORRECTION]
      .includes(store.routingSlip.status as SlipStatus)
  })

  function adjustRoutingSlipChequeNumber(num: string, paymentIndex = 0) {
    const chequeNumToChange: AdjustRoutingSlipChequeParams = {
      chequeNum: num,
      paymentIndex
    }
    updateRoutingSlipChequeNumber(chequeNumToChange)
  }

  function adjustRoutingSlipAmount(num: number, isUsdChange: boolean, paymentIndex = 0) {
    const amountToChange: AdjustRoutingSlipAmountParams = {
      amount: Number(num),
      paymentIndex,
      isRoutingSlipPaidInUsd: isUsdChange
    }
    updateRoutingSlipAmount(amountToChange)
  }

  // Backend returns individual routing slip total. Therefore, we need to sum up the children routing slips as well
  const totalAmount = computed(() => {
    let routingSlipTotal = store.routingSlip.total || 0
    if (isRoutingSlipLinked.value === true && isRoutingSlipAChild.value === false) {
      // this means it is a parent routing slip
      const linkedRoutingSlipsTotal = store.linkedRoutingSlips?.children?.reduce((acc: number, slip: RoutingSlip) => {
        return acc + (slip.total || 0)
      }, 0) || 0
      routingSlipTotal += linkedRoutingSlipsTotal
    }
    return routingSlipTotal ? CommonUtils.appendCurrencySymbol(routingSlipTotal.toFixed(2)) : '$0.00'
  })

  const remainingAmount = computed(() => {
    const amount = store.routingSlip.remainingAmount
    return amount
      ? CommonUtils.appendCurrencySymbol(amount.toFixed(2))
      : '$0.00'
  })

  const isRoutingSlipPaidInUsd = computed(() => {
    return store.routingSlip.totalUsd && store.routingSlip.totalUsd > 0
  })

  const isRoutingSlipChildPaidInUsd = computed(() => {
    return store.linkedRoutingSlips
      && store.linkedRoutingSlips.children
      && store.linkedRoutingSlips.children.length > 0
      && store.linkedRoutingSlips.children[0]?.totalUsd
      && store.linkedRoutingSlips.children[0]?.totalUsd > 0
  })

  const hasPaymentChanges = computed(() => {
    // If routingSlipBeforeEdit is empty, no changes have been made yet
    if (!store.routingSlipBeforeEdit || Object.keys(store.routingSlipBeforeEdit).length === 0) {
      return false
    }
    const current = store.routingSlip as Record<string, unknown>
    const before = store.routingSlipBeforeEdit as Record<string, unknown>
    return !CommonUtils.isDeepEqual(current, before)
  })

  async function adjustRoutingSlipHandler() {
    await adjustRoutingSlip(store.routingSlip.payments || [])
    adjustRoutingSlipStatus()
    const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = {
      routingSlipNumber: store.routingSlip.number || ''
    }
    await getRoutingSlip(getRoutingSlipRequestPayload)

    emit?.('paymentAdjusted')
  }

  function adjustRoutingSlipStatus() {
    isEditable.value = !isEditable.value
  }

  function cancelRoutingSlipAdjust() {
    adjustRoutingSlipStatus()
  }

  function cancelEditPayment() {
    store.routingSlip = store.routingSlipBeforeEdit as RoutingSlip
    adjustRoutingSlipStatus()
  }

  function editPayment() {
    store.routingSlipBeforeEdit = JSON.parse(JSON.stringify(store.routingSlip))
    adjustRoutingSlipStatus()
  }

  function viewPaymentInformation(): void {
    // expand/collapse view payment information children
    isExpanded.value = !isExpanded.value
  }

  const appendQueryParamsIfNeeded = CommonUtils.appendQueryParamsIfNeeded

  function navigateTo(routingSlipNumber: string, childNumber: string): string {
    return appendQueryParamsIfNeeded(
      `/view-routing-slip/${childNumber}`,
      route as { query: Record<string, string> }
    )
  }

  return {
    routingSlip: computed(() => store.routingSlip),
    isExpanded,
    isEditable,
    isPaymentCheque,
    linkedRoutingSlips: computed(() => store.linkedRoutingSlips),
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipChildPaidInUsd,
    totalAmount,
    remainingAmount,
    isRoutingSlipPaidInUsd,
    displayEditRoutingSlip,
    enableEditRoutingSlip,
    adjustRoutingSlipChequeNumber,
    adjustRoutingSlipAmount,
    adjustRoutingSlipHandler,
    adjustRoutingSlipStatus,
    cancelEditPayment,
    editPayment,
    cancelRoutingSlipAdjust,
    viewPaymentInformation,
    navigateTo,
    hasPaymentChanges
  }
}
