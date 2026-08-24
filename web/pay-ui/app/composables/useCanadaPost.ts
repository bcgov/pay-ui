/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Local override of @sbc-connect/nuxt-forms useCanadaPost.
 * Upstream common lib hardcodes `codesList: 'CA'`, which restricts AddressComplete search
 * results to Canada regardless of the selected country and silently
 * overwrites the user's country selection back to 'CA'. Here the codes list
 * follows the selected country instead.
 */
export const useCanadaPost = () => {
  const activeAddressField = ref<string>()
  const address = reactive<ConnectAddress>({
    street: '',
    streetAdditional: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    locationDescription: '',
    streetName: '',
    streetNumber: '',
    unitNumber: ''
  })

  const createAddressComplete = (
    pca: any, key: string, id: string, countryIso2: string, countrySelect: boolean
  ): object => {
    const fields = [
      { element: id, field: 'Line1', mode: pca.fieldMode.SEARCH }
    ]
    // Conditional to only allow country selection depending on control
    const bar = countrySelect ? { visible: true, showCountry: true } : {}
    const countries = {
      defaultCode: countryIso2,
      ...(countrySelect ? {} : { codesList: countryIso2 })
    }
    const options = { key, bar, countries }
    const addressComplete = new pca.Address(fields, options)
    addressComplete.listen('populate', addressCompletePopulate)
    return addressComplete
  }

  const enableAddressComplete = (id: string, countryIso2: string, countrySelect: boolean): void => {
    activeAddressField.value = id
    const config = useRuntimeConfig()
    const pca = (window as any).pca
    const key = config.public.addressCompleteKey as string
    if (!pca || !key) {
      console.warn('AddressComplete not initialized due to missing script and/or key')
      return
    }
    if ((window as any).currentAddressComplete) {
      (window as any).currentAddressComplete.destroy()
    }
    (window as any).currentAddressComplete = createAddressComplete(pca, key, id, countryIso2, countrySelect)
  }

  const addressCompletePopulate = (addressComplete: CanadaPostAddressResponse): void => {
    address.street = addressComplete.Line1 || 'N/A'
    address.streetAdditional = addressComplete.Line2 || ''
    address.city = addressComplete.City
    address.region = addressComplete.ProvinceCode
    address.postalCode = addressComplete.PostalCode
    address.country = addressComplete.CountryIso2
    address.streetName = addressComplete.Street
    address.streetNumber = addressComplete.BuildingNumber
    address.unitNumber = addressComplete.SubBuilding
  }

  return {
    activeAddressField,
    address,
    enableAddressComplete
  }
}
