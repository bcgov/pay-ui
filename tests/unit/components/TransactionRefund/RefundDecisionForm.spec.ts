import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'

import RefundDecisionForm from '@/components/TransactionView/RefundDecisionForm.vue'
import CommonUtils from '@/util/common-util'

describe('RefundDecisionForm.vue', () => {
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})

  const responseData = {
    decisionBy: null,
    decisionDate: null,
    declineReason: null,
    invoiceId: 52305,
    notificationEmail: 'test@example.com',
    partialRefundLines: [],
    paymentMethod: 'DIRECT_PAY',
    refundAmount: 31.5,
    refundId: 1009,
    refundMethod: 'Refund back to Credit Card',
    refundReason: 'test reason',
    refundStatus: 'PENDING_APPROVAL',
    refundType: 'INVOICE',
    requestedBy: 'requester',
    requestedDate: '2025-12-16T23:58:23.872481',
    staffComment: 'staff comment',
    transactionAmount: 31.5
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  function formRender (canApprove: boolean) {
    vi.spyOn(CommonUtils, 'canApproveDeclineProductRefund').mockReturnValue(canApprove)
    const wrapper = shallowMount(RefundDecisionForm, {
      localVue,
      vuetify,
      propsData: {
        refundRequestData: responseData,
        invoiceProduct: 'BUSINESS',
        isProcessing: false
      },
      directives: { can () { } }
    })

    expect(wrapper.findComponent(RefundDecisionForm).exists()).toBe(true)
    expect(wrapper.text()).toContain('Refund Request')
    expect(wrapper.text()).toContain('Request Date')
    expect(wrapper.text()).toContain('Refund Type')
    expect(wrapper.text()).toContain('Full Refund')
    expect(wrapper.text()).toContain('Total Refund Amount')
    expect(wrapper.text()).toContain('$31.50')
    expect(wrapper.text()).toContain('Refund Method')
    expect(wrapper.text()).toContain('Refund back to Credit Card')
    expect(wrapper.text()).toContain('Notification Email')
    expect(wrapper.text()).toContain(responseData.notificationEmail)
    expect(wrapper.text()).toContain('Reason for Refund')
    expect(wrapper.text()).toContain(responseData.refundReason)
    expect(wrapper.text()).toContain('Staff Comment')
    expect(wrapper.text()).toContain(responseData.staffComment)
    expect(wrapper.text()).toContain('Requested By')
    expect(wrapper.text()).toContain('requester, December 16, 2025 3:58 PM Pacific Time')
    return wrapper
  }

  it('renders component with decision actions', () => {
    const wrapper = formRender(true)
    expect(wrapper.find('#decision-actions').exists()).toBe(true)
  })

  it('renders component without decision actions', () => {
    const wrapper = formRender(false)
    expect(wrapper.find('#decision-actions').exists()).toBe(false)
  })

  it('matches snapshot', () => {
    const wrapper = shallowMount(RefundDecisionForm, {
      localVue,
      vuetify,
      propsData: {
        refundRequestData: responseData,
        invoiceProduct: 'BUSINESS',
        isProcessing: false
      },
      directives: { can () { } }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
