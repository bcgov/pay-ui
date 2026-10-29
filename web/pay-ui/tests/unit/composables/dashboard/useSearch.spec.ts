import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSearch } from '~/composables/dashboard/useSearch'
import { SlipStatus } from '~/enums/slip-status'
import { chequeRefundCodes } from '~/utils/constants'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { RoutingSlip, RoutingSlipDetails } from '~/interfaces/routing-slip'
import type { Invoice } from '~/interfaces/invoice'

const mockPostSearchRoutingSlip = vi.fn()
const mockGetCodes = vi.fn()
const mockPayApi = {
  postSearchRoutingSlip: mockPostSearchRoutingSlip,
  getCodes: mockGetCodes
}

const mockToggleLoading = vi.fn()
const mockIsLoading = ref(false)

const mockStatusLabel = vi.fn((code: string) => `Status: ${code}`)

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

mockNuxtImport('usePayApi', () => () => mockPayApi)

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    isLoading: mockIsLoading,
    toggleLoading: mockToggleLoading
  })
}))

vi.mock('~/composables/common/useStatusList', () => ({
  useStatusList: vi.fn(() => ({
    statusLabel: mockStatusLabel
  }))
}))

describe('useSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetCodes.mockImplementation(() => Promise.resolve([]))
    mockPostSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: [],
      total: 0
    }))
    mockIsLoading.value = false
    mockToggleLoading.mockImplementation((value: boolean) => {
      mockIsLoading.value = value
    })
  })

  it('should handle search operations, loading, results, params reset, and filter updates', async () => {
    const composable = await useSearch()
    const searchPromise = composable.searchNow()
    expect(composable.isLoading.value).toBe(true)
    await searchPromise
    expect(mockPostSearchRoutingSlip).toHaveBeenCalled()
    expect(composable.isLoading.value).toBe(false)

    const mockItems = [
      { number: '123', status: 'ACTIVE' },
      { number: '456', status: 'COMPLETED' }
    ]
    mockPostSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: mockItems,
      total: 2
    }))
    await composable.searchNow()
    const { store } = useRoutingSlipStore()
    expect(store.searchRoutingSlipResult.length).toBe(2)

    store.searchRoutingSlipParams.page = 5
    store.searchRoutingSlipParams.limit = 100
    store.searchRoutingSlipResult.push({} as Partial<RoutingSlipDetails>)
    composable.resetSearchParams()
    expect(store.searchRoutingSlipParams.page).toBe(1)
    expect(store.searchRoutingSlipParams.limit).toBe(50)
    expect(store.searchRoutingSlipResult.length).toBe(0)

    composable.updateSearchFilter({ routingSlipNumber: '123' })
    await nextTick()
    expect(store.searchRoutingSlipParams.routingSlipNumber).toBe('123')

    store.searchRoutingSlipParams.routingSlipNumber = '123'
    store.searchRoutingSlipParams.page = 5
    await composable.clearFilter()
    expect(mockPostSearchRoutingSlip).toHaveBeenCalled()
    expect(store.searchRoutingSlipParams.page).toBe(1)
  })

  it('should toggle folio and cheque expansion, format folio results, and get status/refund text', async () => {
    const composable = await useSearch()
    composable.toggleFolio('folio-1')
    expect(composable.showExpandedFolio.value).toContain('folio-1')
    composable.toggleFolio('folio-1')
    expect(composable.showExpandedFolio.value).not.toContain('folio-1')

    composable.toggleCheque('cheque-1')
    expect(composable.showExpandedCheque.value).toContain('cheque-1')
    composable.toggleCheque('cheque-1')
    expect(composable.showExpandedCheque.value).not.toContain('cheque-1')

    const invoices = [
      { businessIdentifier: 'BI1' },
      { businessIdentifier: 'BI2' }
    ] as Partial<Invoice>[]
    let result = composable.formatFolioResult(invoices, null)
    expect(result).toEqual(['BI1', 'BI2'])

    result = composable.formatFolioResult([], 'BI123')
    expect(result).toEqual(['BI123'])

    result = composable.formatFolioResult([], null)
    expect(result).toEqual(['-'])

    composable.getStatusLabel('ACTIVE')
    expect(mockStatusLabel).toHaveBeenCalledWith('ACTIVE')

    const text = composable.getRefundStatusText(chequeRefundCodes.PROCESSED)
    expect(text).toBeDefined()

    const status = composable.getStatusFromRefundStatus(chequeRefundCodes.PROCESSING)
    expect(status).toBeDefined()
  })

  it('should compute routingSlips from searchRoutingSlipResult', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipResult.length = 0
    store.searchRoutingSlipResult.push({
      number: '123',
      status: 'ACTIVE',
      routingSlipDate: '2025-09-26',
      invoices: [],
      paymentAccount: null,
      payments: []
    } as unknown as RoutingSlip)

    await nextTick()
    expect(composable.routingSlips.value).toBeDefined()
    expect(Array.isArray(composable.routingSlips.value)).toBe(true)
    // the routing slip date is a date only value - it must display as stored
    expect(composable.routingSlips.value[0]?.date).toBe('September 26, 2025')
  })

  it('should compute columnVisibility from table headers', async () => {
    const composable = await useSearch()
    expect(composable.columnVisibility.value).toBeDefined()
  })

  it('should not call getNext if isLoading is true', async () => {
    const composable = await useSearch()

    mockPostSearchRoutingSlip.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ items: [], total: 0 }), 100))
    )

    const promise1 = composable.getNext(false)
    const promise2 = composable.getNext(false)

    await Promise.all([promise1, promise2])

    expect(mockPostSearchRoutingSlip).toHaveBeenCalledTimes(1)
  })

  it('should append results when getNext is called', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipResult = [{ number: '1' }] as RoutingSlipDetails[]
    store.searchRoutingSlipParams.page = 1
    store.searchRoutingSlipParams.limit = 50

    mockPostSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: [{ number: '2' }],
      total: 2
    }))

    await composable.getNext(false)
    await nextTick()

    expect(mockPostSearchRoutingSlip).toHaveBeenCalled()
  })

  it('should stop infinite scroll if searchRoutingSlip encounters an error', async () => {
    const composable = await useSearch()
    mockPostSearchRoutingSlip.mockRejectedValue(new Error('API error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.getNext(false)
    await nextTick()

    expect(composable.isLoading.value).toBe(false)
    expect(composable.reachedEnd.value).toBe(true)
    consoleSpy.mockRestore()
  })

  describe('additional branches', () => {
    it('removes incomplete dateFilter and appends results when asked', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      store.searchRoutingSlipParams.dateFilter = { startDate: '2025-01-01', endDate: '' }
      mockPostSearchRoutingSlip.mockResolvedValue({ items: [{ number: '1' }] })
      await composable.searchNow()
      expect(mockPostSearchRoutingSlip.mock.calls[0]![0].dateFilter).toBeUndefined()

      mockPostSearchRoutingSlip.mockResolvedValue({ items: [{ number: '2' }] })
      await composable.searchNow()
      expect(store.searchRoutingSlipResult.map((r: { number: string }) => r.number)).toEqual(['2'])
    })

    it('keeps dateFilter when complete and treats missing items as zero results', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      store.searchRoutingSlipParams.dateFilter = { startDate: '2025-01-01', endDate: '2025-01-31' }
      mockPostSearchRoutingSlip.mockResolvedValue(undefined)
      await composable.searchNow()
      expect(mockPostSearchRoutingSlip.mock.calls[0]![0].dateFilter).toEqual({
        startDate: '2025-01-01', endDate: '2025-01-31'
      })
      expect(composable.reachedEnd.value).toBe(true)
    })

    it('paginates with getNext and appends when more pages exist', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      store.searchRoutingSlipParams.limit = 1
      mockPostSearchRoutingSlip.mockResolvedValueOnce({ items: [{ number: 'a' }] })
      await composable.getNext(true)
      mockPostSearchRoutingSlip.mockResolvedValueOnce({ items: [{ number: 'b' }] })
      await composable.getNext(false)
      expect(store.searchRoutingSlipResult.map((r: { number: string }) => r.number)).toEqual(['a', 'b'])
      expect(store.searchRoutingSlipParams.page).toBe(2)
    })

    it('computes searchParamsExist based on params', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      for (const key of Object.keys(store.searchRoutingSlipParams)) {
        Reflect.set(store.searchRoutingSlipParams, key, '')
      }
      expect(composable.searchParamsExist.value).toBe(true)
      store.searchRoutingSlipParams.routingSlipNumber = '1'
      expect(composable.searchParamsExist.value).toBe(false)
    })

    it('formats folio results across branches', async () => {
      const composable = await useSearch()
      expect(composable.formatFolioResult([], null)).toEqual(['-'])
      expect(composable.formatFolioResult([{ businessIdentifier: '' }] as Partial<Invoice>[], '')).toEqual(['-'])
      expect(composable.formatFolioResult([], 'BI')).toEqual(['BI'])
      composable.updateSearchFilter({ routingSlipNumber: 'x' })
      expect(composable.formatFolioResult([{ businessIdentifier: 'I1' }] as Partial<Invoice>[], 'BI')).toEqual(['I1'])
    })

    it('maps routing slips for cash, cheque and refund statuses', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      store.searchRoutingSlipResult.length = 0
      store.searchRoutingSlipResult.push(
        {
          number: 'C1',
          status: 'ACTIVE',
          routingSlipDate: '2025-09-26',
          paymentAccount: { paymentMethod: 'CASH', accountName: 'Acct' },
          payments: [{ chequeReceiptNumber: 'R1' }],
          invoices: [{ businessIdentifier: 'BI' }],
          remainingAmount: 12.5,
          createdName: 'Bob',
          refundStatus: chequeRefundCodes.PROCESSING
        } as unknown as RoutingSlip,
        {
          number: 'C2',
          paymentAccount: { paymentMethod: 'CHEQUE' },
          payments: [{ chequeReceiptNumber: 'Q1' }, { chequeReceiptNumber: 'Q2' }],
          refundStatus: 'UNKNOWN'
        } as unknown as RoutingSlip,
        { number: 'C3', paymentAccount: { paymentMethod: 'CASH' } } as unknown as RoutingSlip,
        { paymentAccount: { paymentMethod: 'CHEQUE' } } as unknown as RoutingSlip
      )
      await nextTick()
      const [a, b, c, d] = composable.routingSlips.value
      expect(a).toMatchObject({
        routingSlipNumber: 'C1', receiptNumber: 'R1', accountName: 'Acct', createdName: 'Bob',
        businessIdentifier: ['BI'], remainingAmount: expect.stringContaining('12.50'), chequeReceiptNumber: ['-']
      })
      expect(a!.refundStatus).toBe('Processing')
      expect(b).toMatchObject({ receiptNumber: '-', chequeReceiptNumber: ['Q1', 'Q2'], remainingAmount: '-' })
      expect(b!.refundStatus).toBe(chequeRefundCodes.PROCESSING)
      expect(c).toMatchObject({ receiptNumber: '-', refundStatus: '-', accountName: '-', createdName: '-' })
      expect(d).toMatchObject({ routingSlipNumber: '-', chequeReceiptNumber: ['-'] })
    })

    it('getStatusLabel delegates and getStatusFromRefundStatus maps both branches', async () => {
      const composable = await useSearch()
      expect(composable.getStatusLabel('ACTIVE')).toBe('Status: ACTIVE')
      expect(composable.getStatusFromRefundStatus(chequeRefundCodes.PROCESSING)).toBe(SlipStatus.REFUNDREQUEST)
      expect(composable.getStatusFromRefundStatus('OTHER')).toBe(SlipStatus.REFUNDPROCESSED)
    })

    it('sets column visibility and persists it in the store', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      const key = composable.searchRoutingSlipTableHeaders.value
        .find(h => h.accessorKey)!.accessorKey as string
      composable.columnVisibility.value = { [key]: false, unknownKey: true }
      expect(composable.columnVisibility.value[key]).toBe(false)
      expect(store.searchColumnVisibility[key]).toBe(false)
      await nextTick()
      expect(store.searchColumnVisibility[key]).toBe(false)
    })

    it('uses stored headers and visibility when available', async () => {
      const { store } = useRoutingSlipStore()
      store.searchRoutingSlipTableHeaders = [
        { accessorKey: 'a', header: 'A' },
        { accessorKey: 'b', header: 'B', display: false },
        { header: 'NoKey' }
      ] as never
      store.searchColumnVisibility = { a: false }
      const composable = await useSearch()
      const headers = composable.searchRoutingSlipTableHeaders.value
      expect(headers[0]!.display).toBe(false)
      expect(headers[1]!.display).toBe(false)
      expect(headers[2]!.display).toBe(true)
      expect(composable.columnVisibility.value).toEqual({ a: false, b: false })
    })

    it('reports hasActiveFilters for each filter and date range', async () => {
      const composable = await useSearch()
      const f = composable.filters as Record<string, unknown>
      expect(composable.hasActiveFilters.value).toBe(false)
      const keys = ['routingSlipNumber', 'receiptNumber', 'accountName', 'createdName', 'status',
        'refundStatus', 'businessIdentifier', 'chequeReceiptNumber', 'remainingAmount']
      for (const k of keys) {
        const original = f[k]
        f[k] = 'x'
        expect(composable.hasActiveFilters.value).toBe(true)
        f[k] = original
        expect(composable.hasActiveFilters.value).toBe(false)
      }
      f.dateFilter = { startDate: '2025-01-01', endDate: '2025-01-02' }
      expect(composable.hasActiveFilters.value).toBe(true)
      f.dateFilter = { startDate: '2025-01-01', endDate: '' }
      expect(composable.hasActiveFilters.value).toBe(false)
    })

    it('propagates filter changes to search params via watchers and triggers search for status', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      const f = composable.filters as Record<string, unknown>
      const map: Record<string, string> = {
        routingSlipNumber: 'routingSlipNumber', receiptNumber: 'receiptNumber', accountName: 'accountName',
        createdName: 'initiator', businessIdentifier: 'businessIdentifier',
        chequeReceiptNumber: 'chequeReceiptNumber', remainingAmount: 'remainingAmount'
      }
      for (const [k, p] of Object.entries(map)) {
        f[k] = 'v'
        await nextTick()
        expect((store.searchRoutingSlipParams as Record<string, unknown>)[p]).toBe('v')
      }
      f.dateFilter = { startDate: '2025-01-01', endDate: '2025-01-02' }
      await nextTick()
      expect(store.searchRoutingSlipParams.dateFilter).toEqual({ startDate: '2025-01-01', endDate: '2025-01-02' })

      mockPostSearchRoutingSlip.mockClear()
      f.status = 'ACTIVE'
      await nextTick()
      await nextTick()
      expect(store.searchRoutingSlipParams.status).toBe('ACTIVE')
      expect(mockPostSearchRoutingSlip).toHaveBeenCalledTimes(1)

      mockPostSearchRoutingSlip.mockClear()
      f.refundStatus = 'PROCESSING'
      await nextTick()
      await nextTick()
      expect(store.searchRoutingSlipParams.refundStatus).toBe('PROCESSING')
      expect(mockPostSearchRoutingSlip).toHaveBeenCalledTimes(1)
    })

    it('resetSearchFilters clears filters and searches', async () => {
      const composable = await useSearch()
      const { store } = useRoutingSlipStore()
      composable.filters.routingSlipNumber = 'abc'
      mockPostSearchRoutingSlip.mockClear()
      await composable.resetSearchFilters()
      await nextTick()
      await nextTick()
      expect(composable.filters.routingSlipNumber).toBeNull()
      expect(store.searchRoutingSlipParams.page).toBe(1)
      expect(mockPostSearchRoutingSlip).toHaveBeenCalled()
    })

    it('search triggers searchNow after a tick and debouncedSearch fires after the delay', async () => {
      vi.useFakeTimers()
      try {
        const composable = await useSearch()
        mockPostSearchRoutingSlip.mockClear()
        const p = composable.search()
        await vi.advanceTimersByTimeAsync(0)
        await p
        expect(mockPostSearchRoutingSlip).toHaveBeenCalledTimes(1)

        mockPostSearchRoutingSlip.mockClear()
        composable.debouncedSearch()
        composable.debouncedSearch()
        expect(mockPostSearchRoutingSlip).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(2000)
        expect(mockPostSearchRoutingSlip).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
