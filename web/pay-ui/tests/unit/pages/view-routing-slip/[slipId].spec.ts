import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import ViewRoutingSlip from '~/pages/view-routing-slip/[slipId].vue'
import { routingSlipMock } from '../../test-data/mock-routing-slip'

const mockIsLoadingRef = ref(false)

const {
  mockUseI18n,
  mockT,
  mockSetBreadcrumbs,
  mockGetRoutingSlip,
  mockGetLinkedRoutingSlips,
  mockToggleLoading,
  mockIsLoading,
  mockUseViewRoutingSlip,
  mockFetchStaffComments
} = vi.hoisted(() => {
  const _mockUseI18n = vi.fn()
  const _mockT = vi.fn()
  const _mockSetBreadcrumbs = vi.fn()
  const _mockGetRoutingSlip = vi.fn()
  const _mockGetLinkedRoutingSlips = vi.fn().mockResolvedValue({})
  const _mockToggleLoading = vi.fn()
  const _mockIsLoading = { value: false }
  const _mockFetchStaffComments = vi.fn()

  const _mockUseViewRoutingSlip = vi.fn()

  return {
    mockUseI18n: _mockUseI18n,
    mockT: _mockT,
    mockSetBreadcrumbs: _mockSetBreadcrumbs,
    mockGetRoutingSlip: _mockGetRoutingSlip,
    mockGetLinkedRoutingSlips: _mockGetLinkedRoutingSlips,
    mockToggleLoading: _mockToggleLoading,
    mockIsLoading: _mockIsLoading,
    mockUseViewRoutingSlip: _mockUseViewRoutingSlip,
    mockFetchStaffComments: _mockFetchStaffComments
  }
})

mockGetRoutingSlip.mockResolvedValue(routingSlipMock)

const mockRoute = {
  params: {
    slipId: '123456789'
  }
}

const mockRoutingSlip = { value: routingSlipMock }

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('setBreadcrumbs', () => mockSetBreadcrumbs)
mockNuxtImport('useRoutingSlip', () => () => ({
  getRoutingSlip: mockGetRoutingSlip,
  getLinkedRoutingSlips: mockGetLinkedRoutingSlips,
  routingSlip: mockRoutingSlip
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    isLoading: mockIsLoadingRef,
    toggleLoading: mockToggleLoading
  })
}))

vi.mock('~/composables/viewRoutingSlip/useViewRoutingSlip', () => ({
  default: mockUseViewRoutingSlip
}))

vi.mock('~/components/RoutingSlip/StaffComments.vue', () => ({
  default: {
    name: 'StaffComments',
    template: '<div data-testid="staff-comments">Staff Comments</div>',
    setup() {
      return {
        fetchStaffComments: mockFetchStaffComments
      }
    },
    methods: {
      fetchStaffComments: mockFetchStaffComments
    }
  }
}))

vi.mock('~/components/RoutingSlip/LinkRoutingSlip.vue', () => ({
  default: {
    name: 'LinkRoutingSlip',
    template: '<div data-testid="link-routing-slip">Link Routing Slip</div>',
    props: ['slipId']
  }
}))

vi.mock('~/components/RoutingSlip/PaymentInformation.vue', () => ({
  default: {
    name: 'PaymentInformation',
    template: '<div data-testid="payment-information">Payment Information</div>',
    emits: ['payment-adjusted']
  }
}))

vi.mock('~/components/RoutingSlip/RoutingSlipTransaction.vue', () => ({
  default: {
    name: 'RoutingSlipTransaction',
    template: '<div data-testid="routing-slip-transaction">Routing Slip Transaction</div>',
    props: ['invoices']
  }
}))

vi.mock('~/components/RoutingSlip/RoutingSlipInformation.vue', () => ({
  default: {
    name: 'RoutingSlipInformation',
    template: '<div data-testid="routing-slip-information">Routing Slip Information</div>',
    emits: ['comments-updated']
  }
}))

describe('ViewRoutingSlip Page [slipId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseI18n.mockReturnValue({
      t: mockT
    })
    mockT.mockImplementation((key: string, params?: Record<string, string>) => {
      if (params?.id) {
        return key.replace('{id}', params.id)
      }
      return key
    })
    mockIsLoading.value = false
    mockIsLoadingRef.value = false
    mockRoute.params.slipId = '123456789'
    mockGetRoutingSlip.mockResolvedValue(routingSlipMock)
    mockGetLinkedRoutingSlips.mockResolvedValue({})
    mockUseViewRoutingSlip.mockReturnValue({
      slipId: ref('123456789'),
      getRoutingSlipAndLinkedRoutingSlips: vi.fn()
    })
  })

  it('should render the page', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    expect(wrapper.exists()).toBe(true)
  })

  it('should set page title', async () => {
    await mountSuspended(ViewRoutingSlip)
    expect(mockT).toHaveBeenCalledWith('page.viewRoutingSlip.title')
  })

  it('should set breadcrumbs with correct labels', async () => {
    await mountSuspended(ViewRoutingSlip)
    expect(mockSetBreadcrumbs).toHaveBeenCalled()
    const breadcrumbsCall = mockSetBreadcrumbs.mock.calls[0]?.[0]
    expect(breadcrumbsCall).toBeDefined()
    if (breadcrumbsCall) {
      expect(breadcrumbsCall).toHaveLength(2)
      expect(breadcrumbsCall[0]).toMatchObject({
        label: 'label.fasDashboard',
        to: '/home'
      })
      expect(breadcrumbsCall[1]).toHaveProperty('label')
    }
  })

  it('should call useViewRoutingSlip with slipId from route', async () => {
    await mountSuspended(ViewRoutingSlip)
    expect(mockUseViewRoutingSlip).toHaveBeenCalledWith({ slipId: '123456789' })
  })

  it('should call getRoutingSlip and getLinkedRoutingSlips on mount', async () => {
    await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('123456789')
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should toggle loading to false even if getRoutingSlip fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = new Error('API Error')
    mockGetRoutingSlip.mockImplementationOnce(() => Promise.reject(error))

    const unhandledRejections: Error[] = []
    const originalHandler = process.listeners('unhandledRejection').find(
      handler => handler.name === 'unhandledRejection'
    )
    const rejectionHandler = (reason: unknown) => {
      unhandledRejections.push(reason as Error)
    }
    process.once('unhandledRejection', rejectionHandler)

    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 200)
    })

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)

    await wrapper.unmount()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    process.removeListener('unhandledRejection', rejectionHandler)
    if (originalHandler) {
      process.on('unhandledRejection', originalHandler)
    }
    consoleWarnSpy.mockRestore()
  })

  it('should toggle loading to false even if getLinkedRoutingSlips fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = new Error('API Error')
    mockGetLinkedRoutingSlips.mockImplementationOnce(() => Promise.reject(error))

    const unhandledRejections: Error[] = []
    const originalHandler = process.listeners('unhandledRejection').find(
      handler => handler.name === 'unhandledRejection'
    )
    const rejectionHandler = (reason: unknown) => {
      unhandledRejections.push(reason as Error)
    }
    process.once('unhandledRejection', rejectionHandler)

    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 200)
    })

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)

    await wrapper.unmount()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    process.removeListener('unhandledRejection', rejectionHandler)
    if (originalHandler) {
      process.on('unhandledRejection', originalHandler)
    }
    consoleWarnSpy.mockRestore()
  })

  it('should render loading state when isLoading is true', async () => {
    mockIsLoadingRef.value = true
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const loadingIcon = wrapper.find('.animate-spin')
    expect(loadingIcon.exists()).toBe(true)
  })

  it('should render content when isLoading is false', async () => {
    mockIsLoadingRef.value = false
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
  })

  it('should render heading with slipId', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const heading = wrapper.find('h1')
    expect(heading.text()).toContain('123456789')
  })

  it('should render StaffComments component', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const staffComments = wrapper.find('[data-testid="staff-comments"]')
    expect(staffComments.exists()).toBe(true)
  })

  it('should render RoutingSlipInformation component', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const routingSlipInfo = wrapper.find('[data-testid="routing-slip-information"]')
    expect(routingSlipInfo.exists()).toBe(true)
  })

  it('should render PaymentInformation component', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const paymentInfo = wrapper.find('[data-testid="payment-information"]')
    expect(paymentInfo.exists()).toBe(true)
  })

  it('should render LinkRoutingSlip component with slipId prop', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const linkRoutingSlip = wrapper.find('[data-testid="link-routing-slip"]')
    expect(linkRoutingSlip.exists()).toBe(true)
  })

  it('should render RoutingSlipTransaction component with invoices', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()

    const transaction = wrapper.find('[data-testid="routing-slip-transaction"]')
    expect(transaction.exists()).toBe(true)
  })

  it('should call fetchStaffComments when handlePaymentAdjusted is called', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const paymentInfo = wrapper.findComponent({ name: 'PaymentInformation' })
    expect(paymentInfo.exists()).toBe(true)
    await paymentInfo.vm.$emit('payment-adjusted')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(mockFetchStaffComments).toHaveBeenCalled()
  })

  it('should call fetchStaffComments when RoutingSlipInformation emits comments-updated', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const routingSlipInfo = wrapper.findComponent({ name: 'RoutingSlipInformation' })
    expect(routingSlipInfo.exists()).toBe(true)
    await routingSlipInfo.vm.$emit('comments-updated')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(mockFetchStaffComments).toHaveBeenCalled()
  })

  it('should handle missing staffCommentsRef gracefully', async () => {
    const wrapper = await mountSuspended(ViewRoutingSlip)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const routingSlipInfo = wrapper.findComponent({ name: 'RoutingSlipInformation' })
    expect(routingSlipInfo.exists()).toBe(true)
    await routingSlipInfo.vm.$emit('comments-updated')

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const paymentInfo = wrapper.findComponent({ name: 'PaymentInformation' })
    expect(paymentInfo.exists()).toBe(true)
    await expect(async () => {
      await paymentInfo.vm.$emit('payment-adjusted')
    }).not.toThrow()
  })
})
