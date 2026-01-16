import type { Invoice } from '~/interfaces/invoice'
import type { SearchRoutingSlipParams, RoutingSlip } from '~/interfaces/routing-slip'
import type { TableColumn } from '@nuxt/ui'
import { debounce } from 'es-toolkit'
import { useStatusList } from '@/composables/common/useStatusList'
import {
  chequeRefundCodes,
  ChequeRefundStatus,
  PaymentMethods,
  getSearchRoutingSlipTableHeaders,
  UI_CONSTANTS
} from '@/utils/constants'
import { SlipStatus } from '~/enums/slip-status'
import CommonUtils from '@/utils/common-util'
import { usePayApi } from '@/composables/pay-api'
import { defaultFilters } from '@/stores/routing-slip-store'
import { useInfiniteScroll } from '@/composables/eft/useEftTable'

type ExtendedTableColumn = TableColumn<Record<string, unknown>> & {
  display?: boolean
  hideInSearchColumnFilter?: boolean
  accessorKey?: string
}

export async function useSearch() {
  const { t } = useI18n()
  const { store } = useRoutingSlipStore()
  const searchRoutingSlipParams = store.searchRoutingSlipParams
  const searchRoutingSlipResult = store.searchRoutingSlipResult
  const defaultParams: SearchRoutingSlipParams = {
    page: 1,
    limit: UI_CONSTANTS.DEFAULT_PAGE_LIMIT
  }
  const { statusLabel } = await useStatusList(reactive({ value: '' }), { emit: () => {} })

  const searchParamsExist = computed<boolean>(() => {
    const params = searchRoutingSlipParams as Record<string, unknown>
    return !Object.values(params).some(value => value && value !== '')
  })

  const resetSearchParams = (): void => {
    Object.assign(searchRoutingSlipParams, defaultParams)
    Object.assign(store.searchFilters, { ...defaultFilters })
    searchRoutingSlipResult.length = 0
  }

  const searchRoutingSlip = async (appendToResults = false): Promise<number> => {
    const params: SearchRoutingSlipParams = { ...searchRoutingSlipParams }

    if (!params.dateFilter?.startDate || !params.dateFilter?.endDate) {
      delete params.dateFilter
    }

    const cleanedParams = CommonUtils.cleanObject(params as Record<string, unknown>) as SearchRoutingSlipParams

    try {
      const response = await usePayApi().postSearchRoutingSlip(cleanedParams)
      if (response?.items) {
        if (appendToResults) {
          searchRoutingSlipResult.push(...response.items)
        } else {
          searchRoutingSlipResult.length = 0
          searchRoutingSlipResult.push(...response.items)
        }
        return response.items.length
      }
      return 0
    } catch (error) {
      console.error('error ', error)
      return 0
    }
  }

  const { loadState, getNext, reset: resetScroll } = useInfiniteScroll<RoutingSlip>({
    fetchPage: async (page, appendResults) => {
      searchRoutingSlipParams.page = page
      const itemsReturned = await searchRoutingSlip(appendResults)
      const limit = searchRoutingSlipParams.limit || UI_CONSTANTS.DEFAULT_PAGE_LIMIT
      const hasMore = itemsReturned > 0 && itemsReturned >= limit
      return { items: [], hasMore }
    }
  })

  const showExpandedFolio = ref<string[]>([])
  const showExpandedCheque = ref<string[]>([])
  const searchParamsChanged = ref(false)

  const columnPinning = ref({
    right: ['actions']
  })

  const filters = store.searchFilters

  const searchRoutingSlipTableHeaders = ref(
    (store.searchRoutingSlipTableHeaders?.length
      ? store.searchRoutingSlipTableHeaders
      : getSearchRoutingSlipTableHeaders(t))
      .map((header) => {
        const extHeader = header as ExtendedTableColumn
        const savedVisibility = store.searchColumnVisibility[extHeader.accessorKey as string]
        return {
          ...header,
          display: savedVisibility !== undefined ? savedVisibility : (extHeader.display ?? true)
        }
      }) as ExtendedTableColumn[]
  )

  function updateSearchFilter(updates: Record<string, string | number | boolean | object | null>) {
    Object.assign(searchRoutingSlipParams, {
      ...searchRoutingSlipParams,
      ...defaultParams,
      ...updates
    })
    searchParamsChanged.value = true
    resetScroll()
  }

  async function searchNow() {
    loadState.isLoading = true
    const itemsReturned = await searchRoutingSlip()
    loadState.reachedEnd = itemsReturned === 0
    searchParamsChanged.value = false
    loadState.isLoading = false
  }

  const search = async () => {
    await nextTick()
    searchNow()
  }

  const debouncedSearch = debounce(() => {
    searchNow()
  }, UI_CONSTANTS.SEARCH_DEBOUNCE_DELAY_MS)

  function getStatusLabel(code: string) {
    return statusLabel(code)
  }

  async function clearFilter() {
    loadState.isLoading = true
    resetSearchParams()
    const itemsReturned = await searchRoutingSlip()
    loadState.reachedEnd = itemsReturned === 0
    searchParamsChanged.value = false
    loadState.isLoading = false
  }

  function toggleArrayItem(array: Ref<string[]>, id: string) {
    const index = array.value.indexOf(id)
    if (index > -1) {
      array.value.splice(index, 1)
    } else {
      array.value.push(id)
    }
  }

  const toggleFolio = (id: string) => toggleArrayItem(showExpandedFolio, id)
  const toggleCheque = (id: string) => toggleArrayItem(showExpandedCheque, id)

  function formatFolioResult(invoices: Invoice[], businessIdentifier: string | null) {
    if (
      !searchParamsChanged.value
      && businessIdentifier
      && businessIdentifier !== ''
    ) {
      return [businessIdentifier]
    }

    const folios = invoices
      .map(invoice => invoice.businessIdentifier)
      .filter(Boolean) as string[]

    return folios.length ? folios : ['-']
  }

  function getRefundStatusText(statusCode: string | null): string | null {
    const refundStatus = ChequeRefundStatus
      .find(item => item.code === statusCode)?.text || chequeRefundCodes.PROCESSING || null
    return refundStatus
  }

  const routingSlips = computed(() => {
    if (!searchRoutingSlipResult) {
      return []
    }
    return searchRoutingSlipResult.map((item: RoutingSlip) => {
      return {
        routingSlipNumber: item.number ?? '-',
        receiptNumber: item.paymentAccount
          && item.paymentAccount.paymentMethod === PaymentMethods.CASH
          ? (item.payments?.[0]?.chequeReceiptNumber ?? '-')
          : '-',
        accountName: item.paymentAccount?.accountName ?? '-',
        createdName: item.createdName ?? '-',
        date: CommonUtils.formatDisplayDate(item.routingSlipDate || '', 'MMMM dd, yyyy'),
        status: item.status || '',
        refundStatus: item.refundStatus ? getRefundStatusText(item.refundStatus) : '-',
        businessIdentifier: formatFolioResult(item.invoices || [], filters.businessIdentifier),
        chequeReceiptNumber: item.paymentAccount && item.paymentAccount.paymentMethod === PaymentMethods.CHEQUE
          ? (item.payments?.map((p: { chequeReceiptNumber?: string }) => p.chequeReceiptNumber) || ['-'])
          : ['-'],
        remainingAmount: item.remainingAmount
          ? CommonUtils.appendCurrencySymbol(item.remainingAmount.toFixed(2))
          : '-'
      }
    })
  })

  const columnVisibility = computed<Record<string, boolean>>({
    get() {
      const visibility: Record<string, boolean> = {}
      ;(searchRoutingSlipTableHeaders.value as ExtendedTableColumn[]).forEach((item) => {
        if (item.accessorKey) {
          visibility[item.accessorKey] = item.display ?? true
        }
      })
      return visibility
    },
    set(newVisibility: Record<string, boolean>) {
      ;(searchRoutingSlipTableHeaders.value as ExtendedTableColumn[]).forEach((item) => {
        if (item.accessorKey && newVisibility[item.accessorKey] !== undefined) {
          item.display = newVisibility[item.accessorKey]
        }
      })
      Object.assign(store.searchColumnVisibility, newVisibility)
    }
  })

  const hasActiveFilters = computed(() => {
    return !!filters.routingSlipNumber
      || !!filters.receiptNumber
      || !!filters.accountName
      || !!filters.createdName
      || !!filters.status
      || !!filters.refundStatus
      || !!filters.businessIdentifier
      || !!filters.chequeReceiptNumber
      || !!filters.remainingAmount
      || (!!filters.dateFilter?.startDate && !!filters.dateFilter?.endDate)
  })

  const resetSearchFilters = async () => {
    Object.assign(filters, { ...defaultFilters })
    resetSearchParams()
    search()
  }

  watch(() => filters.routingSlipNumber, val => updateSearchFilter({ routingSlipNumber: val }))
  watch(() => filters.receiptNumber, val => updateSearchFilter({ receiptNumber: val }))
  watch(() => filters.accountName, val => updateSearchFilter({ accountName: val }))
  watch(() => filters.createdName, val => updateSearchFilter({ initiator: val }))
  watch(() => filters.dateFilter, val => updateSearchFilter({ dateFilter: val }), { deep: true })
  watch(() => filters.status, (val) => {
    updateSearchFilter({ status: val })
    search()
  })
  watch(() => filters.refundStatus, (val) => {
    updateSearchFilter({ refundStatus: val })
    search()
  })
  watch(() => filters.businessIdentifier, val => updateSearchFilter({ businessIdentifier: val }))
  watch(() => filters.chequeReceiptNumber, val => updateSearchFilter({ chequeReceiptNumber: val }))
  watch(() => filters.remainingAmount, val => updateSearchFilter({ remainingAmount: val }))

  watch(searchRoutingSlipTableHeaders, (headers) => {
    const visibility: Record<string, boolean> = {}
    ;(headers as ExtendedTableColumn[]).forEach((item) => {
      if (item.accessorKey) {
        visibility[item.accessorKey] = item.display ?? true
      }
    })
    Object.assign(store.searchColumnVisibility, visibility)
  }, { deep: true })

  function getStatusFromRefundStatus(statusCode: string): SlipStatus {
    if (statusCode === chequeRefundCodes.PROCESSING) {
      return SlipStatus.REFUNDREQUEST
    } else {
      return SlipStatus.REFUNDPROCESSED
    }
  }

  return {
    searchRoutingSlipTableHeaders,
    searchNow,
    debouncedSearch,
    searchRoutingSlipResult,
    getStatusLabel,
    searchParamsExist,
    formatFolioResult,
    showExpandedFolio,
    showExpandedCheque,
    toggleFolio,
    toggleCheque,
    isLoading: computed(() => loadState.isLoading),
    getNext,
    getRefundStatusText,
    getStatusFromRefundStatus,
    updateSearchFilter,
    clearFilter,
    filters,
    routingSlips,
    columnPinning,
    isInitialLoad: computed(() => loadState.isInitialLoad),
    columnVisibility,
    resetSearchFilters,
    hasActiveFilters,
    search,
    resetSearchParams,
    reachedEnd: computed(() => loadState.reachedEnd)
  }
}
