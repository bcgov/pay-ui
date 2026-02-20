import { mount } from '@vue/test-utils'
import RefundReviewForm from '~/pages/transaction-view/[id]/RefundReviewForm.vue'
import type { RefundFormData } from '~/interfaces/transaction-view'

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: vi.fn(() => 'January 02, 2025 3:04 AM'),
    formatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`)
  }
}))

describe('RefundReviewForm', () => {
  const sampleData: RefundFormData = {
    refundType: 'Full Refund',
    refundLineItems: [],
    totalRefundAmount: 250,
    refundMethod: 'Refund back to Credit Card',
    notificationEmail: 'user@example.com',
    reasonsForRefund: 'Reason',
    staffComment: 'Comment',
    requestedBy: 'Jane',
    requestedTime: '2025-01-02T03:04:05Z',
    decisionBy: null,
    decisionTime: null
  }

  const createWrapper = (propsOverride: Partial<{
    refundFormData: RefundFormData
    isProcessing: boolean
  }> = {}) => {
    return mount(RefundReviewForm, {
      props: {
        refundFormData: sampleData,
        isProcessing: false,
        ...propsOverride
      },
      global: {
        stubs: {
          UIcon: true
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
    expect(wrapper.text()).toContain('Request Date')
    expect(wrapper.text()).toContain('Refund Type')
    expect(wrapper.text()).toContain('Total Refund Amount')
    expect(wrapper.text()).toContain('Refund Method')
    expect(wrapper.text()).toContain('Notification Email')
    expect(wrapper.text()).toContain('Reason for Refund')
    expect(wrapper.text()).toContain('Staff Comment')
    expect(wrapper.text()).toContain('Requested By')
  })

  it('should display refund form data values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Full Refund')
    expect(wrapper.text()).toContain('$250.00')
    expect(wrapper.text()).toContain('Refund back to Credit Card')
    expect(wrapper.text()).toContain('user@example.com')
    expect(wrapper.text()).toContain('Reason')
    expect(wrapper.text()).toContain('Comment')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('January 02, 2025 3:04 AM')
  })

  it('should show Back and Submit buttons', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Back')
    expect(wrapper.text()).toContain('Submit Refund Request')
  })

  it('should emit onProceedToRequestForm when Back is clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const backBtn = buttons.find(b => b.text().includes('Back'))
    await backBtn?.trigger('click')
    expect(wrapper.emitted('onProceedToRequestForm')).toBeTruthy()
  })

  it('should emit onProceedToConfirm when Submit is clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const submitBtn = buttons.find(b => b.text().includes('Submit Refund Request'))
    await submitBtn?.trigger('click')
    expect(wrapper.emitted('onProceedToConfirm')).toBeTruthy()
  })

  it('should disable submit button when isProcessing is true', () => {
    const wrapper = createWrapper({ isProcessing: true })
    const buttons = wrapper.findAll('button')
    const submitBtn = buttons.find(b => b.attributes('disabled') !== undefined)
    expect(submitBtn?.exists()).toBe(true)
  })
})
