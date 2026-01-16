import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNamePaymentHistory from '~/components/eft/ShortNamePaymentHistory.vue'
import {
  ShortNameHistoryType,
  ShortNameHistoryTypeDescription,
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

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: () => void) => fn,
  useInfiniteScroll: vi.fn(),
  createSharedComposable: (fn: () => unknown) => fn
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: vi.fn((date: string) => date ? 'January 1, 2024' : ''),
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
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

  it('should render component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should display header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Short Name Payment History')
  })

  it('should call getNext on mount via watch', async () => {
    createWrapper()
    await flushPromises()

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

  it('should format date correctly', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      formatDate: (date: string | undefined) => string
    }

    expect(vm.formatDate('2024-01-01')).toBe('January 1, 2024')
    expect(vm.formatDate(undefined)).toBe('')
  })

  it('should get description for funds received', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, transactionDate?: string }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED,
      transactionDate: '2024-01-15'
    })

    expect(result.title).toBe(ShortNameHistoryTypeDescription.FUNDS_RECEIVED)
  })

  it('should get description for statement paid', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, statementNumber?: number }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.STATEMENT_PAID,
      statementNumber: 12345
    })

    expect(result.title).toBe(ShortNameHistoryTypeDescription.STATEMENT_PAID)
    expect(result.subtitle).toContain('12345')
  })

  it('should get description for refund by EFT', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, eftRefundMethod?: string }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL,
      eftRefundMethod: EFTRefundMethod.EFT
    })

    expect(result.title).toContain('Direct Deposit')
  })

  it('should get description for refund by cheque', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, eftRefundMethod?: string }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
      eftRefundMethod: EFTRefundMethod.CHEQUE
    })

    expect(result.title).toContain('Cheque')
  })

  it('should identify refund types', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      isRefundType: (item: { transactionType: string }) => boolean
    }

    expect(vm.isRefundType({ transactionType: ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL })).toBe(true)
    expect(vm.isRefundType({ transactionType: ShortNameHistoryType.SN_REFUND_APPROVED })).toBe(true)
    expect(vm.isRefundType({ transactionType: ShortNameHistoryType.SN_REFUND_DECLINED })).toBe(true)
    expect(vm.isRefundType({ transactionType: ShortNameHistoryType.FUNDS_RECEIVED })).toBe(false)
  })

  it('should identify funds received type', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      isFundsReceived: (item: { transactionType: string }) => boolean
    }

    expect(vm.isFundsReceived({ transactionType: ShortNameHistoryType.FUNDS_RECEIVED })).toBe(true)
    expect(vm.isFundsReceived({ transactionType: ShortNameHistoryType.STATEMENT_PAID })).toBe(false)
  })

  it('should get display date for funds received', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayDate: (item: { transactionType: string, transactionDate: string, createdOn?: string }) => string
    }

    const result = vm.getDisplayDate({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED,
      transactionDate: '2024-01-01',
      createdOn: '2024-01-05'
    })

    expect(result).toBe('2024-01-05')
  })

  it('should get display date for other types', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayDate: (item: { transactionType: string, transactionDate: string }) => string
    }

    const result = vm.getDisplayDate({
      transactionType: ShortNameHistoryType.STATEMENT_PAID,
      transactionDate: '2024-01-01'
    })

    expect(result).toBe('2024-01-01')
  })

  it('should identify declined refund', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      isDeclinedRefund: (item: { transactionType: string }) => boolean
    }

    expect(vm.isDeclinedRefund({ transactionType: ShortNameHistoryType.SN_REFUND_DECLINED })).toBe(true)
    expect(vm.isDeclinedRefund({ transactionType: ShortNameHistoryType.SN_REFUND_APPROVED })).toBe(false)
  })

  it('should calculate display amount for negative types', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount: number }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.STATEMENT_PAID,
      amount: 500
    })).toBe(-500)
  })

  it('should return null for declined refund amount', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount: number }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.SN_REFUND_DECLINED,
      amount: 500
    })).toBeNull()
  })

  it('should check if refund detail can be shown', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      canShowRefundDetail: (item: {
        transactionType: string
        eftRefundId?: number
        shortNameRefundId?: number
      }) => boolean
    }

    expect(vm.canShowRefundDetail({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
      eftRefundId: 123
    })).toBe(true)

    expect(vm.canShowRefundDetail({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED,
      eftRefundId: 123
    })).toBe(false)

    expect(vm.canShowRefundDetail({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED
    })).toBe(false)
  })

  it('should navigate to refund detail', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      navigateToRefundDetail: (item: { eftRefundId?: number, shortNameRefundId?: number }) => void
    }

    vm.navigateToRefundDetail({ eftRefundId: 456 })

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/eft/shortname-details/123/refund',
      query: { eftRefundId: '456' }
    })
  })

  it('should not navigate without refund ID', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      navigateToRefundDetail: (item: { eftRefundId?: number }) => void
    }

    vm.navigateToRefundDetail({})

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should get refund subtitle for processing state', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getRefundSubtitle: (item: { transactionType: string, isProcessing?: boolean }) => string
    }

    expect(vm.getRefundSubtitle({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
      isProcessing: true
    })).toBe(RefundStatusText.PROCESSING)
  })

  it('should get refund subtitle for pending approval', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getRefundSubtitle: (item: { transactionType: string }) => string
    }

    expect(vm.getRefundSubtitle({
      transactionType: ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL
    })).toBe(RefundStatusText.REFUND_REQUESTED)
  })

  it('should get refund subtitle for declined', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getRefundSubtitle: (item: { transactionType: string }) => string
    }

    expect(vm.getRefundSubtitle({
      transactionType: ShortNameHistoryType.SN_REFUND_DECLINED
    })).toBe(RefundStatusText.REFUND_DECLINED)
  })

  it('should get refund subtitle with cheque status', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getRefundSubtitle: (item: { transactionType: string, eftRefundChequeStatus?: string }) => string
    }

    const mockChequeStatus = ChequeRefundStatus.find(s => s.code !== undefined)
    if (mockChequeStatus) {
      expect(vm.getRefundSubtitle({
        transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
        eftRefundChequeStatus: mockChequeStatus.code
      })).toBeDefined()
    }
  })

  it('should handle invoice refund description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: {
        transactionType: string
        invoiceId?: number
        isProcessing?: boolean
      }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.INVOICE_REFUND,
      invoiceId: 999
    })

    expect(result.subtitle).toContain('999')
  })

  it('should handle invoice partial refund description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: {
        transactionType: string
        invoiceId?: number
        isProcessing?: boolean
      }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.INVOICE_PARTIAL_REFUND,
      invoiceId: 888,
      isProcessing: true
    })

    expect(result.title).toContain(RefundStatusText.PROCESSING)
    expect(result.subtitle).toContain('888')
  })

  it('should handle statement reverse description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, relatedStatementNumber?: number }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.STATEMENT_REVERSE,
      relatedStatementNumber: 54321
    })

    expect(result.title).toBe(ShortNameHistoryTypeDescription.STATEMENT_REVERSE)
    expect(result.subtitle).toContain('54321')
  })

  it('should handle transfer sent description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, comment?: string }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_TRANSFER_SENT,
      comment: 'Transfer comment'
    })

    expect(result.title).toBe(ShortNameHistoryTypeDescription.SN_TRANSFER_SENT)
    expect(result.subtitle).toBe('Transfer comment')
  })

  it('should handle transfer received description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, comment?: string }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_TRANSFER_RECEIVED,
      comment: 'Received transfer'
    })

    expect(result.title).toBe(ShortNameHistoryTypeDescription.SN_TRANSFER_RECEIVED)
    expect(result.subtitle).toBe('Received transfer')
  })

  it('should handle default description with account info', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: {
        transactionType: string
        accountId?: number
        accountName?: string
      }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: 'UNKNOWN_TYPE',
      accountId: 100,
      accountName: 'Test Account'
    })

    expect(result.subtitle).toBe('Test Account')
  })

  it('should return negative amount for refund with refundAmount', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount?: number, refundAmount?: number }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
      amount: 1000,
      refundAmount: 500
    })).toBe(-500)
  })

  it('should return null for null amount', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount: null }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED,
      amount: null
    })).toBeNull()
  })

  it('should return positive amount for funds received', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount: number }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED,
      amount: 1500
    })).toBe(1500)
  })

  it('should return negative amount for transfer sent', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDisplayAmount: (item: { transactionType: string, amount: number }) => number | null
    }

    expect(vm.getDisplayAmount({
      transactionType: ShortNameHistoryType.SN_TRANSFER_SENT,
      amount: 300
    })).toBe(-300)
  })

  it('should get funds received tooltip', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getFundsReceivedTooltip: (item: { transactionDate?: string, createdOn?: string }) => string
    }

    const result = vm.getFundsReceivedTooltip({
      transactionDate: '2024-01-10',
      createdOn: '2024-01-15'
    })

    expect(result).toContain('deposited')
    expect(result).toContain('available')
  })

  it('should return empty tooltip for missing dates', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getFundsReceivedTooltip: (item: { transactionDate?: string, createdOn?: string }) => string
    }

    expect(vm.getFundsReceivedTooltip({})).toBe('')
  })

  it('should identify negative amount types', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      isNegativeAmountType: (item: { transactionType: string }) => boolean
    }

    expect(vm.isNegativeAmountType({ transactionType: ShortNameHistoryType.STATEMENT_PAID })).toBe(true)
    expect(vm.isNegativeAmountType({ transactionType: ShortNameHistoryType.SN_TRANSFER_SENT })).toBe(true)
    expect(vm.isNegativeAmountType({ transactionType: ShortNameHistoryType.SN_REFUND_APPROVED })).toBe(true)
    expect(vm.isNegativeAmountType({ transactionType: ShortNameHistoryType.FUNDS_RECEIVED })).toBe(false)
  })

  it('should navigate with shortNameRefundId if eftRefundId not present', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      navigateToRefundDetail: (item: { eftRefundId?: number, shortNameRefundId?: number }) => void
    }

    vm.navigateToRefundDetail({ shortNameRefundId: 789 })

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/eft/shortname-details/123/refund',
      query: { eftRefundId: '789' }
    })
  })

  it('should prefer eftRefundId over shortNameRefundId', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      navigateToRefundDetail: (item: { eftRefundId?: number, shortNameRefundId?: number }) => void
    }

    vm.navigateToRefundDetail({ eftRefundId: 111, shortNameRefundId: 222 })

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/eft/shortname-details/123/refund',
      query: { eftRefundId: '111' }
    })
  })

  it('should handle invoice refund without invoice ID', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, invoiceId?: number }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.INVOICE_REFUND
    })

    expect(result.subtitle).toBe('')
  })

  it('should handle statement paid without statement number', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, statementNumber?: number }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.STATEMENT_PAID
    })

    expect(result.subtitle).toBe('')
  })

  it('should handle statement reverse without related statement number', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, relatedStatementNumber?: number }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.STATEMENT_REVERSE
    })

    expect(result.subtitle).toBe('')
  })

  it('should handle funds received without deposit date', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, transactionDate?: string }) =>
      { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.FUNDS_RECEIVED
    })

    expect(result.subtitle).toBe('')
  })

  it('should handle transfer without comment', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, comment?: string }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_TRANSFER_SENT
    })

    expect(result.subtitle).toBe('')
  })

  it('should handle default description without account info', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: {
        transactionType: string
        accountId?: number
        accountName?: string
      }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: 'UNKNOWN_TYPE'
    })

    expect(result.subtitle).toBe('')
  })

  it('should use refundMethod if eftRefundMethod not present', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getDescription: (item: { transactionType: string, refundMethod?: string }) => { title: string, subtitle: string }
    }

    const result = vm.getDescription({
      transactionType: ShortNameHistoryType.SN_REFUND_APPROVED,
      refundMethod: EFTRefundMethod.CHEQUE
    })

    expect(result.title).toContain('Cheque')
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
