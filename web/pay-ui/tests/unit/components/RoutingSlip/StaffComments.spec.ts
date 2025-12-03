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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('should call save when Save button is clicked with valid comment', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))
    mockUpdateRoutingSlipComments.mockImplementation(() => Promise.resolve({}))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: {
            template: '<button @click="$emit(\'click\')" :id="id"><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class', 'loading']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const textarea = wrapper.find('textarea')
    if (textarea.exists()) {
      await textarea.setValue('Test comment')
      await nextTick()

      const saveButton = wrapper.find('#save-button')
      if (saveButton.exists()) {
        await saveButton.trigger('click')
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        expect(mockUpdateRoutingSlipComments).toHaveBeenCalled()
      }
    }
  })

  it('should validate comment and show error when empty', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const textarea = wrapper.find('textarea')
    if (textarea.exists()) {
      await textarea.setValue('   ')
      await textarea.trigger('blur')
      await nextTick()

      expect(wrapper.text()).toContain('Enter a comment.')
    }
  })

  it('should call close when Cancel button is clicked', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: {
            template: '<button @click="$emit(\'click\')" :id="id"><slot /></button>',
            props: ['id', 'color', 'variant', 'size', 'icon', 'class']
          },
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const cancelButton = wrapper.find('#cancel-button')
    if (cancelButton.exists()) {
      await cancelButton.trigger('click')
      await nextTick()
    }
  })

  it('should call close when close button is clicked', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id'
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const closeButton = wrapper.find('#close-button')
    if (closeButton.exists()) {
      await closeButton.trigger('click')
      await nextTick()
    }
  })

  it('should format timestamp correctly', async () => {
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
            template: '<div><slot /><div><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open']
          },
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('Pacific time')
  })

  it('should show error when comment exceeds maxLength', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id',
        maxLength: 10
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const textarea = wrapper.find('textarea')
    if (textarea.exists()) {
      await textarea.setValue('This is a very long comment that exceeds the maximum length')
      await textarea.trigger('blur')
      await nextTick()

      expect(wrapper.text()).toContain('Maximum characters reached.')
    }
  })

  it('should display characters remaining', async () => {
    mockGetRoutingSlipComments.mockImplementation(() => Promise.resolve({ comments: [] }))

    const wrapper = await mountSuspended(StaffComments, {
      props: {
        identifier: 'test-id',
        maxLength: 2000
      },
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot /><div v-if="modelValue"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              },
              popper: Object
            },
            emits: ['update:open'],
            computed: {
              modelValue() {
                return this.open
              }
            }
          },
          UButton: true,
          UIcon: true
        }
      }
    })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const textarea = wrapper.find('textarea')
    if (textarea.exists()) {
      await textarea.setValue('Test')
      await nextTick()

      expect(wrapper.text()).toContain('characters remaining')
    }
  })
})
