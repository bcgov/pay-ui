import CommonUtils from '@/utils/common-util'
import { useRoutingSlip } from '../useRoutingSlip'
import { debounce } from 'es-toolkit'

interface UseAddManualTransactionDetailsProps {
  index?: number
  manualTransaction?: ManualTransactionDetails | null
}

interface UseAddManualTransactionDetailsEmit {
  (event: 'removeManualTransactionRow', index: number): void
  (event: 'updateManualTransaction', payload: { transaction: ManualTransactionDetails, index: number }): void
}

export default function useAddManualTransactionDetails(
  props: UseAddManualTransactionDetailsProps,
  emit?: UseAddManualTransactionDetailsEmit
) {
  const { getFeeByCorpTypeAndFilingType } = useRoutingSlip()
  const { manualTransaction, index } = toRefs(props)

  const manualTransactionDetails = ref<ManualTransactionDetails | undefined>(undefined)

  const requiredFieldRule = CommonUtils.requiredFieldRule()

  const errorMessage = computed(() => {
    const msg = manualTransactionDetails.value.quantity && (
      manualTransactionDetails.value.availableAmountForManualTransaction < manualTransactionDetails.value.total
      || manualTransactionDetails.value.availableAmountForManualTransaction < 0)
      ? 'Amount exceeds the routing slip\'s current balance'
      : ''
    return msg
  })

  const totalFormatted = computed(() => {
    return manualTransaction.value?.total?.toFixed(2)
  })

  async function calculateTotal() {
    try {
      if (manualTransactionDetails
        && manualTransactionDetails.value.filingType
        && manualTransactionDetails.value.quantity) {
        const getFeeRequestParams: GetFeeRequestParams = {
          corpTypeCode: manualTransactionDetails.value.filingType.corpTypeCode.code,
          filingTypeCode: manualTransactionDetails.value.filingType.filingTypeCode.code,
          requestParams: {
            quantity: manualTransactionDetails.value.quantity,
            priority: manualTransactionDetails.value.priority,
            futureEffective: manualTransactionDetails.value.futureEffective
          }
        }
        // Global exception handler will handle this one.
        manualTransactionDetails.value.total = await getFeeByCorpTypeAndFilingType(getFeeRequestParams)
      } else {
        manualTransactionDetails.value.total = null
      }
    } catch (error: unknown) {
      manualTransactionDetails.value.total = null
      console.error('error ', error?.response?.data)
    } finally {
      emitManualTransactionDetails()
    }
  }

  const delayedCalculateTotal = debounce(calculateTotal, 100)

  // Emit this remove row event, that is consumed in parent and slice the v-model array of parent
  function removeManualTransactionRowEventHandler() {
    if (emit && index?.value !== undefined) {
      emit('removeManualTransactionRow', index.value)
    }
  }

  function emitManualTransactionDetails() {
    if (emit && manualTransactionDetails.value && index?.value !== undefined) {
      emit('updateManualTransaction', { transaction: manualTransactionDetails.value, index: index.value })
    }
  }

  function getIndexedTag(tag: string, idx: number | undefined): string {
    return `${tag}-${idx}`
  }

  const referenceNumberRules = [
    (v: string) => ((v || '').length <= 20) || 'Incorporation/Reference Number should not be more than 20 characters'
  ]

  const quantityRules = [
    (v: number) => !!v || 'This field is required',
    (v: number) => (v > 0) || 'Quantity should be greater than 0'
  ]

  if (manualTransaction) {
    watch(manualTransaction, () => {
      if (manualTransactionDetails.value && manualTransaction.value) {
        manualTransactionDetails.value.availableAmountForManualTransaction
          = manualTransaction.value.availableAmountForManualTransaction
      }
    }, { deep: true })
  }

  onMounted(() => {
    if (manualTransaction?.value) {
      manualTransactionDetails.value = JSON.parse(JSON.stringify(manualTransaction.value))
    }
  })

  const errors = reactive({
    filingType: '',
    quantity: ''
  })

  function validate() {
    errors.filingType = ''
    errors.quantity = ''
    let isValid = true

    if (!manualTransactionDetails.value?.filingType) {
      errors.filingType = 'This field is required'
      isValid = false
    }
    if (!manualTransactionDetails.value?.quantity || manualTransactionDetails.value.quantity <= 0) {
      errors.quantity = 'This field is required'
      isValid = false
    }

    return isValid
  }

  return {
    manualTransactionDetails,
    requiredFieldRule,
    removeManualTransactionRowEventHandler,
    delayedCalculateTotal,
    calculateTotal,
    getIndexedTag,
    emitManualTransactionDetails,
    errorMessage,
    totalFormatted,
    referenceNumberRules,
    quantityRules,
    errors,
    validate
  }
}
