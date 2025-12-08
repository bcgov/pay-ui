import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import CreateRoutingSlip from '~/pages/create-routing-slip.vue'

const {
  mockUseI18n,
  mockT,
  mockCrsStore,
  mockModal,
  mockCreateRoutingSlip
} = vi.hoisted(() => {
  const _mockUseI18n = vi.fn()
  const _mockT = vi.fn()
  const _mockCrsStore = {
    loading: false,
    reviewMode: false,
    isCheque: true,
    totalCAD: '0.00',
    state: {
      details: {
        id: '123',
        date: '2025-10-07T10:00:00.000Z',
        entity: 'BC123'
      },
      payment: {
        paymentType: 'CHEQUE' as const,
        paymentItems: {
          1: {
            uuid: '1',
            date: '2025-10-05T10:00:00.000Z',
            amountCAD: '150.75',
            amountUSD: '110.25',
            identifier: '1234'
          }
        },
        isUSD: false
      },
      address: {
        name: 'Test Org',
        address: {
          street: '123 Main St',
          streetAdditional: '',
          city: '',
          region: '',
          postalCode: '',
          country: '',
          locationDescription: ''
        }
      }
    }
  }
  const _mockModal = {
    openLeaveCreateRoutingSlipModal: vi.fn()
  }
  const _mockCreateRoutingSlip = vi.fn()

  return {
    mockUseI18n: _mockUseI18n,
    mockT: _mockT,
    mockCrsStore: _mockCrsStore,
    mockModal: _mockModal,
    mockCreateRoutingSlip: _mockCreateRoutingSlip
  }
})

mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('useCreateRoutingSlipStore', () => () => mockCrsStore)
mockNuxtImport('usePayModals', () => () => mockModal)
mockNuxtImport('useRoutingSlip', () => () => ({
  createRoutingSlip: mockCreateRoutingSlip
}))

vi.mock('~/components/CreateRoutingSlip/index.vue', () => ({
  default: {
    name: 'CreateRoutingSlip',
    template: '<div data-testid="create-routing-slip">Create Routing Slip Component</div>',
    emits: ['submit', 'cancel']
  }
}))

vi.mock('~/components/ReviewRoutingSlip/index.vue', () => ({
  default: {
    name: 'ReviewRoutingSlip',
    template: '<div data-testid="review-routing-slip">Review Routing Slip Component</div>',
    emits: ['cancel', 'create']
  }
}))

describe('CreateRoutingSlip Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseI18n.mockReturnValue({
      t: mockT
    })
    mockT.mockImplementation((key: string) => key)
    mockCrsStore.loading = false
    mockCrsStore.reviewMode = false
  })

  it('should render the page', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip)
    expect(wrapper.exists()).toBe(true)
  })

  it('should render the back button', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const backButton = wrapper.find('button')
    expect(backButton.exists()).toBe(true)
    expect(backButton.text()).toBe('Back to Dashboard')
  })

  it('should call openLeaveCreateRoutingSlipModal when back button is clicked', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const backButton = wrapper.find('button')
    await backButton.trigger('click')

    expect(mockModal.openLeaveCreateRoutingSlipModal).toHaveBeenCalled()
  })

  it('should disable back button when loading', async () => {
    mockCrsStore.loading = true
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const backButton = wrapper.find('button')

    expect(backButton.attributes('disabled')).toBeDefined()
  })

  it('should render the heading', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Add Routing Slip')
  })

  it('should render CreateRoutingSlip component when not in review mode', async () => {
    mockCrsStore.reviewMode = false
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const createComponent = wrapper.find('[data-testid="create-routing-slip"]')
    const reviewComponent = wrapper.find('[data-testid="review-routing-slip"]')

    expect(createComponent.exists()).toBe(true)
    expect(reviewComponent.exists()).toBe(false)
  })

  it('should render ReviewRoutingSlip component when in review mode', async () => {
    mockCrsStore.reviewMode = true
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const createComponent = wrapper.find('[data-testid="create-routing-slip"]')
    const reviewComponent = wrapper.find('[data-testid="review-routing-slip"]')

    expect(createComponent.exists()).toBe(false)
    expect(reviewComponent.exists()).toBe(true)
  })

  it('should set reviewMode to true when CreateRoutingSlip emits submit', async () => {
    mockCrsStore.reviewMode = false
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const createComponent = wrapper.findComponent({ name: 'CreateRoutingSlip' })

    await createComponent.vm.$emit('submit')

    expect(mockCrsStore.reviewMode).toBe(true)
  })

  it('should call openLeaveCreateRoutingSlipModal when CreateRoutingSlip emits cancel', async () => {
    mockCrsStore.reviewMode = false
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const createComponent = wrapper.findComponent({ name: 'CreateRoutingSlip' })

    await createComponent.vm.$emit('cancel')

    expect(mockModal.openLeaveCreateRoutingSlipModal).toHaveBeenCalled()
  })

  it('should call createRoutingSlip when ReviewRoutingSlip emits create', async () => {
    mockCrsStore.reviewMode = true
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const reviewComponent = wrapper.findComponent({ name: 'ReviewRoutingSlip' })

    await reviewComponent.vm.$emit('create')

    expect(mockCreateRoutingSlip).toHaveBeenCalled()
  })

  it('should call openLeaveCreateRoutingSlipModal when ReviewRoutingSlip emits cancel', async () => {
    mockCrsStore.reviewMode = true
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const reviewComponent = wrapper.findComponent({ name: 'ReviewRoutingSlip' })

    await reviewComponent.vm.$emit('cancel')

    expect(mockModal.openLeaveCreateRoutingSlipModal).toHaveBeenCalled()
  })

  it('should set page title', async () => {
    await mountSuspended(CreateRoutingSlip)
    expect(mockT).toHaveBeenCalledWith('page.createRoutingSlip.title')
  })

  it('should show correct heading label in review mode', async () => {
    mockCrsStore.reviewMode = true
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const heading = wrapper.find('h1')

    expect(heading.text()).toBe('Add Routing Slip')
  })

  it('should show correct heading label in create mode', async () => {
    mockCrsStore.reviewMode = false
    const wrapper = await mountSuspended(CreateRoutingSlip)
    const heading = wrapper.find('h1')

    expect(heading.text()).toBe('Add Routing Slip')
  })
})
