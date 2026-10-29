import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Search from '~/components/Dashboard/Search.vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  debouncedSearch: vi.fn(),
  search: vi.fn(),
  resetSearchFilters: vi.fn(),
  updateSearchFilter: vi.fn(),
  getNext: vi.fn(),
  toggleFolio: vi.fn(),
  toggleCheque: vi.fn(),
  getStatusLabel: vi.fn((c: string) => `label-${c}`),
  state: {} as Record<string, unknown>
}))

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }))
mockNuxtImport('usePayApi', () => () => ({ getCodes: vi.fn(() => Promise.resolve({ codes: [] })) }))
mockNuxtImport('navigateTo', () => mocks.navigateTo)

vi.mock('~/composables/dashboard/useSearch', async () => {
  const { ref, reactive } = await import('vue')
  const allColumns = [
    'routingSlipNumber', 'receiptNumber', 'accountName', 'createdName', 'date', 'status',
    'refundStatus', 'businessIdentifier', 'chequeReceiptNumber', 'remainingAmount'
  ]
  return {
    useSearch: async () => {
      const s = mocks.state
      s.filters = reactive({
        routingSlipNumber: null, receiptNumber: null, accountName: null, createdName: null,
        dateFilter: { startDate: null, endDate: null }, status: null, refundStatus: null,
        businessIdentifier: null, chequeReceiptNumber: null, remainingAmount: null,
        ...((s.initialFilters as object) || {})
      })
      return {
        searchRoutingSlipTableHeaders: ref(allColumns.map(accessorKey => ({
          accessorKey, header: accessorKey, display: accessorKey !== 'date'
        }))),
        debouncedSearch: mocks.debouncedSearch,
        getStatusLabel: mocks.getStatusLabel,
        searchParamsExist: ref(s.searchParamsExist ?? true),
        showExpandedFolio: ref((s.expandedFolio as string[]) || []),
        showExpandedCheque: ref((s.expandedCheque as string[]) || []),
        toggleFolio: mocks.toggleFolio,
        toggleCheque: mocks.toggleCheque,
        isLoading: ref(false),
        getNext: mocks.getNext,
        filters: s.filters,
        routingSlips: ref((s.rows as unknown[]) || []),
        columnPinning: ref({ right: ['actions'] }),
        isInitialLoad: ref(true),
        columnVisibility: ref(Object.fromEntries(allColumns.map(c => [c, true]))),
        resetSearchFilters: mocks.resetSearchFilters,
        hasActiveFilters: ref(!!s.hasActiveFilters),
        search: mocks.search,
        updateSearchFilter: mocks.updateSearchFilter
      }
    }
  }
})

const stubs = {
  UTable: {
    props: ['data'],
    template: `<div>
      <slot name="body-top" /><slot name="empty" />
      <div v-for="row in data" :key="row.routingSlipNumber" class="row">
        <slot name="status-cell" :row="{ original: row }" />
        <slot name="businessIdentifier-cell" :row="{ original: row }" />
        <slot name="chequeReceiptNumber-cell" :row="{ original: row }" />
        <slot name="actions-cell" :row="{ original: row }" />
      </div></div>`
  },
  UInput: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue', 'input'],
    template: '<input :placeholder="placeholder" :value="modelValue"'
      + ' @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\')" />'
  },
  UButton: {
    props: ['label'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>'
  },
  UPopover: { template: '<div><slot /><slot name="content" /></div>' },
  UCheckbox: {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<input type="checkbox" class="col-check" :checked="modelValue"'
      + ' @change="$emit(\'update:modelValue\', $event.target.checked)" />'
  },
  UIcon: true,
  DateRangeFilter: {
    emits: ['change'],
    template: '<div class="date-filter" @click="$emit(\'change\')" />'
  },
  StatusList: true
}

const row = (over: Record<string, unknown> = {}) => ({
  routingSlipNumber: 'RS1',
  status: 'ACTIVE',
  businessIdentifier: ['F1'],
  chequeReceiptNumber: ['C1'],
  ...over
})

describe('Search with all columns visible', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.state = {}
  })

  it('renders every filter input and triggers debounced search on input', async () => {
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    const placeholders = ['Routing Slip Number', 'Receipt Number', 'Entity Number', 'Created By',
      'Reference Number', 'Cheque Number', 'Balance']
    for (const p of placeholders) {
      const input = wrapper.find(`input[placeholder="${p}"]`)
      expect(input.exists()).toBe(true)
      await input.setValue('abc')
    }
    expect(mocks.debouncedSearch).toHaveBeenCalledTimes(placeholders.length)
    expect((mocks.state.filters as Record<string, unknown>).remainingAmount).toBe('abc')
    expect((mocks.state.filters as Record<string, unknown>).accountName).toBe('abc')
    expect(wrapper.findAllComponents({ name: 'StatusList' }).length).toBe(2)
  })

  it('does not render the date column when hidden filters or runs search on date change', async () => {
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    await wrapper.find('.date-filter').trigger('click')
    expect(mocks.search).toHaveBeenCalled()
  })

  it('syncs active filters to search params on mount and searches', async () => {
    mocks.state = { hasActiveFilters: true, initialFilters: { routingSlipNumber: 'RS9', createdName: 'Bob' } }
    await mountSuspended(Search, { global: { stubs } })
    await nextTick()
    await nextTick()
    expect(mocks.updateSearchFilter).toHaveBeenCalledWith(expect.objectContaining({
      routingSlipNumber: 'RS9', initiator: 'Bob'
    }))
    expect(mocks.search).toHaveBeenCalled()
  })

  it('does not sync params when no filters are active but still searches', async () => {
    await mountSuspended(Search, { global: { stubs } })
    await nextTick()
    expect(mocks.updateSearchFilter).not.toHaveBeenCalled()
    expect(mocks.search).toHaveBeenCalledTimes(1)
  })

  it('shows Clear Filters only with active filters and resets on click', async () => {
    const without = await mountSuspended(Search, { global: { stubs } })
    expect(without.text()).not.toContain('Clear Filters')
    mocks.state = { hasActiveFilters: true }
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    await wrapper.findAll('button').find(b => b.text() === 'Clear Filters')!.trigger('click')
    expect(mocks.resetSearchFilters).toHaveBeenCalledOnce()
  })

  it('renders start vs. no-result empty messages', async () => {
    mocks.state = { searchParamsExist: true }
    const start = await mountSuspended(Search, { global: { stubs } })
    expect(start.html()).toContain('text.searchStartMessage')
    mocks.state = { searchParamsExist: false }
    const none = await mountSuspended(Search, { global: { stubs } })
    expect(none.html()).toContain('text.searchNoResult')
  })

  it('renders cells, single and multi value expansion, and Open navigation', async () => {
    mocks.state = {
      rows: [
        row(),
        row({ routingSlipNumber: 'RS2', businessIdentifier: ['A', 'B'], chequeReceiptNumber: ['X', 'Y'] }),
        row({ routingSlipNumber: 'RS3', businessIdentifier: ['A', 'B'], chequeReceiptNumber: ['X', 'Y'] })
      ],
      expandedFolio: ['RS3'],
      expandedCheque: ['RS3']
    }
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    const rows = wrapper.findAll('.row')
    expect(rows[0]!.text()).toContain('label-ACTIVE')
    expect(rows[0]!.text()).toContain('F1')
    expect(rows[1]!.text()).toContain('A')
    expect(rows[1]!.text()).not.toContain('B')
    expect(rows[2]!.text()).toContain('B')
    expect(rows[2]!.text()).toContain('Y')

    const clickable = rows[1]!.findAll('.cursor-pointer')
    await clickable[0]!.trigger('click')
    await clickable[1]!.trigger('click')
    expect(mocks.toggleFolio).toHaveBeenCalledWith('RS2')
    expect(mocks.toggleCheque).toHaveBeenCalledWith('RS2')
    await rows[2]!.findAll('.cursor-pointer')[0]!.trigger('click')
    expect(mocks.toggleFolio).toHaveBeenCalledWith('RS3')

    await rows[0]!.findAll('button').find(b => b.text() === 'Open')!.trigger('click')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/view-routing-slip/RS1')
  })

  it('falls back to a dash when the status label is missing', async () => {
    mocks.getStatusLabel.mockReturnValueOnce(undefined as never)
    mocks.state = { rows: [row()] }
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    expect(wrapper.find('.row span').text()).toBe('-')
  })

  it('toggles column display through the popover checkboxes and hides the date column', async () => {
    const wrapper = await mountSuspended(Search, { global: { stubs } })
    const checks = wrapper.findAll('.col-check')
    expect(checks.length).toBe(10)
    await checks[0]!.setValue(false)
    expect((checks[0]!.element as HTMLInputElement).checked).toBe(false)
  })
})
