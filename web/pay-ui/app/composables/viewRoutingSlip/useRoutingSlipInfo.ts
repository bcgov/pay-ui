import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { useLoader } from '@/composables/common/useLoader'
import { SlipStatus } from '~/enums/slip-status'
import { SlipStatusDropdown, ChequeRefundStatus, chequeRefundCodes } from '~/utils/constants'
import commonUtil from '~/utils/common-util'
import type { Address } from '~/interfaces/address'
import type { RefundRequestDetails } from '~/interfaces/routing-slip'
import { DateTime } from 'luxon'

export function useRoutingSlipInfo() {
  const { updateRoutingSlipStatus, updateRoutingSlipRefundStatus,
    getRoutingSlip, updateRoutingSlipComments, invoiceCount } = useRoutingSlip()
  const { store } = useRoutingSlipStore()
  const { t } = useI18n()
  const modal = usePayModals()
  const { toggleLoading } = useLoader()

  const showRefundForm = ref(false)

  function getRefundStatusText(statusCode: string | null): string {
    return ChequeRefundStatus.find(item => item.code === statusCode)?.text
      ?? ChequeRefundStatus.find(item => item.code === chequeRefundCodes.PROCESSING)?.text
      ?? 'N/A'
  }

  const mailingAddress = computed<Address | undefined>(() => {
    const refunds = store.routingSlip.refunds
    if (refunds && refunds.length > 0 && refunds[0]?.details?.mailingAddress) {
      return refunds[0].details.mailingAddress
    }
    return store.routingSlip.mailingAddress
  })

  const state = reactive({
    formattedDate: computed<string>(() => {
      const date = store.routingSlip.createdOn
      if (!date) {
        return '-'
      }
      const dt = DateTime.fromISO(date, { zone: 'UTC' }).setZone('America/Vancouver')
      return dt.isValid ? dt.toFormat('MMM dd, yyyy') : '-'
    }),
    statusColor: computed<string>(() => {
      const status = store.routingSlip.status
      if (!status) {
        return ''
      }
      return commonUtil.statusListColor(status, true)
    }),
    statusLabel: computed<string>(() => {
      const status = store.routingSlip.status
      if (!status) {
        return '-'
      }
      const i18nKey = `enum.SlipStatus.${status}`
      return t(i18nKey, status)
    }),
    entityNumber: computed<string>(() => {
      return store.routingSlip.paymentAccount?.accountName || ''
    }),
    contactName: computed<string | undefined>(() => {
      const refunds = store.routingSlip.refunds
      if (refunds && refunds.length > 0 && refunds[0]?.details?.name) {
        return refunds[0].details.name
      }
      return store.routingSlip.contactName
    }),
    mailingAddress,
    deliveryInstructions: computed<string | undefined>(() => {
      const address = mailingAddress.value
      return address?.deliveryInstructions
    }),
    allowedStatuses: computed<SlipStatusDropdown[]>(() => {
      const statuses = store.routingSlip.allowedStatuses || []
      const dropdownValues = Object.values(SlipStatusDropdown) as string[]
      return statuses
        .map((status: string) => {
          const statusString = status as string
          if (dropdownValues.includes(statusString)) {
            return statusString as SlipStatusDropdown
          }
          return null
        })
        .filter((status): status is SlipStatusDropdown => status !== null)
    }),
    refundAmount: computed(() => store.routingSlip.refundAmount || store.routingSlip.remainingAmount || 0),
    shouldShowRefundAmount: computed(() => {
      const hasRefundAmount = !!(store.routingSlip.refundAmount || store.routingSlip.remainingAmount)
      const isNotActive = store.routingSlip.status !== SlipStatus.ACTIVE
      return hasRefundAmount && !showRefundForm.value && isNotActive
    }),
    refundFormInitialData: computed(() => {
      const refundDetails = store.routingSlip.refunds?.[0]?.details
      const contactName = store.routingSlip.contactName || ''

      if (refundDetails) {
        return {
          ...refundDetails,
          name: refundDetails.name || contactName
        }
      }
      return {
        name: contactName,
        mailingAddress: store.routingSlip.mailingAddress || undefined,
        chequeAdvice: undefined
      }
    }),
    refundStatus: computed(() => {
      return getRefundStatusText(store.routingSlip.refundStatus || null)?.toUpperCase()
    }),
    chequeAdvice: computed(() => store.routingSlip.refunds?.[0]?.details?.chequeAdvice || ''),
    isRefundRequested: computed(() => store.routingSlip.status === SlipStatus.REFUNDREQUEST),
    isRefundStatusUndeliverable: computed(() =>
      store.routingSlip.refundStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE),
    canUpdateRefundStatus: computed(() => {
      const isProcessed = store.routingSlip.refundStatus === chequeRefundCodes.PROCESSED
      const isUndeliverable = store.routingSlip.refundStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE
      return isProcessed || isUndeliverable
    }),
    shouldShowRefundStatusSection: computed(() => {
      const isRequested = store.routingSlip.status === SlipStatus.REFUNDREQUEST
      return (isRequested || store.routingSlip.status === SlipStatus.REFUNDPROCESSED) && !showRefundForm.value
    }),
    shouldShowNameAndAddress: computed(() => {
      if (showRefundForm.value) {
        return false
      }
      const refunds = store.routingSlip.refunds
      const contactNameValue = refunds && refunds.length > 0 && refunds[0]?.details?.name
        ? refunds[0].details.name
        : store.routingSlip.contactName
      const mailingAddressValue = mailingAddress.value
      const hasContactName = !!contactNameValue
      const hasMailingAddress = !!mailingAddressValue && (
        mailingAddressValue.street
        || mailingAddressValue.city
        || mailingAddressValue.region
        || mailingAddressValue.postalCode
        || mailingAddressValue.country
      )
      return hasContactName || hasMailingAddress
    })
  })

  const handleStatusSelect = async (status: SlipStatus) => {
    if (!store.routingSlip.number) {
      return
    }

    if (status === SlipStatus.REFUNDREQUEST) {
      showRefundForm.value = true
    } else if (status === SlipStatus.NSF) {
      await modal.openPlaceRoutingSlipToNSFModal(async () => {
        await updateRoutingSlipStatusHandler(status)
      })
    } else if (status === SlipStatus.VOID) {
      if (invoiceCount.value && invoiceCount.value > 0) {
        await modal.openErrorDialog(
          t('error.voidRoutingSlip.title'),
          t('error.voidRoutingSlip.description')
        )
        return
      }
      await modal.openVoidRoutingSlipModal(async () => {
        await updateRoutingSlipStatusHandler(status)
      })
    } else {
      await updateRoutingSlipStatusHandler(status)
    }
  }

  const handleRefundFormSubmit = async (details: RefundRequestDetails) => {
    if (!store.routingSlip.number) {
      return
    }

    try {
      const payload = {
        ...details,
        status: SlipStatus.REFUNDREQUEST
      }
      const detailsString = JSON.stringify(payload)
      toggleLoading(true)
      // Global Exception handler will handle this one.
      await usePayApi().updateRoutingSlipRefund(detailsString, store.routingSlip.number)
      const routingSlipNumber = store.routingSlip.number
      await getRoutingSlip({ routingSlipNumber })
      toggleLoading(false)
      showRefundForm.value = false
    } catch (error) {
      console.error('Error submitting refund request:', error)
      toggleLoading(false)
    }
  }

  const handleRefundFormCancel = () => {
    showRefundForm.value = false
  }

  const updateRoutingSlipStatusHandler = async (status: SlipStatus) => {
    if (!store.routingSlip.number) {
      return
    }

    try {
      toggleLoading(true)
      // Global Exception handler will handle this one.
      await updateRoutingSlipStatus({ status })
      const routingSlipNumber = store.routingSlip.number
      await getRoutingSlip({ routingSlipNumber })
      toggleLoading(false)
    } catch (error) {
      console.error('Error updating routing slip status:', error)
      toggleLoading(false)
    }
  }

  const handleRefundStatusSelect = async (status: string, onCommentsUpdated?: () => void) => {
    if (!store.routingSlip.number) {
      return
    }

    try {
      toggleLoading(true)
      const currentRefundStatus = store.routingSlip.refundStatus || null
      // Global Exception handler will handle this one.
      await updateRoutingSlipRefundStatus(status)

      const oldStatusText = getRefundStatusText(currentRefundStatus)
      const newStatusText = getRefundStatusText(status)
      const comment = `Refund status updated from ${oldStatusText} to ${newStatusText}`

      await updateRoutingSlipComments(comment)

      if (onCommentsUpdated) {
        onCommentsUpdated()
      }

      const routingSlipNumber = store.routingSlip.number
      await getRoutingSlip({ routingSlipNumber })
      toggleLoading(false)
    } catch (error) {
      console.error('Error updating refund status:', error)
      toggleLoading(false)
    }
  }

  return {
    routingSlip: computed(() => store.routingSlip),
    ...toRefs(state),
    handleStatusSelect,
    handleRefundStatusSelect,
    showRefundForm,
    handleRefundFormSubmit,
    handleRefundFormCancel
  }
}
