import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import InvoiceRefundHistory from '~/pages/transaction-view/[id]/InvoiceRefundHistory.vue'
import { RefundApprovalStatus } from '~/utils/constants'

const mockPush = vi.fn()

mockNuxtImport('useRouter', () => () => ({
  push: mockPush
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: vi.fn(() => 'January 01, 2025 12:00 AM'),
    formatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`)
  }
}))

describe('InvoiceRefundHistory', () => {
  const refundHistoryItem = {
    codeRefundId: 1,
    invoiceId: 1001,
    refundId: 201,
    requestedDate: '2025-01-01T00:00:00Z',
    refundMethod: 'CHEQUE',
    refundStatus: RefundApprovalStatus.APPROVED,
    refundAmount: 150,
    partialRefundLines: [] as unknown[]
  }

  const createWrapper = (refundHistoryData = [refundHistoryItem]) => {
    const mockRow = refundHistoryData[0]
    return mount(InvoiceRefundHistory, {
      props: { refundHistoryData },
      global: {
        stubs: {
          UIcon: true,
          UButton: {
            template: '<button @click="$emit(\'click\')">{{ label }}</button>',
            props: ['label', 'color', 'size']
          },
          UBadge: {
            template: '<span class="badge"><slot /></span>',
            props: ['color', 'variant', 'size']
          },
          UTable: {
            template: `
              <div class="table">
                <slot name="requestedDate-cell" :row="{ original: mockRow }" />
                <slot name="refundMethod-cell" :row="{ original: mockRow }" />
                <slot name="refundAmount-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
              </div>
            `,
            props: ['data', 'columns', 'sticky'],
            data: () => ({ mockRow })
          }
        }
      }
    })
  }

  it('should render component with header', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Refund History')
  })

  it('should render formatted date, method and amount', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('January 01, 2025 12:00 AM')
    expect(wrapper.text()).toContain('CHEQUE')
    expect(wrapper.text()).toContain('$150.00')
  })

  it.each([
    [RefundApprovalStatus.PENDING_APPROVAL, [], 'REFUND REQUESTED'],
    [RefundApprovalStatus.APPROVED, [{ id: 1 }], 'PARTIALLY REFUNDED'],
    [RefundApprovalStatus.APPROVED, [], 'FULL REFUND APPROVED'],
    [RefundApprovalStatus.DECLINED, [], 'REFUND DECLINED']
  ])('should show correct badge label for status %s', (refundStatus, partialRefundLines, expectedLabel) => {
    const item = { ...refundHistoryItem, refundStatus, partialRefundLines }
    const wrapper = createWrapper([item])
    expect(wrapper.text()).toContain(expectedLabel)
  })

  it.each([
    ['CHEQUE', RefundApprovalStatus.APPROVED, [], 'FULL REFUND APPROVED'],
    ['CHEQUE', RefundApprovalStatus.PENDING_APPROVAL, [], 'REFUND REQUESTED'],
    ['EFT', RefundApprovalStatus.APPROVED, [], 'FULL REFUND APPROVED'],
    ['EFT', RefundApprovalStatus.APPROVED, [{ id: 1 }], 'PARTIALLY REFUNDED'],
    ['EFT', RefundApprovalStatus.DECLINED, [], 'REFUND DECLINED'],
    ['ONLINE_BANKING', RefundApprovalStatus.PENDING_APPROVAL, [], 'REFUND REQUESTED'],
    ['PAD', RefundApprovalStatus.APPROVED, [], 'FULL REFUND APPROVED']
  ])('should display method %s with badge label %s', (refundMethod, refundStatus,
    partialRefundLines, expectedBadge) => {
    const item = { ...refundHistoryItem, refundMethod, refundStatus, partialRefundLines }
    const wrapper = createWrapper([item])
    expect(wrapper.text()).toContain(refundMethod)
    expect(wrapper.text()).toContain(expectedBadge)
  })

  it('should navigate to refund detail when View Details is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('button').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({
      path: `/transaction-view/${refundHistoryItem.invoiceId}/refund-request/${refundHistoryItem.refundId}`
    })
  })
})
