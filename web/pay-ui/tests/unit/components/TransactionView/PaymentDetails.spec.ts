import { mount } from '@vue/test-utils'
import PaymentDetails from '~/pages/transaction-view/[id]/PaymentDetails.vue'
import CommonUtils from '~/utils/common-util'
import type { PaymentData } from '~/interfaces/transaction-view'

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`)
  }
}))

describe('PaymentDetails', () => {
  const sampleData: PaymentData = {
    accountName: 'Acme Corp',
    folioNumber: 'FOLIO-123',
    initiatedBy: 'user@idir',
    paymentMethod: 'CHEQUE',
    paymentStatus: 'COMPLETED',
    totalTransactionAmount: 2000
  }

  const createWrapper = (propsOverride: Partial<PaymentData> = {}) => {
    return mount(PaymentDetails, {
      props: {
        paymentData: { ...sampleData, ...propsOverride }
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
    expect(wrapper.text()).toContain('Payment Details')
  })

  it('should render all field labels', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Account Name')
    expect(wrapper.text()).toContain('Folio Number')
    expect(wrapper.text()).toContain('Initiated By')
    expect(wrapper.text()).toContain('Payment Info')
    expect(wrapper.text()).toContain('Payment Method')
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Total Amount')
  })

  it('should display payment data values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain(sampleData.accountName as string)
    expect(wrapper.text()).toContain(sampleData.folioNumber as string)
    expect(wrapper.text()).toContain(sampleData.initiatedBy as string)
    expect(wrapper.text()).toContain('Cheque')
    expect(wrapper.text()).toContain('Completed')
    expect(CommonUtils.formatAmount).toHaveBeenCalledWith(sampleData.totalTransactionAmount)
  })
})
