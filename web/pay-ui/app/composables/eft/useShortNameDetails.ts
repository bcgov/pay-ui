import type { ShortNameType } from '@/utils/constants'

export interface ShortNameDetails {
  id: number
  shortName: string
  shortNameType?: ShortNameType
  creditsRemaining?: number
  linkedAccountsCount?: number
}

export interface EftShortName {
  id: number
  shortName: string
  shortNameType?: ShortNameType
  casSupplierNumber?: string
  casSupplierSite?: string
  email?: string
}

export function useShortNameDetails(shortNameId: Ref<number>) {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  const shortNameDetails = ref<ShortNameDetails | null>(null)
  const shortName = ref<EftShortName | null>(null)
  const loading = ref(true)
  const notFound = ref(false)

  async function loadShortname() {
    if (notFound.value) {
      return
    }

    loading.value = true
    try {
      const summaryResponse = await $payApi<{ items: ShortNameDetails[] }>(
        `/eft-shortnames/summaries?shortNameId=${shortNameId.value}`,
        { method: 'GET' }
      )

      if (summaryResponse?.items?.[0]) {
        shortNameDetails.value = summaryResponse.items[0]

        const shortNameResponse = await $payApi<EftShortName>(
          `/eft-shortnames/${shortNameDetails.value.id}`,
          { method: 'GET' }
        )
        shortName.value = shortNameResponse
      } else {
        notFound.value = true
      }
    } catch (error: unknown) {
      notFound.value = true
      console.error('Failed to load short name details:', error)
    } finally {
      loading.value = false
    }
  }

  async function refreshShortName() {
    if (shortNameDetails.value?.id) {
      const shortNameResponse = await $payApi<EftShortName>(
        `/eft-shortnames/${shortNameDetails.value.id}`,
        { method: 'GET' }
      )
      shortName.value = shortNameResponse
    }
  }

  async function refreshSummary() {
    try {
      const summaryResponse = await $payApi<{ items: ShortNameDetails[] }>(
        `/eft-shortnames/summaries?shortNameId=${shortNameId.value}`,
        { method: 'GET' }
      )
      if (summaryResponse?.items?.[0]) {
        shortNameDetails.value = summaryResponse.items[0]
      }
    } catch (error) {
      console.error('Failed to refresh short name summary:', error)
    }
  }

  async function patchShortName(data: Partial<Pick<EftShortName, 'casSupplierNumber' | 'casSupplierSite' | 'email'>>) {
    if (!shortNameDetails.value?.id) {
      return { success: false }
    }

    try {
      await $payApi(
        `/eft-shortnames/${shortNameDetails.value.id}`,
        {
          method: 'PATCH',
          body: data
        }
      )
      await refreshShortName()
      return { success: true }
    } catch (error) {
      console.error('Failed to update short name:', error)
      return { success: false, error }
    }
  }

  return {
    shortNameDetails,
    shortName,
    loading,
    notFound,
    loadShortname,
    refreshShortName,
    refreshSummary,
    patchShortName
  }
}
