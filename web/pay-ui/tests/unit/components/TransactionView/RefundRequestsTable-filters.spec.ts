import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import RefundRequestsTable from '~/components/refund/RefundRequestsTable.vue'

const {
  mockNavigateTo,
  mockLoadTableData,
  mockUpdateFilter,
  mockGetNext,
  mockResetReachedEnd,
  mockUpdateSticky,
  mockInfiniteScroll,
  store,
  loadState
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockLoadTableData: vi.fn(),
  mockUpdateFilter: vi.fn(),
  mockGetNext: vi.fn(),
  mockResetReachedEnd: vi.fn(),
  mockUpdateSticky: vi.fn(),
  mockInfiniteScroll: vi.fn(),
  store: {
    tableSettings: null as unknown,
    refundRequestsFilter: null as unknown,
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    setTableSettings: vi.fn()
  },
  loadState: { reachedEnd: false, isLoading: false, isInitialLoad: true, currentPage: 1 }
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

let tableState: RefundRequestState

vi.mock('~/composables/refund/useRefundRequestTable', () => ({
  useRefundRequestTable: (state: RefundRequestState) => {
    tableState = state
    return {
      loadTableData: mockLoadTableData,
      updateFilter: mockUpdateFilter,
      getNext: mockGetNext,
      resetReachedEnd: mockResetReachedEnd,
      loadState
    }
  }
}))

vi.mock('~/composables/common/useStickyHeader', () => ({
  useStickyHeader: () => ({ updateStickyHeaderHeight: mockUpdateSticky })
}))

vi.mock('~/composables/common/useStatusList', () => ({
  usePaymentMethodsList: () => ({ list: ['CC', 'PAD'], mapFn: vi.fn() })
}))

vi.mock('~/stores/refund-requests-store', () => ({
  useRefundRequestsStore: () => store
}))

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useDebounceFn: (fn: () => void) => fn,
    useInfiniteScroll: mockInfiniteScroll
  }
})

const item: RefundRequestResult = {
  invoiceId: 7,
  refundId: 9,
  refundStatus: 'PENDING_APPROVAL',
  refundType: 'INVOICE',
  refundMethod: 'x',
  notificationEmail: 'a@b.com',
  refundReason: 'r',
  staffComment: null,
  requestedBy: 'me',
  requestedDate: undefined as unknown as string,
  declineReason: null,
  decisionBy: null,
  decisionDate: null,
  refundAmount: undefined as unknown as number,
  transactionAmount: 10,
  paymentMethod: 'PAD',
  partialRefundLines: []
}

const inputStub = {
  props: ['modelValue', 'id'],
  emits: ['update:modelValue'],
  template: `<input :id="id" :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)" />`
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(RefundRequestsTable, {
    props: { tableTitle: 'Refunds', ...props },
    global: {
      stubs: {
        UTable: {
          props: ['data', 'columns', 'loading', 'sticky'],
          template: `<div class="table">
            <table><tbody><slot name="body-top" /></tbody></table>
            <div v-for="(row, i) in data" :key="i" class="row">
              <span class="date"><slot name="requestedDate-cell" :row="{ original: row }" /></span>
              <span class="refund"><slot name="refundAmount-cell" :row="{ original: row }" /></span>
              <span class="actions"><slot name="actions-cell" :row="{ original: row }" /></span>
            </div>
            <slot name="loading" /><slot name="empty" />
          </div>`
        },
        UInput: inputStub,
        UButton: {
          props: ['label'],
          emits: ['click'],
          template: '<button :aria-label="label" @click="$emit(\'click\')">{{ label }}</button>'
        },
        UIcon: true,
        DateRangeFilter: {
          name: 'DateRangeFilter',
          props: ['modelValue'],
          emits: ['update:modelValue', 'change'],
          template: '<div class="drf" />'
        },
        StatusList: {
          name: 'StatusList',
          props: ['modelValue', 'list', 'mapFn'],
          emits: ['update:modelValue'],
          template: '<div class="status-list" />'
        }
      }
    }
  })
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

describe('RefundRequestsTable - filters and state restore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.tableSettings = null
    store.refundRequestsFilter = null
    mockLoadTableData.mockImplementation(() => {
      tableState.results = [item]
      tableState.totalResults = 1
      return Promise.resolve()
    })
  })

  it('renders title with total, updates sticky header and registers infinite scroll', async () => {
    const wrapper = createWrapper()
    await flush()
    expect(wrapper.find('h2').text()).toBe('Refunds (1)')
    expect(mockUpdateSticky).toHaveBeenCalled()
    expect(mockInfiniteScroll).toHaveBeenCalledTimes(1)
    const [, cb, opts] = mockInfiniteScroll.mock.calls[0]!
    expect(opts).toEqual({ distance: 200 })
    await cb()
    expect(mockGetNext).toHaveBeenCalledWith(true)
  })

  it('renders empty strings for missing date and amount', async () => {
    const wrapper = createWrapper()
    await flush()
    expect(wrapper.find('.date').text()).toBe('')
    expect(wrapper.find('.refund').text()).toBe('')
  })

  it('defaults filter payload to pending approval and persists filter changes to the store', async () => {
    const wrapper = createWrapper()
    await flush()
    expect(tableState.filters.filterPayload.refundStatus).toBe(RefundApprovalStatus.PENDING_APPROVAL)
    await wrapper.find('#transaction-id-filter').setValue('123')
    await flush()
    expect(mockUpdateFilter).toHaveBeenCalledWith('invoiceId', '123')
    expect(store.setFilter).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: '123' }))
  })

  it.each([
    ['#requested-by-filter', 'requestedBy'],
    ['#refund-reason-filter', 'refundReason'],
    ['#transaction-amount-filter', 'transactionAmount'],
    ['#refund-amount-filter', 'refundAmount']
  ])('debounced filter input %s updates %s', async (selector, col) => {
    const wrapper = createWrapper()
    await flush()
    await wrapper.find(selector).setValue('abc')
    expect(mockUpdateFilter).toHaveBeenCalledWith(col, 'abc')
  })

  it('updates payment method via StatusList and falls back to empty string', async () => {
    const wrapper = createWrapper()
    await flush()
    const list = wrapper.findComponent({ name: 'StatusList' })
    expect(list.props('list')).toEqual(['CC', 'PAD'])
    list.vm.$emit('update:modelValue', 'PAD')
    await nextTick()
    expect(tableState.filters.filterPayload.paymentMethod).toBe('PAD')
    expect(mockUpdateFilter).toHaveBeenCalledWith('paymentMethod', 'PAD')
    expect(list.props('modelValue')).toBe('PAD')
    list.vm.$emit('update:modelValue', null)
    await nextTick()
    expect(mockUpdateFilter).toHaveBeenLastCalledWith('paymentMethod', '')
  })

  it('maps date range model both ways and reloads on change', async () => {
    const wrapper = createWrapper()
    await flush()
    const drf = wrapper.findComponent({ name: 'DateRangeFilter' })
    expect(drf.props('modelValue')).toEqual({ startDate: null, endDate: null })

    drf.vm.$emit('update:modelValue', { startDate: '2025-01-01', endDate: '2025-01-31' })
    await nextTick()
    expect(tableState.filters.filterPayload.requestedStartDate).toBe('2025-01-01')
    expect(tableState.filters.filterPayload.requestedEndDate).toBe('2025-01-31')
    expect(drf.props('modelValue')).toEqual({ startDate: '2025-01-01', endDate: '2025-01-31' })

    drf.vm.$emit('update:modelValue', { startDate: null, endDate: null })
    await nextTick()
    expect(tableState.filters.filterPayload.requestedStartDate).toBe('')
    expect(tableState.filters.filterPayload.requestedEndDate).toBe('')

    mockLoadTableData.mockClear()
    drf.vm.$emit('change')
    await flush()
    expect(store.setFilter).toHaveBeenCalled()
    expect(mockLoadTableData).toHaveBeenCalledWith('page', 1)
  })

  it('shows Clear Filters when active and resets everything on click', async () => {
    const wrapper = createWrapper()
    await flush()
    expect(wrapper.find('[aria-label="Clear all filters"]').exists()).toBe(false)
    tableState.filters.isActive = true
    tableState.filters.filterPayload.invoiceId = '55' as unknown as number
    await nextTick()
    mockLoadTableData.mockClear()
    await wrapper.find('[aria-label="Clear all filters"]').trigger('click')
    await flush()
    expect(tableState.clearFiltersTrigger).toBe(1)
    expect(tableState.filters.isActive).toBe(false)
    expect(tableState.filters.filterPayload).toEqual({
      refundStatus: RefundApprovalStatus.PENDING_APPROVAL, paymentMethod: null
    })
    expect(store.clearFilter).toHaveBeenCalled()
    expect(store.setTableSettings).toHaveBeenCalledWith(null)
    expect(mockResetReachedEnd).toHaveBeenCalled()
    expect(mockLoadTableData).toHaveBeenCalledWith()
  })

  it('restores saved table settings and clears them', async () => {
    store.tableSettings = { filterPayload: { requestedBy: 'bob' }, pageNumber: 3 }
    createWrapper()
    await flush()
    expect(tableState.filters.filterPayload.requestedBy).toBe('bob')
    expect(tableState.filters.filterPayload.refundStatus).toBe(RefundApprovalStatus.PENDING_APPROVAL)
    expect(tableState.filters.pageNumber).toBe(3)
    expect(store.setTableSettings).toHaveBeenCalledWith(null)
  })

  it('restores saved filter when no table settings exist', async () => {
    store.refundRequestsFilter = { refundStatus: RefundApprovalStatus.APPROVED, refundReason: 'dup' }
    createWrapper()
    await flush()
    expect(tableState.filters.filterPayload.refundStatus).toBe(RefundApprovalStatus.APPROVED)
    expect(tableState.filters.filterPayload.refundReason).toBe('dup')
    expect(store.setTableSettings).not.toHaveBeenCalled()
  })

  it('reloads data when currentTab changes', async () => {
    const wrapper = createWrapper({ currentTab: 0 })
    await flush()
    mockLoadTableData.mockClear()
    await wrapper.setProps({ currentTab: 1 })
    await flush()
    expect(mockLoadTableData).toHaveBeenCalledTimes(1)
  })

  it('saves table settings before navigating to details', async () => {
    const wrapper = createWrapper()
    await flush()
    await wrapper.find('.actions button').trigger('click')
    expect(store.setTableSettings).toHaveBeenCalledWith({
      filterPayload: expect.objectContaining({ refundStatus: RefundApprovalStatus.PENDING_APPROVAL }),
      pageNumber: 1
    })
    expect(mockNavigateTo).toHaveBeenCalledWith('/transaction-view/7/refund-request/9')
  })
})
