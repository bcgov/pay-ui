import type {
  AdjustRoutingSlipAmountParams, AdjustRoutingSlipChequeParams, GetRoutingSlipRequestPayload,
  ManualTransactionDetails, BusinessInfo, GetFeeRequestParams, TransactionParams, Payment
} from '~/interfaces/routing-slip'
import {
  CreateRoutingSlipStatus
} from '@/utils/constants'
import { SlipStatus } from '~/enums/slip-status'
import { FASErrorCode } from '~/enums/api-errors'
import CommonUtils from '@/utils/common-util'
import { createRoutingSlipPayload } from '~/utils/create-routing-slip'
import { useLoader } from '@/composables/common/useLoader'
import { getFASErrorMessage } from '@/utils/api-error-handler'

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
    const toast = useToast()
    const { toggleLoading } = useLoader()

    try {
      toggleLoading(true)
      const payload = createRoutingSlipPayload(crsStore.state)
      const res = await payApi.postRoutingSlip(payload)
      toast.add({
        description: 'Routing slip created successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
      await navigateTo(`/view-routing-slip/${res.number}`)
      crsStore.$reset()
    } catch (e) {
      toast.add({
        description: getFASErrorMessage(e),
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
      if (response) {
        return CreateRoutingSlipStatus.EXISTS
      }
      return CreateRoutingSlipStatus.VALID
    } catch (error) {
      const errorResponse = error as { response?: { status?: number, data?: { type?: string } } }
      if (errorResponse.response?.status === 400
        && errorResponse.response?.data?.type === FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS
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
      // Global Exception handler will handle this one.
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

  const getRoutingSlipV2 = async (getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload) => {
    try {
      // Global Exception handler will handle this one.
      const response = await usePayApi().getRoutingSlipV2(
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
    const toast = useToast()

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
        toast.add({
          description: 'Routing slip status updated successfully.',
          icon: 'i-mdi-check-circle',
          color: 'success'
        })
        return response
      }
    } catch (error) {
      console.error('error ', error)
      toast.add({
        description: getFASErrorMessage(error),
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      return null
    }
  }

  const updateRoutingSlipRefundStatus = async (status: string) => {
    const slipNumber = store.routingSlip.number
    try {
      // Global Exception handler will handle this one.
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
    const slipNumber = store.routingSlip.number
    const toast = useToast()

    try {
      const response = await usePayApi().adjustRoutingSlip(
        payments,
        slipNumber
      )
      toast.add({
        description: 'Routing slip adjusted successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
      return response
    } catch (error) {
      console.error('error adjust routing slip:', error)
      toast.add({
        description: getFASErrorMessage(error),
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
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
  ): Promise<{ error: boolean, message?: string, details?: unknown } | undefined> => {
    const childRoutingSlipNumber: string = store.routingSlip.number ?? ''
    const toast = useToast()
    const linkParams = { childRoutingSlipNumber, parentRoutingSlipNumber }

    try {
      await usePayApi().saveLinkRoutingSlip(linkParams)
      toast.add({
        description: 'Routing slips linked successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
      return {
        error: false
      }
    } catch (error) {
      const errorResponse = error as { response?: { status?: number, data?: unknown } }
      const errorMessage = getFASErrorMessage(error)

      toast.add({
        description: errorMessage,
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })

      if (errorResponse.response?.status === 400) {
        return { error: true, message: errorMessage, details: errorResponse.response?.data }
      }

      console.error('error ', errorResponse.response?.data)
      return { error: true, message: errorMessage }
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
      // Global Exception handler will handle this one.
      return await usePayApi().getDailyReport(formatedDate, type)
    } catch (error) {
      console.error('error ', error) // 500 errors may not return data
      return null
    }
  }

  const getAutoCompleteRoutingSlips = async (
    routingSlipNumber: string
  ): Promise<RoutingSlipDetails[]> => {
  // Global Exception handler will handle this one.
    const response = await usePayApi().postSearchRoutingSlip({
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
    // Global Exception handler will handle this one.
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

    if (!filingType?.corpTypeCode?.code) {
      throw new Error('Filing type must have a valid corporation type code')
    }

    const businessInfo: BusinessInfo = {
      corpType: filingType.corpTypeCode.code
    }

    if (referenceNumber) {
      businessInfo.businessIdentifier = referenceNumber
    }

    const transactionParams: TransactionParams = {
      businessInfo,
      filingInfo: {
        filingTypes: [
          {
            filingTypeCode: filingType?.filingTypeCode?.code,
            futureEffective: Boolean(futureEffective),
            priority: Boolean(priority),
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
    getRoutingSlipV2,
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
