import type { EFTShortnameResponse, ShortNameSummaryState } from '@/interfaces/eft-short-name'
import { useLoader } from '@/composables/common/useLoader'
import { useEftTable, createEftApiFetcher } from './useEftTable'

interface ShortNameSummaryResponse {
  items: EFTShortnameResponse[]
  total: number
}

export function useShortNameTable(state: ShortNameSummaryState) {
  const { toggleLoading } = useLoader()
  const fetchSummary = createEftApiFetcher<ShortNameSummaryResponse>('/eft-shortnames/summaries')

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
    fetchData: fetchSummary,
    extractItems: response => response.items || [],
    extractTotal: response => response.total || 0,
    onLoadStart: () => toggleLoading(true),
    onLoadEnd: () => toggleLoading(false)
  })

  async function refreshSummaryItem(shortNameId: number) {
    const response = await fetchSummary({ shortNameId: String(shortNameId) })
    const updated = response?.items?.[0]
    if (!updated) { return }
    const index = state.results.findIndex(r => r.id === updated.id)
    if (index !== -1) {
      state.results[index] = updated
    }
  }

  return {
    loadTableSummaryData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd,
    refreshSummaryItem
  }
}
