import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNameSummaryTable from '~/components/eft/ShortNameSummaryTable.vue'

const mockLoadTableSummaryData = vi.fn()
const mockUpdateFilter = vi.fn()
const mockGetNext = vi.fn()
const mockResetReachedEnd = vi.fn()

const { mockNavigateTo, mockToastAdd } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockToastAdd: vi.fn()
}))

const _mockState = reactive({
  results: [],
  totalResults: 0,
  filters: {
    isActive: false,
    pageNumber: 1,
    pageLimit: 20,
    filterPayload: {
      shortName: '',
      shortNameType: '',
      creditsRemaining: '',
      linkedAccountsCount: '',
      paymentReceivedStartDate: '',
      paymentReceivedEndDate: ''
    }
  },
  loading: false,
  highlightIndex: -1,
  clearFiltersTrigger: 0
})

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

vi.mock('~/composables/eft/useShortNameTable', () => ({
  useShortNameTable: () => ({
    loadTableSummaryData: mockLoadTableSummaryData,
    updateFilter: mockUpdateFilter,
    getNext: mockGetNext,
    resetReachedEnd: mockResetReachedEnd,
    loadState: {
      isInitialLoad: true,
      reachedEnd: false,
      isLoading: false
    }
  })
}))

vi.mock('~/stores/eft-store', () => ({
  useEftStore: () => ({
    summaryTableSettings: null,
    summaryFilter: null,
    setSummaryFilter: vi.fn(),
    clearSummaryFilter: vi.fn(),
    setSummaryTableSettings: vi.fn()
  })
}))

vi.mock('~/composables/common/useStatusList', () => ({
  useShortNameTypeList: () => ({
    list: ref([{ code: 'EFT', label: 'EFT' }, { code: 'WIRE', label: 'Wire' }]),
    mapFn: vi.fn()
  })
}))

vi.mock('~/composables/common/useStickyHeader', () => ({
  useStickyHeader: () => ({
    updateStickyHeaderHeight: vi.fn()
  })
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: () => void) => fn,
  useInfiniteScroll: vi.fn()
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    formatDisplayDate: vi.fn((date: string) => date ? 'January 1, 2024' : '')
  }
}))

vi.mock('~/utils/short-name-util', () => ({
  default: {
    getShortNameTypeDescription: vi.fn((type: string) => type === 'EFT' ? 'EFT' : 'Wire Transfer')
  }
}))

describe('ShortNameSummaryTable', () => {
  const defaultProps = {
    linkedAccount: undefined,
    currentTab: 0
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNameSummaryTable, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="body-top" />
                <slot name="shortName-cell" :row="{ original: mockRow }" />
                <slot name="shortNameType-cell" :row="{ original: mockRow }" />
                <slot name="lastPaymentReceivedDate-cell" :row="{ original: mockRow }" />
                <slot name="creditsRemaining-cell" :row="{ original: mockRow }" />
                <slot name="linkedAccountsCount-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
                <slot name="loading" />
                <slot name="empty" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder', 'name']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>',
            props: ['label', 'variant', 'color']
          },
          UIcon: true,
          UBadge: {
            template: '<span class="badge"><slot /></span>',
            props: ['color', 'variant']
          },
          UDropdownMenu: true,
          StatusList: true,
          DateRangeFilter: true,
          ShortNameLinkingDialog: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadTableSummaryData.mockResolvedValue(undefined)
  })

  it('should render component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should load data on mount', async () => {
    createWrapper()
    await flushPromises()

    expect(mockLoadTableSummaryData).toHaveBeenCalled()
  })

  it('should emit shortname-state-total when results change', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.vm.state.totalResults = 42
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('shortname-state-total')).toBeTruthy()
  })

  it('should navigate to details', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { navigateToDetails: (id: number) => void }

    vm.navigateToDetails(123)

    expect(mockNavigateTo).toHaveBeenCalledWith('/eft/shortname-details/123')
  })

  it('should open linking dialog', () => {
    const wrapper = createWrapper()
    const item = { id: 123, shortName: 'TEST', linkedAccountsCount: 0 }

    const vm = wrapper.vm as unknown as {
      openAccountLinkingDialog: (item: typeof item) => void
    }
    vm.openAccountLinkingDialog(item)

    expect(wrapper.vm.linkingDialogOpen).toBe(true)
    expect(wrapper.vm.selectedShortNameForLinking).toEqual(item)
  })

  it('should emit on-link-account when account is linked', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      onLinkAccount: (account: unknown) => Promise<void>
    }

    await vm.onLinkAccount({ accountId: 'ACC1' })

    expect(wrapper.emitted('on-link-account')).toBeTruthy()
    expect(mockLoadTableSummaryData).toHaveBeenCalled()
  })

  it('should clear filters', async () => {
    const wrapper = createWrapper()
    wrapper.vm.state.filters.filterPayload.shortName = 'TEST'
    wrapper.vm.state.filters.isActive = true

    const vm = wrapper.vm as unknown as { clearFilters: () => Promise<void> }
    await vm.clearFilters()

    expect(wrapper.vm.state.filters.filterPayload.shortName).toBe('')
    expect(wrapper.vm.state.filters.isActive).toBe(false)
    expect(mockResetReachedEnd).toHaveBeenCalled()
    expect(mockLoadTableSummaryData).toHaveBeenCalled()
  })

  it('should handle date range change', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { onDateRangeChange: () => Promise<void> }

    await vm.onDateRangeChange()

    expect(mockLoadTableSummaryData).toHaveBeenCalledWith('page', 1)
  })

  it('should format last payment date', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      formatLastPaymentDate: (date: string | undefined) => string
    }

    expect(vm.formatLastPaymentDate('2024-01-01')).toBe('January 1, 2024')
    expect(vm.formatLastPaymentDate(undefined)).toBe('')
  })

  it('should get short name type description', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      getShortNameTypeDescription: (type: string | undefined) => string
    }

    expect(vm.getShortNameTypeDescription('EFT')).toBe('EFT')
    expect(vm.getShortNameTypeDescription('WIRE')).toBe('Wire Transfer')
  })

  it('should handle short name type filter change', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      onShortNameTypeChange: (value: string) => void
    }

    vm.onShortNameTypeChange('EFT')

    expect(wrapper.vm.state.filters.filterPayload.shortNameType).toBe('EFT')
    expect(mockUpdateFilter).toHaveBeenCalledWith('shortNameType', 'EFT')
  })

  it('should handle linked account highlight', async () => {
    const wrapper = createWrapper()
    wrapper.vm.state.results = [
      { id: 123, shortName: 'TEST', linkedAccountsCount: 1 }
    ]

    const vm = wrapper.vm as unknown as {
      onLinkedAccount: (account: { shortNameId?: number }) => void
    }
    vm.onLinkedAccount({ shortNameId: 123 })

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('TEST')
      })
    )
    expect(wrapper.vm.state.highlightIndex).toBe(0)
  })

  it('should reload on currentTab change', async () => {
    const wrapper = createWrapper({ currentTab: 0 })
    await flushPromises()

    mockLoadTableSummaryData.mockClear()
    await wrapper.setProps({ currentTab: 1 })
    await wrapper.vm.$nextTick()

    // loadData is called
    expect(mockLoadTableSummaryData).toHaveBeenCalled()
  })

  it('should watch linkedAccount prop', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.vm.state.results = [{ id: 123, shortName: 'TEST', linkedAccountsCount: 1 }]

    await wrapper.setProps({
      linkedAccount: { shortNameId: 123 }
    })
    await wrapper.vm.$nextTick()

    expect(mockToastAdd).toHaveBeenCalled()
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
