import { Address } from '@/models/Address'
import { computed, ref, toRefs, watch } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { RefundRequestDetails } from '@/models/RoutingSlip'
import { useRoutingSlipInfo } from '@/composables/ViewRoutingSlip'
import { getAddressSchema } from '@/schema'

// Composable function to inject Props, options and values to RefundRequestForm component
export default function useRefundRequestForm (props, context) {
  // using `toRefs` to create a Reactive Reference to the `slipId` property of props
  const { inputRefundRequestDetails, isApprovalFlow, isEditing } = toRefs(props)
  const { routingSlipDetails } = useRoutingSlipInfo(props)

  const baseAddressSchema = ref<any>(getAddressSchema(true))
  const isAddressValid = ref<boolean>(false)

  const refundRequestForm = ref<HTMLFormElement>()
  const addressForm = ref<HTMLFormElement>()

  const nameRules = CommonUtils.requiredFieldRule()
  const chequeAdviceRules = CommonUtils.optionalFieldRule('This field should be maximum of 40 characters', 40)

  const name = ref<string>('')
  const address = ref<Address>({})
  const chequeAdvice = ref<string>('')

  const canEdit = computed(() => {
    // except "chequeAdvice" , all other field are not editable in approval process
    return !isApprovalFlow.value && isEditing.value
  })

  const showAddress = computed(() => {
    return canEdit.value || (address.value && Object.values(address.value).some(value => !!value))
  })

  function addressValidity (isValid: boolean): void {
    isAddressValid.value = isValid
  }

  const updateAddress = (updatedAddress: Address) => {
    address.value = updatedAddress || {}
  }

  function isValid (): boolean {
    // Trigger both the form children validations
    // if the status is refund requested that means it is in approval flow where we need to check for only the chequeAdvice form validation
    if (isApprovalFlow.value && isEditing.value) {
      return refundRequestForm.value?.validate()
    }
    const nameValidate = refundRequestForm.value?.validate()
    return addressForm.value?.triggerValidate() && nameValidate && isAddressValid.value
  }

  watch(routingSlipDetails, (newDetails) => {
    name.value = newDetails.contactName || ''
    address.value = newDetails.mailingAddress || {}
  }, { immediate: true })

  // watch input elements name and address, and if anything changes, bubble up the values back to parent;
  watch([name, address, chequeAdvice], () => {
    const refundRequestDetails: RefundRequestDetails = { name: name.value, mailingAddress: address.value, chequeAdvice: chequeAdvice.value } as RefundRequestDetails
    context.emit('update:refundRequestDetails', refundRequestDetails)
  })

  // watch property from parent and if there are any updates, pass on the values to address component
  watch(inputRefundRequestDetails, () => {
    if (inputRefundRequestDetails.value) {
      // convert to address format to component
      name.value = inputRefundRequestDetails.value?.name
      address.value = inputRefundRequestDetails.value?.mailingAddress
      chequeAdvice.value = inputRefundRequestDetails.value?.chequeAdvice
    }
  }, { deep: true, immediate: true })

  return {
    baseAddressSchema,
    refundRequestForm,
    nameRules,
    chequeAdviceRules,
    name,
    chequeAdvice,
    address,
    addressForm,
    addressValidity,
    isValid,
    canEdit,
    showAddress,
    updateAddress
  }
}
