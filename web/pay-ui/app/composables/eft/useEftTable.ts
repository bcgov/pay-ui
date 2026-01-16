import CommonUtils from '@/utils/common-util'

const hasValue = (value: unknown): boolean =>
  value !== '' && value !== null && value !== undefined

export interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number, appendResults: boolean) => Promise<{ items: T[], hasMore: boolean }>
  onLoadStart?: () => void
  onLoadEnd?: () => void
}

export function useInfiniteScroll<T>(options: UseInfiniteScrollOptions<T>) {
  const { fetchPage, onLoadStart, onLoadEnd } = options

  const loadState = reactive({
    reachedEnd: false,
    isLoading: false,
    isInitialLoad: true
  })

  const currentPage = ref(1)

  async function loadPage(page: number, appendResults = false) {
    if (loadState.isLoading) { return }

    loadState.isLoading = true
    onLoadStart?.()

    try {
      currentPage.value = page
      const { hasMore } = await fetchPage(page, appendResults)
      loadState.reachedEnd = !hasMore
    } catch (error) {
      console.error('Error loading data:', error)
      loadState.reachedEnd = true
    } finally {
      loadState.isLoading = false
      onLoadEnd?.()
    }
  }

  async function getNext(isInitialLoadParam = false) {
    if (loadState.isLoading) { return }

    if (isInitialLoadParam) {
      loadState.isInitialLoad = false
      await loadPage(1, false)
    } else if (!loadState.reachedEnd) {
      await loadPage(currentPage.value + 1, true)
    }
  }

  function reset() {
    loadState.reachedEnd = false
    loadState.isInitialLoad = true
    currentPage.value = 1
  }

  return {
    loadState,
    currentPage,
    getNext,
    reset,
    loadPage
  }
}

export interface BaseTableState<T, F extends Record<string, string> = Record<string, string>> {
  results: T[]
  totalResults: number
  filters: {
    isActive: boolean
    pageNumber: number
    pageLimit: number
    filterPayload: F
  }
  loading: boolean
}

export interface UseEftTableOptions<
  T,
  R,
  S extends BaseTableState<T, Record<string, string>>
> {
  state: S
  buildPayload: (filters: S['filters']) => Record<string, unknown>
  fetchData: (payload: Record<string, unknown>) => Promise<R>
  extractItems: (response: R) => T[]
  extractTotal: (response: R) => number
  onLoadStart?: () => void
  onLoadEnd?: () => void
}

export function useEftTable<
  T,
  R,
  S extends BaseTableState<T, Record<string, string>> = BaseTableState<T>
>(options: UseEftTableOptions<T, R, S>) {
  const { state, buildPayload, fetchData, extractItems, extractTotal, onLoadStart, onLoadEnd } = options

  const { loadState, getNext, reset: resetReachedEnd, currentPage } = useInfiniteScroll<T>({
    fetchPage: async (page, appendResults) => {
      state.filters.pageNumber = page
      state.filters.isActive = Object.values(state.filters.filterPayload).some(hasValue)

      const payload = buildPayload(state.filters)
      const cleanedPayload = CommonUtils.cleanObject(payload as Record<string, unknown>)
      const response = await fetchData(cleanedPayload)

      if (response) {
        const items = extractItems(response)
        state.results = appendResults ? [...state.results, ...items] : items
        state.totalResults = extractTotal(response)
        return { items, hasMore: state.results.length < state.totalResults }
      }
      return { items: [], hasMore: false }
    },
    onLoadStart: () => {
      state.loading = true
      onLoadStart?.()
    },
    onLoadEnd: () => {
      state.loading = false
      onLoadEnd?.()
    }
  })

  async function loadTableData(col?: string, val?: string | number, appendResults = false) {
    if (loadState.isLoading) { return }

    const isFilterUpdate = col && col !== 'page' && hasValue(val)

    if (isFilterUpdate) {
      state.filters.filterPayload = { ...state.filters.filterPayload, [col]: val as string }
      state.filters.pageNumber = 1
      appendResults = false
      resetReachedEnd()
    }

    state.loading = true
    onLoadStart?.()
    loadState.isLoading = true

    try {
      state.filters.isActive = Object.values(state.filters.filterPayload).some(hasValue)
      const payload = buildPayload(state.filters)
      const cleanedPayload = CommonUtils.cleanObject(payload as Record<string, unknown>)
      const response = await fetchData(cleanedPayload)

      if (response) {
        const items = extractItems(response)
        state.results = appendResults ? [...state.results, ...items] : items
        state.totalResults = extractTotal(response)
        loadState.reachedEnd = state.results.length >= state.totalResults
      }
    } catch (error) {
      console.error('Error loading table data:', error)
    } finally {
      state.loading = false
      loadState.isLoading = false
      onLoadEnd?.()
    }
  }

  function updateFilter(col: string, val: string | number) {
    state.filters.pageNumber = 1
    resetReachedEnd()
    loadTableData(col, val)
  }

  return {
    loadTableData,
    updateFilter,
    loadState,
    getNext,
    resetReachedEnd,
    currentPage
  }
}

export function createEftApiFetcher<R>(endpoint: string) {
  return async (payload: Record<string, unknown>): Promise<R> => {
    const nuxtApp = useNuxtApp()
    const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

    const filteredParams = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => hasValue(value))
    ) as Record<string, string>

    const queryString = CommonUtils.createQueryParams(filteredParams)

    return $payApi<R>(
      `${endpoint}${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    )
  }
}
