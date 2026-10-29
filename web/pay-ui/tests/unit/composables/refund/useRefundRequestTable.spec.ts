import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRefundRequestTable } from '~/composables/refund/useRefundRequestTable'
import type { RefundRequestState } from '~/interfaces/refund-requests'

const { mockPayApi, mockToggleLoading } = vi.hoisted(() => ({
  mockPayApi: vi.fn(),
  mockToggleLoading: vi.fn()
}))

mockNuxtImport('useNuxtApp', original => () => {
  const overrides: Record<PropertyKey, unknown> = {
    $payApi: mockPayApi,
    $payApiWithErrorHandling: mockPayApi
  }
  return new Proxy(original(), {
    get: (target, key, receiver) => key in overrides ? overrides[key] : Reflect.get(target, key, receiver)
  })
})

vi.mock('~/composables/common/useLoader', async importOriginal => ({
  ...(await importOriginal<typeof import('~/composables/common/useLoader')>()),
  useLoader: () => ({ isLoading: ref(false), isThereActiveCalls: ref(false), toggleLoading: mockToggleLoading })
}))

function createState(filterPayload: Record<string, string> = {}): RefundRequestState {
  return reactive({
    results: [],
    totalResults: 0,
    stateTotal: 0,
    filters: {
      isActive: false,
      pageNumber: 1,
      pageLimit: 20,
      filterPayload
    },
    loading: false
  }) as unknown as RefundRequestState
}

describe('useRefundRequestTable', () => {
  it('exposes the table API', () => {
    const table = useRefundRequestTable(createState())
    expect(table).toEqual(expect.objectContaining({
      loadTableData: expect.any(Function),
      updateFilter: expect.any(Function),
      loadState: expect.any(Object),
      getNext: expect.any(Function),
      resetReachedEnd: expect.any(Function)
    }))
  })

  it('fetches /refunds with page, limit and non-empty filters and stores the results', async () => {
    const items = [{ refundId: 1 }, { refundId: 2 }]
    mockPayApi.mockResolvedValue({ items, total: 5, statusTotal: 3 })
    const state = createState({ refundStatus: 'PENDING', requestedBy: '' })
    const { getNext, loadState } = useRefundRequestTable(state)

    await getNext(true)

    expect(mockPayApi).toHaveBeenCalledTimes(1)
    const [url, options] = mockPayApi.mock.calls[0]!
    expect(options).toEqual({ method: 'GET' })
    const [path, query] = (url as string).split('?')
    expect(path).toBe('/refunds')
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      page: '1',
      limit: '20',
      refundStatus: 'PENDING'
    })
    expect(state.results).toEqual(items)
    expect(state.totalResults).toBe(5)
    expect(state.stateTotal).toBe(3)
    expect(state.filters.isActive).toBe(true)
    expect(loadState.reachedEnd).toBe(false)
    expect(mockToggleLoading).toHaveBeenNthCalledWith(1, true)
    expect(mockToggleLoading).toHaveBeenLastCalledWith(false)
  })

  it('falls back to empty items and zero totals when the response omits them', async () => {
    mockPayApi.mockResolvedValue({})
    const state = createState()
    const { getNext, loadState } = useRefundRequestTable(state)

    await getNext(true)

    expect(state.results).toEqual([])
    expect(state.totalResults).toBe(0)
    expect(state.stateTotal).toBe(0)
    expect(state.filters.isActive).toBe(false)
    expect(loadState.reachedEnd).toBe(true)
  })

  it('updateFilter resets to page 1 and reloads with the new filter', async () => {
    mockPayApi.mockResolvedValue({ items: [{ refundId: 9 }], total: 1 })
    const state = createState()
    state.filters.pageNumber = 4
    const { updateFilter } = useRefundRequestTable(state)

    updateFilter('refundStatus', 'APPROVED')
    await vi.waitFor(() => expect(state.loading).toBe(false))

    const query = (mockPayApi.mock.calls[0]![0] as string).split('?')[1]
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      page: '1',
      limit: '20',
      refundStatus: 'APPROVED'
    })
    expect(state.results).toEqual([{ refundId: 9 }])
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenLastCalledWith(false)
  })
})
