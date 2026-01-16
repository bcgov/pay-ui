import type {
  LinkedShortNameItem,
  LinkedShortNameResponse,
  LinkedShortNameState
} from '@/interfaces/eft-short-name'
import { useEftTable, createEftApiFetcher } from './useEftTable'

export function useLinkedShortNameTable(state: LinkedShortNameState) {
  const {
    loadTableData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  } = useEftTable<LinkedShortNameItem, LinkedShortNameResponse, LinkedShortNameState>({
    state,
    buildPayload: (filters) => {
      const { accountNumber, ...restFilters } = filters.filterPayload
      return {
        page: filters.pageNumber,
        limit: filters.pageLimit,
        state: 'LINKED',
        ...restFilters,
        accountId: accountNumber,
        shortNameType: filters.filterPayload.shortNameType || ''
      }
    },
    fetchData: createEftApiFetcher('/eft-shortnames'),
    extractItems: response => response.items || [],
    extractTotal: response => response.total || 0
  })

  return {
    loadTableData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd
  }
}
