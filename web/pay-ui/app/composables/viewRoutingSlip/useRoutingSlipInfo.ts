import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { SlipStatus } from '~/enums/slip-status'
import { SlipStatusDropdown } from '~/utils/constants'
import commonUtil from '~/utils/common-util'
import type { Address } from '~/interfaces/address'
import type { RefundRequestDetails } from '~/interfaces/routing-slip'
import { DateTime } from 'luxon'

export function useRoutingSlipInfo() {
  const { routingSlip, updateRoutingSlipStatus, updateRoutingSlipRefundStatus, getRoutingSlip } = useRoutingSlip()
  const { t } = useI18n()
  const { baseModal } = useConnectModal()

  const showRefundForm = ref(false)

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

  const handleRefundStatusSelect = async (status: string) => {
    if (!routingSlip.value?.number) {
      return
    }

    try {
      await updateRoutingSlipRefundStatus(status)
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
