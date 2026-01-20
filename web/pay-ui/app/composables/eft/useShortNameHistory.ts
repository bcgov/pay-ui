import type { ShortNameHistoryResponse, ShortNameHistoryState } from '@/interfaces/eft-short-name'
import { ShortNamePaymentActions } from '@/utils/constants'
import { getEFTErrorMessage } from '@/utils/api-error-handler'

const PAGE_LIMIT = 10
const REVERSAL_WINDOW_DAYS = 60

export function useShortNameHistory(shortNameId: number, state: ShortNameHistoryState) {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi
  const toast = useToast()

  const loadState = reactive({
    reachedEnd: false,
    isLoading: false,
    isInitialLoad: true,
    currentPage: 1
  })

  async function fetchHistory(page: number): Promise<ShortNameHistoryResponse | null> {
    try {
      return await $payApi<ShortNameHistoryResponse>(
        `/eft-shortnames/${shortNameId}/history?page=${page}&limit=${PAGE_LIMIT}`,
        { method: 'GET' }
      )
    } catch (error) {
      console.error('Error fetching history:', error)
      return null
    }
  }

  async function loadHistoryData(appendResults = false) {
    if (loadState.isLoading) {
      return
    }

    loadState.isLoading = true
    state.loading = true

    try {
      const response = await fetchHistory(loadState.currentPage)
      if (response) {
        state.results = appendResults ? [...state.results, ...response.items] : response.items
        state.totalResults = response.total
        loadState.reachedEnd = state.results.length >= state.totalResults
      }
    } finally {
      loadState.isLoading = false
      state.loading = false
    }
  }

  async function getNext(isInitialLoadParam = false) {
    if (loadState.isLoading) {
      return
    }

    if (isInitialLoadParam) {
      loadState.isInitialLoad = false
      loadState.currentPage = 1
      await loadHistoryData(false)
    } else if (!loadState.reachedEnd) {
      loadState.currentPage++
      await loadHistoryData(true)
    }
  }

  function resetState() {
    loadState.reachedEnd = false
    loadState.isInitialLoad = true
    loadState.currentPage = 1
    state.results = []
    state.totalResults = 0
  }

  async function reversePayment(statementId: number, accountId?: string): Promise<boolean> {
    try {
      state.loading = true
      await $payApi(
        `/eft-shortnames/${shortNameId}/payment`,
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.REVERSE,
            accountId: accountId || '',
            statementId
          }
        }
      )

      resetState()
      await getNext(true)

      toast.add({
        description: 'Payment reversed successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
      return true
    } catch (error) {
      console.error('An error occurred reversing payment.', error)
      toast.add({
        description: getEFTErrorMessage(error),
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      return false
    } finally {
      state.loading = false
    }
  }

  function canReversePayment(transactionDate: string | undefined, paymentDate: string | undefined): boolean {
    const dateToCheck = paymentDate || transactionDate

    if (!dateToCheck) {
      return false
    }

    const txDate = new Date(dateToCheck)
    const now = new Date()
    const daysDifference = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24))

    return daysDifference <= REVERSAL_WINDOW_DAYS
  }

  function getReversalTooltip(transactionDate: string | undefined, paymentDate: string | undefined): string {
    const dateToCheck = paymentDate || transactionDate

    if (!dateToCheck) {
      return 'Cannot reverse this transaction'
    }

    const canReverse = canReversePayment(transactionDate, paymentDate)

    if (!canReverse) {
      return 'Cannot reverse transactions older than 60 days'
    }

    return 'Reverse this payment'
  }

  return {
    loadState,
    getNext,
    resetState,
    reversePayment,
    canReversePayment,
    getReversalTooltip
  }
}
