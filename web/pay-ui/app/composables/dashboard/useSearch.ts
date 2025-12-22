import type { Invoice } from '~/interfaces/invoice'
import type { SearchRoutingSlipParams, RoutingSlip } from '~/interfaces/routing-slip'
import { debounce } from 'es-toolkit'
import { useLoader } from '@/composables/common/useLoader'
import { useStatusList } from '@/composables/common/useStatusList'
import { chequeRefundCodes, ChequeRefundStatus, PaymentMethods, SearchRoutingSlipTableHeaders } from '@/utils/constants'
import { SlipStatus } from '~/enums/slip-status'
import CommonUtils from '@/utils/common-util'
import { usePayApi } from '@/composables/pay-api'

export interface SearchFilterState {
  routingSlipNumber: string | null
  receiptNumber: string | null
  accountName: string | null
  createdName: string | null
  dateFilter: { startDate: string | null, endDate: string | null }
  status: string | null
  refundStatus: string | null
  businessIdentifier: string | null
  chequeReceiptNumber: string | null
  remainingAmount: string | null
}

export async function useSearch() {
  const { store } = useRoutingSlipStore()
  const searchRoutingSlipParams = store.searchRoutingSlipParams
  const searchRoutingSlipResult = store.searchRoutingSlipResult
  const defaultParams: SearchRoutingSlipParams = {
    page: 1,
    limit: 50,
    total: Infinity
  }
  const { statusLabel } = await useStatusList(reactive({ value: '' }), { emit: () => {} })
  const { isLoading, toggleLoading } = useLoader()

  const searchParamsExist = computed<boolean>(() => {
    const params = searchRoutingSlipParams as Record<string, unknown>
    for (const key in params) {
      if (params[key] && params[key] !== '') {
        return false
      }
    }
    return true
  })

  const resetSearchParams = (): void => {
    Object.assign(searchRoutingSlipParams, defaultParams)
    searchRoutingSlipResult.length = 0
  }

  const searchRoutingSlip = async (appendToResults = false) => {
    const params: SearchRoutingSlipParams = { ...searchRoutingSlipParams }

    // filtering and removing all non set values
    if (!params.dateFilter?.startDate || !params.dateFilter?.endDate) {
      delete params.dateFilter
    }
    const cleanedParams = CommonUtils.cleanObject(
      params as Record<string, unknown>
    ) as SearchRoutingSlipParams

    try {
      // Let Global Error Handler handle this one.
      const response = await usePayApi().getSearchRoutingSlip(cleanedParams)
      if (response && response.items) {
        Object.assign(searchRoutingSlipParams, {
          ...searchRoutingSlipParams,
          total: response.total || 0
        })
        if (appendToResults) {
          searchRoutingSlipResult.push(...(response.items || []))
        } else {
          searchRoutingSlipResult.length = 0
          searchRoutingSlipResult.push(...(response.items || []))
        }
      }
    } catch (error) {
      console.error('error ', error)
    }
  }

  async function infiniteScrollCallback(isInitialLoad: boolean): Promise<boolean> {
    const params = { ...searchRoutingSlipParams }
    if (params.total !== Infinity && params?.total && params?.limit && params?.total < params?.limit) {
      return true
    }
    Object.assign(searchRoutingSlipParams, {
      ...searchRoutingSlipParams,
      page: searchRoutingSlipParams.page && !isInitialLoad
        ? searchRoutingSlipParams.page + 1
        : 1
    })
    await searchRoutingSlip(true)
    return false
  }

  const showExpandedFolio = ref<string[]>([])
  const showExpandedCheque = ref<string[]>([])
  // to make sure not updating result on keyup
  const searchParamsChanged = ref(false)
  const reachedEnd = ref(false)

  const columnPinning = ref({
    right: ['actions']
  })

  const isInitialLoad = ref(true)

  const filterInitialState: SearchFilterState = {
    routingSlipNumber: null,
    receiptNumber: null,
    accountName: null,
    createdName: null,
    dateFilter: { startDate: null, endDate: null },
    status: null,
    refundStatus: null,
    businessIdentifier: null,
    chequeReceiptNumber: null,
    remainingAmount: null
  }

  const filters = reactive<SearchFilterState>({
    routingSlipNumber: null,
    receiptNumber: null,
    accountName: null,
    createdName: null,
    dateFilter: { startDate: null, endDate: null },
    status: null,
    refundStatus: null,
    businessIdentifier: null,
    chequeReceiptNumber: null,
    remainingAmount: null
  })

  const searchRoutingSlipTableHeaders = ref(SearchRoutingSlipTableHeaders)

  function updateSearchFilter(updates: Record<string, string | number | boolean | object | null>) {
    Object.assign(searchRoutingSlipParams, {
      ...searchRoutingSlipParams,
      ...defaultParams,
      ...updates
    })
    searchParamsChanged.value = true
    reachedEnd.value = false
  }

  async function searchNow() {
    toggleLoading(true)
    await searchRoutingSlip()
    searchParamsChanged.value = false
    toggleLoading(false)
  }

  const search = async () => {
    await nextTick()
    searchNow()
  }

  const debouncedSearch = debounce(() => {
    searchNow()
  }, 500)

  function getStatusLabel(code: string) {
    return statusLabel(code)
  }

  async function clearFilter() {
    toggleLoading(true)
    resetSearchParams()
    await searchRoutingSlip()
    searchParamsChanged.value = false
    toggleLoading(false)
  }

  function toggleFolio(id: string) {
    // to show and hide multiple folio on click
    // remove from array if already existing else add to array
    if (showExpandedFolio.value.includes(id)) {
      showExpandedFolio.value = showExpandedFolio.value.filter(function (item) {
        return item !== id
      })
    } else {
      showExpandedFolio.value.push(id)
    }
  }

  function toggleCheque(id: string) {
    // to show and hide multiple folio on click
    // remove from array if already existing else add to array
    if (showExpandedCheque.value.includes(id)) {
      showExpandedCheque.value = showExpandedCheque.value.filter(function (item) {
        return item !== id
      })
    } else {
      showExpandedCheque.value.push(id)
    }
  }

  function formatFolioResult(invoices: Invoice[], businessIdentifier: string | null) {
    // to make sure not updating on keyup
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

  const getNext = async (isInitialLoadParam = false) => {
    if (isLoading.value) {
      return
    }
    reachedEnd.value = await infiniteScrollCallback(isInitialLoadParam)
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

  const columnVisibility = computed<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {}
    searchRoutingSlipTableHeaders.value.forEach((item: { accessorKey: string, display: boolean }) => {
      visibility[item.accessorKey] = item.display
    })
    return visibility
  })

  const hasActiveFilters = computed(() => {
    return filters.routingSlipNumber !== null ||
      filters.receiptNumber !== null ||
      filters.accountName !== null ||
      filters.createdName !== null ||
      filters.status !== null ||
      filters.refundStatus !== null ||
      filters.businessIdentifier !== null ||
      filters.chequeReceiptNumber !== null ||
      filters.remainingAmount !== null ||
      (filters.dateFilter?.startDate !== null && filters.dateFilter?.endDate !== null)
  })

  const resetSearchFilters = async () => {
    Object.assign(filters, filterInitialState)
    search()
  }

  // Watch filters and update search params
  watch(() => filters.routingSlipNumber, newVal => updateSearchFilter({ routingSlipNumber: newVal }))
  watch(() => filters.receiptNumber, newVal => updateSearchFilter({ receiptNumber: newVal }))
  watch(() => filters.accountName, newVal => updateSearchFilter({ accountName: newVal }))
  watch(() => filters.createdName, newVal => updateSearchFilter({ initiator: newVal }))
  watch(
    () => filters.dateFilter,
    (newVal) => {
      updateSearchFilter({ dateFilter: newVal })
    },
    { deep: true }
  )
  watch(() => filters.status, newVal => {
    updateSearchFilter({ status: newVal })
    search()
  })
  watch(() => filters.refundStatus, newVal => {
    updateSearchFilter({ refundStatus: newVal })
    search()
  })
  watch(() => filters.businessIdentifier, newVal => updateSearchFilter({ businessIdentifier: newVal }))
  watch(() => filters.chequeReceiptNumber, newVal => updateSearchFilter({ chequeReceiptNumber: newVal }))
  watch(() => filters.remainingAmount, newVal => updateSearchFilter({ remainingAmount: newVal }))

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
    isLoading,
    getNext,
    getRefundStatusText,
    getStatusFromRefundStatus,
    updateSearchFilter,
    clearFilter,
    filters,
    routingSlips,
    columnPinning,
    isInitialLoad,
    columnVisibility,
    resetSearchFilters,
    hasActiveFilters,
    search,
    resetSearchParams
  }
}
