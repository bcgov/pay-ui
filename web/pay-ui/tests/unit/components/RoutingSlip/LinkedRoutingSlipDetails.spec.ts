import { mountSuspended } from '@nuxt/test-utils/runtime'
import LinkedRoutingSlipDetails from '~/components/RoutingSlip/LinkedRoutingSlipDetails.vue'

const { mockFormatDisplayDate } = vi.hoisted(() => {
  const mockFormatDisplayDate = vi.fn((date: Date | string) => {
    if (!date) {
      return ''
    }
    return new Date(date).toLocaleDateString()
  })
  return { mockFormatDisplayDate }
})

vi.mock('~/utils/common-util', () => ({
  default: {
    formatDisplayDate: mockFormatDisplayDate
  }
}))

describe('LinkedRoutingSlipDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails)
    expect(wrapper.exists()).toBe(true)
  })

  it('should render routing slip number', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        routingSlipNumber: '123456',
        createdDate: '2025-01-01'
      }
    })
    expect(wrapper.text()).toContain('123456')
  })

  it('should render created date', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        routingSlipNumber: '123456',
        createdDate: '2025-01-01'
      }
    })
    expect(mockFormatDisplayDate).toHaveBeenCalledWith('2025-01-01')
    expect(wrapper.text()).toContain('Routing slip created date')
  })

  it('should render SI number when provided', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        siNumber: 1,
        routingSlipNumber: '123456',
        createdDate: '2025-01-01'
      }
    })
    expect(wrapper.text()).toContain('1.')
  })

  it('should not render SI number when not provided', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        routingSlipNumber: '123456',
        createdDate: '2025-01-01'
      }
    })
    expect(wrapper.text()).not.toContain('.')
  })

  it('should generate correct link when parentRoutingSlipNumber is provided', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        routingSlipNumber: '123456',
        parentRoutingSlipNumber: '789012',
        createdDate: '2025-01-01'
      }
    })
    const link = wrapper.findComponent({ name: 'NuxtLink' })
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/view-routing-slip/789012/123456')
  })

  it('should generate correct link when parentRoutingSlipNumber is not provided', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails, {
      props: {
        routingSlipNumber: '123456',
        createdDate: '2025-01-01'
      }
    })
    const link = wrapper.findComponent({ name: 'NuxtLink' })
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/view-routing-slip/123456')
  })

  it('should use default props when not provided', async () => {
    const wrapper = await mountSuspended(LinkedRoutingSlipDetails)
    expect(wrapper.exists()).toBe(true)
  })
})
