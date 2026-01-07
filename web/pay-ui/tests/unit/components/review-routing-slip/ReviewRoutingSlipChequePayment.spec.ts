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

  it('should render, display multiple payments, handle USD, enable/disable inputs, '
    + 'format dates, and handle updates', async () => {
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
    expect(wrapper.find('[data-test="txt-cheque-receipt-number-1"]').exists()).toBe(true)

    expect(chequeNumberInput.attributes('disabled')).toBeDefined()
    expect(amountInput.attributes('disabled')).toBeDefined()

    const wrapper2 = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: true,
        isEditable: false
      }
    })

    const usdInput = wrapper2.find('[data-test="txt-paid-usd-amount-0"]')
    expect(usdInput.exists()).toBe(true)

    const wrapper3 = await mountSuspended(ReviewRoutingSlipChequePayment, {
      props: {
        chequePayment: chequePaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const chequeNumberInput2 = wrapper3.find('[data-test="txt-cheque-receipt-number-0"]')
    const amountInput2 = wrapper3.find('[data-test="txt-paid-amount-0"]')

    expect(chequeNumberInput2.attributes('disabled')).toBeUndefined()
    expect(amountInput2.attributes('disabled')).toBeUndefined()

    const inputs = wrapper3.findAllComponents({ name: 'ConnectInput' })
    const chequeNumberInput3 = inputs[0]
    await chequeNumberInput3.vm.$emit('update:modelValue', '12345')
    expect(mockAdjustRoutingSlipChequeNumber).toHaveBeenCalledWith('12345', 0)

    const amountInput3 = inputs[2]
    await amountInput3.vm.$emit('update:modelValue', '1000')
    expect(mockAdjustRoutingSlipAmount).toHaveBeenCalledWith(1000, false, 0)
  })
})
