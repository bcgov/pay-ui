import type { ShortNameFilterPayload } from '@/interfaces/eft-short-name'

export const useEftStore = defineStore('eft-store', () => {
  const tabIndex = ref(0)
  const summaryFilter = ref<ShortNameFilterPayload | null>(null)

  function setTabIndex(index: number) {
    tabIndex.value = index
  }

  function setSummaryFilter(filter: ShortNameFilterPayload | null) {
    summaryFilter.value = filter
  }

  function clearSummaryFilter() {
    summaryFilter.value = null
  }

  return {
    tabIndex,
    summaryFilter,
    setTabIndex,
    setSummaryFilter,
    clearSummaryFilter
  }
})
