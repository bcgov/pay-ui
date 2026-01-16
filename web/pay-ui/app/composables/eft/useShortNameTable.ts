import type { EFTShortnameResponse, ShortNameSummaryState } from '@/interfaces/eft-short-name'
import { useLoader } from '@/composables/common/useLoader'
import { useEftTable, createEftApiFetcher } from './useEftTable'

interface ShortNameSummaryResponse {
  items: EFTShortnameResponse[]
  total: number
}

export function useShortNameTable(state: ShortNameSummaryState) {
  const { toggleLoading } = useLoader()

  const {
    loadTableData: loadTableSummaryData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  } = useEftTable<EFTShortnameResponse, ShortNameSummaryResponse, ShortNameSummaryState>({
    state,
    buildPayload: filters => ({
      page: filters.pageNumber,
      limit: filters.pageLimit,
      ...filters.filterPayload,
      shortNameType: filters.filterPayload.shortNameType || ''
    }),
    fetchData: createEftApiFetcher('/eft-shortnames/summaries'),
    extractItems: response => response.items || [],
    extractTotal: response => response.total || 0,
    onLoadStart: () => toggleLoading(true),
    onLoadEnd: () => toggleLoading(false)
  })

  return {
    loadTableSummaryData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  }
}
