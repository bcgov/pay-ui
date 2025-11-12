import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReviewRoutingSlipCashPayment from '~/components/ReviewRoutingSlip/ReviewRoutingSlipCashPayment.vue'
import { cashPaymentMock } from '../../test-data/mock-routing-slip'

const mockAdjustRoutingSlipAmount = vi.fn()

vi.mock('~/composables/usePaymentInformation', () => ({
  usePaymentInformation: () => ({
    adjustRoutingSlipAmount: mockAdjustRoutingSlipAmount
  })
}))

describe('ReviewRoutingSlipCashPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders component with correct values', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: cashPaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    const receiptInput = wrapper.find('[data-test="txt-receipt-number"]')
    const amountInput = wrapper.find('[data-test="txt-paid-amount"]')

    expect(receiptInput.exists()).toBe(true)
    expect(amountInput.exists()).toBe(true)
  })

  it('calls adjustRoutingSlipAmount when amount is updated', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: cashPaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectInput' })
    const amountInput = inputs[1]

    await amountInput.vm.$emit('update:modelValue', '1000')

    expect(mockAdjustRoutingSlipAmount).toHaveBeenCalledWith(1000, false)
  })

  it('displays USD amount when isAmountPaidInUsd is true', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: { ...cashPaymentMock, paidUsdAmount: 800 },
        isAmountPaidInUsd: true,
        isEditable: false
      }
    })

    const usdInput = wrapper.find('[data-test="txt-paid-usd-amount"]')
    expect(usdInput.exists()).toBe(true)
  })

  it('disables inputs when not editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: cashPaymentMock,
        isAmountPaidInUsd: false,
        isEditable: false
      }
    })

    const receiptInput = wrapper.find('[data-test="txt-receipt-number"]')
    const amountInput = wrapper.find('[data-test="txt-paid-amount"]')

    expect(receiptInput.attributes('disabled')).toBeDefined()
    expect(amountInput.attributes('disabled')).toBeDefined()
  })

  it('enables amount input when editable', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: cashPaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const amountInput = wrapper.find('[data-test="txt-paid-amount"]')
    expect(amountInput.attributes('disabled')).toBeUndefined()
  })
})
