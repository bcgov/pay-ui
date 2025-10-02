import RoutingSlipService from '@/services/routingSlip.services'
import type {
  AccountInfo, AdjustRoutingSlipAmountPrams, AdjustRoutingSlipChequePrams, GetRoutingSlipRequestPayload,
  LinkedRoutingSlips, RoutingSlip, RoutingSlipDetails, RoutingSlipAddress
} from '@/models/RoutingSlip'
import {
  ApiErrors, CreateRoutingSlipStatus, headerSearchTitle as headerSearchTitleConstant, SlipStatus
} from '@/util/constants'
import CommonUtils from '@/util/common-util'
import type { BusinessInfo, GetFeeRequestParams, Payment, TransactionParams } from '@/models/Payment'

const defaultParams = {
  page: 1,
  limit: 50,
  total: Infinity
}
const headerSearchTitle = ref(headerSearchTitleConstant)
const searchRoutingSlipResult = ref<RoutingSlip[]>([])
const searchRoutingSlipParams = ref<any>(defaultParams)

const routingSlip = ref<RoutingSlip>({})
const linkedRoutingSlips = ref<LinkedRoutingSlips>(undefined)
const routingSlipDetails = ref<RoutingSlipDetails>({})
const routingSlipAddress = ref<RoutingSlipAddress>({})
const accountInfo = ref<AccountInfo>({})
const chequePayment = ref<Payment[]>([])
const cashPayment = ref<Payment>({})
const isPaymentMethodCheque = ref(true)
const isAmountPaidInUsd = ref(false)
const autoCompleteRoutingSlips = ref<RoutingSlip[]>([])

export const useRoutingSlip = () => {
  // Computed
  const invoiceCount = computed<number>(() => {
    return routingSlip.value?.invoices?.length
  })

  const searchParamsExist = computed<boolean>(() => {
    const params = searchRoutingSlipParams.value
    for (const key in params) {
      if (params[key] && params[key] !== '') {
        return false
      }
    }
    return true
  })

  // for a child linked to a parent routing slip, there would be a parentNumber
  const isRoutingSlipAChild = computed<boolean>(() => {
    return !!routingSlip.value?.parentNumber
  })

  // if routingslip has parentNumber then it is a child Else, check if there are any children in linkedroutingslips for it.(in this case, it is a parent)
  const isRoutingSlipLinked = computed<boolean>(() => {
    return (
      isRoutingSlipAChild.value || linkedRoutingSlips.value?.children.length > 0
    )
  })

  const isRoutingSlipVoid = computed<boolean>(() => {
    return routingSlip.value?.status === SlipStatus.VOID
  })

  const updateRoutingSlipChequeNumber = (chequeNumToChange: AdjustRoutingSlipChequePrams) => {
    const payments = routingSlip.value.payments.map((payment: Payment, i: number) => {
      if (chequeNumToChange.paymentIndex === i) {
        payment.chequeReceiptNumber = chequeNumToChange.chequeNum
      }
      return { ...payment }
    })
    routingSlip.value.payments = payments
  }

  const updateRoutingSlipAmount = (amountToChange: AdjustRoutingSlipAmountPrams) => {
    const payments = routingSlip.value.payments.map((payment: Payment, i: number) => {
      if (amountToChange.paymentIndex === i) {
        if (amountToChange.isRoutingSlipPaidInUsd) {
          payment.paidUsdAmount = amountToChange.amount
        } else {
          payment.paidAmount = amountToChange.amount
        }
      }
      return { ...payment }
    })
    routingSlip.value.payments = payments
  }

  // Functions
  const createRoutingSlip = async () => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    let routingSlipRequest: RoutingSlip = {}
    routingSlipRequest = { ...routingSlipDetails.value, ...routingSlipAddress.value }
    routingSlipRequest.paymentAccount = accountInfo.value

    // By design, a routing slip can only have one payment method - CASH or CHEQUE.
    routingSlipRequest.payments = isPaymentMethodCheque.value
      ? chequePayment.value
      : [cashPayment.value]

    const response = await RoutingSlipService.createRoutingSlip(
      routingSlipRequest,
      true
    )
    if (response && response.data && response.status === 200) {
      routingSlip.value = response.data
    }
  }

  const checkRoutingNumber = async (): Promise<CreateRoutingSlipStatus> => {
    try {
      const routingNumber = routingSlipDetails.value.number
      const response = await RoutingSlipService.getRoutingSlip(routingNumber)
      // if routing number existing we will get 200 as response
      // else we will get 204
      if (response.status === 204) {
        return CreateRoutingSlipStatus.VALID
      }
      // all other case routing is existing so can't use this number
      return CreateRoutingSlipStatus.EXISTS
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.type === ApiErrors.FAS_INVALID_ROUTING_SLIP_DIGITS) {
        return CreateRoutingSlipStatus.INVALID_DIGITS
      }

      console.error('error ', error.response?.data)
      // on error we allow the routing number which should break on create and show error message
      return CreateRoutingSlipStatus.VALID
    }
  }

  const getRoutingSlip = async (getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload) => {
    try {
      routingSlip.value = null
      const response = await RoutingSlipService.getRoutingSlip(
        getRoutingSlipRequestPayload.routingSlipNumber,
        getRoutingSlipRequestPayload?.showGlobalLoader
      )

      if (response && response.data && response.status === 200) {
        routingSlip.value = response.data
      }
      // TODO : need to handle if slip not existing
    } catch (error) {
      console.error('error ', error.response?.data) // 500 errors may not return data
    }
  }

  const updateRoutingSlipStatus = async (
    statusDetails: any
  ) => {
    const slipNumber = routingSlip.value.number
    // update status
    try {
      let response
      if (CommonUtils.isRefundProcessStatus(statusDetails?.status)) {
        response = await RoutingSlipService.updateRoutingSlipRefund(
          statusDetails,
          slipNumber
        )
      } else {
        response = await RoutingSlipService.updateRoutingSlipStatus(
          statusDetails.status,
          slipNumber
        )
      }
      if (response?.data && (response.status === 200 || response.status === 202)) {
        if (!CommonUtils.isRefundProcessStatus(statusDetails?.status)) {
          routingSlip.value = response.data
        } else {
          const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = { routingSlipNumber: slipNumber }
          getRoutingSlip(getRoutingSlipRequestPayload)
        }
        return response
      }
    } catch (error) {
      console.error('error ', error.response)
      return error?.response
    }
  }

  const updateRoutingSlipRefundStatus = async (status: any) => {
    const slipNumber = routingSlip.value.number
    try {
      const responseData = await RoutingSlipService.updateRoutingSlipRefundStatus(status, slipNumber)
      return responseData
    } catch (error) {
      console.error('Error updating refund status:', error)
      return error?.response
    }
  }

  const updateRoutingSlipComments = async (text: any) => {
    const slipNumber = routingSlip.value.number
    const data = {
      comment: {
        businessId: slipNumber,
        comment: text
      }
    }
    try {
      const responseData = await RoutingSlipService.updateRoutingSlipComments(data, slipNumber)
      return responseData
    } catch (error) {
      console.error('Error updating routing slip comments:', error)
      return error?.response
    }
  }

  const adjustRoutingSlip = async (payments: Payment[]): Promise<RoutingSlip> => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    const slipNumber = routingSlip.value.number
    try {
      const response = await RoutingSlipService.adjustRoutingSlip(
        payments,
        slipNumber
      )
      if (response?.data && response.status === 200) {
        return response.data
      }
    } catch (error) {
      console.error('error ', error.response)
      return error?.response
    }
  }

  const resetRoutingSlipDetails = () => {
    routingSlipDetails.value = undefined
    accountInfo.value = undefined
    chequePayment.value = undefined
    cashPayment.value = undefined
    isPaymentMethodCheque.value = undefined
    routingSlipAddress.value = undefined
  }

  const resetSearchParams = (): void => {
    searchRoutingSlipParams.value = defaultParams
    searchRoutingSlipResult.value = []
  }

  const searchRoutingSlip = async (appendToResults = false) => {
    // // build the RoutingSlip Request JSON object that needs to be sent.

    let params = { ...searchRoutingSlipParams.value }
    // filtering and removing all non set values
    params = CommonUtils.cleanObject(params)

    // formatting as per API
    if (params.dateFilter) {
      params.dateFilter = {
        startDate: CommonUtils.formatDisplayDate(
          params.dateFilter[0],
          'YYYY-MM-DD'
        ),
        endDate: CommonUtils.formatDisplayDate(
          params.dateFilter[1],
          'YYYY-MM-DD'
        )
      }
    }

    // check for error handling
    if (params.status) {
      params.status = params.status.code
    }

    if (Object.keys(params).length > 0) {
      // need to reset result of there is no search params
      const response = await RoutingSlipService.getSearchRoutingSlip(
        params
      )
      if (response && response.data && response.status === 200) {
        searchRoutingSlipParams.value = {
          ...searchRoutingSlipParams.value,
          total: response.data?.total || 0
        }
        if (appendToResults) {
          searchRoutingSlipResult.value = [
            ...searchRoutingSlipResult.value,
            ...response.data?.items
          ]
        } else {
          searchRoutingSlipResult.value = response.data?.items
        }

        return
      }
    }
    searchRoutingSlipResult.value = []
  }

  const saveLinkRoutingSlip = async (
    parentRoutingSlipNumber: string
  ): Promise<any> => {
    const childRoutingSlipNumber: string = routingSlip.value.number

    const LinkPrams = { childRoutingSlipNumber, parentRoutingSlipNumber }

    try {
      // handle error condtions here
      const response = await RoutingSlipService.saveLinkRoutingSlip(LinkPrams)
      if (response && response.data && response.status === 200) {
        return {
          error: false
        }
      }
    } catch (error) {
      if (error.response.status === 400) {
        return { error: true, details: error.response?.data }
      }

      console.error('error ', error.response?.data)
    }
  }

  const getLinkedRoutingSlips = async (routingSlipNumber) => {
    try {
      const response = await RoutingSlipService.getLinkedRoutingSlips(
        routingSlipNumber,
        true
      )
      let result: LinkedRoutingSlips
      if (response && response.data && response.status === 200) {
        result = response.data
      }
      // 204 non content response
      linkedRoutingSlips.value = result
    } catch (error) {
      linkedRoutingSlips.value = undefined

      console.error('error ', error.response?.data) // 500 errors may not return data
    }
  }

  const getDailyReportByDate = async (selectedDate, type) => {
    const formatedDate = CommonUtils.formatDisplayDate(
      selectedDate,
      'YYYY-MM-DD'
    )
    try {
      return await RoutingSlipService.getDailyReport(formatedDate, type, false)
    } catch (error) {
      console.error('error ', error.response?.data) // 500 errors may not return data
      return error.response
    }
  }

  const getAutoCompleteRoutingSlips = async (
    routingSlipNumber
  ): Promise<RoutingSlipDetails[]> => {
    const response = await RoutingSlipService.getSearchRoutingSlip({
      routingSlipNumber
    })
    if (response && response.data && response.status === 200) {
      return response.data?.items
    }

    return []
  }

  const getFeeByCorpTypeAndFilingType = async (
    getFeeRequestParams: GetFeeRequestParams
  ): Promise<number> => {
    // Currently, in FAS we only need total from the result that is the source of truth.
    // Other properties such as tax breakdown and priority fees can be ignored here.
    const response = await RoutingSlipService.getFeeByCorpTypeAndFilingType(
      getFeeRequestParams
    )
    if (response && response.data && response.status === 200) {
      return response.data?.total
    }
    return null
  }

  const saveManualTransactions = async (transation: any): Promise<any> => {
    // prepare format from here
    const routingSlipNumber: string = routingSlip.value.number

    const {
      referenceNumber,
      filingType,
      futureEffective,
      priority,
      quantity
    } = transation
    const businessInfo: BusinessInfo = {
      corpType: filingType.corpTypeCode.code
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
            filingTypeCode: filingType.filingTypeCode.code,
            futureEffective: futureEffective,
            priority: priority,
            quantity: parseInt(quantity)
          }
        ]
      },
      accountInfo: {
        routingSlip: routingSlipNumber
      }
    }

    const response = await RoutingSlipService.saveManualTransactions(
      transactionParams
    )
    return response
  }

  const cancelRoutingSlipInvoice = async (invoiceId: number) => {
    return await RoutingSlipService.cancelRoutingSlipInvoice(invoiceId)
  }

  async function infiniteScrollCallback() {
    const params = { ...searchRoutingSlipParams.value }
    if (params.total !== Infinity && params.total < params.limit) { return true }
    searchRoutingSlipParams.value = {
      ...searchRoutingSlipParams.value,
      page: searchRoutingSlipParams.value.page ? searchRoutingSlipParams.value.page + 1 : 1
    }
    await searchRoutingSlip(true)
    return false
  }

  return {
    headerSearchTitle,
    searchRoutingSlipResult,
    searchRoutingSlipParams,
    routingSlip,
    linkedRoutingSlips,
    routingSlipDetails,
    routingSlipAddress,
    accountInfo,
    chequePayment,
    cashPayment,
    isPaymentMethodCheque,
    isAmountPaidInUsd,
    autoCompleteRoutingSlips,
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
