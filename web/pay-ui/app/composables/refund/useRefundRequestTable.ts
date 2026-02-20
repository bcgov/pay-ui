import type { RefundRequestResult, RefundRequestState } from '@/interfaces/refund-requests'
import { useLoader } from '@/composables/common/useLoader'
import { useBaseTable, createTableApiFetcher } from '@/composables/common/useBaseTable'

export function useRefundRequestTable(state: RefundRequestState) {
  const { toggleLoading } = useLoader()

  const {
    loadTableData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  } = useBaseTable<RefundRequestResult, RefundRequestListResponse, RefundRequestState>({
    state,
    buildPayload: filters => ({
      page: filters.pageNumber,
      limit: filters.pageLimit,
      ...filters.filterPayload
    }),
    fetchData: createTableApiFetcher('/refunds'),
    extractItems: response => response.items || [],
    extractTotal: response => response.total || 0,
    extractStateTotal: response => response.statusTotal || 0,
    onLoadStart: () => toggleLoading(true),
    onLoadEnd: () => toggleLoading(false)
  })

  return {
    loadTableData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  }
}
