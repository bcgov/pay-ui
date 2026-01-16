import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useEftTable, useInfiniteScroll, createEftApiFetcher } from '~/composables/eft/useEftTable'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    cleanObject: vi.fn((obj: Record<string, unknown>) => {
      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned[key] = value
        }
      }
      return cleaned
    }),
    createQueryParams: vi.fn((params: Record<string, string>) => {
      return Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
    })
  }
}))

describe('useInfiniteScroll', () => {
  it('should initialize with correct default state', () => {
    const { loadState, currentPage } = useInfiniteScroll({
      fetchPage: vi.fn().mockResolvedValue({ items: [], hasMore: false })
    })

    expect(loadState.reachedEnd).toBe(false)
    expect(loadState.isLoading).toBe(false)
    expect(loadState.isInitialLoad).toBe(true)
    expect(currentPage.value).toBe(1)
  })

  describe('getNext', () => {
    it('should fetch initial page', async () => {
      const fetchPage = vi.fn().mockResolvedValue({ items: [1, 2], hasMore: true })
      const { getNext, loadState, currentPage } = useInfiniteScroll({ fetchPage })

      await getNext(true)

      expect(fetchPage).toHaveBeenCalledWith(1, false)
      expect(loadState.isInitialLoad).toBe(false)
      expect(currentPage.value).toBe(1)
    })

    it('should fetch subsequent pages', async () => {
      const fetchPage = vi.fn().mockResolvedValue({ items: [1], hasMore: true })
      const { getNext, currentPage } = useInfiniteScroll({ fetchPage })

      await getNext(true)
      await getNext(false)

      expect(fetchPage).toHaveBeenCalledWith(2, true)
      expect(currentPage.value).toBe(2)
    })

    it('should stop when hasMore is false', async () => {
      const fetchPage = vi.fn().mockResolvedValue({ items: [], hasMore: false })
      const { getNext, loadState } = useInfiniteScroll({ fetchPage })

      await getNext(true)
      expect(loadState.reachedEnd).toBe(true)

      fetchPage.mockClear()
      await getNext(false)
      expect(fetchPage).not.toHaveBeenCalled()
    })

    it('should not fetch while loading', async () => {
      let resolvePromise: (value: unknown) => void
      const fetchPage = vi.fn().mockImplementation(() =>
        new Promise((resolve) => { resolvePromise = resolve })
      )
      const { getNext, loadState } = useInfiniteScroll({ fetchPage })

      const firstCall = getNext(true)
      expect(loadState.isLoading).toBe(true)

      await getNext(true)
      expect(fetchPage).toHaveBeenCalledTimes(1)

      resolvePromise!({ items: [], hasMore: false })
      await firstCall
    })

    it('should call onLoadStart and onLoadEnd callbacks', async () => {
      const onLoadStart = vi.fn()
      const onLoadEnd = vi.fn()
      const fetchPage = vi.fn().mockResolvedValue({ items: [], hasMore: false })

      const { getNext } = useInfiniteScroll({ fetchPage, onLoadStart, onLoadEnd })
      await getNext(true)

      expect(onLoadStart).toHaveBeenCalled()
      expect(onLoadEnd).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onLoadEnd = vi.fn()
      const fetchPage = vi.fn().mockRejectedValue(new Error('Fetch error'))

      const { getNext, loadState } = useInfiniteScroll({ fetchPage, onLoadEnd })
      await getNext(true)

      expect(loadState.isLoading).toBe(false)
      expect(onLoadEnd).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const fetchPage = vi.fn().mockResolvedValue({ items: [], hasMore: false })
      const { getNext, reset, loadState, currentPage } = useInfiniteScroll({ fetchPage })

      await getNext(true)
      expect(loadState.reachedEnd).toBe(true)
      expect(loadState.isInitialLoad).toBe(false)

      reset()

      expect(loadState.reachedEnd).toBe(false)
      expect(loadState.isInitialLoad).toBe(true)
      expect(currentPage.value).toBe(1)
    })
  })
})

describe('useEftTable', () => {
  interface TestItem {
    id: number
    name: string
  }

  interface TestResponse {
    items: TestItem[]
    total: number
  }

  interface TestState {
    results: TestItem[]
    totalResults: number
    filters: {
      isActive: boolean
      pageNumber: number
      pageLimit: number
      filterPayload: { name: string }
    }
    loading: boolean
  }

  function createTestState(): TestState {
    return {
      results: [],
      totalResults: 0,
      filters: {
        isActive: false,
        pageNumber: 1,
        pageLimit: 20,
        filterPayload: { name: '' }
      },
      loading: false
    }
  }

  it('should load table data', async () => {
    const state = createTestState()
    const mockResponse: TestResponse = {
      items: [{ id: 1, name: 'Test' }],
      total: 1
    }
    const fetchData = vi.fn().mockResolvedValue(mockResponse)

    const { loadTableData } = useEftTable({
      state,
      buildPayload: filters => ({ page: filters.pageNumber, ...filters.filterPayload }),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total
    })

    await loadTableData()

    expect(state.results).toEqual(mockResponse.items)
    expect(state.totalResults).toBe(1)
  })

  it('should update filter and reload data', async () => {
    const state = createTestState()
    const fetchData = vi.fn().mockResolvedValue({ items: [], total: 0 })

    const { updateFilter } = useEftTable({
      state,
      buildPayload: filters => ({ page: filters.pageNumber, ...filters.filterPayload }),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total
    })

    await updateFilter('name', 'test')

    expect(state.filters.filterPayload.name).toBe('test')
    expect(state.filters.pageNumber).toBe(1)
    expect(state.filters.isActive).toBe(true)
    expect(fetchData).toHaveBeenCalled()
  })

  it('should set isActive based on filter values', async () => {
    const state = createTestState()
    const fetchData = vi.fn().mockResolvedValue({ items: [], total: 0 })

    const { loadTableData } = useEftTable({
      state,
      buildPayload: filters => ({ page: filters.pageNumber, ...filters.filterPayload }),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total
    })

    await loadTableData()
    expect(state.filters.isActive).toBe(false)

    state.filters.filterPayload.name = 'test'
    await loadTableData()
    expect(state.filters.isActive).toBe(true)
  })

  it('should call onLoadStart and onLoadEnd', async () => {
    const state = createTestState()
    const onLoadStart = vi.fn()
    const onLoadEnd = vi.fn()
    const fetchData = vi.fn().mockResolvedValue({ items: [], total: 0 })

    const { loadTableData } = useEftTable({
      state,
      buildPayload: () => ({}),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total,
      onLoadStart,
      onLoadEnd
    })

    await loadTableData()

    expect(onLoadStart).toHaveBeenCalled()
    expect(onLoadEnd).toHaveBeenCalled()
  })

  it('should handle pagination correctly', async () => {
    const state = createTestState()
    const page1 = { items: [{ id: 1, name: 'First' }], total: 2 }
    const page2 = { items: [{ id: 2, name: 'Second' }], total: 2 }
    const fetchData = vi.fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)

    const { getNext, loadState } = useEftTable({
      state,
      buildPayload: filters => ({ page: filters.pageNumber }),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total
    })

    await getNext(true)
    expect(state.results).toHaveLength(1)
    expect(loadState.reachedEnd).toBe(false)

    await getNext(false)
    expect(state.results).toHaveLength(2)
    expect(loadState.reachedEnd).toBe(true)
  })

  it('should handle fetch error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const state = createTestState()
    const fetchData = vi.fn().mockRejectedValue(new Error('API Error'))

    const { loadTableData } = useEftTable({
      state,
      buildPayload: () => ({}),
      fetchData,
      extractItems: response => response.items,
      extractTotal: response => response.total
    })

    await loadTableData()

    expect(state.loading).toBe(false)
    consoleSpy.mockRestore()
  })
})

describe('createEftApiFetcher', () => {
  it('should create a fetcher that calls the API', async () => {
    const mockResponse = { items: [], total: 0 }
    mockPayApi.mockResolvedValue(mockResponse)

    const fetcher = createEftApiFetcher('/test-endpoint')
    const result = await fetcher({ page: 1, limit: 20 })

    expect(result).toEqual(mockResponse)
    expect(mockPayApi).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      { method: 'GET' }
    )
  })

  it('should filter out empty values from params', async () => {
    mockPayApi.mockResolvedValue({})

    const fetcher = createEftApiFetcher('/test-endpoint')
    await fetcher({ page: 1, name: '', status: null, active: undefined })

    expect(mockPayApi).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
      { method: 'GET' }
    )
  })

  it('should handle endpoint without query params', async () => {
    mockPayApi.mockResolvedValue({})

    const fetcher = createEftApiFetcher('/test-endpoint')
    await fetcher({})

    expect(mockPayApi).toHaveBeenCalledWith(
      '/test-endpoint',
      { method: 'GET' }
    )
  })
})
