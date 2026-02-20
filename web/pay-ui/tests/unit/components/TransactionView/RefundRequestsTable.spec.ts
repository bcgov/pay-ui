import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import RefundRequestsTable from '~/components/refund/RefundRequestsTable.vue'

const mockGetNext = vi.fn()
const mockLoadTableData = vi.fn()

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn()
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/composables/refund/useRefundRequestTable', () => ({
  useRefundRequestTable: () => ({
    loadTableData: mockLoadTableData,
    updateFilter: vi.fn(),
    getNext: mockGetNext,
    resetReachedEnd: vi.fn(),
    loadState: {
      reachedEnd: false,
      isLoading: false,
      isInitialLoad: true,
      currentPage: 1
    }
  })
}))

vi.mock('~/composables/common/useStickyHeader', () => ({
  useStickyHeader: () => ({
    updateStickyHeaderHeight: vi.fn()
  })
}))

vi.mock('~/composables/common/useStatusList', () => ({
  usePaymentMethodsList: () => ({
    list: [],
    mapFn: vi.fn()
  })
}))

vi.mock('~/stores/refund-requests-store', () => ({
  useRefundRequestsStore: () => ({
    tableSettings: null,
    refundRequestsFilter: null,
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    setTableSettings: vi.fn()
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
    formatDisplayDate: vi.fn((date: string) => date ? 'January 01, 2025' : ''),
    formatAmount: vi.fn((amount: number | undefined) =>
      amount !== undefined && amount !== null ? `$${amount.toFixed(2)}` : '$0.00'
    )
  }
}))

describe('RefundRequestsTable', () => {
  const sampleItem: RefundRequestResult = {
    invoiceId: 52305,
    refundId: 1009,
    refundStatus: 'PENDING_APPROVAL',
    refundType: 'INVOICE',
    refundMethod: 'Refund back to Credit Card',
    notificationEmail: 'test@example.com',
    refundReason: 'test reason',
    staffComment: null,
    requestedBy: 'requester',
    requestedDate: '2025-12-16T23:58:23.872481',
    declineReason: null,
    decisionBy: null,
    decisionDate: null,
    refundAmount: 31.5,
    transactionAmount: 31.5,
    paymentMethod: 'DIRECT_PAY',
    partialRefundLines: []
  }

  const createWrapper = (props = {}) => {
    return mount(RefundRequestsTable, {
      props: { ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="requestedDate-cell" :row="{ original: mockRow }" />
                <slot name="transactionAmount-cell" :row="{ original: mockRow }" />
                <slot name="refundAmount-cell" :row="{ original: mockRow }" />
                <slot name="paymentMethod-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
                <slot name="loading" />
                <slot name="empty" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky'],
            data: () => ({
              mockRow: sampleItem
            })
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>',
            props: ['label']
          },
          UInput: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNext.mockResolvedValue(undefined)
    mockLoadTableData.mockResolvedValue(undefined)
  })

  it('should render component and call loadTableData on mount', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
    expect(mockLoadTableData).toHaveBeenCalled()
  })

  it('should render formatted date in requestedDate cell', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.text()).toContain('January 01, 2025')
  })

  it('should render formatted amounts in amount cells', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.text()).toContain('$31.50')
  })

  it('should render payment method display name', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.text()).toContain('Credit Card')
  })

  it('should render View Details button', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    expect(wrapper.text()).toContain('View Details')
  })

  it('should navigate to details when View Details is clicked', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.find('button').trigger('click')
    expect(mockNavigateTo).toHaveBeenCalledWith(
      `/transaction-view/${sampleItem.invoiceId}/refund-request/${sampleItem.refundId}`
    )
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}