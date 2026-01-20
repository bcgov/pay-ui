import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameHistory } from '~/composables/eft/useShortNameHistory'
import type { ShortNameHistoryState } from '~/interfaces/eft-short-name'
import { ShortNamePaymentActions } from '~/utils/constants'

const mockPayApi = vi.fn()
const mockToastAdd = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

mockNuxtImport('useToast', () => () => ({
  add: mockToastAdd
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

  describe('state management and pagination', () => {
    it('should initialize, fetch, paginate, and reset state correctly', async () => {
      const state = createState()
      const { loadState, getNext, resetState } = useShortNameHistory(123, state)

      expect(loadState.reachedEnd).toBe(false)
      expect(loadState.isLoading).toBe(false)
      expect(loadState.isInitialLoad).toBe(true)
      expect(loadState.currentPage).toBe(1)

      const firstPage = { items: [{ id: 1 }], total: 20 }
      const secondPage = { items: [{ id: 2 }], total: 20 }
      mockPayApi.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)

      await getNext(true)

      expect(state.results).toEqual(firstPage.items)
      expect(loadState.isInitialLoad).toBe(false)
      expect(loadState.currentPage).toBe(1)
      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/123/history?page=1&limit=10', { method: 'GET' })

      await getNext(false)

      expect(state.results).toHaveLength(2)
      expect(loadState.currentPage).toBe(2)

      mockPayApi.mockResolvedValue({ items: [{ id: 3 }], total: 3 })
      await getNext(false)

      expect(loadState.reachedEnd).toBe(true)

      resetState()

      expect(state.results).toEqual([])
      expect(loadState.reachedEnd).toBe(false)
      expect(loadState.isInitialLoad).toBe(true)
      expect(loadState.currentPage).toBe(1)
    })

    it('should manage loading state and prevent concurrent fetches', async () => {
      let resolvePromise: (value: unknown) => void
      mockPayApi.mockImplementation(() => new Promise((resolve) => { resolvePromise = resolve }))

      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      const first = getNext(true)
      const second = getNext(true)

      expect(state.loading).toBe(true)
      expect(loadState.isLoading).toBe(true)
      expect(mockPayApi).toHaveBeenCalledTimes(1)

      resolvePromise!({ items: [{ id: 1 }], total: 1 })
      await first
      await second

      expect(state.loading).toBe(false)
      expect(loadState.isLoading).toBe(false)
      expect(mockPayApi).toHaveBeenCalledTimes(1)
    })

    it.each([
      [{ items: [], total: 0 }, 0, true],
      [{ items: [{ id: 1 }], total: 1 }, 1, true],
      [{ items: Array(10).fill({ id: 1 }), total: 10 }, 10, true],
      [{ items: Array(10).fill({ id: 1 }), total: 1000 }, 10, false]
    ])('should handle various result counts', async (response, expectedLength, shouldReachEnd) => {
      mockPayApi.mockResolvedValue(response)
      const state = createState()
      const { getNext, loadState } = useShortNameHistory(123, state)

      await getNext(true)

      expect(state.results).toHaveLength(expectedLength)
      expect(loadState.reachedEnd).toBe(shouldReachEnd)
    })

    it('should handle API errors gracefully', async () => {
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

  describe('reversePayment', () => {
    it('should reverse payment successfully and refresh history', async () => {
      const historyResponse = { items: [{ id: 1, transactionType: 'STATEMENT_REVERSE' }], total: 1 }
      mockPayApi.mockResolvedValueOnce({}).mockResolvedValueOnce(historyResponse)

      const state = createState()
      const { reversePayment } = useShortNameHistory(123, state)

      const result = await reversePayment(456, 'ACC-123')

      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/123/payment', {
        method: 'POST',
        body: { action: ShortNamePaymentActions.REVERSE, accountId: 'ACC-123', statementId: 456 }
      })
      expect(result).toBe(true)
      expect(state.results).toEqual(historyResponse.items)
      expect(mockToastAdd).toHaveBeenCalledWith({
        description: 'Payment reversed successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
    })

    it('should handle reversal errors with generic message', async () => {
      mockPayApi.mockRejectedValueOnce(new Error('Reversal failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const state = createState()
      const { reversePayment } = useShortNameHistory(123, state)

      const result = await reversePayment(456)

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith({
        description: 'An error occurred while processing your request.',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      consoleSpy.mockRestore()
    })

    it('should handle reversal errors with specific EFT error message', async () => {
      const eftError = {
        response: {
          _data: {
            type: 'EFT_PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS'
          }
        }
      }
      mockPayApi.mockRejectedValueOnce(eftError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const state = createState()
      const { reversePayment } = useShortNameHistory(123, state)

      const result = await reversePayment(456)

      expect(result).toBe(false)
      expect(mockToastAdd).toHaveBeenCalledWith({
        description: 'Cannot reverse payment - exceeds 60 day limit.',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      consoleSpy.mockRestore()
    })
  })

  describe('reversal eligibility', () => {
    it.each([
      [new Date().toISOString(), undefined, true, 'Reverse this payment'],
      [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), undefined, true, 'Reverse this payment'],
      [new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), undefined, true, 'Reverse this payment'],
      [new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString(), undefined, false, 'Cannot reverse transactions older than 60 days'],
      [undefined, undefined, false, 'Cannot reverse this transaction']
    ])('canReversePayment and tooltip for date %s', (transactionDate, paymentDate, canReverse, tooltip) => {
      const state = createState()
      const { canReversePayment, getReversalTooltip } = useShortNameHistory(123, state)

      expect(canReversePayment(transactionDate, paymentDate)).toBe(canReverse)
      expect(getReversalTooltip(transactionDate, paymentDate)).toBe(tooltip)
    })

    it('should prefer paymentDate over transactionDate', () => {
      const state = createState()
      const { canReversePayment } = useShortNameHistory(123, state)

      const oldTransactionDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      const recentPaymentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      expect(canReversePayment(oldTransactionDate, recentPaymentDate)).toBe(true)
    })
  })
})
