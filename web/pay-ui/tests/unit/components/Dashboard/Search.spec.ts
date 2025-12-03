import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Search from '~/components/Dashboard/Search.vue'
import { createPinia, setActivePinia } from 'pinia'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

const {
  mockSearchRoutingSlipTableHeaders,
  mockDebouncedSearch,
  mockGetStatusLabel,
  mockSearchParamsExist,
  mockShowExpandedFolio,
  mockShowExpandedCheque,
  mockToggleFolio,
  mockToggleCheque,
  mockIsLoading,
  mockGetNext,
  mockFilters,
  mockRoutingSlips,
  mockColumnPinning,
  mockIsInitialLoad,
  mockColumnVisibility,
  mockResetSearchFilters,
  mockSearch,
  mockUseSearch
} = vi.hoisted(() => {
  const { ref, reactive, computed } = require('vue')
  const mockSearchRoutingSlipTableHeaders = ref([
    { accessorKey: 'routingSlipNumber', header: 'Routing Slip Number', display: true },
    { accessorKey: 'receiptNumber', header: 'Receipt Number', display: true }
  ])

  const mockDebouncedSearch = vi.fn()
  const mockGetStatusLabel = vi.fn()
  const mockSearchParamsExist = ref(true)
  const mockShowExpandedFolio = ref([] as string[])
  const mockShowExpandedCheque = ref([] as string[])
  const mockToggleFolio = vi.fn()
  const mockToggleCheque = vi.fn()
  const mockIsLoading = ref(false)
  const mockGetNext = vi.fn()
  const mockFilters = reactive({
    routingSlipNumber: null,
    receiptNumber: null,
    accountName: null,
    createdName: null,
    dateFilter: { startDate: null, endDate: null },
    status: null,
    refundStatus: null,
    businessIdentifier: null,
    chequeReceiptNumber: null,
    remainingAmount: null
  })
  const mockRoutingSlips = ref([])
  const mockColumnPinning = ref({ right: ['actions'] })
  const mockIsInitialLoad = ref(true)
  const mockColumnVisibility = computed(() => ({
    routingSlipNumber: true,
    receiptNumber: true
  }))
  const mockResetSearchFilters = vi.fn()
  const mockSearch = vi.fn()

  const mockUseSearch = vi.fn(async () => ({
    searchRoutingSlipTableHeaders: mockSearchRoutingSlipTableHeaders,
    debouncedSearch: mockDebouncedSearch,
    getStatusLabel: mockGetStatusLabel,
    searchParamsExist: mockSearchParamsExist,
    showExpandedFolio: mockShowExpandedFolio,
    showExpandedCheque: mockShowExpandedCheque,
    toggleFolio: mockToggleFolio,
    toggleCheque: mockToggleCheque,
    isLoading: mockIsLoading,
    getNext: mockGetNext,
    filters: mockFilters,
    routingSlips: mockRoutingSlips,
    columnPinning: mockColumnPinning,
    isInitialLoad: mockIsInitialLoad,
    columnVisibility: mockColumnVisibility,
    resetSearchFilters: mockResetSearchFilters,
    search: mockSearch
  }))

  return {
    mockSearchRoutingSlipTableHeaders,
    mockDebouncedSearch,
    mockGetStatusLabel,
    mockSearchParamsExist,
    mockShowExpandedFolio,
    mockShowExpandedCheque,
    mockToggleFolio,
    mockToggleCheque,
    mockIsLoading,
    mockGetNext,
    mockFilters,
    mockRoutingSlips,
    mockColumnPinning,
    mockIsInitialLoad,
    mockColumnVisibility,
    mockResetSearchFilters,
    mockSearch,
    mockUseSearch
  }
})

vi.mock('~/composables/dashboard/useSearch', () => ({
  useSearch: mockUseSearch
}))

describe('Search', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSearchRoutingSlipTableHeaders.value = [
      { accessorKey: 'routingSlipNumber', header: 'Routing Slip Number', display: true },
      { accessorKey: 'receiptNumber', header: 'Receipt Number', display: true }
    ]
    mockSearchParamsExist.value = true
    mockShowExpandedFolio.value = []
    mockShowExpandedCheque.value = []
    mockIsLoading.value = false
    mockIsInitialLoad.value = true
    mockRoutingSlips.value = []
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: true,
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should call useSearch composable', async () => {
    await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: true,
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(mockUseSearch).toHaveBeenCalled()
  })

  it('should render search header with title', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: true,
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper.text()).toContain('Search Routing Slip')
  })

  it('should render columns popover button', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: true,
          UInput: true,
          UButton: {
            template: '<button><slot />{{ label }}</button>',
            props: ['label', 'color', 'variant', 'trailing-icon', 'size', 'dismissible']
          },
          UPopover: {
            template: '<div><slot /><slot name="content" /></div>'
          },
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper.text()).toContain('Columns to show')
  })

  it('should render clear filters button', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: {
            template: '<button><slot />{{ label }}</button>',
            props: ['label', 'variant', 'trailing-icon', 'size']
          },
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper.text()).toContain('Clear Filters')
  })
})
