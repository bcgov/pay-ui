import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'

import RefundReviewForm from '@/components/TransactionView/RefundReviewForm.vue'
import CommonUtils from '@/util/common-util'
import { PaymentTypes } from '@/util/constants'

describe('RefundReviewForm.vue', () => {
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})

  const baseData = {
    refundType: 'Full Refund',
    totalRefundAmount: 250,
    refundMethod: 'Refund back to Credit Card',
    notificationEmail: 'user@example.com',
    reasonsForRefund: 'Reason',
    staffComment: 'Comment',
    requestedBy: 'Jane',
    requestedTime: new Date('2025-01-02T03:04:05Z')
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders component', () => {
    vi.spyOn(CommonUtils, 'formatUtcToPacificDate').mockReturnValue('Jan 02, 2025 3:04:05 AM')

    const wrapper = shallowMount(RefundReviewForm, {
      localVue,
      vuetify,
      propsData: {
        refundFormData: baseData,
        isProcessing: false,
        invoicePaymentMethod: PaymentTypes.DIRECT_PAY
      },
      directives: { can () { } }
    })

    expect(wrapper.findComponent(RefundReviewForm).exists()).toBe(true)
    expect(wrapper.text()).toContain('Refund Request')
    expect(wrapper.text()).toContain('Request Date')
    expect(wrapper.text()).toContain('Refund Type')
    expect(wrapper.text()).toContain(baseData.refundType)
    expect(wrapper.text()).toContain('Total Refund Amount')
    expect(wrapper.text()).toContain('$250.00')
    expect(wrapper.text()).toContain('Refund Method')
    expect(wrapper.text()).toContain(baseData.refundMethod)
    expect(wrapper.text()).toContain('Notification Email')
    expect(wrapper.text()).toContain(baseData.notificationEmail)
    expect(wrapper.text()).toContain('Reason for Refund')
    expect(wrapper.text()).toContain(baseData.reasonsForRefund)
    expect(wrapper.text()).toContain('Staff Comment')
    expect(wrapper.text()).toContain(baseData.staffComment)
    expect(wrapper.text()).toContain('Requested By')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Jan 02, 2025 3:04:05 AM')
  })

  it('matches snapshot', () => {
    vi.spyOn(CommonUtils, 'formatUtcToPacificDate').mockReturnValue('Jan 02, 2025 3:04:05 AM')

    const wrapper = shallowMount(RefundReviewForm, {
      localVue,
      vuetify,
      propsData: {
        refundFormData: baseData,
        isProcessing: false,
        invoicePaymentMethod: PaymentTypes.DIRECT_PAY
      },
      directives: { can () { } }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
