import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNamePaymentHistory from '~/components/eft/ShortNamePaymentHistory.vue'
import {
  ShortNameHistoryType,
  EFTRefundMethod,
  RefundStatusText,
  ChequeRefundStatus
} from '~/utils/constants'

const mockGetNext = vi.fn()
const mockResetState = vi.fn()

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn()
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/composables/eft/useShortNameHistory', () => ({
  useShortNameHistory: () => ({
    loadState: {
      reachedEnd: false,
      isLoading: false,
      isInitialLoad: true,
      currentPage: 1
    },
    getNext: mockGetNext,
    resetState: mockResetState
  })
}))

vi.mock('~/composables/common/useStickyHeader', () => ({
  useStickyHeader: () => ({
    updateStickyHeaderHeight: vi.fn()
  })
}))

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useDebounceFn: (fn: () => void) => fn,
    useInfiniteScroll: vi.fn(),
    createSharedComposable: (fn: () => unknown) => fn
  }
})

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: vi.fn((date: string) => date ? 'January 1, 2024' : ''),
    formatAmount: vi.fn((amount: number | undefined) =>
      amount !== undefined && amount !== null ? `$${amount.toFixed(2)}` : '$0.00'
    ),
    formatAccountDisplayName: vi.fn(() => 'Test Account')
  }
}))

describe('ShortNamePaymentHistory', () => {
  const defaultProps = {
    shortNameId: 123
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNamePaymentHistory, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="transactionDate-cell" :row="{ original: mockRow }" />
                <slot name="description-cell" :row="{ original: mockRow }" />
                <slot name="amount-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
                <slot name="loading" />
                <slot name="empty" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky'],
            data: () => ({
              mockRow: {
                id: 1,
                transactionDate: '2024-01-01',
                transactionType: 'FUNDS_RECEIVED',
                amount: 1000
              }
            })
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>',
            props: ['label']
          },
          UIcon: true,
          IconTooltip: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNext.mockResolvedValue(undefined)
  })

  it('should render component with header and call getNext on mount', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Short Name Payment History')
    expect(mockGetNext).toHaveBeenCalled()
  })

  it('should reset and reload when shortNameId changes', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    mockResetState.mockClear()
    mockGetNext.mockClear()

    await wrapper.setProps({ shortNameId: 456 })
    await flushPromises()

    expect(mockResetState).toHaveBeenCalled()
    expect(mockGetNext).toHaveBeenCalledWith(true)
  })

  describe('helper methods', () => {
    let wrapper: ReturnType<typeof createWrapper>
    let vm: any

    beforeEach(() => {
      wrapper = createWrapper()
      vm = wrapper.vm
    })

    it.each([
      ['2024-01-01', 'January 1, 2024'],
      [undefined, '']
    ])('formatDate should format %s', (date, expected) => {
      expect(vm.formatDate(date)).toBe(expected)
    })

    it.each([
      [ShortNameHistoryType.FUNDS_RECEIVED, { transactionDate: '2024-01-15' }],
      [ShortNameHistoryType.STATEMENT_PAID, { statementNumber: 12345 }],
      [ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL, { eftRefundMethod: EFTRefundMethod.EFT }],
      [ShortNameHistoryType.SN_REFUND_APPROVED, { eftRefundMethod: EFTRefundMethod.CHEQUE }],
      [ShortNameHistoryType.INVOICE_REFUND, { invoiceId: 999 }],
      [ShortNameHistoryType.INVOICE_PARTIAL_REFUND, { invoiceId: 888, isProcessing: true }],
      [ShortNameHistoryType.STATEMENT_REVERSE, { relatedStatementNumber: 54321 }],
      [ShortNameHistoryType.SN_TRANSFER_SENT, { comment: 'Transfer comment' }],
      [ShortNameHistoryType.SN_TRANSFER_RECEIVED, { comment: 'Received transfer' }],
      ['UNKNOWN_TYPE', { accountId: 100, accountName: 'Test Account' }]
    ])('getDescription should handle %s', (transactionType, extraProps) => {
      const result = vm.getDescription({ transactionType, ...extraProps })
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('subtitle')
    })

    const testCases = {
      isRefundType: [
        [ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL, true],
        [ShortNameHistoryType.SN_REFUND_APPROVED, true],
        [ShortNameHistoryType.SN_REFUND_DECLINED, true],
        [ShortNameHistoryType.FUNDS_RECEIVED, false]
      ],
      isFundsReceived: [
        [ShortNameHistoryType.FUNDS_RECEIVED, true],
        [ShortNameHistoryType.STATEMENT_PAID, false]
      ],
      isDeclinedRefund: [
        [ShortNameHistoryType.SN_REFUND_DECLINED, true],
        [ShortNameHistoryType.SN_REFUND_APPROVED, false]
      ],
      isNegativeAmountType: [
        [ShortNameHistoryType.STATEMENT_PAID, true],
        [ShortNameHistoryType.SN_TRANSFER_SENT, true],
        [ShortNameHistoryType.SN_REFUND_APPROVED, true],
        [ShortNameHistoryType.FUNDS_RECEIVED, false]
      ]
    }

    Object.entries(testCases).forEach(([method, cases]) => {
      it.each(cases)(`${method}(%s) should return %s`, (transactionType, expected) => {
        expect(vm[method]({ transactionType })).toBe(expected)
      })
    })

    it.each([
      [ShortNameHistoryType.FUNDS_RECEIVED, '2024-01-01', '2024-01-05', '2024-01-05'],
      [ShortNameHistoryType.STATEMENT_PAID, '2024-01-01', undefined, '2024-01-01']
    ])('getDisplayDate should handle %s', (transactionType, transactionDate, createdOn, expected) => {
      expect(vm.getDisplayDate({ transactionType, transactionDate, createdOn })).toBe(expected)
    })

    it.each([
      [ShortNameHistoryType.STATEMENT_PAID, 500, undefined, -500],
      [ShortNameHistoryType.SN_REFUND_DECLINED, 500, undefined, null],
      [ShortNameHistoryType.SN_REFUND_APPROVED, 1000, 500, -500],
      [ShortNameHistoryType.FUNDS_RECEIVED, null, undefined, null],
      [ShortNameHistoryType.FUNDS_RECEIVED, 1500, undefined, 1500],
      [ShortNameHistoryType.SN_TRANSFER_SENT, 300, undefined, -300]
    ])('getDisplayAmount should handle %s with amount %s', (transactionType, amount, refundAmount, expected) => {
      expect(vm.getDisplayAmount({ transactionType, amount, refundAmount })).toBe(expected)
    })

    it.each([
      [ShortNameHistoryType.SN_REFUND_APPROVED, { eftRefundId: 123 }, true],
      [ShortNameHistoryType.FUNDS_RECEIVED, { eftRefundId: 123 }, false],
      [ShortNameHistoryType.SN_REFUND_APPROVED, {}, false]
    ])('canShowRefundDetail should handle %s', (transactionType, extraProps, expected) => {
      expect(vm.canShowRefundDetail({ transactionType, ...extraProps })).toBe(expected)
    })

    it.each([
      ['with eftRefundId', { eftRefundId: 456 }, { path: '/eft/shortname-details/123/refund', query: { eftRefundId: '456' } }, true],
      ['with shortNameRefundId', { shortNameRefundId: 789 }, { path: '/eft/shortname-details/123/refund', query: { eftRefundId: '789' } }, true],
      ['with both IDs', { eftRefundId: 111, shortNameRefundId: 222 }, { path: '/eft/shortname-details/123/refund', query: { eftRefundId: '111' } }, true],
      ['without refund ID', {}, null, false]
    ])('navigateToRefundDetail should handle %s', (_, item, expectedCall, shouldNavigate) => {
      vm.navigateToRefundDetail(item)
      if (shouldNavigate) {
        expect(mockNavigateTo).toHaveBeenCalledWith(expectedCall)
      } else {
        expect(mockNavigateTo).not.toHaveBeenCalled()
      }
    })

    it.each([
      [ShortNameHistoryType.SN_REFUND_APPROVED, { isProcessing: true }, RefundStatusText.PROCESSING],
      [ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL, {}, RefundStatusText.REFUND_REQUESTED],
      [ShortNameHistoryType.SN_REFUND_DECLINED, {}, RefundStatusText.REFUND_DECLINED]
    ])('getRefundSubtitle should handle %s', (transactionType, extraProps, expected) => {
      expect(vm.getRefundSubtitle({ transactionType, ...extraProps })).toBe(expected)
    })

    it('should get refund subtitle with cheque status', () => {
      const mockChequeStatus = ChequeRefundStatus.find(s => s.code !== undefined)
      if (mockChequeStatus) {
        const result = vm.getRefundSubtitle({
          transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
          eftRefundChequeStatus: mockChequeStatus.code
        })
        expect(result).toBeDefined()
      }
    })

    it.each([
      [{ transactionDate: '2024-01-10', createdOn: '2024-01-15' }, 'deposited'],
      [{}, '']
    ])('getFundsReceivedTooltip should handle %s', (item, expectedMatch) => {
      const result = vm.getFundsReceivedTooltip(item)
      if (expectedMatch) {
        expect(result).toContain(expectedMatch)
      } else {
        expect(result).toBe('')
      }
    })
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
