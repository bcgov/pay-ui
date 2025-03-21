import { Address } from '@/models/Address'
import { ref } from '@vue/composition-api'
import { getAddressSchema } from '@/schema'

export function useEFTRefundAddress () {
  const addressForm = ref<HTMLFormElement>()
  const isAddressValid = ref<boolean>(false)

  function addressValidity (isValid: boolean): void {
    isAddressValid.value = isValid
  }

  const baseAddressSchema = ref<any>(getAddressSchema(true))
  const address = ref<Address>({})
  const errorMessage = ref<string>('')

  function isValid (): boolean {
    return addressForm.value?.triggerValidate() && errorMessage.value?.length === 0
  }

  return {
    address,
    baseAddressSchema,
    errorMessage,
    isValid,
    addressForm,
    addressValidity,
    isAddressValid
  }
}
