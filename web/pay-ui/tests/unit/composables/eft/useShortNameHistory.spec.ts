import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameHistory } from '~/composables/eft/useShortNameHistory'
import type { ShortNameHistoryState } from '~/interfaces/eft-short-name'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

function createState(): ShortNameHistoryState {
  return {
    results: [],
    totalResults: 0,
    loading: false
  }
}

describe('useShortNameHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default load state', () => {
    const state = createState()
    const { loadState } = useShortNameHistory(123, state)

    expect(loadState.reachedEnd).toBe(false)
    expect(loadState.isLoading).toBe(false)
    expect(loadState.isInitialLoad).toBe(true)
    expect(loadState.currentPage).toBe(1)
  })

  describe('getNext', () => {
    it('should fetch initial data on first call', async () => {
      const mockResponse = {
        items: [
          { id: 1, transactionDate: '2024-01-01', transactionType: 'FUNDS_RECEIVED', amount: 100 }
        ],
        total: 1
      }
      mockPayApi.mockResolvedValue(mockResponse)

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toEqual(mockResponse.items)
      expect(state.totalResults).toBe(1)
      expect(loadState.isInitialLoad).toBe(false)
      expect(loadState.currentPage).toBe(1)
    })

    it('should append results on subsequent calls', async () => {
      const firstPage = {
        items: [{ id: 1, transactionDate: '2024-01-01', transactionType: 'FUNDS_RECEIVED', amount: 100 }],
        total: 20
      }
      const secondPage = {
        items: [{ id: 2, transactionDate: '2024-01-02', transactionType: 'STATEMENT_PAID', amount: 50 }],
        total: 20
      }

      mockPayApi.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      expect(state.results).toHaveLength(1)

      await getNext(false)
      expect(state.results).toHaveLength(2)
      expect(loadState.currentPage).toBe(2)
    })

    it('should set reachedEnd when all results fetched', async () => {
      const mockResponse = {
        items: [{ id: 1, transactionDate: '2024-01-01', transactionType: 'FUNDS_RECEIVED', amount: 100 }],
        total: 1
      }
      mockPayApi.mockResolvedValue(mockResponse)

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(loadState.reachedEnd).toBe(true)
    })

    it('should not fetch more when reachedEnd is true', async () => {
      const mockResponse = {
        items: [{ id: 1, transactionDate: '2024-01-01', transactionType: 'FUNDS_RECEIVED', amount: 100 }],
        total: 1
      }
      mockPayApi.mockResolvedValue(mockResponse)

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      expect(loadState.reachedEnd).toBe(true)

      mockPayApi.mockClear()
      await getNext(false)

      expect(mockPayApi).not.toHaveBeenCalled()
    })

    it('should not fetch if already loading', async () => {
      const mockResponse = { items: [], total: 0 }
      mockPayApi.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)))

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      const firstCall = getNext(true)
      expect(loadState.isLoading).toBe(true)

      await getNext(true)
      expect(mockPayApi).toHaveBeenCalledTimes(1)

      await firstCall
    })

    it('should call API with correct pagination', async () => {
      mockPayApi.mockResolvedValue({ items: [], total: 100 })

      const state = createState()
      const { getNext } = useShortNameHistory(456, state)

      await getNext(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/456/history?page=1&limit=10',
        { method: 'GET' }
      )

      await getNext(false)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/456/history?page=2&limit=10',
        { method: 'GET' }
      )
    })

    it('should handle API error gracefully', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toEqual([])
      expect(loadState.isLoading).toBe(false)
      expect(state.loading).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('resetState', () => {
    it('should reset all state values', async () => {
      mockPayApi.mockResolvedValue({
        items: [{ id: 1, transactionDate: '2024-01-01', transactionType: 'FUNDS_RECEIVED', amount: 100 }],
        total: 1
      })

      const state = createState()
      const { getNext, resetState, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      expect(state.results).toHaveLength(1)
      expect(loadState.isInitialLoad).toBe(false)

      resetState()

      expect(state.results).toEqual([])
      expect(loadState.reachedEnd).toBe(false)
      expect(loadState.isInitialLoad).toBe(true)
      expect(loadState.currentPage).toBe(1)
    })
  })

  describe('loading state', () => {
    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockPayApi.mockImplementation(() => new Promise((resolve) => { resolvePromise = resolve }))

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      const fetchPromise = getNext(true)

      expect(state.loading).toBe(true)
      expect(loadState.isLoading).toBe(true)

      resolvePromise!({ items: [], total: 0 })
      await fetchPromise

      expect(state.loading).toBe(false)
      expect(loadState.isLoading).toBe(false)
    })
  })

  describe('pagination edge cases', () => {
    it('should handle single result', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 1 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toHaveLength(1)
      expect(loadState.reachedEnd).toBe(true)
    })

    it('should handle exactly one page of results', async () => {
      const tenItems = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      mockPayApi.mockResolvedValue({ items: tenItems, total: 10 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toHaveLength(10)
      expect(loadState.reachedEnd).toBe(true)
    })

    it('should handle pagination with 11 items (2 pages)', async () => {
      const firstPage = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      const secondPage = [{ id: 11 }]

      mockPayApi
        .mockResolvedValueOnce({ items: firstPage, total: 11 })
        .mockResolvedValueOnce({ items: secondPage, total: 11 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      expect(state.results).toHaveLength(10)
      expect(loadState.reachedEnd).toBe(false)

      await getNext(false)
      expect(state.results).toHaveLength(11)
      expect(loadState.reachedEnd).toBe(true)
    })

    it('should handle zero results', async () => {
      mockPayApi.mockResolvedValue({ items: [], total: 0 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toHaveLength(0)
      expect(loadState.reachedEnd).toBe(true)
    })

    it('should handle large total count', async () => {
      mockPayApi.mockResolvedValue({ items: Array(10).fill({ id: 1 }), total: 1000 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.totalResults).toBe(1000)
      expect(loadState.reachedEnd).toBe(false)
    })
  })

  describe('resetState behavior', () => {
    it('should reset after multiple pages loaded', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 50 })

      const state = createState()
      const { getNext, resetState, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      await getNext(false)
      await getNext(false)

      expect(loadState.currentPage).toBe(3)
      expect(state.results.length).toBeGreaterThan(0)

      resetState()

      expect(loadState.currentPage).toBe(1)
      expect(state.results).toEqual([])
      expect(state.totalResults).toBe(0)
      expect(loadState.reachedEnd).toBe(false)
      expect(loadState.isInitialLoad).toBe(true)
    })
  })

  describe('different short name IDs', () => {
    it('should fetch from different endpoints for different IDs', async () => {
      mockPayApi.mockResolvedValue({ items: [], total: 0 })

      const state1 = createState()
      const { getNext: getNext1 } = useShortNameHistory(123, state1)
      await getNext1(true)

      const state2 = createState()
      const { getNext: getNext2 } = useShortNameHistory(456, state2)
      await getNext2(true)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/history?page=1&limit=10',
        { method: 'GET' }
      )
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/456/history?page=1&limit=10',
        { method: 'GET' }
      )
    })

    it('should handle ID 0', async () => {
      mockPayApi.mockResolvedValue({ items: [], total: 0 })

      const state = createState()
      const { getNext } = useShortNameHistory(0, state)
      await getNext(true)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/0/history?page=1&limit=10',
        { method: 'GET' }
      )
    })
  })

  describe('concurrent requests', () => {
    it('should not allow concurrent fetches', async () => {
      let resolveFirst: (value: unknown) => void
      mockPayApi.mockImplementation(() => new Promise((resolve) => { resolveFirst = resolve }))

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      const first = getNext(true)
      const second = getNext(true)

      expect(loadState.isLoading).toBe(true)
      expect(mockPayApi).toHaveBeenCalledTimes(1)

      resolveFirst!({ items: [{ id: 1 }], total: 1 })
      await first
      await second

      expect(mockPayApi).toHaveBeenCalledTimes(1)
    })
  })

  describe('response data handling', () => {
    it('should preserve item properties', async () => {
      const mockItem = {
        id: 1,
        transactionDate: '2024-01-01',
        transactionType: 'FUNDS_RECEIVED',
        amount: 100.50,
        customField: 'test'
      }
      mockPayApi.mockResolvedValue({ items: [mockItem], total: 1 })

      const state = createState()
      const { getNext } = useShortNameHistory(123, state)
      await getNext(true)

      expect(state.results[0]).toEqual(mockItem)
    })

    it('should handle null amount', async () => {
      const mockItem = {
        id: 1,
        transactionDate: '2024-01-01',
        transactionType: 'SN_REFUND_DECLINED',
        amount: null
      }
      mockPayApi.mockResolvedValue({ items: [mockItem], total: 1 })

      const state = createState()
      const { getNext } = useShortNameHistory(123, state)
      await getNext(true)

      expect(state.results[0].amount).toBeNull()
    })

    it('should handle missing optional fields', async () => {
      const mockItem = {
        id: 1,
        transactionType: 'FUNDS_RECEIVED'
      }
      mockPayApi.mockResolvedValue({ items: [mockItem], total: 1 })

      const state = createState()
      const { getNext } = useShortNameHistory(123, state)
      await getNext(true)

      expect(state.results[0]).toEqual(mockItem)
    })
  })

  describe('initial load flag', () => {
    it('should set isInitialLoad to false after first load', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 10 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      expect(loadState.isInitialLoad).toBe(true)
      await getNext(true)
      expect(loadState.isInitialLoad).toBe(false)
    })

    it('should not set isInitialLoad when passed false', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 10 })

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(false)
      expect(loadState.isInitialLoad).toBe(true)
    })

    it('should reset isInitialLoad on resetState', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 10 })

      const state = createState()
      const { getNext, resetState, loadState } = useShortNameHistory(123, state)

      await getNext(true)
      expect(loadState.isInitialLoad).toBe(false)

      resetState()
      expect(loadState.isInitialLoad).toBe(true)
    })
  })
})
