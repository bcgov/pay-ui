/**
 * Shared composable for refreshing staff comments across components
 * This allows components to register their refresh function and trigger refreshes
 * Uses singleton pattern to ensure all components share the same state
 */
const refreshFn = ref<(() => Promise<void>) | null>(null)

export function useStaffCommentsRefresh() {
  function registerRefresh(fn: () => Promise<void>) {
    refreshFn.value = fn
  }

  async function refresh() {
    if (refreshFn.value) {
      await refreshFn.value()
    }
  }

  return {
    registerRefresh,
    refresh
  }
}

