import { ShortNameResponseStatus } from '@/utils/constants'

export interface EftAccount {
  accountId: string
  accountName: string
  totalDue: number
  statusCode?: string
}

interface EftShortNameLink {
  accountId: string
  statusCode?: string
}

interface ShortNameLinkResponse {
  shortNameId?: number
  accountId?: string
}

export function useShortNameLinking() {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  async function getStatementsSummary(accountId: string): Promise<number> {
    try {
      const data = await $payApi<{ totalDue: number }>(
        `/accounts/${accountId}/statements/summary`,
        { method: 'GET' }
      )
      return data.totalDue || 0
    } catch (error) {
      console.error('Failed to get statements summary:', error)
      return 0
    }
  }

  async function getStatementId(accountId: string): Promise<number | null> {
    try {
      const data = await $payApi<{ items: Array<{ id: number }> }>(
        `/accounts/${accountId}/statements?page=1&limit=1`,
        { method: 'GET' }
      )
      return data.items?.[0]?.id || null
    } catch (error) {
      console.error('Failed to get statement ID:', error)
      return null
    }
  }

  async function searchEftAccounts(query: string): Promise<EftAccount[]> {
    try {
      const eftAccountsResponse = await $payApi<{ items: EftAccount[] }>(
        `/accounts/search/eft?searchText=${encodeURIComponent(query)}`,
        { method: 'GET' }
      )
      const eftAccounts = eftAccountsResponse.items || []

      if (!eftAccounts.length) {
        return []
      }

      return eftAccounts.map(eftAccount => ({
        ...eftAccount,
        statusCode: undefined,
        totalDue: 0
      }))
    } catch (error) {
      console.error('Error occurred while searching EFT accounts:', error)
      return []
    }
  }

  async function getAccountLinkDetails(accountIds: string[]): Promise<Map<string, { statusCode?: string, totalDue: number }>> {
    const detailsMap = new Map<string, { statusCode?: string, totalDue: number }>()

    try {
      const [eftShortNamesResponse, statementsSummaries] = await Promise.all([
        $payApi<{ items: EftShortNameLink[] }>(
          `/eft-shortnames?limit=${accountIds.length}&accountIdList=${accountIds.join(',')}`,
          { method: 'GET' }
        ),
        Promise.all(accountIds.map(accountId => getStatementsSummary(accountId)))
      ])

      const eftShortNames = eftShortNamesResponse.items || []

      accountIds.forEach((accountId, index) => {
        const eftShortName = eftShortNames.find(sn => sn.accountId === accountId)
        detailsMap.set(accountId, {
          statusCode: eftShortName?.statusCode,
          totalDue: statementsSummaries[index] ?? 0
        })
      })
    } catch (error) {
      console.error('Error occurred while getting account link details:', error)
    }

    return detailsMap
  }

  async function linkShortNameToAccount(
    shortNameId: number,
    accountId: string
  ): Promise<{ success: boolean, data?: ShortNameLinkResponse, errorType?: string }> {
    try {
      const response = await $payApi<ShortNameLinkResponse>(
        `/eft-shortnames/${shortNameId}/links`,
        {
          method: 'POST',
          body: { accountId }
        }
      )
      return { success: true, data: response }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { type?: string } } }
      const errorType = err.response?.data?.type
      console.error('Failed to link short name to account:', error)
      return {
        success: false,
        errorType: errorType || 'UNKNOWN_ERROR'
      }
    }
  }

  function isAlreadyMappedError(errorType?: string): boolean {
    return errorType === ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED
  }

  return {
    getStatementsSummary,
    getStatementId,
    searchEftAccounts,
    getAccountLinkDetails,
    linkShortNameToAccount,
    isAlreadyMappedError
  }
}
