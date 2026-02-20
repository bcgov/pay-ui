import type { getTransactionsTableHeaders } from '~/composables/transactions/useTransactionsTable'
import type { TransactionFilter } from '~/interfaces/transactions'

export interface TransactionTableSettings {
  filterPayload: Partial<TransactionFilter>
  pageNumber: number
}

export const useTransactionsStore = defineStore('transactions-store', () => {
  const tabIndex = ref(0)
  const store = reactive({
    searchTransactionsTableHeaders: [] as ReturnType<typeof getTransactionsTableHeaders>,
    searchColumnVisibility: {} as Record<string, boolean>
  })

  const transactionFilter = ref<Partial<TransactionFilter> | null>(null)
  const tableSettings = ref<TransactionTableSettings | null>(null)

  function setTabIndex(index: number) {
    tabIndex.value = index
  }

  function setFilter(filter: Partial<TransactionFilter> | null) {
    transactionFilter.value = filter
  }

  function clearFilter() {
    transactionFilter.value = null
  }

  function setTableSettings(settings: TransactionTableSettings | null) {
    tableSettings.value = settings
  }

  function clearTableSettings() {
    tableSettings.value = null
  }

  return {
    store,
    tabIndex,
    transactionFilter,
    tableSettings,
    setTabIndex,
    setFilter,
    clearFilter,
    setTableSettings,
    clearTableSettings
  }
})
