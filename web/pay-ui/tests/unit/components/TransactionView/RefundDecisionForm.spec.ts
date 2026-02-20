import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import RefundDecisionForm from '~/pages/transaction-view/[id]/RefundDecisionForm.vue'
import { RefundApprovalStatus } from '~/utils/constants'

const {
  mockCanApprove,
  mockGetUserInfo,
  mockFormatDisplayDate,
  mockFormatAmount
} = vi.hoisted(() => ({
  mockCanApprove: vi.fn(() => false),
  mockGetUserInfo: vi.fn(() => ({ userName: 'APPROVER' })),
  mockFormatDisplayDate: vi.fn(() => 'January 01, 2025 12:00 AM'),
  mockFormatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`)
}))

const mockAuthUser = ref({
  userName: 'APPROVER',
  roles: ['business_refund_approver']
})

mockNuxtImport('useConnectAuth', () => () => ({
  authUser: mockAuthUser
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: mockFormatDisplayDate,
    formatAmount: mockFormatAmount,
    getUserInfo: mockGetUserInfo,
    canApproveDeclineProductRefund: mockCanApprove
  }
}))

describe('RefundDecisionForm', () => {
  const sampleData: RefundRequestResult = {
    invoiceId: 52305,
    refundId: 1009,
    refundStatus: RefundApprovalStatus.PENDING_APPROVAL,
    refundType: 'INVOICE',
    refundMethod: 'Refund back to Credit Card',
    notificationEmail: 'test@example.com',
    refundReason: 'test reason',
    staffComment: 'staff comment',
    requestedBy: 'requester',
    requestedDate: '2025-12-16T23:58:23.872481',
    declineReason: null,
    decisionBy: null,
    decisionDate: null,
    refundAmount: 31.5,
    transactionAmount: 31.5,
    paymentMethod: 'DIRECT_PAY',
    partialRefundLines: []
  }

  const createWrapper = (propsOverride: Partial<{
    refundRequestData: RefundRequestResult
    invoiceProduct: string | null
    isProcessing: boolean
  }> = {}) => {
    return mount(RefundDecisionForm, {
      props: {
        refundRequestData: sampleData,
        invoiceProduct: 'BUSINESS',
        isProcessing: false,
        ...propsOverride
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          UIcon: true,
          UBadge: {
            template: '<span class="badge"><slot /></span>',
            props: ['color', 'variant', 'size']
          },
          UModal: {
            template: '<div v-if="open" class="modal">'
              + '<slot name="header" /><slot name="body" /><slot name="footer" /></div>',
            props: ['open']
          },
          UInput: true
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
    expect(wrapper.text()).toContain('Refund Status')
  })

  it('should display refund request data values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Full Refund')
    expect(wrapper.text()).toContain('$31.50')
    expect(wrapper.text()).toContain('Refund back to Credit Card')
    expect(wrapper.text()).toContain('test@example.com')
    expect(wrapper.text()).toContain('test reason')
    expect(wrapper.text()).toContain('staff comment')
    expect(wrapper.text()).toContain('requester')
  })

  it('should show decision actions when user has permission and is not requester', () => {
    mockCanApprove.mockReturnValue(true)
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Decline')
    expect(wrapper.text()).toContain('Approve')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('should hide decision actions when user lacks permission', () => {
    mockCanApprove.mockReturnValue(false)
    const wrapper = createWrapper()
    expect(wrapper.text()).not.toContain('Decline')
    expect(wrapper.text()).not.toContain('Approve')
  })

  it('should show Approved By when status is APPROVED', () => {
    const wrapper = createWrapper({
      refundRequestData: {
        ...sampleData,
        refundStatus: RefundApprovalStatus.APPROVED,
        decisionBy: 'admin@idir',
        decisionDate: '2025-12-17T10:00:00Z'
      }
    })
    expect(wrapper.text()).toContain('Approved By')
    expect(wrapper.text()).toContain('admin@idir')
  })

  it('should show Declined By and decline reason when status is DECLINED', () => {
    const wrapper = createWrapper({
      refundRequestData: {
        ...sampleData,
        refundStatus: RefundApprovalStatus.DECLINED,
        decisionBy: 'admin@idir',
        decisionDate: '2025-12-17T10:00:00Z',
        declineReason: 'Invalid request'
      }
    })
    expect(wrapper.text()).toContain('Declined By')
    expect(wrapper.text()).toContain('Reasons for Declining')
    expect(wrapper.text()).toContain('Invalid request')
  })

  it('should emit onApproveRefund when approve button is clicked', async () => {
    mockCanApprove.mockReturnValue(true)
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const approveBtn = buttons.find(b => b.text().includes('Approve'))
    await approveBtn?.trigger('click')
    expect(wrapper.emitted('onApproveRefund')).toBeTruthy()
  })

  it('should emit onCancel when cancel button is clicked', async () => {
    mockCanApprove.mockReturnValue(true)
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text() === 'Cancel')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('onCancel')).toBeTruthy()
  })
})
