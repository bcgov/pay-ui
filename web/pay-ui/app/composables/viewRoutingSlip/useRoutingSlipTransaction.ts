import { useLoader } from '@/composables/common/useLoader'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { cloneDeep } from 'lodash'

export default function useRoutingSlipTransaction() {
  const { t } = useI18n()
  const {
    getRoutingSlip,
    isRoutingSlipAChild,
    isRoutingSlipVoid,
    saveManualTransactions
  } = useRoutingSlip()
  const { store } = useRoutingSlipStore()

  const showAddManualTransaction = ref<boolean>(false)
  const formRoutingSlipManualTransactions = ref<HTMLFormElement>()
  const manualTransactionsList = ref<ManualTransactionDetails[]>([])

  const { isLoading, toggleLoading } = useLoader()

  const status = ref<string>('')

  function showManualTransaction(): void {
    // Show manual transaction component through toggling showAddManualTransaction
    // only show the component and not toggle it back to hide the component
    toggleShowAddManualTransaction(true)
    if (manualTransactionsList.value.length === 0) {
      addManualTransactionRow()
    }
  }

  async function addManualTransactions(validateFn?: () => boolean) {
    status.value = ''

    if (validateFn && !validateFn()) {
      return
    }

    let error = false
    const isExcessAmount: boolean = availableAmountForManualTransaction() < 0
    if (isExcessAmount) {
      error = true
      status.value = t('text.cantAddTransactions')
      return
    }

    toggleLoading(true)
    for (const transactions of manualTransactionsList.value) {
      try {
        await saveManualTransactions(transactions)
      } catch (err) {
        error = true
        console.error('error', err)
        break
      }
    }

    if (store.routingSlip.number) {
      const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload
        = { routingSlipNumber: store.routingSlip.number }
      await getRoutingSlip(getRoutingSlipRequestPayload)
    }
    toggleLoading(false)

    if (!error) {
      resetManualTransaction()
    }
  }

  function availableAmountForManualTransaction() {
    // iterate all manualTransactionsList and find sum
    // reduce it from the remainingAmount amount and return
    const sum = manualTransactionsList.value.reduce((sum, current) => sum + (current?.total || 0), 0)
    return (store.routingSlip?.remainingAmount || 0) - sum
  }

  function validateTotalAmount(): boolean {
    const availableAmount = availableAmountForManualTransaction()
    if (availableAmount < 0) {
      status.value = t('text.cantAddTransactions')
      return false
    }
    return true
  }

  function resetManualTransaction() {
    status.value = ''
    toggleShowAddManualTransaction(false)
    manualTransactionsList.value = []
  }

  // Divider not visible if array is 1 OR last array element
  function isLastChild(index: number): boolean {
    const length = manualTransactionsList.value.length - 1
    return index !== length
  }

  function getDefaultRow(): ManualTransactionDetails {
    // By default, the flags futureEffective, priority are false
    const amount = availableAmountForManualTransaction()
    return {
      // we cannot use index as it would be inconsistent with push/pop
      key: Math.random(),
      futureEffective: false,
      priority: false,
      availableAmountForManualTransaction: amount
    } as ManualTransactionDetails
  }

  function toggleShowAddManualTransaction(value: boolean): void {
    showAddManualTransaction.value = value
  }

  function addManualTransactionRow() {
    status.value = ''
    manualTransactionsList.value.push(getDefaultRow())
  }

  function removeManualTransactionRow(index: number) {
    status.value = ''
    manualTransactionsList.value.splice(index, 1)
  }

  /* Update the record to keep it up to date with the inptu changes happening in the child transaction
  Cannot use output-sync or v-model, since it is not allowed on iterable list;
  therefore using event listener, we update the properties of the parent list elements
  */
  function updateManualTransactionDetails(payload: { index: number, transaction: ManualTransactionDetails }) {
    const transaction = manualTransactionsList.value[payload.index]
    if (!transaction) {
      return
    }
    // assigning individual properties rather than spread or splice as computed/watch not recognizing it
    transaction.filingType = payload.transaction.filingType ? cloneDeep(payload.transaction.filingType) : undefined
    transaction.futureEffective = Boolean(payload.transaction.futureEffective)
    transaction.priority = Boolean(payload.transaction.priority)
    transaction.quantity = payload.transaction.quantity
    transaction.referenceNumber = payload.transaction.referenceNumber
    transaction.total = payload.transaction.total
    updateAvailableAmountForManualTransaction()
    status.value = ''
  }

  function updateAvailableAmountForManualTransaction(): void {
    // We dont need the first item as it would have the entire remainingAmount of the routingslip
    for (let i = 1; i <= manualTransactionsList.value.length - 1; i++) {
      const currentTransaction = manualTransactionsList.value[i]
      const previousTransaction = manualTransactionsList.value[i - 1]
      if (!currentTransaction || !previousTransaction) {
        continue
      }
      // if previous record has no total, then the available amount is carried over to the next record
      if (previousTransaction.total && previousTransaction.total > 0) {
        currentTransaction.availableAmountForManualTransaction
          = (store.routingSlip.remainingAmount || 0) - previousTransaction.total
      } else {
        currentTransaction.availableAmountForManualTransaction
          = previousTransaction.availableAmountForManualTransaction
      }
    }
  }

  function hideManualTransaction(): void {
    manualTransactionsList.value = []
    toggleShowAddManualTransaction(false)
  }

  return {
    formRoutingSlipManualTransactions,
    showAddManualTransaction,
    manualTransactionsList,
    isRoutingSlipAChild,
    isRoutingSlipVoid,
    isLoading,
    showManualTransaction,
    addManualTransactionRow,
    addManualTransactions,
    isLastChild,
    availableAmountForManualTransaction,
    validateTotalAmount,
    removeManualTransactionRow,
    updateManualTransactionDetails,
    hideManualTransaction,
    status
  }
}
