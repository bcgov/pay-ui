import { mount, shallowMount } from '@vue/test-utils'

import CreateRoutingSlipCashPayment from '@/components/RoutingSlip/CreateRoutingSlipCashPayment.vue'
import Vuetify from 'vuetify'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'

describe('CreateRoutingSlipCashPayment.vue', () => {
  let store
  const vuetify = new Vuetify({})
  const { cashPayment } = useRoutingSlip()
  beforeEach(() => {
    cashPayment.value = { chequeReceiptNumber: '1234', paidAmount: 20 }
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders with 2 input', () => {
    const wrapper = shallowMount(CreateRoutingSlipCashPayment, {
      store
    })
    const reciptNumber: any = wrapper.find('[data-test="txtReceiptNumber"]')
    const txtPaidAmount: any = wrapper.find('[data-test="txtPaidAmount"]')
    expect(reciptNumber.exists()).toBeTruthy()
    expect(txtPaidAmount.exists()).toBeTruthy()
  })

  it('Should have Receipt Number input field and inital value from store', () => {
    const wrapper = mount(CreateRoutingSlipCashPayment, {
      vuetify
    })

    const reciptNumber: any = wrapper.find('[data-test="txtReceiptNumber"]')
    const txtPaidAmount: any = wrapper.find('[data-test="txtPaidAmount"]')
    expect(reciptNumber.element.value).toBe(cashPayment.value.chequeReceiptNumber)
    expect(txtPaidAmount.element.value).toBe(cashPayment.value.paidAmount.toString())
  })

  it('Should update Receipt Number on change', () => {
    const wrapper = mount(CreateRoutingSlipCashPayment, {
      store,
      vuetify
    })

    const reciptNumber: any = wrapper.find('[data-test="txtReceiptNumber"]')
    const txtPaidAmount: any = wrapper.find('[data-test="txtPaidAmount"]')

    reciptNumber.setValue('456')
    txtPaidAmount.setValue('40')
    expect(reciptNumber.element.value).toBe('456')
    expect(txtPaidAmount.element.value).toBe('40')
  })

  it('When EnableUSDExchange flag is FALSE, should NOT display USD checkbox and amount field', () => {
    vi.spyOn(LaunchDarklyService, 'getFlag').mockReturnValue(false)
    const wrapper: any = mount(CreateRoutingSlipCashPayment, { vuetify })

    const usdCheckbox: any = wrapper.find('[data-test="usd-checkbox"]')
    const usdAmountField: any = wrapper.find('[data-test="txtPaidUsdAmount"]')
    expect(usdCheckbox.exists()).toBeFalsy()
    expect(usdAmountField.exists()).toBeFalsy()
  })
})
