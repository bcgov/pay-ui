import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSearch } from '~/composables/dashboard/useSearch'
import { chequeRefundCodes } from '~/utils/constants'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const mockGetSearchRoutingSlip = vi.fn()
const mockGetCodes = vi.fn()
const mockPayApi = {
  getSearchRoutingSlip: mockGetSearchRoutingSlip,
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
    mockGetSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: [],
      total: 0
    }))
    mockIsLoading.value = false
    mockToggleLoading.mockImplementation((value: boolean) => {
      mockIsLoading.value = value
    })
  })

  it('should be defined', async () => {
    const composable = await useSearch()
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', async () => {
    const composable = await useSearch()
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
  })

  it('should initialize with default search params', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    expect(store.searchRoutingSlipParams.page).toBe(1)
    expect(store.searchRoutingSlipParams.limit).toBe(50)
  })

  it('should initialize filters with null values', async () => {
    const composable = await useSearch()
    expect(composable.filters.routingSlipNumber).toBeNull()
    expect(composable.filters.receiptNumber).toBeNull()
    expect(composable.filters.accountName).toBeNull()
    expect(composable.filters.status).toBeNull()
    expect(composable.filters.refundStatus).toBeNull()
  })

  it('should call searchRoutingSlip when searchNow is called', async () => {
    const composable = await useSearch()
    await composable.searchNow()
    expect(mockGetSearchRoutingSlip).toHaveBeenCalled()
  })

  it('should toggle loading when searchNow is called', async () => {
    const composable = await useSearch()
    await composable.searchNow()
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should update searchRoutingSlipResult when search is successful', async () => {
    const mockItems = [
      { number: '123', status: 'ACTIVE' },
      { number: '456', status: 'COMPLETED' }
    ]
    mockGetSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: mockItems,
      total: 2
    }))

    const composable = await useSearch()
    await composable.searchNow()
    const { store } = useRoutingSlipStore()
    expect(store.searchRoutingSlipResult.length).toBe(2)
  })

  it('should reset search params when resetSearchParams is called', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipParams.page = 5
    store.searchRoutingSlipParams.limit = 100
    store.searchRoutingSlipParams.total = 10
    store.searchRoutingSlipResult.push({} as any)

    composable.resetSearchParams()

    expect(store.searchRoutingSlipParams.page).toBe(1)
    expect(store.searchRoutingSlipParams.limit).toBe(50)
    expect(store.searchRoutingSlipParams.total).toBe(Infinity)
    expect(store.searchRoutingSlipResult.length).toBe(0)
  })

  it('should update search filter when updateSearchFilter is called', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()

    composable.updateSearchFilter({ routingSlipNumber: '123' })
    await nextTick()

    expect(store.searchRoutingSlipParams.routingSlipNumber).toBe('123')
  })

  it('should clear filter and search when clearFilter is called', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipParams.routingSlipNumber = '123'
    store.searchRoutingSlipParams.page = 5

    await composable.clearFilter()

    expect(mockGetSearchRoutingSlip).toHaveBeenCalled()
    expect(store.searchRoutingSlipParams.page).toBe(1)
  })

  it('should toggle folio expansion', async () => {
    const composable = await useSearch()
    composable.toggleFolio('folio-1')
    expect(composable.showExpandedFolio.value).toContain('folio-1')

    composable.toggleFolio('folio-1')
    expect(composable.showExpandedFolio.value).not.toContain('folio-1')
  })

  it('should toggle cheque expansion', async () => {
    const composable = await useSearch()
    composable.toggleCheque('cheque-1')
    expect(composable.showExpandedCheque.value).toContain('cheque-1')

    composable.toggleCheque('cheque-1')
    expect(composable.showExpandedCheque.value).not.toContain('cheque-1')
  })

  it('should format folio result from invoices', async () => {
    const composable = await useSearch()
    const invoices = [
      { businessIdentifier: 'BI1' },
      { businessIdentifier: 'BI2' }
    ] as any[]

    const result = composable.formatFolioResult(invoices, null)
    expect(result).toEqual(['BI1', 'BI2'])
  })

  it('should return business identifier if search params not changed and business identifier provided', async () => {
    const composable = await useSearch()

    // formatFolioResult returns businessIdentifier when searchParamsChanged is false and businessIdentifier is provided
    const result = composable.formatFolioResult([], 'BI123')
    expect(result).toEqual(['BI123'])
  })

  it('should return ["-"] if no folios found', async () => {
    const composable = await useSearch()
    const result = composable.formatFolioResult([], null)
    expect(result).toEqual(['-'])
  })

  it('should get status label', async () => {
    const composable = await useSearch()
    const label = composable.getStatusLabel('ACTIVE')
    expect(mockStatusLabel).toHaveBeenCalledWith('ACTIVE')
  })

  it('should get refund status text', async () => {
    const composable = await useSearch()
    const text = composable.getRefundStatusText(chequeRefundCodes.PROCESSED)
    expect(text).toBeDefined()
  })

  it('should get status from refund status', async () => {
    const composable = await useSearch()
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
    ] as any[]

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

    expect(mockGetSearchRoutingSlip).not.toHaveBeenCalled()
  })

  it('should append results when getNext is called', async () => {
    const composable = await useSearch()
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipResult = [{ number: '1' }] as any[]
    store.searchRoutingSlipParams.page = 1
    store.searchRoutingSlipParams.total = 100
    store.searchRoutingSlipParams.limit = 50

    mockGetSearchRoutingSlip.mockImplementation(() => Promise.resolve({
      items: [{ number: '2' }],
      total: 2
    }))

    await composable.getNext(false)
    await nextTick()

    expect(mockGetSearchRoutingSlip).toHaveBeenCalled()
  })
})
