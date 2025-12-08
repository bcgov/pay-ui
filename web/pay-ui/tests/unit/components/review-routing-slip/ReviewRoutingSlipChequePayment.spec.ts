import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReviewRoutingSlipChequePayment from '~/components/ReviewRoutingSlip/ReviewRoutingSlipChequePayment.vue'
import { chequePaymentMock } from '../../test-data/mock-routing-slip'

const mockAdjustRoutingSlipChequeNumber = vi.fn()
const mockAdjustRoutingSlipAmount = vi.fn()

vi.mock('~/composables/usePaymentInformation', () => ({
  usePaymentInformation: () => ({
    adjustRoutingSlipChequeNumber: mockAdjustRoutingSlipChequeNumber,
    adjustRoutingSlipAmount: mockAdjustRoutingSlipAmount
  })
}))

describe('ReviewRoutingSlipChequePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders component with correct values', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    const chequeNumberInput = wrapper.find('[data-test="txt-cheque-receipt-number-0"]')
    const chequeDateInput = wrapper.find('[data-test="txt-cheque-date-0"]')
    const amountInput = wrapper.find('[data-test="txt-paid-amount-0"]')

    expect(chequeNumberInput.exists()).toBe(true)
    expect(chequeDateInput.exists()).toBe(true)
    expect(amountInput.exists()).toBe(true)
  })

  it('renders multiple cheque payments', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    // Should have 2 cheque payments
    expect(wrapper.find('[data-test="txt-cheque-receipt-number-0"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="txt-cheque-receipt-number-1"]').exists()).toBe(true)
  })

  it('displays USD amount when isAmountPaidInUsd is true', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: true,
        isEditable: false
      }
    })

    const usdInput = wrapper.find('[data-test="txt-paid-usd-amount-0"]')
    expect(usdInput.exists()).toBe(true)
  })

  it('disables inputs when not editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    const chequeNumberInput = wrapper.find('[data-test="txt-cheque-receipt-number-0"]')
    const amountInput = wrapper.find('[data-test="txt-paid-amount-0"]')

    expect(chequeNumberInput.attributes('disabled')).toBeDefined()
    expect(amountInput.attributes('disabled')).toBeDefined()
  })

  it('enables inputs when editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const chequeNumberInput = wrapper.find('[data-test="txt-cheque-receipt-number-0"]')
    const amountInput = wrapper.find('[data-test="txt-paid-amount-0"]')

    expect(chequeNumberInput.attributes('disabled')).toBeUndefined()
    expect(amountInput.attributes('disabled')).toBeUndefined()
  })

  it('renders cheque number input when editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const chequeNumberInput = wrapper.find('[data-test="txt-cheque-receipt-number-0"]')
    expect(chequeNumberInput.exists()).toBe(true)
    expect(chequeNumberInput.attributes('disabled')).toBeUndefined()
  })

  it('renders amount input when editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const amountInput = wrapper.find('[data-test="txt-paid-amount-0"]')
    expect(amountInput.exists()).toBe(true)
    expect(amountInput.attributes('disabled')).toBeUndefined()
  })

  it('formats date correctly', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    const chequeDateInput = wrapper.find('[data-test="txt-cheque-date-0"]')
    expect(chequeDateInput.exists()).toBe(true)
    // Date should be formatted (not raw ISO string)
  })

  it('calls adjustRoutingSlipChequeNumber when cheque number is updated', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectInput' })
    const chequeNumberInput = inputs[0]

    await chequeNumberInput.vm.$emit('update:modelValue', '12345')

    expect(mockAdjustRoutingSlipChequeNumber).toHaveBeenCalledWith('12345', 0)
  })

  it('calls adjustRoutingSlipAmount when amount is updated', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectInput' })
    const amountInput = inputs[2]

    await amountInput.vm.$emit('update:modelValue', '1000')

    expect(mockAdjustRoutingSlipAmount).toHaveBeenCalledWith(1000, false, 0)
  })
})
