import { AddressSchemaIF } from '@/interfaces'
import { maxLength, required } from 'vuelidate/lib/validators'

// The Address schema containing Vuelidate rules.
export const addressSchema: AddressSchemaIF = {
  streetAddress: {
    max: maxLength(50)
  },
  streetAddressAdditional: {
    max: maxLength(50)
  },
  addressCity: {
    max: maxLength(40)
  },
  addressCountry: {
  },
  addressRegion: {
    max: maxLength(2)
  },
  postalCode: {
    max: maxLength(15)
  },
  deliveryInstructions: {
    max: maxLength(80)
  }
}

export function getAddressSchema (isRequired: boolean): AddressSchemaIF {
  return {
    streetAddress: {
      ...(isRequired && { required }),
      max: maxLength(50)
    },
    streetAddressAdditional: {
      max: maxLength(50)
    },
    addressCity: {
      ...(isRequired && { required }),
      max: maxLength(40)
    },
    addressCountry: {
      ...(isRequired && { required })
    },
    addressRegion: {
      ...(isRequired && { required }),
      max: maxLength(2)
    },
    postalCode: {
      ...(isRequired && { required }),
      max: maxLength(15)
    },
    deliveryInstructions: {
      max: maxLength(80)
    }
  }
}
