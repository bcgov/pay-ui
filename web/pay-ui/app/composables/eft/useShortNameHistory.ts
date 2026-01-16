import type { ShortNameHistoryResponse, ShortNameHistoryState } from '@/interfaces/eft-short-name'

const PAGE_LIMIT = 10

export function useShortNameHistory(shortNameId: number, state: ShortNameHistoryState) {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  const loadState = reactive({
    reachedEnd: false,
    isLoading: false,
    isInitialLoad: true,
    currentPage: 1
  })

  async function fetchHistory(page: number): Promise<ShortNameHistoryResponse | null> {
    try {
      return await $payApi<ShortNameHistoryResponse>(
        `/eft-shortnames/${shortNameId}/history?page=${page}&limit=${PAGE_LIMIT}`,
        { method: 'GET' }
      )
    } catch (error) {
      console.error('Error fetching history:', error)
      return null
    }
  }

  async function loadHistoryData(appendResults = false) {
    if (loadState.isLoading) {
      return
    }

    loadState.isLoading = true
    state.loading = true

    try {
      const response = await fetchHistory(loadState.currentPage)
      if (response) {
        state.results = appendResults ? [...state.results, ...response.items] : response.items
        state.totalResults = response.total
        loadState.reachedEnd = state.results.length >= state.totalResults
      }
    } finally {
      loadState.isLoading = false
      state.loading = false
    }
  }

  async function getNext(isInitialLoadParam = false) {
    if (loadState.isLoading) {
      return
    }

    if (isInitialLoadParam) {
      loadState.isInitialLoad = false
      loadState.currentPage = 1
      await loadHistoryData(false)
    } else if (!loadState.reachedEnd) {
      loadState.currentPage++
      await loadHistoryData(true)
    }
  }

  function resetState() {
    loadState.reachedEnd = false
    loadState.isInitialLoad = true
    loadState.currentPage = 1
    state.results = []
    state.totalResults = 0
  }

  return {
    loadState,
    getNext,
    resetState
  }
}
