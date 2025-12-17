import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'

import RefundRequestForm from '@/components/TransactionView/RefundRequestForm.vue'
import CommonUtils from '@/util/common-util'
import { RefundType } from '@/models/transaction-refund'

describe('RefundRequestForm.vue', () => {
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders component', () => {
    const wrapper = shallowMount(RefundRequestForm, {
      localVue,
      vuetify,
      propsData: {
        totalTransactionAmount: 2000,
        refundLineItems: [],
        refundMethods: [],
        previousRefundedAmount: 0,
        isPartialRefundAllowed: true,
        isFullRefundAllowed: true
      },
      directives: { can () { } }
    })

    expect(wrapper.findComponent(RefundRequestForm).exists()).toBe(true)
    expect(wrapper.text()).toContain('Refund Request')
    expect(wrapper.text()).toContain('Refund Type')
    expect(wrapper.text()).toContain('Total Refund Amount')
    expect(wrapper.text()).toContain('Refund Method')
    expect(wrapper.text()).toContain('Notification Email')
    expect(wrapper.text()).toContain('Reasons for Refund')
    expect(wrapper.text()).toContain('Staff Comment')
  })

  it('displays data values', async () => {
    const wrapper: any = shallowMount(RefundRequestForm, {
      localVue,
      vuetify,
      propsData: {
        totalTransactionAmount: 2000,
        refundLineItems: [],
        previousRefundedAmount: 0,
        isPartialRefundAllowed: true,
        isFullRefundAllowed: true
      },
      directives: { can () { } }
    })

    wrapper.vm.refundFormData.refundType = RefundType.FULL_REFUND
    await wrapper.vm.onRefundTypeChange()
    wrapper.vm.refundFormData.refundMethod = 'Refund back to Credit Card'
    wrapper.vm.refundFormData.notificationEmail = 'test@example.com'
    wrapper.vm.refundFormData.reasonsForRefund = 'Reason'
    wrapper.vm.refundFormData.staffComment = 'Comment'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(CommonUtils.formatAmount(2000))
    expect(wrapper.text()).toContain('Credit Card')
    expect(wrapper.vm.refundFormData.notificationEmail).toBe('test@example.com')
    expect(wrapper.vm.refundFormData.reasonsForRefund).toBe('Reason')
    expect(wrapper.vm.refundFormData.staffComment).toBe('Comment')
  })

  it('emits onProceedToReview on valid submit', async () => {
    const wrapper: any = shallowMount(RefundRequestForm, {
      localVue,
      vuetify,
      propsData: {
        totalTransactionAmount: 2000,
        refundLineItems: [],
        previousRefundedAmount: 0,
        isPartialRefundAllowed: true,
        isFullRefundAllowed: true
      },
      directives: { can () { } }
    })

    wrapper.vm.refundFormData.refundType = RefundType.FULL_REFUND
    wrapper.vm.refundFormData.refundMethod = 'Refund back to Credit Card'
    wrapper.vm.refundFormData.notificationEmail = 'test@example.com'
    wrapper.vm.refundFormData.reasonsForRefund = 'Reason'
    wrapper.vm.refundFormData.staffComment = 'Comment'

    wrapper.vm.refundRequestForm = { validate: () => true }

    wrapper.vm.onReviewBtnClick()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('onProceedToReview')).toBeTruthy()
    const payload = wrapper.emitted('onProceedToReview')[0][0]
    expect(payload.refundType).toContain(RefundType.FULL_REFUND)
  })

  it('matches snapshot', () => {
    const wrapper = shallowMount(RefundRequestForm, {
      localVue,
      vuetify,
      propsData: {
        totalTransactionAmount: 2000,
        previousRefundedAmount: 0,
        isPartialRefundAllowed: false,
        isFullRefundAllowed: true
      },
      directives: { can () { } }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
