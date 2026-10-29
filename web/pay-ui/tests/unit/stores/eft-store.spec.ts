import { createPinia, setActivePinia } from 'pinia'
import { useEftStore } from '~/stores/eft-store'
import type { ShortNameFilterPayload, EftTableSettings } from '~/interfaces/eft-short-name'

describe('eft-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has the expected initial state', () => {
    const store = useEftStore()
    expect(store.tabIndex).toBe(0)
    expect(store.summaryFilter).toBeNull()
    expect(store.summaryTableSettings).toBeNull()
    expect(store.linkedTableSettings).toBeNull()
  })

  it('sets the tab index', () => {
    const store = useEftStore()
    store.setTabIndex(2)
    expect(store.tabIndex).toBe(2)
  })

  it('sets and clears the summary filter', () => {
    const store = useEftStore()
    const filter = { shortName: 'ABC' } as unknown as ShortNameFilterPayload
    store.setSummaryFilter(filter)
    expect(store.summaryFilter).toEqual(filter)
    store.clearSummaryFilter()
    expect(store.summaryFilter).toBeNull()
  })

  it('sets and clears table settings independently', () => {
    const store = useEftStore()
    const summary = { pageNumber: 2 } as unknown as EftTableSettings
    const linked = { pageNumber: 3 } as unknown as EftTableSettings

    store.setSummaryTableSettings(summary)
    expect(store.summaryTableSettings).toEqual(summary)
    expect(store.linkedTableSettings).toBeNull()

    store.setLinkedTableSettings(linked)
    expect(store.linkedTableSettings).toEqual(linked)

    store.clearTableSettings()
    expect(store.summaryTableSettings).toBeNull()
    expect(store.linkedTableSettings).toBeNull()
  })
})
