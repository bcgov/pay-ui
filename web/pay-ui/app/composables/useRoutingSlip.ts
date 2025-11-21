import type {
  AccountInfo, AdjustRoutingSlipAmountParams, AdjustRoutingSlipChequeParams, GetRoutingSlipRequestPayload,
  LinkedRoutingSlips, RoutingSlip, RoutingSlipDetails, RoutingSlipAddress, ManualTransactionDetails,
  BusinessInfo, GetFeeRequestParams, Payment, TransactionParams, SearchRoutingSlipParams
} from '~/interfaces/routing-slip'
import { reactive, toRefs } from 'vue'
import {
  CreateRoutingSlipStatus, SearchRoutingSlipTableHeaders
} from '@/utils/constants'
import { SlipStatus } from '~/enums/slip-status'
import { ApiErrors } from '~/enums/api-errors'
import CommonUtils from '@/utils/common-util'

interface StatusDetails {
  status: string
}

const defaultParams: SearchRoutingSlipParams = {
  page: 1,
  limit: 50,
  total: Infinity
}
const searchRoutingSlipTableHeaders = ref(SearchRoutingSlipTableHeaders)

// TODO move this out of global state use useState instead or Pinia
const state = reactive({
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
  searchRoutingSlipParams: defaultParams as SearchRoutingSlipParams
})

export const useRoutingSlip = () => {
  const invoiceCount = computed<number | undefined>(() => {
    return state.routingSlip?.invoices?.length
  })

  const searchParamsExist = computed<boolean>(() => {
    const params = state.searchRoutingSlipParams as Record<string, unknown>
    for (const key in params) {
      if (params[key] && params[key] !== '') {
        return false
      }
    }
    return true
  })

  // for a child linked to a parent routing slip, there would be a parentNumber
  const isRoutingSlipAChild = computed<boolean>(() => {
    return !!state.routingSlip?.parentNumber
  })

  // if routingslip has parentNumber then it is a child Else,
  // check if there are any children in linkedroutingslips for
  // it.(in this case, it is a parent)
  const isRoutingSlipLinked = computed<boolean>(() => {
    return (
      isRoutingSlipAChild.value || !!state.linkedRoutingSlips?.children?.length
    )
  })

  const isRoutingSlipVoid = computed<boolean>(() => {
    return state.routingSlip?.status === SlipStatus.VOID
  })

  const updateRoutingSlipChequeNumber = (chequeNumToChange: AdjustRoutingSlipChequeParams) => {
    const payments = state.routingSlip.payments?.map((payment: Payment, i: number) => {
      if (chequeNumToChange.paymentIndex === i) {
        payment.chequeReceiptNumber = chequeNumToChange.chequeNum
      }
      return { ...payment }
    })
    state.routingSlip.payments = payments
  }

  const updateRoutingSlipAmount = (amountToChange: AdjustRoutingSlipAmountParams) => {
    const payments = state.routingSlip.payments?.map((payment: Payment, i: number) => {
      if (amountToChange.paymentIndex === i) {
        if (amountToChange.isRoutingSlipPaidInUsd) {
          payment.paidUsdAmount = amountToChange.amount
        } else {
          payment.paidAmount = amountToChange.amount
        }
      }
      return { ...payment }
    })
    state.routingSlip.payments = payments
  }

  // Functions
  const createRoutingSlip = async () => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    let routingSlipRequest: RoutingSlip = {}
    routingSlipRequest = { ...state.routingSlipDetails, ...state.routingSlipAddress }
    routingSlipRequest.paymentAccount = state.accountInfo

    // By design, a routing slip can only have one payment method - CASH or CHEQUE.
    routingSlipRequest.payments = state.isPaymentMethodCheque
      ? state.chequePayment
      : (state.cashPayment ? [state.cashPayment] : [])

    const response = await usePayApi().createRoutingSlip(
      routingSlipRequest
    )
    if (response) {
      state.routingSlip = response
    }
  }

  const checkRoutingNumber = async (): Promise<CreateRoutingSlipStatus> => {
    try {
      const routingNumber = state.routingSlipDetails?.number ?? ''
      const response = await usePayApi().getRoutingSlip(routingNumber)
      // if routing number exists, we get a response object
      // if it doesn't exist, we get undefined or throw error
      if (response) {
        // routing slip exists
        return CreateRoutingSlipStatus.EXISTS
      }
      // routing slip doesn't exist
      return CreateRoutingSlipStatus.VALID
    } catch (error) {
      const axiosError = error as { response?: { status?: number, data?: { type?: string } } }
      if (axiosError.response?.status === 400
        && axiosError.response?.data?.type === ApiErrors.FAS_INVALID_ROUTING_SLIP_DIGITS
      ) {
        return CreateRoutingSlipStatus.INVALID_DIGITS
      }

      console.error('error ', axiosError.response?.data)
      // on error we allow the routing number which should break on create and show error message
      return CreateRoutingSlipStatus.VALID
    }
  }

  const getRoutingSlip = async (getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload) => {
    try {
      state.routingSlip = {} as RoutingSlip
      const response = await usePayApi().getRoutingSlip(
        getRoutingSlipRequestPayload.routingSlipNumber ?? ''
      )
      if (response) {
        state.routingSlip = response
      }
      // TODO : need to handle if slip not existing
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown } }
      console.error('error ', axiosError.response?.data) // 500 errors may not return data
    }
  }

  const updateRoutingSlipStatus = async (
    statusDetails: string | StatusDetails
  ) => {
    const slipNumber = state.routingSlip.number
    // update status
    try {
      let response
      if (CommonUtils.isRefundProcessStatus((statusDetails as StatusDetails)?.status as SlipStatus)) {
        response = await usePayApi().updateRoutingSlipRefund(
          statusDetails as string,
          slipNumber ?? ''
        )
      } else {
        response = await usePayApi().updateRoutingSlipStatus(
          (statusDetails as StatusDetails)?.status,
          slipNumber ?? ''
        )
      }
      if (response) {
        if (!CommonUtils.isRefundProcessStatus((statusDetails as StatusDetails)?.status as SlipStatus)) {
          state.routingSlip = response as RoutingSlip
        } else {
          const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = { routingSlipNumber: slipNumber }
          getRoutingSlip(getRoutingSlipRequestPayload)
        }
        return response
      }
    } catch (error) {
      console.error('error ', error)
      return null
    }
  }

  const updateRoutingSlipRefundStatus = async (status: string) => {
    const slipNumber = state.routingSlip.number
    try {
      const responseData = await usePayApi().updateRoutingSlipRefundStatus(status, slipNumber ?? '')
      return responseData
    } catch (error) {
      console.error('Error updating refund status:', error)
      return null
    }
  }

  const updateRoutingSlipComments = async (text: string) => {
    const slipNumber = state.routingSlip.number
    const data = {
      comment: {
        businessId: slipNumber,
        comment: text
      }
    }
    try {
      const responseData = await usePayApi().updateRoutingSlipComments(data, slipNumber ?? '')
      return responseData
    } catch (error) {
      console.error('Error updating routing slip comments:', error)
      return null
    }
  }

  const adjustRoutingSlip = async (payments: Payment[]): Promise<RoutingSlip | null> => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    const slipNumber = state.routingSlip.number
    try {
      const response = await usePayApi().adjustRoutingSlip(
        payments,
        slipNumber ?? ''
      )
      return response
    } catch (error) {
      console.error('error adjust routing slip:', error)
      return null
    }
  }

  const resetRoutingSlipDetails = () => {
    state.routingSlipDetails = undefined
    state.accountInfo = undefined
    state.chequePayment = undefined
    state.cashPayment = undefined
    state.isPaymentMethodCheque = undefined
    state.routingSlipAddress = undefined
  }

  const resetSearchParams = (): void => {
    state.searchRoutingSlipParams = defaultParams
    state.searchRoutingSlipResult = []
  }

  const searchRoutingSlip = async (appendToResults = false) => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    const params: SearchRoutingSlipParams = { ...state.searchRoutingSlipParams }

    // filtering and removing all non set values
    if (!params.dateFilter?.startDate || !params.dateFilter?.endDate) {
      delete params.dateFilter
    }
    const cleanedParams = CommonUtils.cleanObject(
      params as Record<string, unknown>
    ) as SearchRoutingSlipParams

    try {
      const response = await usePayApi().getSearchRoutingSlip(cleanedParams)
      if (response && response.items) {
        state.searchRoutingSlipParams = {
          ...state.searchRoutingSlipParams,
          total: response.total || 0
        }
        if (appendToResults) {
          state.searchRoutingSlipResult = [
            ...state.searchRoutingSlipResult,
            ...(response.items || [])
          ]
        } else {
          state.searchRoutingSlipResult = response.items || []
        }
      }
    } catch (error) {
      console.error('error ', error)
    }
  }

  const saveLinkRoutingSlip = async (
    parentRoutingSlipNumber: string
  ): Promise<{ error: boolean, details?: unknown } | undefined> => {
    const childRoutingSlipNumber: string = state.routingSlip.number ?? ''

    const linkParams = { childRoutingSlipNumber, parentRoutingSlipNumber }

    try {
      // handle error condtions here
      await usePayApi().saveLinkRoutingSlip(linkParams)
      return {
        error: false
      }
    } catch (error) {
      const errorResponse = error as { response?: { status?: number, data?: unknown } }
      if (errorResponse.response?.status === 400) {
        return { error: true, details: errorResponse.response?.data }
      }

      console.error('error ', errorResponse.response?.data)
    }
  }

  const getLinkedRoutingSlips = async (routingSlipNumber: string) => {
    try {
      const response = await usePayApi().getLinkedRoutingSlips(
        routingSlipNumber
      )
      state.linkedRoutingSlips = response || undefined
    } catch (error) {
      state.linkedRoutingSlips = undefined
      console.error('error ', error) // 500 errors may not return data
    }
  }

  const getDailyReportByDate = async (selectedDate: Date | string, type: string | undefined) => {
    const formatedDate = CommonUtils.formatDisplayDate(
      selectedDate,
      'yyyy-MM-dd'
    )
    try {
      return await usePayApi().getDailyReport(formatedDate, type)
    } catch (error) {
      console.error('error ', error) // 500 errors may not return data
      return null
    }
  }

  const getAutoCompleteRoutingSlips = async (
    routingSlipNumber: string
  ): Promise<RoutingSlipDetails[]> => {
    const response = await usePayApi().getSearchRoutingSlip({
      routingSlipNumber
    })
    if (response && response.items) {
      return response.items
    }

    return []
  }

  const getFeeByCorpTypeAndFilingType = async (
    getFeeRequestParams: GetFeeRequestParams
  ): Promise<number | null> => {
    // Currently, in FAS we only need total from the result that is the source of truth.
    // Other properties such as tax breakdown and priority fees can be ignored here.
    const response = await usePayApi().getFeeByCorpTypeAndFilingType(
      getFeeRequestParams
    )
    if (response && response.total) {
      return response.total
    }
    return null
  }

  const saveManualTransactions = async (transation: ManualTransactionDetails): Promise<Invoice> => {
    // prepare format from here
    const routingSlipNumber: string | undefined = state.routingSlip.number

    const {
      referenceNumber,
      filingType,
      futureEffective,
      priority,
      quantity
    } = transation
    const businessInfo: BusinessInfo = {
      corpType: filingType?.corpTypeCode?.code || ''
    }

    // no need to pass if empty
    if (referenceNumber) {
      businessInfo.businessIdentifier = referenceNumber
    }

    const transactionParams: TransactionParams = {
      businessInfo,
      filingInfo: {
        filingTypes: [
          {
            filingTypeCode: filingType?.filingTypeCode?.code,
            futureEffective: futureEffective?.toString(),
            priority: priority?.toString(),
            quantity: quantity ? parseInt(quantity.toString()) : undefined
          }
        ]
      },
      accountInfo: {
        routingSlip: routingSlipNumber
      }
    }

    const response = await usePayApi().saveManualTransactions(
      transactionParams
    )
    return response
  }

  const cancelRoutingSlipInvoice = async (invoiceId: number) => {
    return await usePayApi().cancelRoutingSlipInvoice(invoiceId)
  }

  async function infiniteScrollCallback(isInitialLoad: boolean): Promise<boolean> {
    const params = { ...state.searchRoutingSlipParams }
    if (params.total !== Infinity && params?.total && params?.limit && params?.total < params?.limit) {
      return true
    }
    state.searchRoutingSlipParams = {
      ...state.searchRoutingSlipParams,
      page: state.searchRoutingSlipParams.page && !isInitialLoad
        ? state.searchRoutingSlipParams.page + 1
        : 1
    }
    await searchRoutingSlip(true)
    return false
  }

  return {
    searchRoutingSlipTableHeaders,
    ...toRefs(state),
    invoiceCount,
    searchParamsExist,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipVoid,
    defaultParams,
    updateRoutingSlipChequeNumber,
    updateRoutingSlipAmount,
    createRoutingSlip,
    checkRoutingNumber,
    getRoutingSlip,
    updateRoutingSlipStatus,
    updateRoutingSlipRefundStatus,
    adjustRoutingSlip,
    resetRoutingSlipDetails,
    resetSearchParams,
    searchRoutingSlip,
    saveLinkRoutingSlip,
    getLinkedRoutingSlips,
    getDailyReportByDate,
    getAutoCompleteRoutingSlips,
    getFeeByCorpTypeAndFilingType,
    saveManualTransactions,
    cancelRoutingSlipInvoice,
    infiniteScrollCallback,
    updateRoutingSlipComments
  }
}
