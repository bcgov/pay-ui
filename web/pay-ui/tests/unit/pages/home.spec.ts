import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Home from '~/pages/home.vue'

const {
  mockNavigateTo,
  mockUseI18n,
  mockT
} = vi.hoisted(() => {
  const _mockNavigateTo = vi.fn()
  const _mockUseI18n = vi.fn()
  const _mockT = vi.fn()

  return {
    mockNavigateTo: _mockNavigateTo,
    mockUseI18n: _mockUseI18n,
    mockT: _mockT
  }
})

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useI18n', () => mockUseI18n)

vi.mock('~/components/Dashboard/Search.vue', () => ({
  default: {
    name: 'Search',
    template: '<div data-testid="search">Search Component</div>'
  }
}))

vi.mock('~/components/Dashboard/DailyReport.vue', () => ({
  default: {
    name: 'DailyReport',
    template: '<div data-testid="daily-report">Daily Report Component</div>'
  }
}))

const vCanStub = {
  mounted: () => {},
  updated: () => {}
}

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseI18n.mockReturnValue({
      t: mockT
    })
    mockT.mockImplementation((key: string) => key)
  })

  const mountOptions = {
    global: {
      directives: {
        can: vCanStub
      }
    }
  }

  it('should render the page', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    expect(wrapper.exists()).toBe(true)
  })

  it('should render the heading', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Fee Accounting System Dashboard')
  })

  it('should render the subtitle', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const subtitle = wrapper.find('.dashboard-subtitle')
    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('Search, add and manage routing slips')
  })

  it('should render the Add New Routing Slip button', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Add New Routing Slip')
  })

  it('should navigate to create-routing-slip when button is clicked', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const button = wrapper.find('button')
    await button.trigger('click')

    expect(mockNavigateTo).toHaveBeenCalledWith('/create-routing-slip')
  })

  it('should render Search component', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const search = wrapper.find('[data-testid="search"]')
    expect(search.exists()).toBe(true)
  })

  it('should render DailyReport component', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const dailyReport = wrapper.find('[data-testid="daily-report"]')
    expect(dailyReport.exists()).toBe(true)
  })

  it('should set page title', async () => {
    await mountSuspended(Home, mountOptions)
    expect(mockT).toHaveBeenCalledWith('page.dashboard.title')
  })

  it('should have correct layout classes', async () => {
    const wrapper = await mountSuspended(Home, mountOptions)
    const container = wrapper.find('.dashboard-container')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('flex-col')
  })
})
