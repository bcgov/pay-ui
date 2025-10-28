export const usePayApi = () => {
  const { $payApi } = useNuxtApp()

  async function getCodes<T>(codeType: string): Promise<T[]> {
    const res = await $payApi<{ codes: T[] }>(`/codes/${codeType}`)
    return res.codes
  }

  async function getRoutingSlip(routingNumber: string): Promise<RoutingSlip | undefined> {
    return $payApi(`/fas/routing-slips/${routingNumber}`)
  }

  async function postRoutingSlip(payload: CreateRoutingSlipPayload): Promise<RoutingSlip> {
    return $payApi('/fas/routing-slips', {
      method: 'POST',
      body: payload
    })
  }

  async function postLinkRoutingSlip(body: LinkRoutingSlipParams): Promise<void> {
    return $payApi('/fas/routing-slips/links', {
      method: 'POST',
      body
    })
  }

  async function postSearchRoutingSlip(body: RoutingSlipSearchParams): Promise<{ items: RoutingSlip[] }> {
    return $payApi<{ items: RoutingSlip[] }>('/fas/routing-slips/queries', {
      method: 'POST',
      body
    })
  }

  return {
    getCodes,
    getRoutingSlip,
    postRoutingSlip,
    postLinkRoutingSlip,
    postSearchRoutingSlip
  }
}
