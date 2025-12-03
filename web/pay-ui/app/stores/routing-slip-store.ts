import type {
  AccountInfo, LinkedRoutingSlips, RoutingSlip, RoutingSlipDetails,
  RoutingSlipAddress, Payment, SearchRoutingSlipParams
} from '~/interfaces/routing-slip'
import { SearchRoutingSlipTableHeaders } from '@/utils/constants'

const defaultParams: SearchRoutingSlipParams = {
  page: 1,
  limit: 50,
  total: Infinity
}

// This is in a share because it's used across the app in various components.
export const useRoutingSlipStore = defineStore('routing-slip-store', () => {
  const store = reactive({
    routingSlip: {} as RoutingSlip,
    linkedRoutingSlips: undefined as LinkedRoutingSlips | undefined,
    routingSlipDetails: {} as RoutingSlipDetails | undefined,
    routingSlipAddress: {} as RoutingSlipAddress | undefined,
    accountInfo: {} as AccountInfo | undefined,
    chequePayment: [] as Payment[] | undefined,
    cashPayment: {} as Payment | undefined,
    isPaymentMethodCheque: true as boolean | undefined,
    isAmountPaidInUsd: false,
    searchRoutingSlipResult: [] as RoutingSlip[],
    searchRoutingSlipParams: defaultParams as SearchRoutingSlipParams,
    searchRoutingSlipTableHeaders: SearchRoutingSlipTableHeaders,
    routingSlipBeforeEdit: {} as RoutingSlip
  })

  return {
    store
  }
})
