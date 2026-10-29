import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import TransactionsDataTable from '~/components/transactions/TransactionsDataTable.vue'
import CommonUtils from '~/utils/common-util'

const { mockNavigateTo, mockPayApi, mockUpdateSticky, scrollCb } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockPayApi: vi.fn(),
  mockUpdateSticky: vi.fn(),
  scrollCb: { fn: null as null | (() => Promise<void>) }
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let h: any

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useNuxtApp', original => () => {
  const overrides: Record<PropertyKey, unknown> = { $payApi: mockPayApi }
  return new Proxy(original(), {
    get: (target, key, receiver) => key in overrides ? overrides[key] : Reflect.get(target, key, receiver)
  })
})

vi.mock('~/composables/transactions/useTransactionsTable', () => ({
  useTransactionsTable: async () => h
}))
vi.mock('@/composables/transactions/useTransactionsTable', () => ({
  useTransactionsTable: async () => h
}))
vi.mock('@/composables/common/useStickyHeader', () => ({
  useStickyHeader: () => ({ updateStickyHeaderHeight: mockUpdateSticky })
}))
vi.mock('@/composables/common/useStatusList', async importOriginal => ({
  ...(await importOriginal<object>()),
  usePaymentMethodsList: () => ({ list: ref([{ code: 'PAD' }]), mapFn: () => ({}) }),
  useProductList: () => ({ list: ref([{ code: 'BUSINESS' }]), mapFn: () => ({}) }),
  useInvoiceStatusList: () => ({ list: ref([{ code: 'PAID' }]), mapFn: () => ({}) })
}))
vi.mock('@vueuse/core', async importOriginal => ({
  ...(await importOriginal<object>()),
  useDebounceFn: (fn: unknown) => fn,
  useInfiniteScroll: (_el: unknown, cb: () => Promise<void>) => { scrollCb.fn = cb }
}))

const COLS = [
  'accountName', 'product', 'lineItems', 'businessIdentifier', 'folioNumber', 'createdName', 'id',
  'invoiceNumber', 'details', 'createdOn', 'total', 'paymentMethod', 'statusCode', 'downloads', 'actions'
]

const UTableStub = {
  props: ['data', 'columns', 'loading'],
  data: () => ({ cols: COLS }),
  template: `<div class="utable">
    <slot name="body-top" />
    <div v-for="(r, i) in data" :key="i" class="row" :data-row="i">
      <div v-for="c in cols" :key="c" :class="'cell-' + c"><slot :name="c + '-cell'" :row="{ original: r }" /></div>
    </div>
    <slot name="loading" /><slot name="empty" />
  </div>`
}

const stubs = {
  UTable: UTableStub,
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button class="ubtn" @click="$emit(\'click\')">{{ label }}<slot /></button>'
  },
  UDropdownMenu: {
    props: ['items'],
    template: `<div class="dropdown">
      <button class="dd-item" @click="items[0][0].onSelect()">{{ items[0][0].label }}</button><slot /></div>`
  },
  UPopover: { template: '<div><slot /><slot name="content" /></div>' },
  UCheckbox: {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<input type="checkbox" class="col-check" :checked="modelValue" :data-label="label"'
      + ' @change="$emit(\'update:modelValue\', $event.target.checked)">'
  },
  UIcon: { props: ['name'], template: '<i class="uicon" :data-name="name" />' },
  UBadge: { template: '<span class="ubadge"><slot /></span>' },
  IconTooltip: { props: ['text'], template: '<span class="tooltip" :data-text="text" />' },
  SearchInput: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input class="search" :data-ph="placeholder" :value="modelValue"'
      + ' @input="$emit(\'update:modelValue\', $event.target.value)">'
  },
  StatusList: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<button class="status-list" :data-ph="placeholder" @click="$emit(\'update:modelValue\', \'X\')" />'
  },
  DateRangeFilter: {
    props: ['modelValue'],
    emits: ['update:modelValue', 'change'],
    template: '<div class="date-range"'
      + ' @click="$emit(\'update:modelValue\', { startDate: \'2024-01-01\', endDate: null })"'
      + ' @dblclick="$emit(\'change\')" />'
  }
}

const baseTx = {
  id: 1,
  paymentAccount: { accountName: 'Acme' },
  product: 'BUSINESS',
  lineItems: [{ description: 'Annual Report' }],
  details: [{ label: 'Detail', value: 'A' }],
  businessIdentifier: 'BC123',
  folioNumber: 'F1',
  createdName: 'Joe',
  invoiceNumber: 'INV1',
  createdOn: '2024-01-01T00:00:00',
  updatedOn: '',
  total: 100,
  paymentMethod: 'PAD',
  statusCode: 'PAID',
  partialRefundable: false,
  fullRefundable: false
}

function makeHarness() {
  return {
    searchTransactionsTableHeaders: ref([
      { accessorKey: 'accountName', header: 'Account Name', display: true },
      { accessorKey: 'product', header: 'Application Type', display: false },
      { accessorKey: 'actions', header: 'Actions', display: true, hideInSearchColumnFilter: true }
    ]),
    columnPinning: ref({ right: ['actions'] }),
    columnVisibility: ref(Object.fromEntries(COLS.map(c => [c, true]))),
    setViewAll: vi.fn(),
    loadTransactionList: vi.fn().mockResolvedValue(undefined),
    clearAllFilters: vi.fn(),
    getNext: vi.fn().mockResolvedValue(undefined),
    transactions: reactive({
      results: [] as unknown[],
      loading: false,
      filters: {
        isActive: false,
        pageNumber: 1,
        filterPayload: { dateFilter: { startDate: '', endDate: '', isDefault: false } } as Record<string, unknown>
      }
    })
  }
}

async function mountTable(results: unknown[] = [baseTx], props = {}) {
  h.transactions.results = results
  const wrapper = await mountSuspended(TransactionsDataTable, { props, global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('TransactionsDataTable', () => {
  beforeEach(() => {
    setActivePinia(useNuxtApp().$pinia as never)
    useTransactionsStore().clearFilter()
    useTransactionsStore().clearTableSettings()
    h = makeHarness()
    scrollCb.fn = null
    vi.spyOn(CommonUtils, 'formatDisplayDate').mockImplementation(((d: string) => `D(${d})`) as never)
    vi.spyOn(CommonUtils, 'canInitiateProductRefund').mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('setup and lifecycle', () => {
    it('sets viewAll from the extended prop (default false)', async () => {
      await mountTable()
      expect(h.setViewAll).toHaveBeenCalledWith(false)
    })

    it('passes extended=true to setViewAll', async () => {
      await mountTable([], { extended: true })
      expect(h.setViewAll).toHaveBeenCalledWith(true)
    })

    it('loads the list on mount and updates the sticky header', async () => {
      await mountTable()
      expect(h.loadTransactionList).toHaveBeenCalledTimes(1)
      expect(mockUpdateSticky).toHaveBeenCalled()
    })

    it('restores saved table settings and clears them', async () => {
      const store = useTransactionsStore()
      store.setTableSettings({ filterPayload: { accountName: 'Saved' }, pageNumber: 3 })
      await mountTable()
      expect(h.transactions.filters.filterPayload.accountName).toBe('Saved')
      expect(h.transactions.filters.pageNumber).toBe(3)
      expect(store.tableSettings).toBeNull()
    })

    it('restores the saved filter when there are no table settings', async () => {
      useTransactionsStore().setFilter({ folioNumber: 'F9' })
      await mountTable()
      expect(h.transactions.filters.filterPayload.folioNumber).toBe('F9')
    })

    it('persists filter payload changes to the store', async () => {
      await mountTable()
      h.transactions.filters.filterPayload.details = 'zzz'
      await nextTick()
      expect(useTransactionsStore().transactionFilter).toMatchObject({ details: 'zzz' })
    })

    it('updates the sticky header when column visibility changes', async () => {
      await mountTable()
      mockUpdateSticky.mockClear()
      h.columnVisibility.value = { ...h.columnVisibility.value, total: false }
      await flushPromises()
      expect(mockUpdateSticky).toHaveBeenCalled()
    })

    it('loads the next page on infinite scroll', async () => {
      await mountTable()
      await scrollCb.fn!()
      expect(h.getNext).toHaveBeenCalled()
    })
  })

  describe('header and filters', () => {
    it('lists only columns that are not hidden from the column filter', async () => {
      const wrapper = await mountTable()
      const labels = wrapper.findAll('.col-check').map(c => c.attributes('data-label'))
      expect(labels).toEqual(['Account Name', 'Application Type'])
    })

    it('toggles column display through the checkbox', async () => {
      const wrapper = await mountTable()
      const boxes = wrapper.findAll('.col-check')
      await boxes[1]!.setValue(true)
      expect(h.searchTransactionsTableHeaders.value[1].display).toBe(true)
    })

    it('hides filter inputs for hidden columns', async () => {
      h.columnVisibility.value.accountName = false
      h.columnVisibility.value.downloads = false
      const wrapper = await mountTable()
      const phs = wrapper.findAll('.search').map(i => i.attributes('data-ph'))
      expect(phs).not.toContain('Account Name')
      expect(phs).toContain('Folio #')
    })

    it.each([
      ['Account Name', 'accountName'],
      ['Transaction Type', 'lineItems'],
      ['Details', 'details'],
      ['Number', 'businessIdentifier'],
      ['Folio #', 'folioNumber'],
      ['Initiated By', 'createdName'],
      ['Transaction ID', 'id'],
      ['Invoice #', 'invoiceNumber']
    ])('search input %s triggers a load for %s', async (placeholder, field) => {
      const wrapper = await mountTable()
      h.loadTransactionList.mockClear()
      await wrapper.find(`.search[data-ph="${placeholder}"]`).setValue('abc')
      expect(h.loadTransactionList).toHaveBeenCalledWith(field, 'abc')
      expect(h.transactions.filters.filterPayload[field]).toBe('abc')
    })

    it.each([
      ['Application Type', 'product'],
      ['Payment Method', 'paymentMethod'],
      ['Status', 'statusCode']
    ])('status list %s sets the filter and loads', async (placeholder, field) => {
      const wrapper = await mountTable()
      h.loadTransactionList.mockClear()
      await wrapper.find(`.status-list[data-ph="${placeholder}"]`).trigger('click')
      expect(h.transactions.filters.filterPayload[field]).toBe('X')
      expect(h.loadTransactionList).toHaveBeenCalledWith(field, 'X')
    })

    it('updates the date range model and reloads on change', async () => {
      const wrapper = await mountTable()
      h.loadTransactionList.mockClear()
      await wrapper.find('.date-range').trigger('click')
      expect(h.transactions.filters.filterPayload.dateFilter).toMatchObject({
        startDate: '2024-01-01', endDate: ''
      })
      await wrapper.find('.date-range').trigger('dblclick')
      await flushPromises()
      expect(h.loadTransactionList).toHaveBeenCalledTimes(1)
      expect(useTransactionsStore().transactionFilter).toMatchObject({ dateFilter: { startDate: '2024-01-01' } })
    })

    it('recreates a missing dateFilter when the range changes', async () => {
      const wrapper = await mountTable()
      delete h.transactions.filters.filterPayload.dateFilter
      await nextTick()
      await wrapper.find('.date-range').trigger('click')
      expect(h.transactions.filters.filterPayload.dateFilter).toEqual({
        startDate: '2024-01-01', endDate: '', isDefault: false
      })
    })

    it('shows Clear Filters only when filters are active and clears everything', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).not.toContain('Clear Filters')
      h.transactions.filters.isActive = true
      await nextTick()
      const store = useTransactionsStore()
      store.setFilter({ folioNumber: 'x' })
      store.setTableSettings({ filterPayload: {}, pageNumber: 1 })
      h.loadTransactionList.mockClear()
      const btn = wrapper.findAll('.ubtn').find(b => b.text().includes('Clear Filters'))!
      await btn.trigger('click')
      await flushPromises()
      expect(h.clearAllFilters).toHaveBeenCalled()
      expect(store.tableSettings).toBeNull()
      expect(h.loadTransactionList).toHaveBeenCalledTimes(1)
    })

    it('renders loading and empty slots', async () => {
      const wrapper = await mountTable([])
      expect(wrapper.text()).toContain('Loading Transaction Records...')
      expect(wrapper.text()).toContain('No Transaction Records')
    })
  })

  describe('cell rendering', () => {
    it('renders the basic transaction cells', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('.cell-accountName').text()).toBe('Acme')
      expect(wrapper.find('.cell-businessIdentifier').text()).toBe('BC123')
      expect(wrapper.find('.cell-folioNumber').text()).toBe('F1')
      expect(wrapper.find('.cell-createdName').text()).toBe('Joe')
      expect(wrapper.find('.cell-id').text()).toBe('1')
      expect(wrapper.find('.cell-invoiceNumber').text()).toBe('INV1')
      expect(wrapper.find('.cell-details').text()).toBe('Detail A')
      expect(wrapper.find('.cell-createdOn').text()).toBe('D(2024-01-01T00:00:00)')
      expect(wrapper.find('.cell-total').text()).toBe(CommonUtils.formatAmount(100))
      expect(wrapper.find('.cell-lineItems').text()).toContain('Annual Report')
    })

    it('falls back to "-" without an account name and tolerates missing details', async () => {
      const wrapper = await mountTable([{ ...baseTx, paymentAccount: undefined, details: undefined }])
      expect(wrapper.find('.cell-accountName').text()).toBe('-')
      expect(wrapper.find('.cell-details').text()).toBe('')
    })

    it('shows $0.00 for cancelled transactions', async () => {
      const wrapper = await mountTable([{ ...baseTx, statusCode: 'CANCELLED' }])
      expect(wrapper.find('.cell-total').text()).toBe('$0.00')
    })

    it('shows the payment method display name or raw value', async () => {
      const wrapper = await mountTable([
        { ...baseTx, paymentMethod: 'PAD' },
        { ...baseTx, id: 2, paymentMethod: 'UNKNOWN_METHOD' }
      ])
      const cells = wrapper.findAll('.cell-paymentMethod')
      expect(cells[0]!.text()).not.toBe('')
      expect(cells[0]!.text()).not.toBe('PAD')
      expect(cells[1]!.text()).toBe('UNKNOWN_METHOD')
    })

    it('shows credit combined payment methods with remaining balance', async () => {
      const credit = [{ id: 7, amountApplied: 40, createdOn: '2024-02-01' }]
      const wrapper = await mountTable([
        { ...baseTx, id: 1, paymentMethod: 'PAD', appliedCredits: credit },
        { ...baseTx, id: 2, paymentMethod: 'ONLINE_BANKING', appliedCredits: credit },
        { ...baseTx, id: 3, paymentMethod: 'CC', appliedCredits: credit },
        { ...baseTx, id: 4, paymentMethod: 'PAD', appliedCredits: [{ id: 8, amountApplied: 100, createdOn: 'x' }] }
      ])
      const cells = wrapper.findAll('.cell-paymentMethod').map(c => c.text())
      expect(cells[0]).toMatch(/ and /)
      expect(cells[1]).toMatch(/ and /)
      expect(cells[2]).not.toMatch(/ and /)
      expect(cells[3]).not.toMatch(/ and /)
      expect(cells[3]).not.toBe('')
    })

    it('renders the product display name', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('.cell-product').text()).not.toBe('')
    })
  })

  describe('status cell', () => {
    const statusOf = (w: Awaited<ReturnType<typeof mountTable>>, i = 0) =>
      w.findAll('.cell-statusCode')[i]!.text()

    it('shows Pending for online banking with scheduled settlement', async () => {
      const wrapper = await mountTable([
        { ...baseTx, paymentMethod: 'ONLINE_BANKING', statusCode: 'SETTLEMENT_SCHED' }
      ])
      expect(statusOf(wrapper)).toContain('Pending')
    })

    it('shows non-sufficient funds for other scheduled settlements', async () => {
      const wrapper = await mountTable([{ ...baseTx, statusCode: 'SETTLEMENT_SCHED' }])
      expect(statusOf(wrapper)).toContain('Non-sufficient Funds')
    })

    it('shows partially credited / refunded for partial refunds', async () => {
      const wrapper = await mountTable([
        { ...baseTx, id: 1, partialRefunds: [{ isCredit: true, refundAmount: 5 }] },
        { ...baseTx, id: 2, partialRefunds: [{ isCredit: false, refundAmount: 5 }] }
      ])
      expect(statusOf(wrapper, 0)).toContain('Partially Credited')
      expect(statusOf(wrapper, 1)).toContain('Partially Refunded')
    })

    it('shows check icon for completed statuses and alert icon plus tooltip for overdue', async () => {
      const wrapper = await mountTable([
        { ...baseTx, id: 1, statusCode: 'COMPLETED' },
        { ...baseTx, id: 2, statusCode: 'OVERDUE' },
        { ...baseTx, id: 3, statusCode: 'REFUND_REQUESTED' },
        { ...baseTx, id: 4, statusCode: 'CREATED' }
      ])
      const cells = wrapper.findAll('.cell-statusCode')
      expect(cells[0]!.find('[data-name="i-mdi-check"]').exists()).toBe(true)
      expect(cells[1]!.find('[data-name="i-mdi-alert"]').exists()).toBe(true)
      expect(cells[1]!.find('.tooltip').attributes('data-text')).toContain('overdue')
      expect(cells[2]!.find('.tooltip').attributes('data-text')).toContain('refund request')
      expect(cells[3]!.find('.tooltip').exists()).toBe(false)
      expect(cells[3]!.find('[data-name="i-mdi-check"]').exists()).toBe(false)
    })

    it('shows updated date and refund badges', async () => {
      const wrapper = await mountTable([
        { ...baseTx, id: 1, updatedOn: '2024-03-03', latestRefundStatus: 'PENDING_APPROVAL' },
        { ...baseTx, id: 2, latestRefundStatus: 'DECLINED' }
      ])
      expect(statusOf(wrapper, 0)).toContain('D(2024-03-03)')
      expect(statusOf(wrapper, 0)).toContain('REFUND REQUEST')
      expect(statusOf(wrapper, 1)).toContain('REFUND DECLINED')
    })
  })

  describe('expandable rows', () => {
    const detailLink = (w: Awaited<ReturnType<typeof mountTable>>) => w.find('.detail-link')

    it('has no expander for plain transactions', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('.detail-link').exists()).toBe(false)
      expect(wrapper.find('.expand-icon-container').exists()).toBe(false)
    })

    it('does not offer details when credits cover the whole total', async () => {
      const wrapper = await mountTable([
        { ...baseTx, appliedCredits: [{ id: 1, amountApplied: 100, createdOn: 'x' }] }
      ])
      expect(wrapper.find('.detail-link').exists()).toBe(false)
    })

    it('expands applied credits with a remaining balance row and collapses again', async () => {
      const wrapper = await mountTable([
        { ...baseTx, appliedCredits: [{ id: 5, amountApplied: 30.5, createdOn: '2024-02-02' }] }
      ])
      expect(detailLink(wrapper).text()).toBe('View Detail')
      await detailLink(wrapper).trigger('click')
      expect(detailLink(wrapper).text()).toBe('Hide Detail')
      const totals = wrapper.findAll('.cell-total').map(c => c.text())
      expect(totals).toEqual([CommonUtils.formatAmount(100), '$30.50', '$69.50'])
      expect(wrapper.findAll('.cell-id').map(c => c.text())).toEqual(['1', '5', '1'])
      expect(wrapper.findAll('.cell-createdOn')[1]!.text()).toBe('D(2024-02-02)')
      await wrapper.find('.expand-icon-container').trigger('click')
      expect(wrapper.findAll('.row')).toHaveLength(1)
      expect(detailLink(wrapper).text()).toBe('View Detail')
    })

    it('shows the expand chevron state', async () => {
      const wrapper = await mountTable([{ ...baseTx, statusCode: 'REFUNDED' }])
      const icon = () => wrapper.find('.expand-icon-container .uicon').attributes('data-name')
      expect(icon()).toBe('i-mdi-chevron-down')
      await wrapper.find('.expand-icon-container').trigger('click')
      expect(icon()).toBe('i-mdi-chevron-up')
    })

    it('expands partial refunds into a single refund row', async () => {
      const wrapper = await mountTable([{
        ...baseTx,
        partialRefunds: [
          { paymentLineItemId: 11, refundAmount: 10, createdOn: '2024-04-01', createdName: 'Ref1', isCredit: false },
          { paymentLineItemId: 12, refundAmount: 5.25, createdOn: '2024-04-02', createdName: 'Ref2', isCredit: false }
        ]
      }])
      await detailLink(wrapper).trigger('click')
      const rows = wrapper.findAll('.row')
      expect(rows).toHaveLength(2)
      const child = rows[1]!
      expect(child.find('.cell-lineItems').text()).toBe('Refund')
      expect(child.find('.cell-total').text()).toBe('-$15.25')
      expect(child.find('.cell-total .refund-amount').exists()).toBe(true)
      expect(child.find('.cell-id').text()).toBe('11, 12')
      expect(child.find('.cell-createdName').text()).toBe('Ref1')
      expect(child.find('.cell-statusCode').text()).toContain('Partially Refunded')
    })

    it('labels partial refunds as credits when isCredit', async () => {
      const wrapper = await mountTable([{
        ...baseTx,
        partialRefunds: [{ paymentLineItemId: 1, refundAmount: 10, createdOn: 'x', createdName: 'R', isCredit: true }]
      }])
      await detailLink(wrapper).trigger('click')
      const child = wrapper.findAll('.row')[1]!
      expect(child.find('.cell-lineItems').text()).toBe('Refund as credits')
      expect(child.find('.cell-statusCode').text()).toContain('Partially Credited')
    })

    it.each([
      ['REFUNDED', 'Refund', 'i-mdi-check'],
      ['CREDITED', 'Refund as credits', 'i-mdi-check'],
      ['MANUALLY_REFUNDED', 'Refund', 'i-mdi-check']
    ])('expands full refund for status %s', async (statusCode, type, icon) => {
      const wrapper = await mountTable([{ ...baseTx, statusCode, refundDate: '2024-05-05' }])
      await detailLink(wrapper).trigger('click')
      const child = wrapper.findAll('.row')[1]!
      expect(child.find('.cell-lineItems').text()).toBe(type)
      expect(child.find('.cell-total').text()).toBe('-$100.00')
      expect(child.find('.cell-createdOn').text()).toBe('D(2024-05-05)')
      expect(child.find(`.cell-statusCode [data-name="${icon}"]`).exists()).toBe(true)
    })

    it('falls back to createdOn when there is no refund date and blank date for no-date rows', async () => {
      const wrapper = await mountTable([{ ...baseTx, statusCode: 'REFUNDED' }])
      await detailLink(wrapper).trigger('click')
      expect(wrapper.findAll('.row')[1]!.find('.cell-createdOn').text()).toBe('D(2024-01-01T00:00:00)')
    })
  })

  describe('downloads', () => {
    it('downloads a receipt and toggles the loading state', async () => {
      const blob = new Blob(['x'])
      let resolve!: (b: Blob) => void
      mockPayApi.mockReturnValue(new Promise<Blob>((r) => { resolve = r }))
      const download = vi.spyOn(CommonUtils, 'fileDownload').mockImplementation(() => {})
      const wrapper = await mountTable()
      await wrapper.find('.receipt-link').trigger('click')
      expect(wrapper.find('[data-name="i-mdi-loading"]').exists()).toBe(true)
      resolve(blob)
      await flushPromises()
      expect(mockPayApi).toHaveBeenCalledWith('/payment-requests/1/receipts', {
        method: 'POST',
        body: { filingDateTime: 'D(2024-01-01T00:00:00)' },
        responseType: 'blob'
      })
      expect(download).toHaveBeenCalledWith(blob, 'bcregistry-receipts-1.pdf', 'application/pdf')
      expect(wrapper.find('[data-name="i-mdi-loading"]').exists()).toBe(false)
      expect(wrapper.find('.receipt-link').text()).toContain('Receipt')
    })

    it('logs and recovers when the download fails', async () => {
      mockPayApi.mockRejectedValue(new Error('fail'))
      const download = vi.spyOn(CommonUtils, 'fileDownload').mockImplementation(() => {})
      const wrapper = await mountTable()
      await wrapper.find('.receipt-link').trigger('click')
      await flushPromises()
      expect(console.error).toHaveBeenCalledWith('Failed to download receipt', expect.any(Error))
      expect(download).not.toHaveBeenCalled()
      expect(wrapper.find('.receipt-link').text()).toContain('Receipt')
    })
  })

  describe('actions', () => {
    it('saves settings and navigates to the transaction view', async () => {
      h.transactions.filters.filterPayload.accountName = 'Acme'
      h.transactions.filters.pageNumber = 2
      const wrapper = await mountTable()
      const store = useTransactionsStore()
      await wrapper.findAll('.ubtn').find(b => b.text() === 'View Details')!.trigger('click')
      expect(mockNavigateTo).toHaveBeenCalledWith('/transaction-view/1/view')
      expect(store.tableSettings).toMatchObject({ filterPayload: { accountName: 'Acme' }, pageNumber: 2 })
    })

    it('defaults the saved page number to 1', async () => {
      h.transactions.filters.pageNumber = undefined
      const wrapper = await mountTable()
      await wrapper.findAll('.ubtn').find(b => b.text() === 'View Details')!.trigger('click')
      expect(useTransactionsStore().tableSettings?.pageNumber).toBe(1)
    })

    it('offers Initiate Refund only for refundable transactions', async () => {
      const wrapper = await mountTable([{ ...baseTx, fullRefundable: true }])
      expect(wrapper.find('.dd-item').text()).toBe('Initiate Refund')
      await wrapper.find('.dd-item').trigger('click')
      expect(mockNavigateTo).toHaveBeenCalledWith('/transaction-view/1/initiateRefund')
      expect(CommonUtils.canInitiateProductRefund).toHaveBeenCalledWith('business_refund_requester')
    })

    it.each([
      ['not refundable flags', { partialRefundable: false, fullRefundable: false }, true],
      ['zero total', { partialRefundable: true, total: 0 }, true],
      ['pending refund', { partialRefundable: true, latestRefundStatus: 'PENDING_APPROVAL' }, true],
      ['no permission', { partialRefundable: true }, false]
    ])('hides Initiate Refund for %s', async (_name, overrides, allowed) => {
      vi.mocked(CommonUtils.canInitiateProductRefund).mockReturnValue(allowed)
      const wrapper = await mountTable([{ ...baseTx, ...overrides }])
      expect(wrapper.find('.dd-item').exists()).toBe(false)
    })

    it('allows refund again after a declined request and without a product', async () => {
      const wrapper = await mountTable([
        { ...baseTx, id: 1, partialRefundable: true, latestRefundStatus: 'DECLINED' },
        { ...baseTx, id: 2, partialRefundable: true, product: undefined }
      ])
      expect(wrapper.findAll('.dd-item')).toHaveLength(2)
      expect(CommonUtils.canInitiateProductRefund).toHaveBeenCalledWith('_refund_requester')
    })
  })
})
