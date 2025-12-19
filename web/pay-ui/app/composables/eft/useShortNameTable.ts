import type { EFTShortnameResponse, ShortNameSummaryState } from '@/interfaces/eft-short-name'
import CommonUtils from '@/utils/common-util'
import { useLoader } from '@/composables/common/useLoader'

export function useShortNameTable(state: ShortNameSummaryState) {
  const { toggleLoading } = useLoader()

  async function loadTableSummaryData(col?: string, val?: string | number, appendResults = false) {
    if (state.loading) { return }

    toggleLoading(true)
    state.loading = true

    try {
      if (col && val !== undefined && col !== 'page') {
        state.filters.filterPayload = {
          ...state.filters.filterPayload,
          [col]: val as string
        }
        state.filters.pageNumber = 1
        appendResults = false
      } else if (col === 'page') {
        state.filters.pageNumber = val as number
      }

      state.filters.isActive = Object.values(state.filters.filterPayload).some(
        value => value !== '' && value !== null && value !== undefined
      )

      const payload = {
        page: state.filters.pageNumber,
        limit: state.filters.pageLimit,
        ...state.filters.filterPayload,
        shortNameType: state.filters.filterPayload.shortNameType || ''
      }

      const cleanedPayload = CommonUtils.cleanObject(payload as Record<string, unknown>)
      const response = await getShortNameSummaries(cleanedPayload)

      if (response) {
        state.results = appendResults
          ? [...state.results, ...(response.items || [])]
          : (response.items || [])
        state.totalResults = response.total || 0
      }
    } catch (error) {
      console.error('Error loading short name summaries:', error)
    } finally {
      state.loading = false
      toggleLoading(false)
    }
  }

  async function getShortNameSummaries(payload: Record<string, unknown>) {
    const nuxtApp = useNuxtApp()
    const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

    const filteredParams = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    ) as Record<string, string>

    const queryString = CommonUtils.createQueryParams(filteredParams)

    return $payApi<{ items: EFTShortnameResponse[], total: number }>(
      `/eft-shortnames/summaries${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    )
  }

  async function infiniteScrollCallback(isInitialLoad: boolean): Promise<boolean> {
    if (state.loading) { return false }
    if (!isInitialLoad && state.results.length >= state.totalResults) { return true }

    if (isInitialLoad) {
      state.filters.pageNumber = 1
      await loadTableSummaryData('page', 1, false)
    } else {
      state.filters.pageNumber++
      await loadTableSummaryData('page', state.filters.pageNumber, true)
    }

    return false
  }

  function updateFilter(col: string, val: string | number) {
    state.filters.pageNumber = 1
    loadTableSummaryData(col, val)
  }

  return {
    infiniteScrollCallback,
    loadTableSummaryData,
    updateFilter
  }
}
