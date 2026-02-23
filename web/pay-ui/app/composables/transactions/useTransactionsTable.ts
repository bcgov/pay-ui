import type { TableColumn } from '@nuxt/ui'
import CommonUtils from '@/utils/common-util'
import type { TransactionFilterParams, Transaction, TransactionState } from '@/interfaces/transactions'
import debounce from 'lodash/throttle'

type ExtendedTableColumn = TableColumn<Record<string, unknown>> & {
  display?: boolean
  hideInSearchColumnFilter?: boolean
  accessorKey?: string
}

export async function useTransactionsTable() {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi
  const { t } = useI18n()
  const { store } = useTransactionsStore()
  const currentUser = CommonUtils.getUserInfo()
  const viewAll = ref(false)
  const transactions = (reactive({
    filters: {
      isActive: false,
      filterPayload: {
        dateFilter: {
          startDate: '',
          endDate: '',
          isDefault: false
        }
      },
      pageLimit: 20,
      pageNumber: 1
    } as TransactionFilterParams,
    loading: false,
    results: [] as Transaction[],
    totalResults: 0
  }) as unknown) as TransactionState

  const loadState = reactive({
    reachedEnd: false,
    isLoading: false,
    isInitialLoad: true
  })

  let requestCounter = 0

  const setViewAll = (val: boolean) => {
    if (val) {
      // check authorized
      if (!currentUser.roles.includes(Role.ViewAllTransactions)
        && !currentUser.roles.includes(Role.ProductRefundViewer)) {
        console.error('User is not authorized to view all transactions.')
        return
      }
    }
    viewAll.value = val
  }

  const loadTransactionList = debounce(async (filterField?: keyof TransactionFilter, value?: unknown) => {
    requestCounter++
    const currentRequestNumber = requestCounter
    const payload = transactions.filters.filterPayload as unknown as Record<string, unknown>
    const isPageOne = filterField || (transactions.filters.pageNumber ?? 1) <= 1
    transactions.loading = true
    loadState.isLoading = true
    if (filterField) {
      // new filter so set page number back to 1
      transactions.filters.pageNumber = 1
      loadState.reachedEnd = false
      payload[filterField] = value
    }
    let filtersActive = false
    for (const key in transactions.filters.filterPayload) {
      if (key === 'dateFilter') {
        if (transactions.filters.filterPayload[key].endDate) { filtersActive = true }
      } else if (payload[key]) { filtersActive = true }
      if (filtersActive) { break }
    }
    transactions.filters.isActive = filtersActive

    try {
      const response = await getTransactions(
        undefined, transactions.filters, viewAll.value)
      // Only process response if this is still the latest request
      if (currentRequestNumber === requestCounter) {
        if (response) {
          const items = response.items || []
          // Append results for pagination, replace for filter changes / initial load
          transactions.results = isPageOne ? items : [...transactions.results, ...items]
          loadState.reachedEnd = !response.hasMore
          loadState.isInitialLoad = false
        } else {
          console.error('No response from getTransactions')
          loadState.reachedEnd = true
        }
      }
    } catch (error) {
      if (currentRequestNumber === requestCounter) {
        console.error('Failed to get transaction list.', error)
        loadState.reachedEnd = true
      }
    }
    transactions.loading = false
    loadState.isLoading = false
  }, 2000, { leading: true, trailing: true }) as (filterField?: string, value?: unknown) => Promise<void>

  async function getTransactions(
    accountId: number | undefined,
    filterParams: TransactionFilterParams,
    viewAll = false
  ): Promise<TransactionListResponse> {
    const query: Record<string, string> = {}
    if (filterParams.pageNumber) {
      query.page = filterParams.pageNumber.toString()
    }
    if (filterParams.pageLimit) {
      query.limit = filterParams.pageLimit.toString()
    }
    if (viewAll) {
      query.viewAll = `${viewAll}`
    }

    return $payApi<TransactionListResponse>(
      `/accounts/${accountId}/payments/queries`,
      {
        method: 'POST',
        body: { ...filterParams.filterPayload, excludeCounts: true },
        query
      }
    )
  }

  const searchTransactionsTableHeaders = ref(
    (store.searchTransactionsTableHeaders?.length
      ? store.searchTransactionsTableHeaders
      : getTransactionsTableHeaders(t))
      .map((header) => {
        const extHeader = header as ExtendedTableColumn
        const savedVisibility = store.searchColumnVisibility[extHeader.accessorKey as string]
        return {
          ...header,
          display: savedVisibility !== undefined ? savedVisibility : (extHeader.display ?? true)
        }
      }) as ExtendedTableColumn[]
  )

  const columnPinning = ref({
    right: ['actions']
  })

  const columnVisibility = computed<Record<string, boolean>>({
    get() {
      const visibility: Record<string, boolean> = {}
      ;(searchTransactionsTableHeaders.value as ExtendedTableColumn[]).forEach((item) => {
        if (item.accessorKey) {
          visibility[item.accessorKey] = item.display ?? true
        }
      })
      return visibility
    },
    set(newVisibility: Record<string, boolean>) {
      ;(searchTransactionsTableHeaders.value as ExtendedTableColumn[]).forEach((item) => {
        if (item.accessorKey && newVisibility[item.accessorKey] !== undefined) {
          item.display = newVisibility[item.accessorKey]
        }
      })
      Object.assign(store.searchColumnVisibility, newVisibility)
    }
  })

  async function getNext() {
    if (loadState.isLoading || loadState.reachedEnd) { return }
    transactions.filters.pageNumber = (transactions.filters.pageNumber ?? 1) + 1
    await loadTransactionList()
  }

  function clearAllFilters() {
    transactions.filters.filterPayload = {
      dateFilter: { startDate: '', endDate: '', isDefault: false }
    } as TransactionFilterParams['filterPayload']
    transactions.filters.isActive = false
    transactions.filters.pageNumber = 1
    loadState.reachedEnd = false
    loadState.isInitialLoad = true
  }

  return {
    searchTransactionsTableHeaders,
    columnPinning,
    columnVisibility,
    setViewAll,
    loadTransactionList,
    clearAllFilters,
    getNext,
    loadState,
    transactions
  }
}

export function getTransactionsTableHeaders(t: (key: string) => string) {
  return [
    {
      header: t('page.transactions.search.label.accountName'),
      align: 'start' as const,
      accessorKey: 'accountName',
      display: true,
      meta: {
        class: {
          th: 'header-account-name'
        }
      }
    },
    {
      header: t('page.transactions.search.label.applicationType'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'product',
      display: false,
      meta: {
        class: {
          th: 'header-application-type'
        }
      }
    },
    {
      header: t('page.transactions.search.label.transactionType'),
      align: 'start' as const,
      accessorKey: 'lineItems',
      sortable: false,
      display: true,
      meta: {
        class: {
          th: 'header-transaction-type'
        }
      }
    },
    {
      header: t('page.transactions.search.label.transactionDetails'),
      align: 'start' as const,
      accessorKey: 'details',
      sortable: false,
      display: false,
      meta: {
        class: {
          th: 'header-transaction-details'
        }
      }
    },
    {
      header: t('page.transactions.search.label.businessIdentifier'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'businessIdentifier',
      display: false,
      meta: {
        class: {
          th: 'header-business-identifier'
        }
      }
    },
    {
      header: t('page.transactions.search.label.folioNumber'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'folioNumber',
      display: false,
      meta: {
        class: {
          th: 'header-folio-number'
        }
      }
    },
    {
      header: t('page.transactions.search.label.createdName'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'createdName',
      display: false,
      meta: {
        class: {
          th: 'header-created-name'
        }
      }
    },
    {
      header: t('page.transactions.search.label.createdOn'),
      align: 'start' as const,
      accessorKey: 'createdOn',
      sortable: false,
      display: true,
      meta: {
        class: {
          th: 'header-created-on'
        }
      }
    },
    {
      header: t('page.transactions.search.label.total'),
      align: 'start' as const,
      accessorKey: 'total',
      sortable: false,
      display: true,
      meta: {
        class: {
          th: 'header-total'
        }
      }
    },
    {
      header: t('page.transactions.search.label.transactionId'),
      align: 'right' as const,
      accessorKey: 'id',
      sortable: false,
      display: false,
      meta: {
        class: {
          th: 'header-transaction-id'
        }
      }
    },
    {
      header: t('page.transactions.search.label.invoiceNumber'),
      align: 'start' as const,
      accessorKey: 'invoiceNumber',
      sortable: false,
      display: false,
      hideInSearchColumnFilter: false,
      meta: {
        class: {
          th: 'header-invoice-number'
        }
      }
    },
    {
      header: t('page.transactions.search.label.paymentMethod'),
      align: 'start' as const,
      accessorKey: 'paymentMethod',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: false,
      meta: {
        class: {
          th: 'header-payment-method'
        }
      }
    },
    {
      header: t('page.transactions.search.label.paymentStatus'),
      align: 'start' as const,
      accessorKey: 'statusCode',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: false,
      meta: {
        class: {
          th: 'header-payment-status'
        }
      }
    },
    {
      header: t('page.transactions.search.label.downloads'),
      align: 'start' as const,
      accessorKey: 'downloads',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: false,
      meta: {
        class: {
          th: 'header-downloads'
        }
      }
    },
    {
      header: t('page.transactions.search.label.actions'),
      align: 'start' as const,
      accessorKey: 'actions',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: true,
      meta: {
        class: {
          th: 'header-action'
        }
      }
    }
  ]
}
