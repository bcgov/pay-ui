import CommonUtils from '@/util/common-util'
import type { Payment } from '@/models/Payment'
import { useRoutingSlip } from '../useRoutingSlip'

// Composable function to inject Props, options and values to CreateRoutingSlip component
// CreateRoutingSlip component holds two behaviors - create routing slip & review routing slip modes
export function useCreateRoutingSlip(_, context) {
  const {
    cashPayment,
    chequePayment,
    createRoutingSlip,
    isAmountPaidInUsd,
    isPaymentMethodCheque,
    routingSlipDetails,
    routingSlipAddress
  } = useRoutingSlip()
  const createRoutingSlipForm = ref<HTMLFormElement>()
  const createRoutingSlipDetailsRef = ref<HTMLFormElement>()
  const createRoutingSlipPaymentRef = ref<HTMLFormElement>()
  const createRoutingSlipAddressRef = ref<HTMLFormElement>()
  const modalDialogRef = ref<HTMLFormElement>()

  // modal dialog props and events
  const modalDialogDetails = reactive<any>({
    modalDialogTitle: '',
    modalDialogText: '',
    modalDialogOkText: '',
    modalDialogCancelText: '',
    modalDialogIcon: ''
  })
  // after creation of routing slip, we display modal dialog as info. If user cancels, we display the same modal dialog as alert.
  const isModalDialogInfo = ref<boolean>(false)

  // this variable is used to track if it is a create mode or review mode
  const isReviewMode = ref<boolean>(false)

  const createRoutingSlipLabel = computed(() => {
    return isReviewMode.value ? 'Create' : 'Review and Create'
  })

  const appendQueryParamsIfNeeded = CommonUtils.appendQueryParamsIfNeeded

  function isValid(): boolean {
    // We would want to trigger validate() of all the children
    let isChildrenValid = createRoutingSlipDetailsRef.value?.isValid()
    isChildrenValid = createRoutingSlipPaymentRef.value?.isValid() && isChildrenValid
    isChildrenValid = createRoutingSlipAddressRef.value?.isValid() && isChildrenValid
    return isChildrenValid
  }

  // used to toggle isReviewMode to true - review mode / false - create mode
  function toggleReviewMode(isReviewModeValue: boolean): void {
    isReviewMode.value = isReviewModeValue
  }

  // when "Review and Create" button is clicked in create mode, we toggle the review
  function reviewAndCreate(): void {
    // set to review mode value
    if (isValid()) {
      // check if isAmountToUsd flag is set to true, so then set paymentUsdAmount fields to 0
      if (!isAmountPaidInUsd.value) {
        if (isPaymentMethodCheque.value) {
          // copy the state and then set the paidUsdAmount to 0
          const chequeList = JSON.parse(JSON.stringify(chequePayment.value)).map((payment: Payment) => {
            return { ...payment, paidUsdAmount: 0 }
          })
          chequePayment.value = chequeList
        } else {
          cashPayment.value = {
            ...cashPayment.value,
            paidUsdAmount: 0
          }
        }
      }
      toggleReviewMode(true)
    }
  }

  function backToEdit(): void {
    toggleReviewMode(false)
  }

  function createandReviewButtonEventHandler(): void {
    if (isReviewMode.value) {
      create()
    } else {
      reviewAndCreate()
    }
  }

  // when "Create" button is clicked in review mode, we call the service
  // Create Routing slip
  async function create() {
    try {
      // not required - but just to double confirm it is review mode
      if (isReviewMode.value === true) {
        await createRoutingSlip()
        // on success redirect to view
        // Check if we had come from Staff dashboard
        context.root.$router.push(appendQueryParamsIfNeeded(`/view-routing-slip/${routingSlipDetails.value.number}`, context.root.$route))
      }
    } catch (error: any) {
      console.error('error ', error?.response)
    }
  }

  const { t } = useI18n()
  // Cancel Routing slip flow
  function cancel() {
    // Update modal dialog props and display
    modalDialogDetails.modalDialogTitle = t('createRoutingSlipCancelTitle').toString()
    modalDialogDetails.modalDialogIcon = 'mdi-alert-circle-outline'
    modalDialogDetails.modalDialogText = t('createRoutingSlipCancelText').toString()
    modalDialogDetails.modalDialogOkText = 'Leave'
    modalDialogDetails.modalDialogCancelText = 'Cancel'
    isModalDialogInfo.value = false
    modalDialogRef.value.open()
  }

  function modalDialogCancel() {
    modalDialogRef.value.close()
  }

  function modalDialogClose() {
    modalDialogRef.value.close()
    context.root.$router.push(appendQueryParamsIfNeeded('/home', context.root.$route))
  }

  return {
    createRoutingSlipForm,
    createRoutingSlipDetailsRef,
    createRoutingSlipPaymentRef,
    createRoutingSlipAddressRef,
    modalDialogRef,
    modalDialogDetails,
    isModalDialogInfo,
    createRoutingSlipLabel,
    isReviewMode,
    cancel,
    modalDialogCancel,
    modalDialogClose,
    isValid,
    createandReviewButtonEventHandler,
    backToEdit
  }
}
