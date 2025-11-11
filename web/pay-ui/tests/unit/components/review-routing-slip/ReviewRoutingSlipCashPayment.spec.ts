/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReviewRoutingSlipCashPayment from '~/components/ReviewRoutingSlip/ReviewRoutingSlipCashPayment.vue'
import { cashPaymentMock } from '../../test-data/mock-routing-slip'

vi.mock('~/composables/usePaymentInformation', () => ({
  usePaymentInformation: () => ({
    adjustRoutingSlipAmount: vi.fn()
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

  it('calls adjustRoutingSlipAmount when amount is updated', async () => {
    const adjustRoutingSlipAmount = vi.fn()
    vi.mocked(usePaymentInformation).mockReturnValue({
      adjustRoutingSlipAmount
    } as any)

    const wrapper = await mountSuspended(ReviewRoutingSlipCashPayment, {
      props: {
        cashPayment: cashPaymentMock,
        isAmountPaidInUsd: false,
        isEditable: true
      }
    })

    const amountInput = wrapper.find('[data-test="txt-paid-amount"]')
    await amountInput.trigger('update:modelValue', '1000')

    expect(adjustRoutingSlipAmount).toHaveBeenCalledWith(1000, false)
  })
})
