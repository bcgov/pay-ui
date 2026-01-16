import type { ShortNameFilterPayload, EftTableSettings } from '@/interfaces/eft-short-name'

export const useEftStore = defineStore('eft-store', () => {
  const tabIndex = ref(0)
  const summaryFilter = ref<ShortNameFilterPayload | null>(null)

  // Table settings for restoring state after navigation
  const summaryTableSettings = ref<EftTableSettings | null>(null)
  const linkedTableSettings = ref<EftTableSettings | null>(null)

  function setTabIndex(index: number) {
    tabIndex.value = index
  }

  function setSummaryFilter(filter: ShortNameFilterPayload | null) {
    summaryFilter.value = filter
  }

  function clearSummaryFilter() {
    summaryFilter.value = null
  }

  function setSummaryTableSettings(settings: EftTableSettings | null) {
    summaryTableSettings.value = settings
  }

  function setLinkedTableSettings(settings: EftTableSettings | null) {
    linkedTableSettings.value = settings
  }

  function clearTableSettings() {
    summaryTableSettings.value = null
    linkedTableSettings.value = null
  }

  return {
    tabIndex,
    summaryFilter,
    summaryTableSettings,
    linkedTableSettings,
    setTabIndex,
    setSummaryFilter,
    clearSummaryFilter,
    setSummaryTableSettings,
    setLinkedTableSettings,
    clearTableSettings
  }
})
