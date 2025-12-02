import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { SlipStatus } from '~/enums/slip-status'
import { SlipStatusDropdown, ChequeRefundStatus, chequeRefundCodes } from '~/utils/constants'
import commonUtil from '~/utils/common-util'
import type { Address } from '~/interfaces/address'
import type { RefundRequestDetails } from '~/interfaces/routing-slip'
import { DateTime } from 'luxon'

export function useRoutingSlipInfo() {
  const { routingSlip, updateRoutingSlipStatus, updateRoutingSlipRefundStatus,
    getRoutingSlip, updateRoutingSlipComments } = useRoutingSlip()
  const { t } = useI18n()
  const { baseModal } = useConnectModal()

  const showRefundForm = ref(false)

  function getRefundStatusText(statusCode: string | null): string {
    return ChequeRefundStatus.find(item => item.code === statusCode)?.text
      ?? ChequeRefundStatus.find(item => item.code === chequeRefundCodes.PROCESSING)?.text
      ?? 'N/A'
  }

  const mailingAddress = computed<Address | undefined>(() => {
    const refunds = routingSlip.value?.refunds
    if (refunds && refunds.length > 0 && refunds[0]?.details?.mailingAddress) {
      return refunds[0].details.mailingAddress
    }
    return routingSlip.value?.mailingAddress
  })

  const state = reactive({
    formattedDate: computed<string>(() => {
      const date = routingSlip.value?.createdOn
      if (!date) {
        return '-'
      }
      const dt = DateTime.fromISO(date, { zone: 'UTC' }).setZone('America/Vancouver')
      return dt.isValid ? dt.toFormat('MMM dd, yyyy') : '-'
    }),
    statusColor: computed<string>(() => {
      const status = routingSlip.value?.status
      if (!status) {
        return ''
      }
      return commonUtil.statusListColor(status, true)
    }),
    statusLabel: computed<string>(() => {
      const status = routingSlip.value?.status
      if (!status) {
        return '-'
      }
      const i18nKey = `enum.SlipStatus.${status}`
      return t(i18nKey, status)
    }),
    entityNumber: computed<string>(() => {
      return routingSlip.value?.paymentAccount?.accountName || ''
    }),
    contactName: computed<string | undefined>(() => {
      const refunds = routingSlip.value?.refunds
      if (refunds && refunds.length > 0 && refunds[0]?.details?.name) {
        return refunds[0].details.name
      }
      return routingSlip.value?.contactName
    }),
    mailingAddress,
    deliveryInstructions: computed<string | undefined>(() => {
      const address = mailingAddress.value
      return address?.deliveryInstructions
    }),
    allowedStatuses: computed<SlipStatusDropdown[]>(() => {
      const statuses = routingSlip.value?.allowedStatuses || []
      const dropdownValues = Object.values(SlipStatusDropdown) as string[]
      return statuses
        .map((status) => {
          const statusString = status as string
          if (dropdownValues.includes(statusString)) {
            return statusString as SlipStatusDropdown
          }
          return null
        })
        .filter((status): status is SlipStatusDropdown => status !== null)
    }),
    refundAmount: computed(() => routingSlip.value?.refundAmount || routingSlip.value?.remainingAmount || 0),
    shouldShowRefundAmount: computed(() => {
      const hasRefundAmount = !!(routingSlip.value?.refundAmount || routingSlip.value?.remainingAmount)
      const isNotActive = routingSlip.value?.status !== SlipStatus.ACTIVE
      return hasRefundAmount && !showRefundForm.value && isNotActive
    }),
    refundFormInitialData: computed(() => {
      const refundDetails = routingSlip.value?.refunds?.[0]?.details
      const contactName = routingSlip.value?.contactName || ''
      
      if (refundDetails) {
        return {
          ...refundDetails,
          name: refundDetails.name || contactName
        }
      }
      return {
        name: contactName,
        mailingAddress: routingSlip.value?.mailingAddress || undefined,
        chequeAdvice: undefined
      }
    }),
    refundStatus: computed(() => {
      return getRefundStatusText(routingSlip.value?.refundStatus || null)?.toUpperCase()
    }),
    chequeAdvice: computed(() => routingSlip.value?.refunds?.[0]?.details?.chequeAdvice || ''),
    isRefundRequested: computed(() => routingSlip.value?.status === SlipStatus.REFUNDREQUEST),
    isRefundStatusUndeliverable: computed(() =>
      routingSlip.value?.refundStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE),
    canUpdateRefundStatus: computed(() => {
      const isProcessed = routingSlip.value?.refundStatus === chequeRefundCodes.PROCESSED
      const isUndeliverable = routingSlip.value?.refundStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE
      return isProcessed || isUndeliverable
    }),
    shouldShowRefundStatusSection: computed(() => {
      const isRequested = routingSlip.value?.status === SlipStatus.REFUNDREQUEST
      return (isRequested || routingSlip.value?.status === SlipStatus.REFUNDPROCESSED) && !showRefundForm.value
    }),
    shouldShowNameAndAddress: computed(() => {
      if (showRefundForm.value) {
        return false
      }
      const refunds = routingSlip.value?.refunds
      const contactNameValue = refunds && refunds.length > 0 && refunds[0]?.details?.name
        ? refunds[0].details.name
        : routingSlip.value?.contactName
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
    if (!routingSlip.value?.number) {
      return
    }

    if (status === SlipStatus.REFUNDREQUEST) {
      showRefundForm.value = true
    } else if (status === SlipStatus.NSF) {
      await baseModal.open({
        title: t('modal.placeRoutingSlipToNSF.title'),
        description: t('modal.placeRoutingSlipToNSF.description'),
        dismissible: true,
        buttons: [
          {
            label: t('modal.placeRoutingSlipToNSF.confirmButton'),
            onClick: async () => {
              await updateRoutingSlipStatusHandler(status)
            },
            shouldClose: true
          },
          {
            label: t('label.cancel'),
            variant: 'outline',
            shouldClose: true
          }
        ]
      })
    } else if (status === SlipStatus.VOID) {
      await baseModal.open({
        title: t('modal.voidRoutingSlip.title'),
        description: t('modal.voidRoutingSlip.description'),
        dismissible: true,
        buttons: [
          {
            label: t('modal.voidRoutingSlip.confirmButton'),
            onClick: async () => {
              await updateRoutingSlipStatusHandler(status)
            },
            shouldClose: true
          },
          {
            label: t('label.cancel'),
            variant: 'outline',
            shouldClose: true
          }
        ]
      })
    } else {
      await updateRoutingSlipStatusHandler(status)
    }
  }

  const handleRefundFormSubmit = async (details: RefundRequestDetails) => {
    if (!routingSlip.value?.number) {
      return
    }

    try {
      const payload = {
        ...details,
        status: SlipStatus.REFUNDREQUEST
      }
      const detailsString = JSON.stringify(payload)
      await usePayApi().updateRoutingSlipRefund(detailsString, routingSlip.value.number)
      const routingSlipNumber = routingSlip.value.number
      if (routingSlipNumber) {
        await getRoutingSlip({ routingSlipNumber, showGlobalLoader: false })
      }
      showRefundForm.value = false
    } catch (error) {
      console.error('Error submitting refund request:', error)
    }
  }

  const handleRefundFormCancel = () => {
    showRefundForm.value = false
  }

  const updateRoutingSlipStatusHandler = async (status: SlipStatus) => {
    if (!routingSlip.value?.number) {
      return
    }

    try {
      await updateRoutingSlipStatus({ status })
      const routingSlipNumber = routingSlip.value.number
      if (routingSlipNumber) {
        await getRoutingSlip({ routingSlipNumber, showGlobalLoader: false })
      }
    } catch (error) {
      console.error('Error updating routing slip status:', error)
    }
  }

  const handleRefundStatusSelect = async (status: string, onCommentsUpdated?: () => void) => {
    if (!routingSlip.value?.number) {
      return
    }

    try {
      const currentRefundStatus = routingSlip.value?.refundStatus || null
      await updateRoutingSlipRefundStatus(status)

      const oldStatusText = getRefundStatusText(currentRefundStatus)
      const newStatusText = getRefundStatusText(status)
      const comment = `Refund status updated from ${oldStatusText} to ${newStatusText}`

      await updateRoutingSlipComments(comment)

      if (onCommentsUpdated) {
        onCommentsUpdated()
      }

      const routingSlipNumber = routingSlip.value.number
      if (routingSlipNumber) {
        await getRoutingSlip({ routingSlipNumber, showGlobalLoader: false })
      }
    } catch (error) {
      console.error('Error updating refund status:', error)
    }
  }

  return {
    routingSlip,
    ...toRefs(state),
    handleStatusSelect,
    handleRefundStatusSelect,
    showRefundForm,
    handleRefundFormSubmit,
    handleRefundFormCancel
  }
}
