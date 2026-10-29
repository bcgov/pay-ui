import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createTableApiFetcher, useBaseTable, useInfiniteScroll } from '~/composables/common/useBaseTable'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', original => () => {
  const overrides: Record<PropertyKey, unknown> = {
    $payApi: vi.fn(),
    $payApiWithErrorHandling: mockPayApi
  }
  return new Proxy(original(), {
    get: (target, key, receiver) => key in overrides ? overrides[key] : Reflect.get(target, key, receiver)
  })
})

describe('useInfiniteScroll', () => {
  it('loads the first page on initial getNext and tracks reachedEnd', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [1], hasMore: false })
    const onLoadStart = vi.fn()
    const onLoadEnd = vi.fn()
    const s = useInfiniteScroll({ fetchPage, onLoadStart, onLoadEnd })
    await s.getNext(true)
    expect(fetchPage).toHaveBeenCalledWith(1, false)
    expect(s.loadState.isInitialLoad).toBe(false)
    expect(s.loadState.reachedEnd).toBe(true)
    expect(s.loadState.isLoading).toBe(false)
    expect(onLoadStart).toHaveBeenCalled()
    expect(onLoadEnd).toHaveBeenCalled()
  })

  it('appends the next page and stops once the end is reached', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], hasMore: true })
    const s = useInfiniteScroll({ fetchPage })
    await s.getNext(true)
    await s.getNext()
    expect(fetchPage).toHaveBeenLastCalledWith(2, true)
    expect(s.currentPage.value).toBe(2)
    fetchPage.mockResolvedValue({ items: [], hasMore: false })
    await s.getNext()
    await s.getNext()
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('ignores calls while loading', async () => {
    let release!: () => void
    const fetchPage = vi.fn().mockReturnValue(new Promise((r) => { release = () => r({ items: [], hasMore: true }) }))
    const s = useInfiniteScroll({ fetchPage })
    const first = s.getNext(true)
    await s.getNext(true)
    await s.loadPage(5)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    release()
    await first
  })

  it('marks end on error', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const s = useInfiniteScroll({ fetchPage: vi.fn().mockRejectedValue(new Error('x')) })
    await s.getNext(true)
    expect(s.loadState.reachedEnd).toBe(true)
    expect(s.loadState.isLoading).toBe(false)
    expect(err).toHaveBeenCalled()
  })

  it('reset restores initial state', async () => {
    const s = useInfiniteScroll({ fetchPage: vi.fn().mockResolvedValue({ items: [], hasMore: false }) })
    await s.getNext(true)
    s.reset()
    expect(s.loadState.reachedEnd).toBe(false)
    expect(s.loadState.isInitialLoad).toBe(true)
    expect(s.currentPage.value).toBe(1)
  })
})

describe('useBaseTable', () => {
  const makeState = () => reactive({
    results: [] as number[],
    totalResults: 0,
    stateTotal: 0,
    filters: {
      isActive: false,
      pageNumber: 1,
      pageLimit: 20,
      filterPayload: { name: '' } as Record<string, string>
    },
    loading: false
  })

  const setup = (response: unknown, extra: Record<string, unknown> = {}) => {
    const state = makeState()
    const fetchData = vi.fn().mockResolvedValue(response)
    const buildPayload = vi.fn((f: typeof state.filters) => ({ page: f.pageNumber, name: f.filterPayload.name }))
    const onLoadStart = vi.fn()
    const onLoadEnd = vi.fn()
    const table = useBaseTable({
      state,
      buildPayload,
      fetchData,
      extractItems: (r: { items: number[] }) => r.items,
      extractTotal: (r: { total: number }) => r.total,
      extractStateTotal: (r: { stateTotal: number }) => r.stateTotal,
      onLoadStart,
      onLoadEnd,
      ...extra
    } as never)
    return { state, fetchData, buildPayload, onLoadStart, onLoadEnd, table }
  }

  it('getNext(true) fetches page 1, cleans payload and stores totals', async () => {
    const { state, fetchData, table, onLoadStart, onLoadEnd } = setup({ items: [1, 2], total: 5, stateTotal: 9 })
    await table.getNext(true)
    expect(fetchData).toHaveBeenCalledWith({ page: 1 })
    expect(state.results).toEqual([1, 2])
    expect(state.totalResults).toBe(5)
    expect(state.stateTotal).toBe(9)
    expect(state.loading).toBe(false)
    expect(table.loadState.reachedEnd).toBe(false)
    expect(onLoadStart).toHaveBeenCalled()
    expect(onLoadEnd).toHaveBeenCalled()
  })

  it('getNext appends the next page and flips filters.isActive', async () => {
    const { state, fetchData, table } = setup({ items: [3], total: 3, stateTotal: 3 })
    state.results = [1, 2]
    state.filters.filterPayload.name = 'abc'
    await table.getNext(true)
    await table.getNext()
    expect(state.filters.isActive).toBe(true)
    expect(fetchData).toHaveBeenCalledTimes(1 + (table.loadState.reachedEnd ? 0 : 1))
  })

  it('treats an empty response as the end of data', async () => {
    const { state, table } = setup(null)
    await table.getNext(true)
    expect(state.results).toEqual([])
    expect(table.loadState.reachedEnd).toBe(true)
  })

  it('loadTableData replaces results and sets reachedEnd', async () => {
    const { state, table } = setup({ items: [1, 2], total: 2, stateTotal: 2 })
    await table.loadTableData()
    expect(state.results).toEqual([1, 2])
    expect(table.loadState.reachedEnd).toBe(true)
    expect(state.loading).toBe(false)
  })

  it('loadTableData appends when requested', async () => {
    const { state, table } = setup({ items: [3], total: 10, stateTotal: 10 })
    state.results = [1, 2]
    await table.loadTableData(undefined, undefined, true)
    expect(state.results).toEqual([1, 2, 3])
    expect(table.loadState.reachedEnd).toBe(false)
  })

  it('loadTableData applies a filter, resets page and ignores append', async () => {
    const { state, fetchData, table } = setup({ items: [9], total: 1, stateTotal: 1 })
    state.results = [1]
    state.filters.pageNumber = 3
    await table.loadTableData('name', 'bob', true)
    expect(state.filters.filterPayload.name).toBe('bob')
    expect(state.filters.pageNumber).toBe(1)
    expect(state.filters.isActive).toBe(true)
    expect(state.results).toEqual([9])
    expect(fetchData).toHaveBeenCalledWith({ page: 1, name: 'bob' })
  })

  it('loadTableData does not treat col "page" or empty values as a filter', async () => {
    const { state, table } = setup({ items: [], total: 0, stateTotal: 0 })
    await table.loadTableData('page', 2)
    await table.loadTableData('name', '')
    expect(state.filters.filterPayload).toEqual({ name: '' })
  })

  it('loadTableData skips when already loading', async () => {
    const { fetchData, table } = setup({ items: [], total: 0, stateTotal: 0 })
    table.loadState.isLoading = true
    await table.loadTableData()
    expect(fetchData).not.toHaveBeenCalled()
  })

  it('loadTableData logs fetch errors and resets loading flags', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { state, fetchData, table, onLoadEnd } = setup({})
    fetchData.mockRejectedValue(new Error('boom'))
    await table.loadTableData()
    expect(err).toHaveBeenCalled()
    expect(state.loading).toBe(false)
    expect(table.loadState.isLoading).toBe(false)
    expect(onLoadEnd).toHaveBeenCalled()
  })

  it('loadTableData works without response or callbacks', async () => {
    const state = makeState()
    const table = useBaseTable({
      state,
      buildPayload: () => ({}),
      fetchData: vi.fn().mockResolvedValue(null),
      extractItems: () => [],
      extractTotal: () => 0,
      extractStateTotal: () => 0
    })
    await table.loadTableData()
    await table.getNext(true)
    expect(state.results).toEqual([])
  })

  it('updateFilter resets page and loads with the filter', async () => {
    const { state, fetchData, table } = setup({ items: [1], total: 1, stateTotal: 1 })
    state.filters.pageNumber = 4
    table.updateFilter('name', 'z')
    await vi.waitFor(() => expect(fetchData).toHaveBeenCalled())
    expect(state.filters.filterPayload.name).toBe('z')
    expect(state.filters.pageNumber).toBe(1)
  })
})

describe('createTableApiFetcher', () => {
  it('drops empty params and builds the query string', async () => {
    mockPayApi.mockResolvedValue({ ok: true })
    const res = await createTableApiFetcher('/things')({ a: '1', b: '', c: null, d: undefined })
    expect(res).toEqual({ ok: true })
    const [url, opts] = mockPayApi.mock.calls[0]!
    expect(url).toMatch(/^\/things\?/)
    expect(url).toContain('a=1')
    expect(url).not.toContain('b=')
    expect(url).not.toContain('c=')
    expect(opts).toEqual({ method: 'GET' })
  })

  it('omits the query string when there are no params', async () => {
    mockPayApi.mockResolvedValue({})
    await createTableApiFetcher('/things')({ a: '' })
    expect(mockPayApi).toHaveBeenCalledWith('/things', { method: 'GET' })
  })
})
