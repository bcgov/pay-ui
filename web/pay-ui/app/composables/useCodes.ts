import type { AxiosResponse } from 'axios'
import type { Code, CodesResponse, PaymentMethod } from '@/models/Code'
import CodesService from '@/services/codes.service'

const routingSlipStatusList = ref<Code[]>([])
const paymentMethods = ref<PaymentMethod[]>([])

export const useCodes = () => {
  const getRoutingSlipStatusList = async () => {
    if (routingSlipStatusList.value.length === 0) {
      const response: AxiosResponse<CodesResponse> = await CodesService.getCodes(
        'routing_slip_statuses'
      )
      if (response && response.data && response.status === 200) {
        routingSlipStatusList.value = response.data?.codes || []
        return
      }
      routingSlipStatusList.value = []
    }
  }

  const getPaymentMethods = async () => {
    if (routingSlipStatusList.value.length === 0) {
      const response: AxiosResponse<CodesResponse> = await CodesService.getCodes(
        'payment_methods'
      )
      if (response && response.data && response.status === 200) {
        paymentMethods.value = response.data?.codes as PaymentMethod[] || []
        return
      }
      paymentMethods.value = []
    }
  }
  return {
    routingSlipStatusList,
    getRoutingSlipStatusList,
    paymentMethods,
    getPaymentMethods
  }
}
