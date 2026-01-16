export function useEftTabCounts() {
  const summaries = ref(0)
  const linked = ref(0)

  async function fetchTabCounts() {
    const nuxtApp = useNuxtApp()
    const $payApi = nuxtApp.$payApi as typeof nuxtApp.$payApi

    const [summariesRes, linkedRes] = await Promise.all([
      $payApi<{ total: number }>('/eft-shortnames/summaries?limit=1'),
      $payApi<{ total: number }>('/eft-shortnames?state=LINKED&limit=1')
    ])

    summaries.value = summariesRes?.total ?? 0
    linked.value = linkedRes?.total ?? 0
  }

  return {
    summaries,
    linked,
    fetchTabCounts
  }
}
