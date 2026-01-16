import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameTable } from '~/composables/eft/useShortNameTable'
import type { ShortNameSummaryState, EFTShortnameResponse } from '~/interfaces/eft-short-name'

const mockPayApi = vi.fn()
const mockToggleLoading = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    toggleLoading: mockToggleLoading
  })
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

function createState(): ShortNameSummaryState {
  return {
    results: [],
    totalResults: 0,
    filters: {
      isActive: false,
      pageNumber: 1,
      pageLimit: 20,
      filterPayload: {
        shortName: '',
        shortNameType: '' as never,
        creditsRemaining: '',
        linkedAccountsCount: '',
        paymentReceivedStartDate: '',
        paymentReceivedEndDate: ''
      }
    },
    loading: false,
    actionDropdown: [],
    options: {},
    shortNameLookupKey: 0,
    clearFiltersTrigger: 0,
    selectedShortName: {},
    accountLinkingErrorDialogTitle: '',
    accountLinkingErrorDialogText: '',
    isShortNameLinkingDialogOpen: false,
    highlightIndex: -1
  }
}

describe('useShortNameTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load table data successfully', async () => {
    const mockResponse = {
      items: [
        { id: 1, shortName: 'TEST', creditsRemaining: 1000, linkedAccountsCount: 2 }
      ] as EFTShortnameResponse[],
      total: 1
    }
    mockPayApi.mockResolvedValue(mockResponse)

    const state = createState()
    const { loadTableSummaryData } = useShortNameTable(state)

    await loadTableSummaryData()

    expect(state.results).toEqual(mockResponse.items)
    expect(state.totalResults).toBe(1)
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should build correct payload', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload.shortName = 'TEST'
    state.filters.filterPayload.creditsRemaining = '500'
    const { loadTableSummaryData } = useShortNameTable(state)

    await loadTableSummaryData()

    expect(mockPayApi).toHaveBeenCalledWith(
      expect.stringContaining('/eft-shortnames/summaries'),
      { method: 'GET' }
    )
  })

  it('should update filter and reload data', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { updateFilter } = useShortNameTable(state)

    await updateFilter('shortName', 'FILTERED')

    expect(state.filters.filterPayload.shortName).toBe('FILTERED')
    expect(state.filters.pageNumber).toBe(1)
  })

  it('should handle pagination with getNext', async () => {
    const page1 = {
      items: [{ id: 1, shortName: 'TEST1' }] as EFTShortnameResponse[],
      total: 2
    }
    const page2 = {
      items: [{ id: 2, shortName: 'TEST2' }] as EFTShortnameResponse[],
      total: 2
    }
    mockPayApi.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    const state = createState()
    const { getNext, loadState } = useShortNameTable(state)

    await getNext(true)
    expect(state.results).toHaveLength(1)

    await getNext(false)
    expect(state.results).toHaveLength(2)
    expect(loadState.reachedEnd).toBe(true)
  })

  it('should reset reached end', async () => {
    mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 1 })

    const state = createState()
    const { getNext, resetReachedEnd, loadState } = useShortNameTable(state)

    await getNext(true)
    expect(loadState.reachedEnd).toBe(true)

    resetReachedEnd()
    expect(loadState.reachedEnd).toBe(false)
    expect(loadState.isInitialLoad).toBe(true)
  })

  it('should handle empty shortNameType in payload', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload.shortNameType = '' as never
    const { loadTableSummaryData } = useShortNameTable(state)

    await loadTableSummaryData()

    expect(mockPayApi).toHaveBeenCalled()
  })

  it('should set isActive when filters have values', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload.shortName = 'TEST'
    const { loadTableSummaryData } = useShortNameTable(state)

    await loadTableSummaryData()

    expect(state.filters.isActive).toBe(true)
  })

  it('should not set isActive when filters are empty', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { loadTableSummaryData } = useShortNameTable(state)

    await loadTableSummaryData()

    expect(state.filters.isActive).toBe(false)
  })
})
