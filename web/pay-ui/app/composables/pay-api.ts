// TODO: move this into /services ???
import { FetchError } from 'ofetch'

export const usePayApi = () => {
  const { $payApi } = useNuxtApp()

  async function getCodes<T>(codeType: string): Promise<T[]> {
    const res = await $payApi<{ codes: T[] }>(`/codes/${codeType}`)
    return res.codes
  }

  async function getRoutingSlip(routingNumber: string): Promise<RoutingSlip | undefined> {
    return $payApi(`/fas/routing-slips/${routingNumber}`)
  }

  async function checkRoutingNumber(routingNumber: string): Promise<{ valid: boolean, message: string }> {
    const validResponse = { valid: true, message: '' }
    const errorMessageSuffix = 'Enter a new number or edit details of this routing slip.'

    try {
      const res = await getRoutingSlip(routingNumber)
      if (res && res.id) {
        return { valid: false, message: `Routing Slip number already present. ${errorMessageSuffix}` }
      }
      return validResponse
    } catch (error) {
      if (error instanceof FetchError) {
        const status = error.response?.status
        const type = error.response?._data?.type
        if (status === 400 && type === ApiErrors.FAS_INVALID_ROUTING_SLIP_DIGITS) {
          return { valid: false, message: `Routing Slip number is invalid. ${errorMessageSuffix}` }
        }
      }
      return validResponse
    }
  }

  return {
    getCodes,
    checkRoutingNumber
  }
}
