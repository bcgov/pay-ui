import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { getTransactionsTableHeaders, useTransactionsTable } from '~/composables/transactions/useTransactionsTable'

const { mockPayApi, mockAuthUser } = vi.hoisted(() => ({
  mockPayApi: vi.fn(),
  mockAuthUser: { value: { roles: [] as string[] } }
}))

vi.mock('lodash/throttle', () => ({ default: (fn: unknown) => fn }))

mockNuxtImport('useI18n', () => () => ({ t: (k: string) => k }))

mockNuxtImport('useConnectAuth', () => () => ({ authUser: mockAuthUser }))

mockNuxtImport('useNuxtApp', original => () => {
  const overrides: Record<PropertyKey, unknown> = {
    $payApi: vi.fn(),
    $payApiWithErrorHandling: mockPayApi
  }
  return new Proxy(original(), {
    get: (target, key, receiver) => key in overrides ? overrides[key] : Reflect.get(target, key, receiver)
  })
})

describe('getTransactionsTableHeaders', () => {
  it('returns 15 columns with expected defaults', () => {
    const headers = getTransactionsTableHeaders((k: string) => k)
    expect(headers).toHaveLength(15)
    const shown = headers.filter(h => h.display).map(h => h.accessorKey)
    expect(shown).toEqual([
      'accountName', 'lineItems', 'createdOn', 'total', 'paymentMethod', 'statusCode', 'downloads', 'actions'
    ])
    expect(headers.find(h => h.accessorKey === 'actions')).toMatchObject({ hideInSearchColumnFilter: true })
  })
})

describe('useTransactionsTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockAuthUser.value = { roles: [] }
    mockPayApi.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('initialises headers from defaults and exposes pinning', async () => {
    const t = await useTransactionsTable()
    expect(t.searchTransactionsTableHeaders.value).toHaveLength(15)
    expect(t.columnPinning.value).toEqual({ right: ['actions'] })
    expect(t.columnVisibility.value.accountName).toBe(true)
    expect(t.columnVisibility.value.product).toBe(false)
    expect(t.loadState).toEqual({ reachedEnd: false, isLoading: false, isInitialLoad: true })
  })

  it('restores headers and visibility from the store', async () => {
    const store = useTransactionsStore()
    store.store.searchTransactionsTableHeaders = [
      { accessorKey: 'a', header: 'A', display: true },
      { accessorKey: 'b', header: 'B' }
    ] as never
    store.store.searchColumnVisibility = { a: false }
    const t = await useTransactionsTable()
    expect(t.columnVisibility.value).toEqual({ a: false, b: true })
  })

  it('updates headers and store when columnVisibility is set', async () => {
    const t = await useTransactionsTable()
    t.columnVisibility.value = { total: false, product: true }
    expect(t.columnVisibility.value.total).toBe(false)
    expect(t.columnVisibility.value.product).toBe(true)
    expect(useTransactionsStore().store.searchColumnVisibility).toMatchObject({ total: false, product: true })
  })

  it('syncs header display changes into the store via watch', async () => {
    const t = await useTransactionsTable()
    const header = t.searchTransactionsTableHeaders.value.find(h => h.accessorKey === 'createdOn')!
    header.display = false
    await nextTick()
    expect(useTransactionsStore().store.searchColumnVisibility.createdOn).toBe(false)
  })

  describe('setViewAll', () => {
    it('rejects unauthorized users', async () => {
      const t = await useTransactionsTable()
      t.setViewAll(true)
      expect(console.error).toHaveBeenCalledWith('User is not authorized to view all transactions.')
      mockPayApi.mockResolvedValue({ items: [], hasMore: false })
      await t.loadTransactionList()
      expect(mockPayApi.mock.calls[0]![1].query.viewAll).toBeUndefined()
    })

    it.each(['view_all_transactions', 'product_refund_viewer'])('allows role %s', async (role) => {
      mockAuthUser.value = { roles: [role] }
      const t = await useTransactionsTable()
      t.setViewAll(true)
      mockPayApi.mockResolvedValue({ items: [], hasMore: false })
      await t.loadTransactionList()
      expect(mockPayApi.mock.calls[0]![1].query.viewAll).toBe('true')
    })

    it('can always switch viewAll off', async () => {
      mockAuthUser.value = { roles: ['view_all_transactions'] }
      const t = await useTransactionsTable()
      t.setViewAll(true)
      t.setViewAll(false)
      mockPayApi.mockResolvedValue({ items: [], hasMore: false })
      await t.loadTransactionList()
      expect(mockPayApi.mock.calls[0]![1].query.viewAll).toBeUndefined()
    })
  })

  describe('loadTransactionList', () => {
    it('loads page 1 with paging query and excludeCounts body', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 1 }, { id: 2 }], hasMore: true })
      const t = await useTransactionsTable()
      await t.loadTransactionList()
      expect(mockPayApi).toHaveBeenCalledWith('/accounts/undefined/payments/queries', {
        method: 'POST',
        body: { dateFilter: { startDate: '', endDate: '', isDefault: false }, excludeCounts: true },
        query: { page: '1', limit: '20' }
      })
      expect(t.transactions.results).toEqual([{ id: 1 }, { id: 2 }])
      expect(t.loadState).toMatchObject({ reachedEnd: false, isInitialLoad: false, isLoading: false })
      expect(t.transactions.loading).toBe(false)
      expect(t.transactions.filters.isActive).toBe(false)
    })

    it('applies a filter, resets the page and marks filters active', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 9 }], hasMore: false })
      const t = await useTransactionsTable()
      t.transactions.filters.pageNumber = 3
      t.loadState.reachedEnd = true
      await t.loadTransactionList('accountName', 'abc')
      expect(t.transactions.filters.pageNumber).toBe(1)
      expect(t.transactions.filters.isActive).toBe(true)
      expect(mockPayApi.mock.calls[0]![1].body.accountName).toBe('abc')
      expect(t.loadState.reachedEnd).toBe(true)
      expect(t.transactions.results).toEqual([{ id: 9 }])
    })

    it('marks active when the date filter has an end date', async () => {
      mockPayApi.mockResolvedValue({ items: [], hasMore: false })
      const t = await useTransactionsTable()
      t.transactions.filters.filterPayload.dateFilter.endDate = '2024-01-02'
      await t.loadTransactionList()
      expect(t.transactions.filters.isActive).toBe(true)
    })

    it('appends results on later pages', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 3 }], hasMore: true })
      const t = await useTransactionsTable()
      t.transactions.results = [{ id: 1 }] as never
      t.transactions.filters.pageNumber = 2
      await t.loadTransactionList()
      expect(t.transactions.results).toEqual([{ id: 1 }, { id: 3 }])
    })

    it('handles a response without items', async () => {
      mockPayApi.mockResolvedValue({ hasMore: false })
      const t = await useTransactionsTable()
      await t.loadTransactionList()
      expect(t.transactions.results).toEqual([])
    })

    it('ends loading when there is no response', async () => {
      mockPayApi.mockResolvedValue(undefined)
      const t = await useTransactionsTable()
      await t.loadTransactionList()
      expect(console.error).toHaveBeenCalledWith('No response from getTransactions')
      expect(t.loadState.reachedEnd).toBe(true)
      expect(t.loadState.isLoading).toBe(false)
    })

    it('ends loading on API errors', async () => {
      mockPayApi.mockRejectedValue(new Error('boom'))
      const t = await useTransactionsTable()
      await t.loadTransactionList()
      expect(console.error).toHaveBeenCalledWith('Failed to get transaction list.', expect.any(Error))
      expect(t.loadState.reachedEnd).toBe(true)
      expect(t.transactions.loading).toBe(false)
    })

    it('ignores stale responses', async () => {
      let resolveFirst!: (v: unknown) => void
      mockPayApi.mockReturnValueOnce(new Promise((r) => { resolveFirst = r }))
      mockPayApi.mockResolvedValueOnce({ items: [{ id: 2 }], hasMore: false })
      const t = await useTransactionsTable()
      const first = t.loadTransactionList()
      await t.loadTransactionList('accountName', 'x')
      resolveFirst({ items: [{ id: 1 }], hasMore: true })
      await first
      expect(t.transactions.results).toEqual([{ id: 2 }])
      expect(t.loadState.reachedEnd).toBe(true)
    })

    it('ignores stale errors', async () => {
      let rejectFirst!: (e: unknown) => void
      mockPayApi.mockReturnValueOnce(new Promise((_r, rej) => { rejectFirst = rej }))
      mockPayApi.mockResolvedValueOnce({ items: [], hasMore: true })
      const t = await useTransactionsTable()
      const first = t.loadTransactionList()
      await t.loadTransactionList('accountName', 'x')
      rejectFirst(new Error('late'))
      await first
      expect(console.error).not.toHaveBeenCalled()
      expect(t.loadState.reachedEnd).toBe(false)
    })
  })

  describe('getNext', () => {
    it('does nothing while loading or at the end', async () => {
      const t = await useTransactionsTable()
      t.loadState.isLoading = true
      await t.getNext()
      t.loadState.isLoading = false
      t.loadState.reachedEnd = true
      await t.getNext()
      expect(mockPayApi).not.toHaveBeenCalled()
      expect(t.transactions.filters.pageNumber).toBe(1)
    })

    it('increments the page and loads', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 5 }], hasMore: true })
      const t = await useTransactionsTable()
      await t.getNext()
      expect(t.transactions.filters.pageNumber).toBe(2)
      expect(mockPayApi.mock.calls[0]![1].query.page).toBe('2')
      expect(t.transactions.results).toEqual([{ id: 5 }])
    })
  })

  it('clearAllFilters resets payload and state', async () => {
    const t = await useTransactionsTable()
    t.transactions.filters.filterPayload = { accountName: 'x' } as never
    t.transactions.filters.isActive = true
    t.transactions.filters.pageNumber = 4
    t.loadState.reachedEnd = true
    t.loadState.isInitialLoad = false
    t.clearAllFilters()
    expect(t.transactions.filters.filterPayload).toEqual({
      dateFilter: { startDate: '', endDate: '', isDefault: false }
    })
    expect(t.transactions.filters.isActive).toBe(false)
    expect(t.transactions.filters.pageNumber).toBe(1)
    expect(t.loadState).toMatchObject({ reachedEnd: false, isInitialLoad: true })
  })
})
