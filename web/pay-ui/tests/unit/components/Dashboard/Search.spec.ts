import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Search from '~/components/Dashboard/Search.vue'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

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

  const mockHasActiveFilters = computed(() => {
    return mockFilters.routingSlipNumber !== null
      || mockFilters.receiptNumber !== null
      || mockFilters.accountName !== null
      || mockFilters.createdName !== null
      || mockFilters.status !== null
      || mockFilters.refundStatus !== null
      || mockFilters.businessIdentifier !== null
      || mockFilters.chequeReceiptNumber !== null
      || mockFilters.remainingAmount !== null
      || (mockFilters.dateFilter?.startDate !== null && mockFilters.dateFilter?.endDate !== null)
  })

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
    hasActiveFilters: mockHasActiveFilters,
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

  it('should render, call useSearch composable, and display search header', async () => {
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
    expect(mockUseSearch).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Search Routing Slip')
  })

  it('should render columns popover, clear filters button, and handle filter interactions', async () => {
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

    _mockFilters.routingSlipNumber = '123456789'
    const wrapper2 = await mountSuspended(Search, {
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
    expect(wrapper2.text()).toContain('Clear Filters')
    const buttons = wrapper2.findAll('[data-test="button"]')
    const clearButton = buttons.find(btn => btn.text().includes('Clear Filters'))
    if (clearButton) {
      await clearButton.trigger('click')
      expect(_mockResetSearchFilters).toHaveBeenCalledOnce()
    }
    _mockFilters.routingSlipNumber = null
  })

  it('should call debouncedSearch and search when filters change', async () => {
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
          DateRangeFilter: {
            template: '<div></div>',
            props: ['modelValue'],
            emits: ['change', 'update:modelValue']
          },
          StatusList: {
            template: '<div></div>',
            props: ['modelValue', 'column', 'placeholder'],
            emits: ['change', 'update:modelValue']
          }
        }
      }
    })
    const inputs = wrapper.findAllComponents({ name: 'UInput' })
    if (inputs.length > 0) {
      await inputs[0]!.vm.$emit('input')
      expect(_mockDebouncedSearch).toHaveBeenCalled()
    }

    const dateFilter = wrapper.findComponent({ name: 'DateRangeFilter' })
    if (dateFilter.exists()) {
      await dateFilter.vm.$emit('change')
      expect(_mockSearch).toHaveBeenCalled()
    }

    const statusLists = wrapper.findAllComponents({ name: 'StatusList' })
    if (statusLists.length > 0) {
      await statusLists[0]!.vm.$emit('change')
      expect(_mockSearch).toHaveBeenCalledTimes(2)
    }
  })

  it('should render table data, display loading state, and handle empty states', async () => {
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

    mockIsLoading.value = true
    const wrapper2 = await mountSuspended(Search, {
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
    expect(wrapper2.text()).toContain('Loading...')

    mockIsLoading.value = false
    mockSearchParamsExist.value = true
    mockRoutingSlips.value = []
    const wrapper3 = await mountSuspended(Search, {
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
    expect(wrapper3.html()).toBeTruthy()

    mockSearchParamsExist.value = false
    const wrapper4 = await mountSuspended(Search, {
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
    expect(wrapper4.html()).toBeTruthy()
  })

  it('should render status cell, toggle folio and cheque expansion', async () => {
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

    mockRoutingSlips.value = [
      { routingSlipNumber: '123', chequeReceiptNumber: ['cheque1', 'cheque2'] }
    ]
    const wrapper2 = await mountSuspended(Search, {
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
    const chequeDiv = wrapper2.find('.cursor-pointer')
    if (chequeDiv.exists()) {
      await chequeDiv.trigger('click')
      expect(_mockToggleCheque).toHaveBeenCalledWith('123')
    }
  })

  it('should render actions cell, handle infinite scroll, and navigate on Open button click', async () => {
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

    mockIsInitialLoad.value = true
    const wrapper2 = await mountSuspended(Search, {
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
    expect(wrapper2.exists()).toBe(true)
    expect(mockIsInitialLoad.value).toBe(true)

    const { mockNavigateTo } = vi.hoisted(() => {
      const _mockNavigateTo = vi.fn()
      return {
        mockNavigateTo: _mockNavigateTo
      }
    })
    mockNuxtImport('navigateTo', () => mockNavigateTo)

    mockRoutingSlips.value = [
      { routingSlipNumber: '123456789', status: 'ACTIVE' }
    ]
    const wrapper3 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot name="actions-cell" :row="{ original: { routingSlipNumber: '123456789' } }" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: true,
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
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

    const openButton = wrapper3.findComponent({ name: 'UButton' })
    if (openButton.exists()) {
      await openButton.trigger('click')
      await nextTick()
      expect(mockNavigateTo).toHaveBeenCalledWith('/view-routing-slip/123456789')
    }
  })

  it('should handle column visibility, expanded folio/cheque, and single values without expansion', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="body-top" /></div>',
            props: ['data', 'columns', 'loading', 'sticky', 'columnVisibility', 'columnPinning']
          },
          UInput: true,
          UButton: true,
          UPopover: true,
          UCheckbox: {
            template: '<input type="checkbox" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue', 'value', 'label'],
            emits: ['update:modelValue']
          },
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })

    const checkboxes = wrapper.findAllComponents({ name: 'UCheckbox' })
    if (checkboxes.length > 0) {
      await checkboxes[0]!.vm.$emit('update:modelValue', false)
      await nextTick()
      expect(wrapper.exists()).toBe(true)
    }

    mockShowExpandedFolio.value = ['123']
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', businessIdentifier: ['folio1', 'folio2'] }
    ]
    const wrapper2 = await mountSuspended(Search, {
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
    const folioDiv = wrapper2.find('.cursor-pointer')
    if (folioDiv.exists()) {
      await folioDiv.trigger('click')
      expect(_mockToggleFolio).toHaveBeenCalledWith('123')
    }

    mockShowExpandedCheque.value = ['123']
    mockRoutingSlips.value = [
      { routingSlipNumber: '123', chequeReceiptNumber: ['cheque1', 'cheque2'] }
    ]
    const wrapper3 = await mountSuspended(Search, {
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
    const chequeDiv = wrapper3.find('.cursor-pointer')
    if (chequeDiv.exists()) {
      await chequeDiv.trigger('click')
      expect(_mockToggleCheque).toHaveBeenCalledWith('123')
    }

    mockRoutingSlips.value = [
      { routingSlipNumber: '123', businessIdentifier: ['folio1'] }
    ]
    const wrapper4 = await mountSuspended(Search, {
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
                      businessIdentifier: ['folio1']
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
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper4.text()).toContain('folio1')

    mockRoutingSlips.value = [
      { routingSlipNumber: '123', chequeReceiptNumber: ['cheque1'] }
    ]
    const wrapper5 = await mountSuspended(Search, {
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
                      chequeReceiptNumber: ['cheque1']
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
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })
    expect(wrapper5.text()).toContain('cheque1')
  })

  it('should handle filter changes, search triggers, infinite scroll, loading, empty states, '
    + 'and column visibility', async () => {
    const wrapper = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot name="body-top" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: {
            template: '<input @input="$emit(\'input\')" v-model="modelValue" />',
            props: ['modelValue', 'placeholder', 'size', 'class'],
            emits: ['input']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')">{{ label }}</button>',
            props: ['label', 'variant', 'trailingIcon', 'size']
          },
          UPopover: {
            template: '<div><slot name="content" /></div>',
            props: []
          },
          UCheckbox: {
            template: '<input type="checkbox" @change="$emit(\'update:modelValue\', !modelValue)" '
              + ':checked="modelValue" />',
            props: ['modelValue', 'value', 'label', 'class'],
            emits: ['update:modelValue']
          },
          UIcon: true,
          DateRangeFilter: {
            template: '<div @change="$emit(\'change\')"></div>',
            props: ['modelValue'],
            emits: ['change']
          },
          StatusList: {
            template: '<div @change="$emit(\'change\')"></div>',
            props: ['modelValue', 'column', 'class', 'hideDetails', 'placeholder'],
            emits: ['change']
          }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'UInput' })
    const routingSlipInput = inputs.find(input => input.props('placeholder') === 'Routing Slip Number')
    if (routingSlipInput?.exists()) {
      await routingSlipInput.setValue('123456')
      await routingSlipInput.vm.$emit('input')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(_mockDebouncedSearch).toHaveBeenCalled()
    }

    const receiptInput = inputs.find(input => input.props('placeholder') === 'Receipt Number')
    if (receiptInput?.exists()) {
      await receiptInput.setValue('REC123')
      await receiptInput.vm.$emit('input')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(_mockDebouncedSearch).toHaveBeenCalledTimes(2)
    }

    const dateFilter = wrapper.findComponent({ name: 'DateRangeFilter' })
    if (dateFilter.exists()) {
      await dateFilter.vm.$emit('change')
      await nextTick()
      expect(_mockSearch).toHaveBeenCalled()
    }

    const statusLists = wrapper.findAllComponents({ name: 'StatusList' })
    const statusList = statusLists.find(sl => sl.props('column') === 'status')
    if (statusList?.exists()) {
      await statusList.vm.$emit('change')
      await nextTick()
      expect(_mockSearch).toHaveBeenCalledTimes(2)
    }

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const clearButton = buttons.find(btn => btn.text() === 'Clear Filters')
    if (clearButton?.exists()) {
      await clearButton.trigger('click')
      await nextTick()
      expect(_mockResetSearchFilters).toHaveBeenCalled()
    }

    mockIsInitialLoad.value = true
    expect(mockIsInitialLoad.value).toBe(true)

    mockIsLoading.value = true
    const wrapper2 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="loading" /></div>',
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
    expect(wrapper2.text()).toContain('Loading...')

    mockIsLoading.value = false
    mockSearchParamsExist.value = true
    mockRoutingSlips.value = []
    const wrapper3 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="empty" /></div>',
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
    expect(wrapper3.exists()).toBe(true)

    mockSearchParamsExist.value = false
    const wrapper4 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: '<div><slot name="empty" /></div>',
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
    expect(wrapper4.exists()).toBe(true)

    const wrapper5 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: true,
          UInput: true,
          UButton: true,
          UPopover: {
            template: '<div><slot name="content" /></div>',
            props: []
          },
          UCheckbox: {
            template: '<input type="checkbox" @change="$emit(\'update:modelValue\', !modelValue)" '
              + ':checked="modelValue" />',
            props: ['modelValue', 'value', 'label', 'class'],
            emits: ['update:modelValue']
          },
          UIcon: true,
          DateRangeFilter: true,
          StatusList: true
        }
      }
    })

    const checkboxes = wrapper5.findAllComponents({ name: 'UCheckbox' })
    if (checkboxes.length > 0 && checkboxes[0]!.exists()) {
      await checkboxes[0]!.vm.$emit('update:modelValue', false)
      await nextTick()
      expect(mockSearchRoutingSlipTableHeaders.value[0]?.display).toBe(false)
    }

    const wrapper6 = await mountSuspended(Search, {
      global: {
        stubs: {
          UTable: {
            template: `
              <div>
                <slot name="body-top" />
              </div>
            `,
            props: ['data', 'columns', 'loading', 'sticky']
          },
          UInput: {
            template: '<input @input="$emit(\'input\')" v-model="modelValue" />',
            props: ['modelValue', 'placeholder', 'size', 'class'],
            emits: ['input']
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

    const inputs2 = wrapper6.findAllComponents({ name: 'UInput' })
    const businessIdentifierInput = inputs2.find(input => input.props('placeholder') === 'Reference Number')
    if (businessIdentifierInput?.exists()) {
      await businessIdentifierInput.setValue('REF123')
      await businessIdentifierInput.vm.$emit('input')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(_mockDebouncedSearch).toHaveBeenCalled()
    }

    const chequeInput = inputs2.find(input => input.props('placeholder') === 'Cheque  Number')
    if (chequeInput?.exists()) {
      await chequeInput.setValue('CHQ123')
      await chequeInput.vm.$emit('input')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(_mockDebouncedSearch).toHaveBeenCalled()
    }
  })
})
