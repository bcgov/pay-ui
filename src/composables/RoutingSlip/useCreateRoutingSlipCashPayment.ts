import { computed, ref } from '@vue/composition-api'

import CommonUtils from '@/util/common-util'
import { PaymentMethods, LDFlags } from '@/util/constants'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import { useRoutingSlip } from '../useRoutingSlip'

// Composable function to inject Props, options and values to CreateRoutingSlipDetails component
export function useCreateRoutingSlipCashPayment () {
  const { cashPayment, isAmountPaidInUsd } = useRoutingSlip()
  const createRoutingSlipCashPaymentForm = ref<HTMLFormElement>()
  const enableUSDExchange: boolean = LaunchDarklyService.getFlag(LDFlags.EnableUSDExchange, false)

  // using same v-model value for getting value and update parent on change
  const chequeReceiptNumber:any = computed({
    get: () => {
      return cashPayment.value?.chequeReceiptNumber || ''
    },
    set: (modalValue: any) => {
      cashPayment.value = {
        ...cashPayment.value,
        chequeReceiptNumber: modalValue,
        paymentMethod: PaymentMethods.CASH
      }
    }
  })

  // using same v-model value for getting value and update parent on change
  const paidAmount:any = computed({
    get: () => {
      return cashPayment.value?.paidAmount || null
    },
    set: (modalValue: any) => {
      cashPayment.value = {
        ...cashPayment.value,
        paidAmount: modalValue,
        paymentMethod: PaymentMethods.CASH
      }
    }
  })

  // using same v-model value for getting value and update parent on change
  const paidUsdAmount:any = computed({
    get: () => {
      return cashPayment.value?.paidUsdAmount || null
    },
    set: (modalValue: any) => {
      cashPayment.value = {
        ...cashPayment.value,
        paidUsdAmount: modalValue,
        paymentMethod: PaymentMethods.CASH
      }
    }
  })

  const isTheAmountPaidInUsd = computed({
    get: () => {
      return isAmountPaidInUsd.value
    },
    set: (modalValue: any) => {
      isAmountPaidInUsd.value = modalValue
    }
  })

  // Input field rules
  const receiptNumberRules = CommonUtils.requiredFieldRule('A Receipt number is required')

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

  const getColumnWidth = computed(() => {
    return isTheAmountPaidInUsd.value ? 4 : 6
  })

  function isValid (): boolean {
    return createRoutingSlipCashPaymentForm.value?.validate()
  }

  return {
    chequeReceiptNumber,
    paidAmount,
    paidUsdAmount,
    createRoutingSlipCashPaymentForm,
    receiptNumberRules,
    paidAmountRules,
    paidUsdAmountRules,
    isValid,
    isTheAmountPaidInUsd,
    getColumnWidth,
    enableUSDExchange
  }
}
