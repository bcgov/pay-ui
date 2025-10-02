import { computed, ref } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { useRoutingSlip } from '../useRoutingSlip'
import { addressSchema } from '@/schema'

export function useCreateRoutingSlipAddress() {
  const addressForm = ref<HTMLFormElement>()
  const isAddressValid = ref<boolean>(false)

  function addressValidity(isValid: boolean): void {
    isAddressValid.value = isValid
  }

  const { routingSlipAddress } = useRoutingSlip()
  const createRoutingSlipAddressForm = ref<HTMLFormElement>()

  const baseAddressSchema = ref<any>(addressSchema)
  const address = ref<Address>({})

  const errorMessage = ref<string>('')

  const contactName = computed({
    get: () => {
      return routingSlipAddress.value?.contactName || ''
    },
    set: (modalValue: string) => {
      routingSlipAddress.value = {
        ...routingSlipAddress.value,
        contactName: modalValue
      }
    }
  })

  const updateAddress = (address: Address) => {
    if (routingSlipAddress?.value) {
      routingSlipAddress.value.mailingAddress = address
    }
  }

  const entityNameRules = CommonUtils.requiredFieldRule(
    'A Name of Person or Organization is required'
  )

  function isValid(): boolean {
    // Current version of Vuetify returns validate() as true even if :error-message is not null on v-text-field
    return addressForm.value?.triggerValidate() && createRoutingSlipAddressForm.value?.validate() && errorMessage.value?.length === 0
  }

  return {
    address,
    baseAddressSchema,
    createRoutingSlipAddressForm,
    contactName,
    entityNameRules,
    routingSlipAddress,
    errorMessage,
    isValid,
    addressForm,
    addressValidity,
    isAddressValid,
    updateAddress
  }
}
