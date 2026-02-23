import type { RefundRequestFilterPayload } from '~/interfaces/refund-requests'

export const useRefundRequestsStore = defineStore('refund-requests-store', () => {
  const tabIndex = ref(0)
  const refundRequestsFilter = ref<RefundRequestFilterPayload | null>(null)

  // Table settings for restoring state after navigation
  const tableSettings = ref<RefundRequestsTableSettings | null>(null)

  function setTabIndex(index: number) {
    tabIndex.value = index
  }

  function setFilter(filter: RefundRequestFilterPayload | null) {
    refundRequestsFilter.value = filter
  }

  function clearFilter() {
    refundRequestsFilter.value = null
  }

  function setTableSettings(settings: RefundRequestsTableSettings | null) {
    tableSettings.value = settings
  }

  function clearTableSettings() {
    tableSettings.value = null
  }

  return {
    tabIndex,
    refundRequestsFilter,
    tableSettings,
    setTabIndex,
    setFilter,
    clearFilter,
    setTableSettings,
    clearTableSettings
  }
})
