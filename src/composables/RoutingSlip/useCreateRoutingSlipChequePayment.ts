import { computed, onMounted, ref, watch } from '@vue/composition-api'

import CommonUtils from '@/util/common-util'
import { Payment } from '@/models/Payment'
import { PaymentMethods, LDFlags } from '@/util/constants'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import { useRoutingSlip } from '../useRoutingSlip'

// Composable function to inject Props, options and values to CreateRoutingSlipDetails component
export function useCreateRoutingSlipChequePayment () {
  const { chequePayment, isAmountPaidInUsd } = useRoutingSlip()
  const chequeList = ref<Payment[]>([])
  const createRoutingSlipChequePaymentForm = ref<HTMLFormElement>()
  const enableUSDExchange: boolean = LaunchDarklyService.getFlag(LDFlags.EnableUSDExchange, false)

  // watch any changes and update to store
  watch(chequeList, () => {
    // send clone copy of object
    chequePayment.value = (JSON.parse(JSON.stringify(chequeList.value)))
  }, { deep: true })

  // Input field rules
  const chequeNumberRules = CommonUtils.requiredFieldRule('A Cheque number is required')
  const paymentDateRules = CommonUtils.requiredFieldRule('Cheque date is required')

  const paidUsdAmountRules = [
    v => !!v || 'Paid Amount in USD is required',
    v => v && (/^\d+(\.\d{1,2})?$/.test(v) || 'Paid Amount in USD can only be up to 2 decimal places')
  ]

  const paidAmountRules = [
    v => !!v || 'Paid Amount is required',
    v => {
      return v >= 0 || 'Valid Paid Amount is required'
    },
    v => v === undefined || (/^\d+(\.\d{1,2})?$/.test(v) || 'Paid Amount can only be up to 2 decimal places')
  ]

  // Compute individual cheque paid amount to calculate total paid amount
  const totalAmount = computed(() => {
    const total = chequeList.value.reduce((acc, payment: Payment) => {
      return Number(acc || 0.0) + Number(payment?.paidAmount || 0.0)
    }, 0)
    return total.toFixed(2)
  })

  const isTheAmountPaidInUsd = computed({
    get: () => {
      return isAmountPaidInUsd.value
    },
    set: (modalValue: any) => {
      isAmountPaidInUsd.value = modalValue
    }
  })

  // By default, we have one cheque row in UI
  onMounted(() => {
    if (chequePayment.value?.length > 0) {
      chequeList.value = chequePayment.value.slice(0)
    } else {
      addCheque()
    }
  })

  // For UI Cheque list - start
  function getIndexedTag (tag: string, index: number): string {
    return `${tag}-${index}`
  }

  function removeCheque (index: number) {
    chequeList.value.splice(index, 1)
  }

  function getDefaultRow (): Payment {
    return { chequeReceiptNumber: '', paidAmount: null, paymentDate: '', paymentMethod: PaymentMethods.CHEQUE }
  }

  function addCheque () {
    chequeList.value.push(getDefaultRow())
  }
  // For UI Cheque list - end

  function isValid (): boolean {
    return createRoutingSlipChequePaymentForm.value?.validate()
  }

  const getColumnWidth = computed(() => {
    return isTheAmountPaidInUsd.value ? 3 : 4
  })

  return {
    totalAmount,
    chequeList,
    createRoutingSlipChequePaymentForm,
    chequeNumberRules,
    paidAmountRules,
    paidUsdAmountRules,
    paymentDateRules,
    isTheAmountPaidInUsd,
    getDefaultRow,
    getIndexedTag,
    addCheque,
    removeCheque,
    isValid,
    getColumnWidth,
    enableUSDExchange
  }
}
