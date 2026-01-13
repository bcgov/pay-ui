import { mountSuspended } from '@nuxt/test-utils/runtime'
import { CreateRoutingSlipPayment } from '#components'

const initialModelValue = {
  paymentType: PaymentTypes.CHEQUE as PaymentTypes.CASH | PaymentTypes.CHEQUE,
  paymentItems: {
    1: { uuid: '1', identifier: '123', date: '2025-01-01', amountCAD: '100', amountUSD: '' }
  },
  isUSD: false
}

const defaultProps = { modelValue: initialModelValue, schemaPrefix: 'payment', isCheque: true, totalCad: '100.00' }

describe('CreateRoutingSlipPayment', () => {
  it('renders', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: defaultProps,
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          UFormField: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          URadioGroup: true,
          UButton: true,
          UCheckbox: true,
          ConnectInput: true
        }
      }
    })

    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    const addChequeButton = wrapper.findComponent({ name: 'UButton', props: { label: 'Additional Cheque' } })
    const totalInput = wrapper.findComponent({ name: 'ConnectInput' })

    expect(datePicker.exists()).toBe(true)
    expect(addChequeButton.exists()).toBe(true)
    expect(totalInput.exists()).toBe(true)
    expect(totalInput.props('modelValue')).toBe('100.00')

    const identifierInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    expect(identifierInput.props('name')).toBe('payment.paymentItems.1.identifier')
  })

  it('should hide fields when in `cash` payment', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: {
        ...defaultProps,
        isCheque: false,
        modelValue: { ...initialModelValue, paymentType: PaymentTypes.CASH }
      },
      global: { stubs: { ConnectFieldset: { template: '<div><slot /></div>' } } }
    })

    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    const addChequeButton = wrapper.findComponent({ props: { label: 'Additional Cheque' } })
    const totalInput = wrapper.findComponent({ props: { label: 'Total Amount Received ($)' } })

    expect(datePicker.exists()).toBe(false)
    expect(addChequeButton.exists()).toBe(false)
    expect(totalInput.exists()).toBe(false)
  })

  it('should emit `add-cheque` when add button is clicked', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: defaultProps
    })

    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const addChequeButton = allButtons.find(btn => btn.text() === 'Additional Cheque')
    await addChequeButton!.vm.$emit('click')

    expect(wrapper.emitted()).toHaveProperty('add-cheque')
  })

  it('should emit `remove-cheque` with uuid when the remove button is clicked', async () => {
    const model = {
      ...initialModelValue,
      paymentItems: {
        ...initialModelValue.paymentItems,
        2: { uuid: '2', identifier: '456', amountCAD: '', amountUSD: '', date: '' }
      }
    }

    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: {
        ...defaultProps,
        modelValue: model
      }
    })

    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const removeButton = allButtons.find(btn => btn.props('icon') === 'i-mdi-close')
    expect(removeButton).toBeDefined()
    await removeButton!.vm.$emit('click')

    const emitted = wrapper.emitted('remove-cheque')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['1'])
  })

  it('should emit `change:payment-type` when the radio group is updated', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: defaultProps
    })

    const radioGroup = wrapper.findComponent({ name: 'URadioGroup' })
    radioGroup.vm.$emit('update:modelValue', PaymentTypes.CASH)

    expect(wrapper.emitted()).toHaveProperty('change:payment-type')
  })

  it('emits `validate-date` with field path on blur', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipPayment, {
      props: defaultProps
    })

    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    datePicker.vm.$emit('blur')

    const emitted = wrapper.emitted('validate-date')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['payment.paymentItems.1.date'])
  })
})
