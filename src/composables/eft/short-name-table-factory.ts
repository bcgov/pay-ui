import { LinkedShortNameState, ShortNameSummaryState } from '@/models/short-name'
import EftService from '@/services/eft.service'
import PaymentService from '@/services/payment.services'
import { chequeRefundCodes, ShortNameRefundStatus } from '@/util/constants'

/* Not using a global state here, state can be passed as a reactive object through to the factory. */
export function useShortNameTable (tableState: LinkedShortNameState | ShortNameSummaryState, emit) {
  const state = tableState

  /* Always includes state, which differes from the Affiliation table. */
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

  /*
   * Helper to load table summary data that makes use of similar logic to loadTableData, but with the isSummary flag
   */
  async function loadTableSummaryData (filterField?: string, value?: any, appendToResults = false): Promise<void> {
    return loadTableData(filterField, value, appendToResults, true)
  }

  /* This is also called inside of the HeaderFilter component inside of the BaseVDataTable component
  * Parts of this is duplicated inside of the other datatable components.
  */
  async function loadTableData (filterField?: string, value?: any, appendToResults = false, isSummary = false): Promise<void> {
    handleFilters(filterField, value)
    try {
      const response = !isSummary ? await PaymentService.getEFTShortNames(state.filters)
        : await PaymentService.getEFTShortNameSummaries(state.filters)

      if (response?.data) {
        /* We use appendToResults for infinite scroll, so we keep the existing results. */
        state.results = appendToResults ? state.results.concat(response.data.items) : response.data.items
        state.totalResults = response.data.total
        emit('shortname-state-total', response.data.stateTotal)
      } else {
        throw new Error('No response from getEFTShortNames')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to getEFTShortNames list.', error)
    }
    state.loading = false
  }

  /* This cannot be done inside of the BaseDataTable component because it manupulates the state outside of it. */
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

  /* Instead of slicing up the results, we handle the results inside of this function. */
  async function infiniteScrollCallback (isSummary = false) {
    if (state.totalResults < (state.filters.pageLimit * state.filters.pageNumber)) return true
    state.filters.pageNumber++
    await loadTableData(null, null, true, isSummary)
    return false
  }

  const patchEFTRefund = async (eftRefundId: number, payload: any) => {
    try {
      const responseData = await PaymentService.patchEFTRefund(eftRefundId, payload)
      return responseData
    } catch (error) {
      console.error('Error updating refund status:', error)
      return error?.response
    }
  }

  const updateEFTRefundChequeStatus = async (eftRefundId: number, chequeStatus: string) => {
    return patchEFTRefund(eftRefundId, { chequeStatus: chequeStatus })
  }

  return {
    infiniteScrollCallback,
    handleFilters,
    loadTableData,
    loadTableSummaryData,
    updateFilter,
    updateEFTRefundChequeStatus,
    patchEFTRefund
  }
}
