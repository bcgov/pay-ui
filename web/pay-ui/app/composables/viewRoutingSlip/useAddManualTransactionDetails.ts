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

// Composable function to inject Props, options and values to AddManualTransactionDetails component
export default function useAddManualTransactionDetails(
  props: UseAddManualTransactionDetailsProps,
  emit?: UseAddManualTransactionDetailsEmit
) {
  const { getFeeByCorpTypeAndFilingType } = useRoutingSlip()
  const { manualTransaction, index } = toRefs(props)

  // Object that holds the input fields - seed it using property
  const manualTransactionDetails = ref<ManualTransactionDetails | undefined>(undefined)

  // Input field rules
  const requiredFieldRule = CommonUtils.requiredFieldRule()

  const errorMessage = computed(() => {
    /*
      We need to check if total exceeds remaining amount and
      if the availableAmountForManualTransaction is greater than 0 as any change
      in prior transaction records affect the remaining amount of this record
    */
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

  // Calculate total fee from pay-api service, triggered if its dependent values are changed
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
        manualTransactionDetails.value.total = await getFeeByCorpTypeAndFilingType(getFeeRequestParams)
      } else {
        manualTransactionDetails.value.total = null
      }
    } catch (error: unknown) {
      manualTransactionDetails.value.total = null
      // TODO : Business errors (400s) need to be handled
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

  // Emits the updated manual transaction detail event to the parent
  function emitManualTransactionDetails() {
    if (emit && manualTransactionDetails.value && index?.value !== undefined) {
      emit('updateManualTransaction', { transaction: manualTransactionDetails.value, index: index.value })
    }
  }

  function getIndexedTag(tag: string, idx: number | undefined): string {
    return `${tag}-${idx}`
  }

  // Input field rules
  const referenceNumberRules = [
    (v: string) => ((v || '').length <= 20) || 'Incorporation/Reference Number should not be more than 20 characters'
  ]

  const quantityRules = [
    (v: number) => !!v || 'This field is required',
    (v: number) => (v > 0) || 'Quantity should be greater than 0'
  ]

  // watch manualTransaction object, assign availableAmountForManualTransaction property.
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
    quantityRules
  }
}
