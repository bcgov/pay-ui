import { mount } from '@vue/test-utils'
import RefundRequestForm from '~/pages/transaction-view/[id]/RefundRequestForm.vue'
import type { RefundLineItem } from '~/interfaces/transaction-view'

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`),
    formatToTwoDecimals: vi.fn((amount: number) => amount.toFixed(2)),
    emailRules: vi.fn(() => [
      (v: string | null) => !!v || 'Email is required',
      (v: string | null) => !v || /.+@.+\..+/.test(v) || 'Invalid email'
    ]),
    getUserInfo: vi.fn(() => ({ fullName: 'Test User' }))
  }
}))

describe('RefundRequestForm', () => {
  const defaultProps = {
    totalTransactionAmount: 2000,
    refundLineItems: [] as RefundLineItem[],
    previousRefundedAmount: 0,
    isPartialRefundAllowed: true,
    isFullRefundAllowed: true,
    invoicePaymentMethod: 'DIRECT_PAY',
    refundMethod: null
  }

  const createWrapper = (propsOverride: Partial<typeof defaultProps> = {}) => {
    return mount(RefundRequestForm, {
      props: { ...defaultProps, ...propsOverride },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          UIcon: true,
          UAlert: {
            template: '<div class="alert"><slot />{{ description }}</div>',
            props: ['color', 'variant', 'icon', 'description']
          },
          URadioGroup: {
            template: '<div class="radio-group"><slot /></div>',
            props: ['modelValue', 'items'],
            emits: ['update:modelValue']
          },
          UCheckbox: true
        }
      }
    })
  }

  it('should render component with header', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Refund Request')
  })

  it('should render all field labels', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Refund Type')
    expect(wrapper.text()).toContain('Total Refund Amount')
    expect(wrapper.text()).toContain('Refund Method')
    expect(wrapper.text()).toContain('Notification Email')
    expect(wrapper.text()).toContain('Reasons for Refund')
    expect(wrapper.text()).toContain('Staff Comment')
  })

  it('should show previous refund alert when previousRefundedAmount > 0', () => {
    const wrapper = createWrapper({ previousRefundedAmount: 500 })
    expect(wrapper.text()).toContain('already been refunded')
  })

  it('should not show previous refund alert when previousRefundedAmount is 0', () => {
    const wrapper = createWrapper({ previousRefundedAmount: 0 })
    expect(wrapper.text()).not.toContain('already been refunded')
  })

  it('should show Cancel and Review buttons', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Review and Confirm')
  })

  it('should emit onCancel when Cancel is clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text().includes('Cancel'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('onCancel')).toBeTruthy()
  })

  it('should set refund method from invoicePaymentMethod', () => {
    const wrapper = createWrapper({ invoicePaymentMethod: 'DIRECT_PAY' })
    expect(wrapper.text()).toContain('Refund back to Credit Card')
  })

  describe('getRequestedAmountRules', () => {
    const lineItem: RefundLineItem = {
      id: 1,
      description: 'Test',
      total: 100,
      filingFees: 100,
      serviceFees: 10,
      priorityFees: 0,
      futureEffectiveFees: 0,
      filingFeesRequested: null,
      serviceFeesRequested: null,
      priorityFeesRequested: null,
      futureEffectiveFeesRequested: null,
      refundEntireItemRequested: false
    }

    it('should reject values with more than 2 decimal places', async () => {
      const wrapper = createWrapper({ isPartialRefundAllowed: true, refundLineItems: [lineItem] })
      const vm = wrapper.vm as unknown as { getAmountValidationError: (v: unknown, max?: unknown) => string }
      expect(vm.getAmountValidationError(0.0001, 100)).toBe('Maximum 2 decimal places allowed')
      expect(vm.getAmountValidationError('0.001', 100)).toBe('Maximum 2 decimal places allowed')
      expect(vm.getAmountValidationError('1.123', 100)).toBe('Maximum 2 decimal places allowed')
    })

    it('should accept values with 2 or fewer decimal places', async () => {
      const wrapper = createWrapper({ isPartialRefundAllowed: true, refundLineItems: [lineItem] })
      const vm = wrapper.vm as unknown as { getAmountValidationError: (v: unknown, max?: unknown) => string }
      expect(vm.getAmountValidationError(0.01, 100)).toBe('')
      expect(vm.getAmountValidationError('50.50', 100)).toBe('')
      expect(vm.getAmountValidationError(100, 100)).toBe('')
      expect(vm.getAmountValidationError(null, 100)).toBe('')
      expect(vm.getAmountValidationError('', 100)).toBe('')
    })
  })
})
