import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useLinkedShortNameTable } from '~/composables/eft/useLinkedShortNameTable'
import type { LinkedShortNameState, LinkedShortNameItem } from '~/interfaces/eft-short-name'

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

function createState(): LinkedShortNameState {
  return {
    results: [],
    totalResults: 0,
    filters: {
      isActive: false,
      pageNumber: 1,
      pageLimit: 20,
      filterPayload: {
        shortName: '',
        shortNameType: '',
        accountName: '',
        accountNumber: '',
        branchName: '',
        amountOwing: '',
        statementId: ''
      }
    },
    loading: false
  }
}

describe('useLinkedShortNameTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load table data successfully', async () => {
    const mockResponse = {
      items: [
        {
          id: 1,
          shortName: 'TEST',
          shortNameId: 123,
          accountId: 'ACC1',
          accountName: 'Test Account',
          accountBranch: 'Vancouver',
          amountOwing: 500,
          statementId: 789,
          shortNameType: 'EFT',
          statusCode: 'LINKED',
          casSupplierNumber: null,
          casSupplierSite: null,
          cfsAccountStatus: null,
          email: null,
          createdOn: '2024-01-01'
        }
      ] as LinkedShortNameItem[],
      total: 1
    }
    mockPayApi.mockResolvedValue(mockResponse)

    const state = createState()
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(state.results).toEqual(mockResponse.items)
    expect(state.totalResults).toBe(1)
  })

  it('should build payload with LINKED state', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(mockPayApi).toHaveBeenCalledWith(
      expect.stringContaining('state=LINKED'),
      { method: 'GET' }
    )
  })

  it('should map accountNumber to accountId in payload', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload.accountNumber = '12345'
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(mockPayApi).toHaveBeenCalledWith(
      expect.stringContaining('accountId=12345'),
      { method: 'GET' }
    )
  })

  it('should update filter and reload data', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { updateFilter } = useLinkedShortNameTable(state)

    await updateFilter('shortName', 'FILTERED')

    expect(state.filters.filterPayload.shortName).toBe('FILTERED')
    expect(state.filters.pageNumber).toBe(1)
    expect(mockPayApi).toHaveBeenCalled()
  })

  it('should handle pagination with getNext', async () => {
    const page1 = {
      items: [{ id: 1, shortName: 'TEST1' }] as LinkedShortNameItem[],
      total: 2
    }
    const page2 = {
      items: [{ id: 2, shortName: 'TEST2' }] as LinkedShortNameItem[],
      total: 2
    }
    mockPayApi.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    const state = createState()
    const { getNext, loadState } = useLinkedShortNameTable(state)

    await getNext(true)
    expect(state.results).toHaveLength(1)

    await getNext(false)
    expect(state.results).toHaveLength(2)
    expect(loadState.reachedEnd).toBe(true)
  })

  it('should reset reached end', async () => {
    mockPayApi.mockResolvedValue({ items: [{ id: 1 }], total: 1 })

    const state = createState()
    const { getNext, resetReachedEnd, loadState } = useLinkedShortNameTable(state)

    await getNext(true)
    expect(loadState.reachedEnd).toBe(true)

    resetReachedEnd()
    expect(loadState.reachedEnd).toBe(false)
  })

  it('should handle all filter fields', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload = {
      shortName: 'SN',
      shortNameType: 'EFT',
      accountName: 'Account',
      accountNumber: '123',
      branchName: 'Branch',
      amountOwing: '500',
      statementId: '789'
    }
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(mockPayApi).toHaveBeenCalled()
  })

  it('should set isActive when filters have values', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    state.filters.filterPayload.shortName = 'TEST'
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(state.filters.isActive).toBe(true)
  })

  it('should not set isActive when filters are empty', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(state.filters.isActive).toBe(false)
  })

  it('should handle empty response', async () => {
    mockPayApi.mockResolvedValue({ items: [], total: 0 })

    const state = createState()
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(state.results).toEqual([])
    expect(state.totalResults).toBe(0)
  })

  it('should handle null items in response', async () => {
    mockPayApi.mockResolvedValue({ items: null, total: 0 })

    const state = createState()
    const { loadTableData } = useLinkedShortNameTable(state)

    await loadTableData()

    expect(state.results).toEqual([])
  })
})
