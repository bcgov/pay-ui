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

  return {
    getCodes,
    getRoutingSlip,
    postRoutingSlip
  }
}
