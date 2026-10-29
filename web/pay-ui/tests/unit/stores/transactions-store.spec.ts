import { createPinia, setActivePinia } from 'pinia'
import { useTransactionsStore } from '~/stores/transactions-store'

describe('transactions-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has empty defaults', () => {
    const s = useTransactionsStore()
    expect(s.tabIndex).toBe(0)
    expect(s.transactionFilter).toBeNull()
    expect(s.tableSettings).toBeNull()
    expect(s.store.searchTransactionsTableHeaders).toEqual([])
    expect(s.store.searchColumnVisibility).toEqual({})
  })

  it('sets the tab index', () => {
    const s = useTransactionsStore()
    s.setTabIndex(2)
    expect(s.tabIndex).toBe(2)
  })

  it('sets and clears the filter', () => {
    const s = useTransactionsStore()
    s.setFilter({ accountName: 'abc' } as never)
    expect(s.transactionFilter).toEqual({ accountName: 'abc' })
    s.clearFilter()
    expect(s.transactionFilter).toBeNull()
    s.setFilter({ product: 'BUSINESS' } as never)
    s.setFilter(null)
    expect(s.transactionFilter).toBeNull()
  })

  it('sets and clears table settings', () => {
    const s = useTransactionsStore()
    const settings = { filterPayload: { folioNumber: 'F1' }, pageNumber: 3 }
    s.setTableSettings(settings as never)
    expect(s.tableSettings).toEqual(settings)
    s.clearTableSettings()
    expect(s.tableSettings).toBeNull()
    s.setTableSettings(settings as never)
    s.setTableSettings(null)
    expect(s.tableSettings).toBeNull()
  })

  it('keeps column visibility reactive', () => {
    const s = useTransactionsStore()
    s.store.searchColumnVisibility.total = false
    expect(s.store.searchColumnVisibility).toEqual({ total: false })
  })
})
