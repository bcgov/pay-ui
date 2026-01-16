export interface BaseFilterState<T extends Record<string, string>> {
  isActive: boolean
  pageNumber: number
  pageLimit: number
  filterPayload: T
}

export function useTableFilters<T extends Record<string, string>>(
  filters: BaseFilterState<T>,
  defaultFilterPayload: () => T
) {
  function resetFilters() {
    filters.filterPayload = defaultFilterPayload()
    filters.isActive = false
    filters.pageNumber = 1
  }

  function hasActiveFilters(): boolean {
    return Object.values(filters.filterPayload).some(
      value => value !== '' && value !== null && value !== undefined
    )
  }

  function updateFilterActive() {
    filters.isActive = hasActiveFilters()
  }

  return {
    resetFilters,
    hasActiveFilters,
    updateFilterActive
  }
}
