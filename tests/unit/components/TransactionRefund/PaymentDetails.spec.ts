import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'

import PaymentDetails from '@/components/TransactionView/PaymentDetails.vue'
import CommonUtils from '@/util/common-util'
import { PaymentData } from '@/models/transaction-refund'

describe('PaymentDetails.vue', () => {
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})

  const sampleData: PaymentData = {
    accountName: 'Acme Corp',
    folioNumber: 'FOLIO-123',
    initiatedBy: 'user@idir',
    paymentMethod: 'CHEQUE',
    paymentStatus: 'COMPLETED',
    totalTransactionAmount: 2000
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders component', () => {
    const wrapper = shallowMount(PaymentDetails, {
      localVue,
      vuetify,
      propsData: { paymentData: sampleData },
      directives: { can () { } }
    })

    expect(wrapper.findComponent(PaymentDetails).exists()).toBe(true)
    expect(wrapper.text()).toContain('Payment Details')

    expect(wrapper.text()).toContain('Account Name')
    expect(wrapper.text()).toContain('Folio Number')
    expect(wrapper.text()).toContain('Initiated By')
    expect(wrapper.text()).toContain('Payment Info')
    expect(wrapper.text()).toContain('Payment Method')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Total Amount')
  })

  it('displays data values', async () => {
    const wrapper = shallowMount(PaymentDetails, {
      localVue,
      vuetify,
      propsData: { paymentData: sampleData },
      directives: { can () { } }
    })

    expect(wrapper.text()).toContain(sampleData.accountName as string)
    expect(wrapper.text()).toContain(sampleData.folioNumber as string)
    expect(wrapper.text()).toContain(sampleData.initiatedBy as string)
    expect(wrapper.text()).toContain('Cheque')
    expect(wrapper.text()).toContain('Completed')

    const expectedAmount = CommonUtils.formatAmount(sampleData.totalTransactionAmount)
    expect(wrapper.text()).toContain(expectedAmount)
  })

  it('matches snapshot', () => {
    const wrapper = shallowMount(PaymentDetails, {
      localVue,
      vuetify,
      propsData: { paymentData: sampleData },
      directives: { can () { } }
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
