import { createPinia, setActivePinia } from 'pinia'
import { useRefundRequestsStore } from '~/stores/refund-requests-store'
import type { RefundRequestFilterPayload } from '~/interfaces/refund-requests'

describe('refund-requests-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has the expected initial state', () => {
    const store = useRefundRequestsStore()
    expect(store.tabIndex).toBe(0)
    expect(store.refundRequestsFilter).toBeNull()
    expect(store.tableSettings).toBeNull()
  })

  it('sets the tab index', () => {
    const store = useRefundRequestsStore()
    store.setTabIndex(1)
    expect(store.tabIndex).toBe(1)
  })

  it('sets and clears the filter', () => {
    const store = useRefundRequestsStore()
    const filter = { refundStatus: 'PENDING' } as unknown as RefundRequestFilterPayload
    store.setFilter(filter)
    expect(store.refundRequestsFilter).toEqual(filter)
    store.clearFilter()
    expect(store.refundRequestsFilter).toBeNull()
  })

  it('sets and clears table settings', () => {
    const store = useRefundRequestsStore()
    const settings = { pageNumber: 3 } as unknown as RefundRequestsTableSettings
    store.setTableSettings(settings)
    expect(store.tableSettings).toEqual(settings)
    store.clearTableSettings()
    expect(store.tableSettings).toBeNull()
  })
})
