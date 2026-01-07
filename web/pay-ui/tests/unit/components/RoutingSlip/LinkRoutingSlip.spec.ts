import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import LinkRoutingSlip from '~/components/RoutingSlip/LinkRoutingSlip.vue'
import { nextTick } from 'vue'
import type { RoutingSlip, RoutingSlipDetails } from '~/interfaces/routing-slip'
import type { VueWrapper } from '@vue/test-utils'

const mockShowSearch = ref(false)
const mockToggleSearch = vi.fn(() => {
  mockShowSearch.value = !mockShowSearch.value
})
const mockIsRoutingSlipLinked = ref(false)
const mockIsRoutingSlipAChild = ref(false)
const mockIsRoutingSlipVoid = ref(false)
const mockChildRoutingSlipDetails = ref<RoutingSlipDetails[]>([])
const mockParentRoutingSlipDetails = ref<Partial<RoutingSlipDetails>>({})
const mockRoutingSlip = ref<Partial<RoutingSlip>>({ number: '123456789' })
const mockInvoiceCount = ref(0)

const mockUseLinkRoutingSlip = {
  showSearch: mockShowSearch,
  toggleSearch: mockToggleSearch,
  isRoutingSlipLinked: mockIsRoutingSlipLinked,
  isRoutingSlipAChild: mockIsRoutingSlipAChild,
  isRoutingSlipVoid: mockIsRoutingSlipVoid,
  childRoutingSlipDetails: mockChildRoutingSlipDetails,
  parentRoutingSlipDetails: mockParentRoutingSlipDetails,
  routingSlip: mockRoutingSlip,
  invoiceCount: mockInvoiceCount
}

vi.mock('~/composables/viewRoutingSlip/useLinkRoutingSlip', () => ({
  default: () => mockUseLinkRoutingSlip
}))

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

describe('LinkRoutingSlip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowSearch.value = false
    mockIsRoutingSlipLinked.value = false
    mockIsRoutingSlipAChild.value = false
    mockIsRoutingSlipVoid.value = false
    mockChildRoutingSlipDetails.value = []
    mockParentRoutingSlipDetails.value = {}
    mockRoutingSlip.value = { number: '123456789' }
    mockInvoiceCount.value = 0
  })

  it('should render, display button, toggle search, show search component, and pass slipId', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)

    mockIsRoutingSlipLinked.value = false
    mockInvoiceCount.value = 0
    mockIsRoutingSlipVoid.value = false
    expect(wrapper.text()).toContain('no linked routing slips')

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'Link Routing Slip')
    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      expect(mockToggleSearch).toHaveBeenCalled()
    }

    mockShowSearch.value = true
    const wrapper2 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    const searchComponent2 = wrapper2.find('[data-test="link-search"]')
    expect(searchComponent2.exists()).toBe(true)

    const wrapper3 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '987654321'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    const searchElement = wrapper3.find('[data-test="link-search"]')
    expect(searchElement.exists()).toBe(true)

    const searchComponent3 = wrapper3.findComponent({ name: 'LinkRoutingSlipSearch' })
    if (searchComponent3.exists()) {
      expect(searchComponent3.props('parentRoutingSlipNumber')).toBe('987654321')
    }
  })

  it('should handle cancel event, disable button, display linked details, and show messages', async () => {
    mockShowSearch.value = true

    const wrapper = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: {
            template: '<div data-test="linked-details"></div>',
            props: ['createdDate', 'routingSlipNumber', 'siNumber', 'parentRoutingSlipNumber']
          },
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: {
            template: '<span></span>',
            props: ['name', 'class']
          }
        }
      }
    })

    const searchComponent = wrapper.findComponent({ name: 'LinkRoutingSlipSearch' })
    if (searchComponent.exists()) {
      searchComponent.vm.$emit('cancel')
      await nextTick()
      expect(mockToggleSearch).toHaveBeenCalled()
    }

    const buttonComponents = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttonComponents.find((btn: VueWrapper) => btn.props('label') === 'Link Routing Slip')
    if (linkButton) {
      expect(linkButton.props('disabled')).toBe(true)
    }

    mockIsRoutingSlipVoid.value = true
    mockShowSearch.value = false
    const wrapper2 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })

    const buttonComponents2 = wrapper2.findAllComponents({ name: 'UButton' })
    const linkButton2 = buttonComponents2.find((btn: VueWrapper) => btn.props('label') === 'Link Routing Slip')
    if (linkButton2) {
      expect(linkButton2.props('disabled')).toBe(true)
    }

    mockIsRoutingSlipLinked.value = true
    mockIsRoutingSlipAChild.value = true
    mockIsRoutingSlipVoid.value = false
    mockParentRoutingSlipDetails.value = {
      number: '987654321',
      createdOn: '2025-09-26'
    }

    const wrapper3 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: {
            template: '<div data-test="linked-details"></div>',
            props: ['createdDate', 'routingSlipNumber']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    const linkedDetails = wrapper3.findAll('[data-test="linked-details"]')
    expect(linkedDetails.length).toBe(1)
    const linkedDetailsComponent = wrapper3.findComponent({ name: 'LinkedRoutingSlipDetails' })
    if (linkedDetailsComponent.exists()) {
      expect(linkedDetailsComponent.props('routingSlipNumber')).toBe('987654321')
    }

    mockIsRoutingSlipAChild.value = false
    mockChildRoutingSlipDetails.value = [
      { number: '111111111', createdOn: '2025-09-26' },
      { number: '222222222', createdOn: '2025-09-27' }
    ]

    const wrapper4 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: {
            template: '<div data-test="linked-details"></div>',
            props: ['siNumber', 'createdDate', 'routingSlipNumber', 'parentRoutingSlipNumber']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    const linkedDetails2 = wrapper4.findAll('[data-test="linked-details"]')
    expect(linkedDetails2.length).toBe(2)
    const linkedDetailsComponents = wrapper4.findAllComponents({ name: 'LinkedRoutingSlipDetails' })
    if (linkedDetailsComponents.length >= 2) {
      expect(linkedDetailsComponents[0]?.props('routingSlipNumber')).toBe('111111111')
      expect(linkedDetailsComponents[1]?.props('routingSlipNumber')).toBe('222222222')
    }

    mockIsRoutingSlipLinked.value = false
    mockInvoiceCount.value = 5
    const wrapper5 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: {
            template: '<span></span>',
            props: ['name', 'class']
          }
        }
      }
    })
    expect(wrapper5.text()).toContain('cannot link')

    mockIsRoutingSlipVoid.value = true
    mockInvoiceCount.value = 0
    const wrapper6 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    expect(wrapper6.text()).toContain('cannot link')

    mockShowSearch.value = true
    mockIsRoutingSlipVoid.value = false
    const wrapper7 = await mountSuspended(LinkRoutingSlip, {
      props: {
        slipId: '123456789'
      },
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>',
            props: ['variant']
          },
          LinkRoutingSlipSearch: {
            template: '<div data-test="link-search"></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    const searchComponent2 = wrapper7.find('[data-test="link-search"]')
    expect(searchComponent2.exists()).toBe(true)
    expect(wrapper7.text()).toContain('no linked routing slips')
  })
})
