import { useLoader } from '@/composables/common/useLoader'
import { useRoutingSlip } from '@/composables/useRoutingSlip'

export default function useRoutingSlipTransaction() {
  const {
    getRoutingSlip,
    isRoutingSlipAChild,
    isRoutingSlipVoid,
    routingSlip,
    saveManualTransactions
  } = useRoutingSlip()

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

  async function addManualTransactions() {
    let error = false
    const isExcessAmount: boolean = availableAmountForManualTransaction() < 0
    if (isExcessAmount) {
      error = true
      status.value = 'cantAddTransactions'
      return
    }
    if (isValid()) {
      toggleLoading(true)
      for (const transactions of manualTransactionsList.value) {
        try {
          await saveManualTransactions(transactions)
        } catch (err) {
          // TODO error handling
          error = true
          // eslint-disable-next-line no-console
          console.log('error', err)
          // breaking loop if any transaction failed
          // TODO if transaction failed, need to reset filed or not?
          break
        }
      }

      if (routingSlip.value?.number) {
        const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload
          = { routingSlipNumber: routingSlip.value?.number }
        await getRoutingSlip(getRoutingSlipRequestPayload)
      }
      toggleLoading(false)

      if (!error) {
        resetManualTransaction()
      }
    }
    error = false
  }

  function availableAmountForManualTransaction() {
    // iterate all manualTransactionsList and find sum
    // reduce it from the remainingAmount amount and return
    const sum = manualTransactionsList.value.reduce((sum, current) => sum + current?.total, 0)
    return routingSlip.value.remainingAmount - sum
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
      // we would need this column with unique value to be used for iterator.
      // we cannot use index as it would be inconsistent with push/pop
      key: Math.random(),
      futureEffective: false,
      priority: false,
      total: null,
      referenceNumber: null,
      filingType: null,
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

  function isValid(): boolean {
    if (!formRoutingSlipManualTransactions.value) {
      return false
    }
    return formRoutingSlipManualTransactions.value.checkValidity()
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
    // assigning individual properties rather than spread or splice as computed/watch not recognizing it
    manualTransactionsList.value[payload.index].filingType = JSON.parse(JSON.stringify(payload.transaction.filingType))
    manualTransactionsList.value[payload.index].futureEffective = payload.transaction.futureEffective
    manualTransactionsList.value[payload.index].priority = payload.transaction.priority
    manualTransactionsList.value[payload.index].quantity = payload.transaction.quantity
    manualTransactionsList.value[payload.index].referenceNumber = payload.transaction.referenceNumber
    manualTransactionsList.value[payload.index].total = payload.transaction.total
    updateAvailableAmountForManualTransaction()
    status.value = ''
  }

  function updateAvailableAmountForManualTransaction(): void {
    // We dont need the first item as it would have the entire remainingAmount of the routingslip
    for (let i = 1; i <= manualTransactionsList.value.length - 1; i++) {
      // if previous record has no total, then the available amount is carried over to the next record
      if (manualTransactionsList.value[i - 1].total > 0) {
        manualTransactionsList.value[i].availableAmountForManualTransaction
          = routingSlip.value.remainingAmount - manualTransactionsList.value[i - 1].total
      } else {
        manualTransactionsList.value[i].availableAmountForManualTransaction
          = manualTransactionsList.value[i - 1].availableAmountForManualTransaction
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
    isValid,
    removeManualTransactionRow,
    updateManualTransactionDetails,
    hideManualTransaction,
    status,
    routingSlip
  }
}
