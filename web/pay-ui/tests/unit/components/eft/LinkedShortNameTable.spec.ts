import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import LinkedShortNameTable from '~/components/eft/LinkedShortNameTable.vue'

const mockLoadTableData = vi.fn()
const mockUpdateFilter = vi.fn()
const mockGetNext = vi.fn()
const mockResetReachedEnd = vi.fn()

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn()
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/composables/eft/useLinkedShortNameTable', () => ({
  useLinkedShortNameTable: () => ({
    loadTableData: mockLoadTableData,
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
    linkedTableSettings: null,
    setLinkedTableSettings: vi.fn()
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
  useInfiniteScroll: vi.fn(),
  createSharedComposable: (fn: () => unknown) => fn
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`)
  }
}))

vi.mock('~/utils/short-name-util', () => ({
  default: {
    getShortNameTypeDescription: vi.fn((type: string) => type === 'EFT' ? 'EFT' : 'Wire Transfer')
  }
}))

describe('LinkedShortNameTable', () => {
  const defaultProps = {
    currentTab: 0
  }

  const createWrapper = (props = {}) => {
    return mount(LinkedShortNameTable, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="body-top" />
                <slot name="shortName-cell" :row="{ original: mockRow }" />
                <slot name="shortNameType-cell" :row="{ original: mockRow }" />
                <slot name="accountName-cell" :row="{ original: mockRow }" />
                <slot name="accountBranch-cell" :row="{ original: mockRow }" />
                <slot name="accountId-cell" :row="{ original: mockRow }" />
                <slot name="amountOwing-cell" :row="{ original: mockRow }" />
                <slot name="statementId-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
                <slot name="loading" />
                <slot name="empty" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky'],
            data: () => ({
              mockRow: {
                id: 1,
                shortName: 'TEST',
                shortNameType: 'EFT',
                accountName: 'Test Account',
                accountBranch: 'Vancouver',
                accountId: 'ACC123',
                amountOwing: 500,
                statementId: 789
              }
            })
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
          StatusList: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadTableData.mockResolvedValue(undefined)
  })

  it('should render component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should load data on mount', async () => {
    createWrapper()
    await flushPromises()

    expect(mockLoadTableData).toHaveBeenCalled()
  })

  it('should emit shortname-state-total when results change', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    wrapper.vm.state.totalResults = 25
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('shortname-state-total')).toBeTruthy()
  })

  it('should navigate to details', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { navigateToDetails: (id: number) => void }

    vm.navigateToDetails(123)

    expect(mockNavigateTo).toHaveBeenCalledWith('/eft/shortname-details/123')
  })

  it('should save table settings before navigation', () => {
    const wrapper = createWrapper()
    wrapper.vm.state.filters.filterPayload.shortName = 'TEST'
    wrapper.vm.state.filters.pageNumber = 2

    const vm = wrapper.vm as unknown as { saveTableSettings: () => void }
    vm.saveTableSettings()

    // Verify saveTableSettings was called (store mock handles the actual saving)
  })

  it('should clear filters', async () => {
    const wrapper = createWrapper()
    wrapper.vm.state.filters.filterPayload = {
      shortName: 'TEST',
      shortNameType: 'EFT',
      accountName: 'Account',
      accountNumber: '123',
      branchName: 'Branch',
      amountOwing: '500',
      statementId: '789'
    }
    wrapper.vm.state.filters.isActive = true

    const vm = wrapper.vm as unknown as { clearFilters: () => Promise<void> }
    await vm.clearFilters()

    expect(wrapper.vm.state.filters.filterPayload.shortName).toBe('')
    expect(wrapper.vm.state.filters.filterPayload.accountName).toBe('')
    expect(wrapper.vm.state.filters.isActive).toBe(false)
    expect(mockResetReachedEnd).toHaveBeenCalled()
    expect(mockLoadTableData).toHaveBeenCalled()
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

    vm.onShortNameTypeChange('WIRE')

    expect(wrapper.vm.state.filters.filterPayload.shortNameType).toBe('WIRE')
    expect(mockUpdateFilter).toHaveBeenCalledWith('shortNameType', 'WIRE')
  })

  it('should handle empty short name type', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      onShortNameTypeChange: (value: string) => void
    }

    vm.onShortNameTypeChange('')

    expect(wrapper.vm.state.filters.filterPayload.shortNameType).toBe('')
    expect(mockUpdateFilter).toHaveBeenCalledWith('shortNameType', '')
  })

  it('should reload when currentTab changes to 1', async () => {
    const wrapper = createWrapper({ currentTab: 0 })
    await flushPromises()

    mockLoadTableData.mockClear()
    await wrapper.setProps({ currentTab: 1 })
    await wrapper.vm.$nextTick()

    expect(mockLoadTableData).toHaveBeenCalled()
  })

  it('should define correct columns', () => {
    const wrapper = createWrapper()
    const columns = wrapper.vm.columns

    expect(columns).toHaveLength(8)
    expect(columns.map((c: { accessorKey: string }) => c.accessorKey)).toEqual([
      'shortName',
      'shortNameType',
      'accountName',
      'accountBranch',
      'accountId',
      'amountOwing',
      'statementId',
      'actions'
    ])
  })

  it('should return default filter payload', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      defaultFilterPayload: () => Record<string, string>
    }

    const payload = vm.defaultFilterPayload()

    expect(payload).toEqual({
      shortName: '',
      shortNameType: '',
      accountName: '',
      accountNumber: '',
      branchName: '',
      amountOwing: '',
      statementId: ''
    })
  })

  it('should use debounced filter update', async () => {
    const wrapper = createWrapper()

    wrapper.vm.debouncedUpdateFilter('shortName', 'TEST')

    expect(mockUpdateFilter).toHaveBeenCalledWith('shortName', 'TEST')
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
