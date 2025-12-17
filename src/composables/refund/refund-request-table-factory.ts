
import PaymentService from '@/services/payment.services'
import { RefundRequestState } from '@/models/refund-request'

export function useRefundRequestTable (tableState: RefundRequestState, emit) {
  const state = tableState

  function handleFilters (filterField?: string, value?: any): void {
    state.loading = true
    if (filterField) {
      state.filters.pageNumber = 1
      state.filters.filterPayload[filterField] = value
    }
    let filtersActive = false
    for (const key in state.filters.filterPayload) {
      // Always send state, don't count it as active filters.
      if (key === 'state') {
        continue
      }
      if (key === 'dateFilter') {
        if (state.filters.filterPayload[key].endDate) filtersActive = true
      } else if (state.filters.filterPayload[key]) filtersActive = true
      if (filtersActive) break
    }
    state.filters.isActive = filtersActive
  }

  /* This is also called inside of the HeaderFilter component inside of the BaseVDataTable component
  * Parts of this is duplicated inside of the other datatable components.
  */
  async function loadTableData (filterField?: string, value?: any, appendToResults = false, isSummary = false): Promise<void> {
    handleFilters(filterField, value)
    try {
      const response = await PaymentService.getRefundRequests(state.filters)

      if (response?.data) {
        state.items = response.data.items
        state.total = response.data.total
        emit('refund-status-total', response.data.statusTotal)
      } else {
        throw new Error('No response from getRefundRequests')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to getRefundRequests list.', error)
    }
    state.loading = false
  }

  /* This cannot be done inside of the BaseDataTable component because it manipulates the state outside of it. */
  function updateFilter (filterField?: string, value?: any) : void {
    if (filterField) {
      if (value) {
        state.filters.filterPayload[filterField] = value
        state.filters.isActive = true
      } else {
        delete state.filters.filterPayload[filterField]
      }
    }
    /* We always send over state in the filter payload. */
    if (Object.keys(state.filters.filterPayload).length === 1) {
      state.filters.isActive = false
    } else {
      state.filters.isActive = true
    }
  }

  return {
    loadTableData,
    updateFilter
  }
}
