import { mount } from '@vue/test-utils'
import TransactionDetails from '~/pages/transaction-view/[id]/TransactionDetails.vue'
import type { TransactionData } from '~/interfaces/transaction-view'
import { InvoiceStatus } from '~/utils/constants'

const mockDownloadReceipt = vi.fn()

vi.mock('~/composables/transactions/useTransactionView', () => ({
  useTransactionView: () => ({
    downloadReceipt: mockDownloadReceipt
  })
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: vi.fn(() => 'January 03, 2025 12:00 AM')
  }
}))

describe('TransactionDetails', () => {
  const sampleData: TransactionData = {
    invoiceId: 1234,
    transactionDate: '2025-01-02T00:00:00Z',
    invoiceStatusCode: InvoiceStatus.PAID,
    invoiceCreatedOn: '2025-01-03T00:00:00Z',
    invoiceReferenceId: 'INV-123',
    transactionAmount: 100,
    applicationName: 'Name Request',
    applicationType: 'NR',
    businessIdentifier: 'NR 1234567',
    applicationDetails: [
      { label: 'NR Number:', value: 'NR_NUMBER' },
      { label: 'Name Choices:', value: '' }
    ],
    routingSlip: null,
    latestRefundId: null,
    latestRefundStatus: null,
    partialRefundable: undefined,
    fullRefundable: undefined
  }

  const createWrapper = (propsOverride: Partial<TransactionData> = {}) => {
    return mount(TransactionDetails, {
      props: {
        transactionData: { ...sampleData, ...propsOverride }
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
    expect(wrapper.text()).toContain('Transaction Details')
  })

  it('should display transaction data values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Name Request')
    expect(wrapper.text()).toContain('NR')
    expect(wrapper.text()).toContain('NR 1234567')
    expect(wrapper.text()).toContain('1234')
    expect(wrapper.text()).toContain('INV-123')
    expect(wrapper.text()).toContain('January 03, 2025 12:00 AM')
    expect(wrapper.text()).toContain('NR Number:')
    expect(wrapper.text()).toContain('NR_NUMBER')
  })

  it('should call downloadReceipt when receipt button is clicked', async () => {
    const wrapper = createWrapper({ invoiceStatusCode: InvoiceStatus.PAID })
    await wrapper.find('button').trigger('click')
    expect(mockDownloadReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: sampleData.invoiceId })
    )
  })

  it('should show routing slip column when present', () => {
    const wrapper = createWrapper({ routingSlip: 'RS-9876' })
    expect(wrapper.text()).toContain('Routing Slip Number')
    expect(wrapper.text()).toContain('RS-9876')
  })

  it('should not show routing slip column when absent', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).not.toContain('Routing Slip Number')
  })
})
