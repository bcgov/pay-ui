import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import StaffComments from '~/components/RoutingSlip/StaffComments.vue'
import { nextTick } from 'vue'

const mockGetRoutingSlipComments = vi.fn()
const mockUpdateRoutingSlipComments = vi.fn()
const mockPayApi = {
  getRoutingSlipComments: mockGetRoutingSlipComments,
  updateRoutingSlipComments: mockUpdateRoutingSlipComments
}

const mockOpenErrorDialog = vi.fn()
const mockPayModals = {
  openErrorDialog: mockOpenErrorDialog
}

mockNuxtImport('usePayApi', () => () => mockPayApi)
mockNuxtImport('usePayModals', () => () => mockPayModals)
mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

describe('StaffComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))
    mockUpdateRoutingSlipComments.mockImplementation(() => Promise.resolve({}))
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display comment count button', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))
    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /></div>',
            props: ['open', 'popper']
          },
          UButton: {
            template: '<button :id="id"><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('#comments-button').exists()).toBe(true)
  })

  it('should call getRoutingSlipComments on mount', async () => {
    mockGetRoutingSlipComments.mockResolvedValue({ comments: [] })

    await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockGetRoutingSlipComments).toHaveBeenCalledWith('test-id')
  })

  it('should display "1 Comment" when there is one comment', async () => {
    const comments = [
      {
        comment: {
          comment: 'Test comment',
          timestamp: '2025-09-26T10:00:00Z',
          submitterDisplayName: 'Test User'
        }
      }
    ]
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /></div>',
            props: ['open', 'popper']
          },
          UButton: {
            template: '<button><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('1 Comment')
  })

  it('should display "X Comments" when there are multiple comments', async () => {
    const comments = [
      {
        comment: {
          comment: 'Comment 1',
          timestamp: '2025-09-26T10:00:00Z',
          submitterDisplayName: 'User 1'
        }
      },
      {
        comment: {
          comment: 'Comment 2',
          timestamp: '2025-09-27T10:00:00Z',
          submitterDisplayName: 'User 2'
        }
      }
    ]
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /></div>',
            props: ['open', 'popper']
          },
          UButton: {
            template: '<button><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('2 Comments')
  })

  it('should expose fetchStaffComments method', async () => {
    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const exposed = wrapper.vm as any
    expect(exposed.fetchStaffComments).toBeDefined()
    expect(typeof exposed.fetchStaffComments).toBe('function')
  })

  it('should handle empty comments array', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /></div>',
            props: ['open', 'popper']
          },
          UButton: {
            template: '<button><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('0 Comments')
  })

  it('should handle API error when fetching comments', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetRoutingSlipComments.mockRejectedValue(new Error('API Error'))

    await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})

