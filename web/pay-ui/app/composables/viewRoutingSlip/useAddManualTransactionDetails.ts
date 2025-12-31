import CommonUtils from '@/utils/common-util'
import { useRoutingSlip } from '../useRoutingSlip'
import { debounce } from 'es-toolkit'
import { cloneDeep } from 'lodash'
import { computed, nextTick, reactive, toRef, toRefs, watch } from 'vue'

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
  emit: UseAddManualTransactionDetailsEmit
) {
  const { t } = useI18n()
  const { getFeeByCorpTypeAndFilingType } = useRoutingSlip()

  const state = reactive({
    manualTransaction: toRef(props, 'manualTransaction'),
    index: toRef(props, 'index'),
    manualTransactionDetails: {} as ManualTransactionDetails,
    errors: {
      filingType: '',
      quantity: '',
      referenceNumber: ''
    },
    totalFormatted: computed<string>(() => {
      const amount: string = CommonUtils.formatAmount(state.manualTransactionDetails.total)
      return amount
    })
  })

  const errorMessage = computed<string | undefined>(() => {
    const details = state.manualTransactionDetails
    const availableAmount: number = details.availableAmountForManualTransaction
    const hasError: boolean = !!details.quantity && (
      availableAmount < details.total || availableAmount < 0
    )
    return hasError ? t('text.amountExceedsBalance') : undefined
  })

  async function calculateTotal() {
    try {
      const filingType = state.manualTransactionDetails.filingType
      if (!filingType?.corpTypeCode || !filingType?.filingTypeCode || !state.manualTransactionDetails.quantity) {
        state.manualTransactionDetails.total = 0
        return
      }
      const getFeeRequestParams: GetFeeRequestParams = {
        corpTypeCode: filingType.corpTypeCode.code!,
        filingTypeCode: filingType.filingTypeCode.code!,
        requestParams: {
          quantity: state.manualTransactionDetails.quantity,
          priority: Boolean(state.manualTransactionDetails.priority),
          futureEffective: Boolean(state.manualTransactionDetails.futureEffective)
        }
      }
      const result = await getFeeByCorpTypeAndFilingType(getFeeRequestParams)
      state.manualTransactionDetails.total = result ?? 0
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      state.manualTransactionDetails.total = 0
      console.error('error', error?.response?.data)
    } finally {
      emitManualTransactionDetails()
    }
  }

  const delayedCalculateTotal = debounce(calculateTotal, 100)

  function removeManualTransactionRowEventHandler() {
    if (state.index !== undefined) {
      emit('removeManualTransactionRow', state.index as number)
    }
  }

  function emitManualTransactionDetails() {
    if (state.index !== undefined) {
      emit('updateManualTransaction', { transaction: state.manualTransactionDetails, index: state.index as number })
    }
  }

  const referenceNumberRules = [
    (v: string) => ((v || '').length <= 20) || 'Incorporation/Reference Number should not be more than 20 characters'
  ]

  const quantityRules = [
    (v: number) => !!v || 'This field is required',
    (v: number) => (v > 0) || 'Quantity should be greater than 0'
  ]

  function validateQuantity(quantity: number): string {
    for (const rule of quantityRules) {
      const result = rule(quantity)
      if (result !== true) {
        return result
      }
    }
    return ''
  }

  function validateReferenceNumber(referenceNumber: string): string {
    if (!referenceNumber) {
      return ''
    }
    for (const rule of referenceNumberRules) {
      const result = rule(referenceNumber)
      if (result !== true) {
        return result
      }
    }
    return ''
  }

  function handleQuantityChange(value: string) {
    const numValue = Number(value)
    state.manualTransactionDetails.quantity = numValue
    state.errors.quantity = validateQuantity(numValue)
    delayedCalculateTotal()
  }

  function handleReferenceNumberChange(value: string) {
    const trimmedValue = value?.trim()
    state.manualTransactionDetails.referenceNumber = trimmedValue
    state.errors.referenceNumber = validateReferenceNumber(trimmedValue)
    emitManualTransactionDetails()
  }

  watch(() => props.manualTransaction, (newValue) => {
    if (newValue) {
      Object.assign(state.manualTransactionDetails, newValue)
    }
  }, { deep: true, immediate: false })

  nextTick(() => {
    if (state.manualTransaction) {
      Object.assign(state.manualTransactionDetails, cloneDeep(state.manualTransaction))
    }
  })

  function validate() {
    state.errors.filingType = ''
    state.errors.quantity = ''
    state.errors.referenceNumber = ''
    let isValid = true

    if (!state.manualTransactionDetails.filingType) {
      state.errors.filingType = 'This field is required'
      isValid = false
    }

    const quantityError = validateQuantity(state.manualTransactionDetails.quantity ?? 0)
    if (quantityError) {
      state.errors.quantity = quantityError
      isValid = false
    }

    const referenceNumberError = validateReferenceNumber(state.manualTransactionDetails.referenceNumber ?? '')
    if (referenceNumberError) {
      state.errors.referenceNumber = referenceNumberError
      isValid = false
    }

    return isValid
  }

  return {
    ...toRefs(state),
    errorMessage,
    removeManualTransactionRowEventHandler,
    delayedCalculateTotal,
    calculateTotal,
    emitManualTransactionDetails,
    referenceNumberRules,
    quantityRules,
    validate,
    handleQuantityChange,
    handleReferenceNumberChange
  }
}
