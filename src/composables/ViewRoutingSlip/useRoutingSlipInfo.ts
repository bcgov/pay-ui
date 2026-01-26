import { computed, reactive, ref, watch } from '@vue/composition-api'

import { RefundRequestDetails, RoutingSlip } from '@/models/RoutingSlip'
import { SlipStatus } from '@/util/constants'
import { useStatusMenu } from '@/composables/common/useStatusMenu'
import { Code } from '@/models/Code'
import CommonUtils from '@/util/common-util'
import { useI18n } from 'vue-i18n-composable'
import { ApiError } from '@/models/ApiError'
import { useCodes } from '../useCodes'
import { useRoutingSlip } from '../useRoutingSlip'
import { addressSchema } from '@/schema'

// Composable function to inject Props, options and values to useRoutingSlipInfo component
export default function useRoutingSlipInfo (props) {
  const { isRoutingSlipAChild, routingSlip, updateRoutingSlipStatus } = useRoutingSlip()
  const { routingSlipStatusList } = useCodes()
  const addMoreDetails = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const isAddressEditable = ref<boolean>(false)
  const currentStatus = ref<Code>(null)
  const errorMessage = ref<string>('')
  const apiError = ref<ApiError>(null)
  const baseAddressSchema = ref<any>(addressSchema)

  const modalDialogRef = ref<HTMLFormElement>()

  const refundRequestForm = ref<HTMLFormElement>()
  const refundRequestDetails = ref<RefundRequestDetails>(null)
  const isApproverRole = CommonUtils.isApproverRole()

  // passign value as blank to avoid warning
  const { statusLabel, getSelectedStatusObject } = useStatusMenu(
    reactive({ value: '' }),
    {}
  )

  const routingSlipDetails = computed<RoutingSlip>(() => {
    return routingSlip.value || {}
  })

  const refundAmount = computed(() => {
    const amount = (routingSlipDetails.value.refundAmount !== null && routingSlipDetails.value.refundAmount > 0)
      ? routingSlipDetails.value.refundAmount
      : routingSlipDetails.value.remainingAmount

    return amount > 0 ? CommonUtils.appendCurrencySymbol(amount.toFixed(2)) : null
  })

  const { t } = useI18n()

  const modalText = computed(() => {
    let title = t('NSFWarningTitle')
    let subText = t('NSFWarningText')
    const icon = 'mdi-alert-circle-outline'
    let confirmBtnText = 'Place status to NSF'
    const cancelBtnText = 'Cancel'
    let isError = false
    if (apiError.value) {
      title = apiError.value?.title || 'Server error'
      subText = apiError.value?.detail || apiError.value?.type || 'Server error'
      isError = true
    } else if (isWriteOfProcess(currentStatus.value)) {
      title = t('WriteOffWarningTitle')
      subText = t('WriteOffWarningText')
      confirmBtnText = 'Authorize Write off'
    } else if (isVoidProcess(currentStatus.value)) {
      title = t('VoidWarningTitle')
      subText = t('VoidWarningText')
      confirmBtnText = 'Void Routing Slip'
    }
    return { title, subText, icon, confirmBtnText, cancelBtnText, isError }
  })

  const canRequestRefund = computed(() => {
    return routingSlipDetails.value.remainingAmount > 0 || false
  })

  const isApprovalFlow = computed(() => {
    // if refund process saved show status as disable
    return (
      (isApproverRole &&
        CommonUtils.isRefundProcessStatus(routingSlipDetails.value?.status)) ||
      false
    )
  })

  const showAddress = computed(() => {
    return isRefundProcess(currentStatus?.value) || !!showAddressEditMode.value
  })

  const showRefundAmount = computed(() => {
    return (
      isRefundProcess(currentStatus?.value) && refundAmount
    )
  })

  const showAddressEditMode = computed(() => {
    // need show address as editable also as view
    return isAddressEditable.value
  })

  const allowedStatusList = computed(() => {
    // get allowed status from API and add here
    let allowedStatuses = routingSlipDetails.value?.allowedStatuses || []
    if (!CommonUtils.isVoidRole()) {
      allowedStatuses = allowedStatuses?.filter((status) => status !== SlipStatus.VOID)
    }
    return allowedStatuses
  })

  const isEditable = computed(() => {
    // if user can edit by status
    const isEditableStatus =
      CommonUtils.isEditEnabledBystatus(routingSlipDetails.value?.status) ||
      false
    return CommonUtils.isRefundRequestStatus(routingSlipDetails.value.status)
      ? isApproverRole
      : isEditableStatus
  })

  const routingSlipContactName = computed(() => {
    return routingSlipDetails.value.refunds?.[0]?.details?.name || routingSlipDetails.value.contactName
  })

  const routingSlipMailingAddress = computed(() => {
    return routingSlipDetails.value.refunds?.[0]?.details?.mailingAddress || routingSlipDetails.value.mailingAddress
  })

  // since we have to return different value
  watch(
    [routingSlipDetails, routingSlipStatusList],
    ([newRoutingSlipDetails], [oldRoutingSlip]) => {
      // routingSlipStatusList need to avoid async data issues
      if (
        routingSlipStatusList.value.length > 0 &&
        (!currentStatus.value ||
          currentStatus.value?.code !== newRoutingSlipDetails.status)
      ) {
        currentStatus.value = getStatusObject(newRoutingSlipDetails.status)
      }
      // to update address
      if (
        oldRoutingSlip?.number !== newRoutingSlipDetails.number ||
        oldRoutingSlip?.status !== newRoutingSlipDetails.status
      ) {
        if (
          newRoutingSlipDetails?.refunds &&
          newRoutingSlipDetails?.refunds[0]
        ) {
          const details = newRoutingSlipDetails?.refunds[0].details
          refundRequestDetails.value = JSON.parse(JSON.stringify(details))
        } else {
          refundRequestDetails.value = null
        }
      }
    },
    { immediate: true, deep: true }
  )

  function getStatusObject (status) : Code {
    const statusObject = getSelectedStatusObject(status)
    return statusObject[0] || {}
  }

  function cancelOrReject () {
    // rest status and set close addMoreDetails on cancel click
    isAddressEditable.value = false
    if (isApprovalFlow.value || isRefundProcess(currentStatus.value)) {
      resettoOldStatus()
    } else if (showConfirmationModal(currentStatus.value)) {
      modalDialogClose()
    }
  }

  function resettoOldStatus () {
    // reset to orginal status on toggle
    currentStatus.value = getStatusObject(routingSlipDetails.value.status)
    addMoreDetails.value = false
  }
  // no additional steps needed before calling API
  function directStatusUpdate () {
    return (
      !isRefundProcess(currentStatus.value) &&
      !showConfirmationModal(currentStatus.value)
    )
  }

  // update routign slip status on click of done
  async function updateStatus () {
    // need to call validate only of its refund
    const overrideStatus = currentStatus.value.code === SlipStatus.CANCEL_REFUND_REQUEST ? SlipStatus.REFUNDREJECTED : currentStatus.value.code
    isLoading.value = true
    const statusDetails = {
      status: overrideStatus,
      details: refundRequestDetails.value
    }

    if (isRefundProcess(currentStatus.value)) {
      const status = isApprovalFlow.value
        ? SlipStatus.REFUNDAUTHORIZED
        : overrideStatus
      await updateRefund(status)
    } else {
      const response = await updateRoutingSlipStatus(statusDetails)
      if (showConfirmationModal(currentStatus.value)) {
        modalDialogClose()
      }
      addMoreDetails.value = false
      if (![202, 200].includes(response.status)) {
        apiError.value = response?.data
        modalDialogRef.value.open()
      }
    }
    isLoading.value = false
  }

  function modalDialogClose () {
    modalDialogRef.value.close()
  }

  async function closeErrorDialog () {
    modalDialogClose()
    // Wait 1 second, for the dialog animation to complete.
    await new Promise(resolve => setTimeout(resolve, 1000))
    apiError.value = null
  }

  async function updateRefund (status: any = SlipStatus.REFUNDREQUEST) {
    if (refundRequestForm.value.isValid()) {
      const statusDetails = {
        status: status,
        details: refundRequestDetails.value
      }
      await updateRoutingSlipStatus(statusDetails)
      addMoreDetails.value = false
      isAddressEditable.value = false
    }
  }

  // get label of status
  function getStatusLabel (code: string) {
    return statusLabel(code)
  }
  function isRefundProcess (status) {
    return CommonUtils.isRefundProcessStatus(status?.code)
  }

  const isRefundState = computed(() => {
    return (
      isRefundProcess(currentStatus?.value) && refundAmount
    )
  })

  function isNSFProcess (status) {
    return status?.code === SlipStatus.NSF
  }

  function isWriteOfProcess (status) {
    return status?.code === SlipStatus.WRITEOFFAUTHORIZED
  }

  function isVoidProcess (status) {
    return status?.code === SlipStatus.VOID
  }

  function showConfirmationModal (status) {
    return isWriteOfProcess(status) || isNSFProcess(status) || isVoidProcess(status)
  }

  // TODO where to show error message
  function statusChange (status) {
    // TODO change to computed for supervisor role

    errorMessage.value = ''

    const showAddressStatus = isRefundProcess(status)
    currentStatus.value = status
    //  change to refund status once status available
    if (showAddressStatus && canRequestRefund.value) {
      isAddressEditable.value = true
    } else if (!canRequestRefund.value) {
      // showAddressEditMode.value = false
      errorMessage.value = 'There is not enough funds for refund'
    }
    // isAddressEditable.value = false
    if (directStatusUpdate()) {
      updateStatus()
    } else if (showConfirmationModal(currentStatus.value)) {
      modalDialogRef.value.open()
    } else if (isRefundProcess(currentStatus.value)) {
      addMoreDetails.value = true
    }
  }

  return {
    routingSlip,
    addMoreDetails,
    routingSlipDetails,
    currentStatus,
    updateStatus,
    getStatusLabel,
    isRoutingSlipAChild,
    statusChange,
    showAddress,
    showRefundAmount,
    refundAmount,
    refundRequestForm,
    refundRequestDetails,
    errorMessage,
    showAddressEditMode,
    isApprovalFlow,
    cancelOrReject,
    isEditable,
    allowedStatusList,
    modalDialogRef,
    modalText,
    isLoading,
    closeErrorDialog,
    baseAddressSchema,
    routingSlipContactName,
    routingSlipMailingAddress
  }
}
