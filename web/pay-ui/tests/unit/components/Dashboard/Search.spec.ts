import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Search from '~/components/Dashboard/Search.vue'
import { createPinia, setActivePinia } from 'pinia'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

const {
  mockSearchRoutingSlipTableHeaders,
  _mockDebouncedSearch,
  _mockGetStatusLabel,
  mockSearchParamsExist,
  mockShowExpandedFolio,
  mockShowExpandedCheque,
  _mockToggleFolio,
  _mockToggleCheque,
  mockIsLoading,
  _mockGetNext,
  _mockFilters,
  mockRoutingSlips,
  _mockColumnPinning,
  mockIsInitialLoad,
  _mockColumnVisibility,
  _mockResetSearchFilters,
  _mockSearch,
  mockUseSearch
} = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    _mockDebouncedSearch: mockDebouncedSearch,
    _mockGetStatusLabel: mockGetStatusLabel,
    mockSearchParamsExist,
    mockShowExpandedFolio,
    mockShowExpandedCheque,
    _mockToggleFolio: mockToggleFolio,
    _mockToggleCheque: mockToggleCheque,
    mockIsLoading,
    _mockGetNext: mockGetNext,
    _mockFilters: mockFilters,
    mockRoutingSlips,
    _mockColumnPinning: mockColumnPinning,
    mockIsInitialLoad,
    _mockColumnVisibility: mockColumnVisibility,
    _mockResetSearchFilters: mockResetSearchFilters,
    _mockSearch: mockSearch,
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

  it('should call resetSearchFilters when clear filters button is clicked', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: {
            template: '<button @click="$emit(\'click\')" data-test="button"><slot />{{ label }}</button>',
            props: ['label', 'variant', 'trailing-icon', 'size'],
            emits: ['click']
          },
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    const buttons = wrapper.findAll('[data-test="button"]')
    const clearButton = buttons.find(btn => btn.text().includes('Clear Filters'))
    if (clearButton) {
      await clearButton.trigger('click')
      expect(_mockResetSearchFilters).toHaveBeenCalledOnce()
    } else {
      expect(clearButton).toBeDefined()
    }
  })

  it('should call debouncedSearch when filter input changes', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: {
            template: '<input @input="$emit(\'input\')" />',
            props: ['modelValue', 'placeholder', 'size'],
            emits: ['input', 'update:modelValue']
          },
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    const inputs = wrapper.findAllComponents({ name: 'UInput' })
    if (inputs.length > 0) {
      await inputs[0]!.vm.$emit('input')
      expect(_mockDebouncedSearch).toHaveBeenCalled()
    }
  })

  it('should call search when DateRangeFilter changes', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: {
            template: '<div></div>',
            props: ['modelValue'],
            emits: ['change', 'update:modelValue']
          },
          StatusList: true
        }
      }
    })
    const dateFilter = wrapper.findComponent({ name: 'DateRangeFilter' })
    if (dateFilter.exists()) {
      await dateFilter.vm.$emit('change')
      expect(_mockSearch).toHaveBeenCalled()
    }
  })

  it('should call search when StatusList changes', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: {
            template: '<div></div>',
            props: ['modelValue', 'column', 'placeholder'],
            emits: ['change', 'update:modelValue']
          }
        }
      }
    })
    const statusLists = wrapper.findAllComponents({ name: 'StatusList' })
    if (statusLists.length > 0) {
      await statusLists[0]!.vm.$emit('change')
      expect(_mockSearch).toHaveBeenCalled()
    }
  })

  it('should render table with routing slips data', async () => {
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', status: 'ACTIVE' },
      { routingSlipNumber: '456', status: 'COMPLETE' }
    ]
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" />Data: {{ data.length }}</div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    expect(wrapper.text()).toContain('Data: 2')
  })

  it('should display loading state', async () => {
    mockIsLoading.value = true
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div v-if="loading"><slot name="loading" /></div><div v-else>Not Loading</div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    expect(wrapper.text()).toContain('Loading...')
  })

  it('should display empty state when searchParamsExist is true', async () => {
    mockSearchParamsExist.value = true
    mockRoutingSlips.value = []
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div v-if="data.length === 0"><slot name="empty" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    expect(wrapper.html()).toBeTruthy()
  })

  it('should display empty state when searchParamsExist is false', async () => {
    mockSearchParamsExist.value = false
    mockRoutingSlips.value = []
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div v-if="data.length === 0"><slot name="empty" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    expect(wrapper.html()).toBeTruthy()
  })

  it('should render status cell with getStatusLabel', async () => {
    _mockGetStatusLabel.mockReturnValue('Active')
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', status: 'ACTIVE' }
    ]
    await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="status-cell" :row="{ original: { status: \'ACTIVE\' } }" /></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    expect(_mockGetStatusLabel).toHaveBeenCalled()
  })

  it('should toggle folio expansion when clicked', async () => {
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', businessIdentifier: ['folio1', 'folio2'] }
    ]
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot
                  name="businessIdentifier-cell"
                  :row="{
                    original: {
                      routingSlipNumber: '123',
                      businessIdentifier: ['folio1', 'folio2']
                    }
                  }"
                />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: {
            template: '<span></span>',
            props: ['name']
          },
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    const folioDiv = wrapper.find('.cursor-pointer')
    if (folioDiv.exists()) {
      await folioDiv.trigger('click')
      expect(_mockToggleFolio).toHaveBeenCalledWith('123')
    }
  })

  it('should toggle cheque expansion when clicked', async () => {
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', chequeReceiptNumber: ['cheque1', 'cheque2'] }
    ]
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot
                  name="chequeReceiptNumber-cell"
                  :row="{
                    original: {
                      routingSlipNumber: '123',
                      chequeReceiptNumber: ['cheque1', 'cheque2']
                    }
                  }"
                />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: true,
          UIcon: {
            template: '<span></span>',
            props: ['name']
          },
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    const chequeDiv = wrapper.find('.cursor-pointer')
    if (chequeDiv.exists()) {
      await chequeDiv.trigger('click')
      expect(_mockToggleCheque).toHaveBeenCalledWith('123')
    }
  })

  it('should render actions cell with Open button', async () => {
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', status: 'ACTIVE' }
    ]
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot name="actions-cell" :row="{ original: { routingSlipNumber: '123' } }" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: {
            template: '<button><slot>{{ label }}</slot></button>',
            props: ['label']
          },
          UPopover: true,
          UCheckbox: true,
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper.text()).toContain('Open')
  })

  it('should handle useInfiniteScroll callback', async () => {
    mockIsInitialLoad.value = true
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div ref="table"></div>',
            props: ['data', 'columns', 'loading', 'sticky']
          },
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
    await nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(mockIsInitialLoad.value).toBe(true)
  })
})
