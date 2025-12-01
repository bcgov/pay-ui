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

const routingSlipBeforeEdit = ref<RoutingSlip>({})

// Composable function to inject Props, options and values to PaymentInformation component
export const usePaymentInformation = (emit?: (event: 'paymentAdjusted') => void) => {
  const {
    adjustRoutingSlip,
    getRoutingSlip,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    linkedRoutingSlips,
    routingSlip,
    updateRoutingSlipAmount,
    updateRoutingSlipChequeNumber
  } = useRoutingSlip()

  const route = useRoute()

  // UI control variables
  const isExpanded = ref<boolean>(false)
  const isEditable = ref<boolean>(false)

  // As per current business rule, a routingslip has one-to-one relation with payment method (Cash/Cheque)
  // Therefore, we can determine the payment method of the current routingslip from the first payment record
  const isPaymentCheque = computed(() => {
    const payments = routingSlip.value?.payments
    // to prevent lazy load
    return payments && payments[0]?.paymentMethod === PaymentTypes.CHEQUE
  })

  const displayEditRoutingSlip = computed(() => {
    return !isEditable.value
      && isExpanded.value
      && routingSlip.value
      && routingSlip.value.payments
  })

  const enableEditRoutingSlip = computed(() => {
    return [SlipStatus.ACTIVE, SlipStatus.COMPLETE, SlipStatus.CORRECTION]
      .includes(routingSlip.value.status as SlipStatus)
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
    let routingSlipTotal = routingSlip.value?.total || 0
    if (isRoutingSlipLinked.value === true && isRoutingSlipAChild.value === false) {
      // this means it is a parent routing slip
      const linkedRoutingSlipsTotal = linkedRoutingSlips.value?.children?.reduce((acc, slip: RoutingSlip) => {
        return acc + (slip.total || 0)
      }, 0) || 0
      routingSlipTotal += linkedRoutingSlipsTotal
    }
    return routingSlipTotal ? CommonUtils.appendCurrencySymbol(routingSlipTotal.toFixed(2)) : '$0.00'
  })

  const remainingAmount = computed(() => {
    const amount = routingSlip.value.remainingAmount
    return amount
      ? CommonUtils.appendCurrencySymbol(amount.toFixed(2))
      : '$0.00'
  })

  const isRoutingSlipPaidInUsd = computed(() => {
    return routingSlip.value.totalUsd && routingSlip.value.totalUsd > 0
  })

  const isRoutingSlipChildPaidInUsd = computed(() => {
    return linkedRoutingSlips.value
      && linkedRoutingSlips.value.children
      && linkedRoutingSlips.value.children.length > 0
      && linkedRoutingSlips.value.children[0]?.totalUsd
      && linkedRoutingSlips.value.children[0]?.totalUsd > 0
  })

  const hasPaymentChanges = computed(() => {
    // If routingSlipBeforeEdit is empty, no changes have been made yet
    if (!routingSlipBeforeEdit.value || Object.keys(routingSlipBeforeEdit.value).length === 0) {
      return false
    }
    const current = routingSlip.value as Record<string, unknown>
    const before = routingSlipBeforeEdit.value as Record<string, unknown>
    return !CommonUtils.isDeepEqual(current, before)
  })

  async function adjustRoutingSlipHandler() {
    await adjustRoutingSlip(routingSlip.value.payments || [])
    adjustRoutingSlipStatus()
    const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = {
      routingSlipNumber: routingSlip.value.number
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
    routingSlip.value = routingSlipBeforeEdit.value
    adjustRoutingSlipStatus()
  }

  function editPayment() {
    routingSlipBeforeEdit.value = JSON.parse(JSON.stringify(routingSlip.value))
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
    routingSlip,
    isExpanded,
    isEditable,
    isPaymentCheque,
    linkedRoutingSlips,
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
