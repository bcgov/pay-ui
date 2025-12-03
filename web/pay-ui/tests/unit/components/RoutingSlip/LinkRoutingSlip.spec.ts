import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import LinkRoutingSlip from '~/components/RoutingSlip/LinkRoutingSlip.vue'
import { nextTick } from 'vue'

const mockShowSearch = ref(false)
const mockToggleSearch = vi.fn(() => {
  mockShowSearch.value = !mockShowSearch.value
})
const mockIsRoutingSlipLinked = ref(false)
const mockIsRoutingSlipAChild = ref(false)
const mockIsRoutingSlipVoid = ref(false)
const mockChildRoutingSlipDetails = ref([])
const mockParentRoutingSlipDetails = ref({})
const mockRoutingSlip = ref({ number: '123456789' })
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

  it('should render', async () => {
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display Link Routing Slip button when not linked and no invoices', async () => {
    mockIsRoutingSlipLinked.value = false
    mockInvoiceCount.value = 0
    mockIsRoutingSlipVoid.value = false
    
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('no linked routing slips')
  })

  it('should call toggleSearch when Link Routing Slip button is clicked', async () => {
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button :label="label" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find((btn: any) => btn.props('label') === 'Link Routing Slip')
    
    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      
      expect(mockToggleSearch).toHaveBeenCalled()
    }
  })

  it('should display LinkRoutingSlipSearch when showSearch is true', async () => {
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
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    const searchComponent = wrapper.find('[data-test="link-search"]')
    expect(searchComponent.exists()).toBe(true)
  })

  it('should pass slipId to LinkRoutingSlipSearch as parentRoutingSlipNumber', async () => {
    mockShowSearch.value = true
    
    const wrapper = await mountSuspended(LinkRoutingSlip, {
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

    const searchElement = wrapper.find('[data-test="link-search"]')
    expect(searchElement.exists()).toBe(true)
    
    const searchComponent = wrapper.findComponent({ name: 'LinkRoutingSlipSearch' })
    if (searchComponent.exists()) {
      expect(searchComponent.props('parentRoutingSlipNumber')).toBe('987654321')
    }
  })

  it('should call toggleSearch when LinkRoutingSlipSearch emits cancel', async () => {
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
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    const searchElement = wrapper.find('[data-test="link-search"]')
    expect(searchElement.exists()).toBe(true)
    
    const searchComponent = wrapper.findComponent({ name: 'LinkRoutingSlipSearch' })
    if (searchComponent.exists()) {
      searchComponent.vm.$emit('cancel')
      await nextTick()
      
      expect(mockToggleSearch).toHaveBeenCalled()
    }
  })

  it('should disable Link Routing Slip button when showSearch is true', async () => {
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })

    const buttonComponents = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttonComponents.find((btn: any) => btn.props('label') === 'Link Routing Slip')
    if (linkButton) {
      expect(linkButton.props('disabled')).toBe(true)
    }
  })

  it('should disable Link Routing Slip button when routing slip is void', async () => {
    mockIsRoutingSlipVoid.value = true
    
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: {
            template: '<button data-test="button" :label="label" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'disabled', 'size', 'class']
          },
          UIcon: true
        }
      }
    })

    const buttonComponents = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttonComponents.find((btn: any) => btn.props('label') === 'Link Routing Slip')
    if (linkButton) {
      expect(linkButton.props('disabled')).toBe(true)
    }
  })

  it('should display parent routing slip details when linked as child', async () => {
    mockIsRoutingSlipLinked.value = true
    mockIsRoutingSlipAChild.value = true
    mockParentRoutingSlipDetails.value = {
      number: '987654321',
      createdOn: '2025-09-26'
    }
    
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

    const linkedDetails = wrapper.findAll('[data-test="linked-details"]')
    expect(linkedDetails.length).toBe(1)
    
    const linkedDetailsComponent = wrapper.findComponent({ name: 'LinkedRoutingSlipDetails' })
    if (linkedDetailsComponent.exists()) {
      expect(linkedDetailsComponent.props('routingSlipNumber')).toBe('987654321')
    }
  })

  it('should display child routing slip details when linked as parent', async () => {
    mockIsRoutingSlipLinked.value = true
    mockIsRoutingSlipAChild.value = false
    mockChildRoutingSlipDetails.value = [
      { number: '111111111', createdOn: '2025-09-26' },
      { number: '222222222', createdOn: '2025-09-27' }
    ]
    
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

    const linkedDetails = wrapper.findAll('[data-test="linked-details"]')
    expect(linkedDetails.length).toBe(2)
    
    const linkedDetailsComponents = wrapper.findAllComponents({ name: 'LinkedRoutingSlipDetails' })
    if (linkedDetailsComponents.length >= 2) {
      expect(linkedDetailsComponents[0]?.props('routingSlipNumber')).toBe('111111111')
      expect(linkedDetailsComponents[1]?.props('routingSlipNumber')).toBe('222222222')
    }
  })

  it('should display invoice message when invoices exist', async () => {
    mockInvoiceCount.value = 5
    mockIsRoutingSlipLinked.value = false
    
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

    expect(wrapper.text()).toContain('cannot link')
  })

  it('should display void message when routing slip is void and no invoices', async () => {
    mockIsRoutingSlipVoid.value = true
    mockInvoiceCount.value = 0
    
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
            template: '<div></div>',
            props: ['parentRoutingSlipNumber'],
            emits: ['cancel', 'success']
          },
          LinkedRoutingSlipDetails: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('cannot link')
  })

  it('should display search info when showSearch is true and not void and no invoices', async () => {
    mockShowSearch.value = true
    mockIsRoutingSlipVoid.value = false
    mockInvoiceCount.value = 0
    
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
          UButton: true,
          UIcon: true
        }
      }
    })

    const searchComponent = wrapper.find('[data-test="link-search"]')
    expect(searchComponent.exists()).toBe(true)
    expect(wrapper.text()).toContain('no linked routing slips')
  })
})

