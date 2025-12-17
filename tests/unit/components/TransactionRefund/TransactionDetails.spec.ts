import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'

import TransactionDetails from '@/components/TransactionView/TransactionDetails.vue'
import CommonUtils from '@/util/common-util'
import { TransactionData } from '@/models/transaction-refund'

describe('TransactionDetails.vue', () => {
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})

  const sampleData: TransactionData = {
    invoiceId: 1234,
    transactionDate: '2025-01-02T00:00:00Z',
    invoiceStatusCode: 'PAID',
    invoiceCreatedOn: '2025-01-03T00:00:00Z',
    invoiceReferenceId: 'INV-123',
    transactionAmount: 100,
    applicationName: 'Name Request',
    applicationType: 'NR',
    businessIdentifier: 'NR 1234567',
    applicationDetails: [
      { label: 'NR Number:', value: 'NR_NUMBER' },
      { label: 'Name Choices:', value: '' }
    ]
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders component', () => {
    vi.spyOn(CommonUtils, 'formatUtcToPacificDate').mockReturnValue('Jan 02, 2025')

    const wrapper = shallowMount(TransactionDetails, {
      localVue,
      vuetify,
      propsData: { transactionData: sampleData },
      directives: { can () { } }
    })

    expect(wrapper.findComponent(TransactionDetails).exists()).toBe(true)
    expect(wrapper.text()).toContain('Transaction Details')
    expect(wrapper.text()).toContain('mdi-file-document')
    expect(wrapper.text()).toContain('Name Request')
    expect(wrapper.text()).toContain('NR')
    expect(wrapper.text()).toContain('NR 1234567')
    expect(wrapper.text()).toContain('1234')
    expect(wrapper.text()).toContain('INV-123')
    expect(wrapper.text()).toContain('Jan 02, 2025')
  })

  it('matches snapshot', () => {
    vi.spyOn(CommonUtils, 'formatUtcToPacificDate').mockReturnValue('Jan 02, 2025')

    const wrapper = shallowMount(TransactionDetails, {
      localVue,
      vuetify,
      propsData: { transactionData: sampleData },
      directives: { can () { } }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
