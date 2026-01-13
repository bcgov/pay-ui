import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSearch } from '~/composables/dashboard/useSearch'
import { chequeRefundCodes } from '~/utils/constants'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { RoutingSlipDetails } from '~/interfaces/routing-slip'
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

  it('should be defined, return all expected properties, and initialize with defaults', async () => {
    const composable = await useSearch()
    expect(composable).toBeDefined()
    expect(composable.searchRoutingSlipTableHeaders).toBeDefined()
    expect(composable.searchNow).toBeDefined()
    expect(composable.debouncedSearch).toBeDefined()
    expect(composable.searchRoutingSlipResult).toBeDefined()
    expect(composable.getStatusLabel).toBeDefined()
    expect(composable.searchParamsExist).toBeDefined()
    expect(composable.formatFolioResult).toBeDefined()
    expect(composable.showExpandedFolio).toBeDefined()
    expect(composable.showExpandedCheque).toBeDefined()
    expect(composable.toggleFolio).toBeDefined()
    expect(composable.toggleCheque).toBeDefined()
    expect(composable.isLoading).toBeDefined()
    expect(composable.getNext).toBeDefined()
    expect(composable.getRefundStatusText).toBeDefined()
    expect(composable.getStatusFromRefundStatus).toBeDefined()
    expect(composable.updateSearchFilter).toBeDefined()
    expect(composable.clearFilter).toBeDefined()
    expect(composable.filters).toBeDefined()
    expect(composable.routingSlips).toBeDefined()
    expect(composable.columnPinning).toBeDefined()
    expect(composable.isInitialLoad).toBeDefined()
    expect(composable.columnVisibility).toBeDefined()
    expect(composable.resetSearchFilters).toBeDefined()
    expect(composable.search).toBeDefined()
    expect(composable.resetSearchParams).toBeDefined()

    const { store } = useRoutingSlipStore()
    expect(store.searchRoutingSlipParams.page).toBe(1)
    expect(store.searchRoutingSlipParams.limit).toBe(50)
    expect(composable.filters.routingSlipNumber).toBeNull()
    expect(composable.filters.receiptNumber).toBeNull()
    expect(composable.filters.accountName).toBeNull()
    expect(composable.filters.status).toBeNull()
    expect(composable.filters.refundStatus).toBeNull()
  })

  it('should handle search operations, loading, results, params reset, and filter updates', async () => {
    const composable = await useSearch()
    await composable.searchNow()
    expect(mockPostSearchRoutingSlip).toHaveBeenCalled()
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)

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
    store.searchRoutingSlipResult = [
      {
        number: '123',
        status: 'ACTIVE',
        routingSlipDate: '2025-09-26',
        invoices: [],
        paymentAccount: null,
        payments: []
      }
    ] as Partial<Invoice>[]

    await nextTick()
    expect(composable.routingSlips.value).toBeDefined()
    expect(Array.isArray(composable.routingSlips.value)).toBe(true)
  })

  it('should compute columnVisibility from table headers', async () => {
    const composable = await useSearch()
    expect(composable.columnVisibility.value).toBeDefined()
  })

  it('should not call getNext if isLoading is true', async () => {
    const composable = await useSearch()
    mockIsLoading.value = true

    await composable.getNext()

    expect(mockPostSearchRoutingSlip).not.toHaveBeenCalled()
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
    mockPostSearchRoutingSlip.mockImplementation(() => {
      throw new Error('API error')
    })

    await composable.getNext(false)
    await nextTick()

    expect(composable.isLoading.value).toBe(false)
    expect(composable.reachedEnd.value).toBe(true)
  })
})
