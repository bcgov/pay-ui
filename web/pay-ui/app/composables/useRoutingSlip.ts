import type {
  AdjustRoutingSlipAmountParams, AdjustRoutingSlipChequeParams, GetRoutingSlipRequestPayload,
  ManualTransactionDetails, BusinessInfo, GetFeeRequestParams, TransactionParams, Payment
} from '~/interfaces/routing-slip'
import {
  CreateRoutingSlipStatus
} from '@/utils/constants'
import { SlipStatus } from '~/enums/slip-status'
import { ApiErrors } from '~/enums/api-errors'
import CommonUtils from '@/utils/common-util'
import { createRoutingSlipPayload } from '~/utils/create-routing-slip'
import { useLoader } from '@/composables/common/useLoader'

interface StatusDetails {
  status: string
}

export const useRoutingSlip = () => {
  const { store } = useRoutingSlipStore()

  const invoiceCount = computed<number | undefined>(() => {
    return store.routingSlip?.invoices?.length
  })

  const isRoutingSlipAChild = computed<boolean>(() => {
    return !!store.routingSlip?.parentNumber
  })

  const isRoutingSlipLinked = computed<boolean>(() => {
    return (
      isRoutingSlipAChild.value || !!store.linkedRoutingSlips?.children?.length
    )
  })

  const isRoutingSlipVoid = computed<boolean>(() => {
    return store.routingSlip?.status === SlipStatus.VOID
  })

  const updateRoutingSlipChequeNumber = (chequeNumToChange: AdjustRoutingSlipChequeParams) => {
    const payments = store.routingSlip.payments?.map((payment: Payment, i: number) => {
      if (chequeNumToChange.paymentIndex === i) {
        payment.chequeReceiptNumber = chequeNumToChange.chequeNum
      }
      return { ...payment }
    })
    store.routingSlip.payments = payments
  }

  const updateRoutingSlipAmount = (amountToChange: AdjustRoutingSlipAmountParams) => {
    const payments = store.routingSlip.payments?.map((payment: Payment, i: number) => {
      if (amountToChange.paymentIndex === i) {
        if (amountToChange.isRoutingSlipPaidInUsd) {
          payment.paidUsdAmount = amountToChange.amount
        } else {
          payment.paidAmount = amountToChange.amount
        }
      }
      return { ...payment }
    })
    store.routingSlip.payments = payments
  }

  async function createRoutingSlip() {
    const crsStore = useCreateRoutingSlipStore()
    const payApi = usePayApi()
    const localePath = useLocalePath()
    const t = useNuxtApp().$i18n.t
    const toast = useToast()
    const { toggleLoading } = useLoader()

    try {
      toggleLoading(true)
      const payload = createRoutingSlipPayload(crsStore.state)
      const res = await payApi.postRoutingSlip(payload, false)
      await navigateTo(localePath(`/view-routing-slip/${res.number}`))
      crsStore.$reset()
    } catch (e) {
      const status = getErrorStatus(e)
      toast.add({
        description: t('error.createRoutingSlip.generic', { status: status ? `${status}: ` : '' }),
        icon: 'i-mdi-alert',
        color: 'error',
        progress: false
      })
    } finally {
      toggleLoading(false)
    }
  }

  const checkRoutingNumber = async (): Promise<CreateRoutingSlipStatus> => {
    try {
      const routingNumber = store.routingSlipDetails?.number ?? ''
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
      const errorResponse = error as { response?: { status?: number, data?: { type?: string } } }
      if (errorResponse.response?.status === 400
        && errorResponse.response?.data?.type === ApiErrors.FAS_INVALID_ROUTING_SLIP_DIGITS
      ) {
        return CreateRoutingSlipStatus.INVALID_DIGITS
      }

      console.error('error ', errorResponse.response?.data)
      // on error we allow the routing number which should break on create and show error message
      return CreateRoutingSlipStatus.VALID
    }
  }

  const getRoutingSlip = async (getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload) => {
    try {
      store.routingSlip = {} as RoutingSlip
      const response = await usePayApi().getRoutingSlip(
        getRoutingSlipRequestPayload.routingSlipNumber
      )
      if (response) {
        store.routingSlip = response
      }
    } catch (error) {
      console.error('error ', error) // 500 errors may not return data
    }
  }

  const updateRoutingSlipStatus = async (
    statusDetails: string | StatusDetails
  ) => {
    const slipNumber = store.routingSlip.number
    // update status
    try {
      let response
      if (CommonUtils.isRefundProcessStatus((statusDetails as StatusDetails)?.status as SlipStatus)) {
        response = await usePayApi().updateRoutingSlipRefund(
          statusDetails as string,
          slipNumber
        )
      } else {
        response = await usePayApi().updateRoutingSlipStatus(
          (statusDetails as StatusDetails)?.status,
          slipNumber
        )
      }
      if (response) {
        if (!CommonUtils.isRefundProcessStatus((statusDetails as StatusDetails)?.status as SlipStatus)) {
          store.routingSlip = response as RoutingSlip
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
    const slipNumber = store.routingSlip.number
    try {
      const responseData = await usePayApi().updateRoutingSlipRefundStatus(status, slipNumber ?? '')
      return responseData
    } catch (error) {
      console.error('Error updating refund status:', error)
      return null
    }
  }

  const updateRoutingSlipComments = async (text: string) => {
    const slipNumber = store.routingSlip.number
    const data = {
      comment: {
        businessId: slipNumber,
        comment: text
      }
    }
    try {
      const responseData = await usePayApi().updateRoutingSlipComments(data, slipNumber)
      return responseData
    } catch (error) {
      console.error('Error updating routing slip comments:', error)
      return null
    }
  }

  const adjustRoutingSlip = async (payments: Payment[]): Promise<RoutingSlip | null> => {
    // build the RoutingSlip Request JSON object that needs to be sent.
    const slipNumber = store.routingSlip.number
    try {
      const response = await usePayApi().adjustRoutingSlip(
        payments,
        slipNumber
      )
      return response
    } catch (error) {
      console.error('error adjust routing slip:', error)
      return null
    }
  }

  const resetRoutingSlipDetails = () => {
    store.routingSlipDetails = undefined
    store.accountInfo = undefined
    store.chequePayment = undefined
    store.cashPayment = undefined
    store.isPaymentMethodCheque = undefined
    store.routingSlipAddress = undefined
  }

  const saveLinkRoutingSlip = async (
    parentRoutingSlipNumber: string
  ): Promise<{ error: boolean, details?: unknown } | undefined> => {
    const childRoutingSlipNumber: string = store.routingSlip.number ?? ''

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
      store.linkedRoutingSlips = response || undefined
    } catch (error) {
      store.linkedRoutingSlips = undefined
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
    const routingSlipNumber: string | undefined = store.routingSlip.number

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
            futureEffective: futureEffective,
            priority: priority,
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

  return {
    invoiceCount,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipVoid,
    updateRoutingSlipChequeNumber,
    updateRoutingSlipAmount,
    createRoutingSlip,
    checkRoutingNumber,
    getRoutingSlip,
    updateRoutingSlipStatus,
    updateRoutingSlipRefundStatus,
    adjustRoutingSlip,
    resetRoutingSlipDetails,
    saveLinkRoutingSlip,
    getLinkedRoutingSlips,
    getDailyReportByDate,
    getAutoCompleteRoutingSlips,
    getFeeByCorpTypeAndFilingType,
    saveManualTransactions,
    cancelRoutingSlipInvoice,
    updateRoutingSlipComments
  }
}
