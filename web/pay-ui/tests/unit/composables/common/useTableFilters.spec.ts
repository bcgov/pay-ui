import { useTableFilters } from '~/composables/common/useTableFilters'

describe('useTableFilters', () => {
  const defaults = () => ({ name: '', status: '' })
  const makeFilters = (payload: Record<string, string> = defaults()) =>
    reactive({ isActive: false, pageNumber: 1, pageLimit: 20, filterPayload: payload })

  it('hasActiveFilters is false for empty values', () => {
    const { hasActiveFilters } = useTableFilters(makeFilters(), defaults)
    expect(hasActiveFilters()).toBe(false)
  })

  it('hasActiveFilters ignores null/undefined and detects real values', () => {
    const filters = makeFilters({ name: null as unknown as string, status: undefined as unknown as string })
    const { hasActiveFilters } = useTableFilters(filters, defaults)
    expect(hasActiveFilters()).toBe(false)
    filters.filterPayload.status = 'PAID'
    expect(hasActiveFilters()).toBe(true)
  })

  it('updateFilterActive syncs isActive', () => {
    const filters = makeFilters()
    const { updateFilterActive } = useTableFilters(filters, defaults)
    filters.filterPayload.name = 'x'
    updateFilterActive()
    expect(filters.isActive).toBe(true)
    filters.filterPayload.name = ''
    updateFilterActive()
    expect(filters.isActive).toBe(false)
  })

  it('resetFilters restores defaults, inactive and page 1', () => {
    const filters = makeFilters({ name: 'abc', status: 'PAID' })
    filters.isActive = true
    filters.pageNumber = 4
    const { resetFilters } = useTableFilters(filters, defaults)
    resetFilters()
    expect(filters.filterPayload).toEqual({ name: '', status: '' })
    expect(filters.isActive).toBe(false)
    expect(filters.pageNumber).toBe(1)
  })
})
