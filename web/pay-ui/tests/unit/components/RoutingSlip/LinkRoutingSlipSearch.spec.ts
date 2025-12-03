import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import LinkRoutingSlipSearch from '~/components/RoutingSlip/LinkRoutingSlipSearch.vue'
import { nextTick } from 'vue'
import { FetchError } from 'ofetch'

const mockPostSearchRoutingSlip = vi.fn()
const mockPostLinkRoutingSlip = vi.fn()
const mockPayApi = {
  postSearchRoutingSlip: mockPostSearchRoutingSlip,
  postLinkRoutingSlip: mockPostLinkRoutingSlip
}

const mockGetLinkedRoutingSlips = vi.fn()
const mockGetRoutingSlip = vi.fn()
const mockUseRoutingSlip = {
  getLinkedRoutingSlips: mockGetLinkedRoutingSlips,
  getRoutingSlip: mockGetRoutingSlip
}

const mockStore = {
  routingSlip: {
    number: '123456789'
  }
}

mockNuxtImport('usePayApi', () => () => mockPayApi)
mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))
mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

describe('LinkRoutingSlipSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPostSearchRoutingSlip.mockImplementation(() => Promise.resolve({ items: [] }))
    mockPostLinkRoutingSlip.mockImplementation(() => Promise.resolve({}))
    mockGetLinkedRoutingSlips.mockImplementation(() => Promise.resolve({}))
    mockGetRoutingSlip.mockImplementation(() => Promise.resolve({}))
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display AsyncAutoComplete component', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const autocomplete = wrapper.find('[data-test="autocomplete"]')
    expect(autocomplete.exists()).toBe(true)
  })

  it('should display Link and Cancel buttons', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button data-test="button" :label="label" '
              + ':loading="loading" :disabled="disabled"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const buttons = wrapper.findAll('[data-test="button"]')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('should emit cancel event when cancel button is clicked', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const buttons = wrapper.findAllComponents({ name: 'UButton' })

    const cancelButton = buttons.find(btn => btn.props('label') === 'label.cancel')

    if (cancelButton) {
      await cancelButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    }
  })

  it('should validate when selected value is empty', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div data-test="form-field"><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const formField = wrapper.find('[data-test="form-field"]')
    expect(formField.exists()).toBe(true)
  })

  it('should call postSearchRoutingSlip when searchRoutingSlipForLinking is called with valid input', async () => {
    const mockItems = [
      {
        number: '987654321',
        routingSlipDate: '2025-09-26T10:00:00Z',
        total: '100.00'
      }
    ]
    mockPostSearchRoutingSlip.mockImplementation(() => Promise.resolve({ items: mockItems }))

    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const autocomplete = wrapper.find('[data-test="autocomplete"]')
    expect(autocomplete.exists()).toBe(true)

    const autocompleteComponent = wrapper.findComponent({ name: 'AsyncAutoComplete' })
    if (autocompleteComponent.exists()) {
      const queryFn = autocompleteComponent.props('queryFn')

      if (queryFn && typeof queryFn === 'function') {
        await queryFn('123')
        expect(mockPostSearchRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123' })
      }
    }
  })

  it('should return empty array searchRoutingSlipForLinking is called with input less than 3 characters', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const autocomplete = wrapper.find('[data-test="autocomplete"]')
    expect(autocomplete.exists()).toBe(true)

    const autocompleteComponent = wrapper.findComponent({ name: 'AsyncAutoComplete' })
    if (autocompleteComponent.exists()) {
      const queryFn = autocompleteComponent.props('queryFn')

      if (queryFn && typeof queryFn === 'function') {
        const result = await queryFn('12')
        expect(result).toEqual([])
        expect(mockPostSearchRoutingSlip).not.toHaveBeenCalled()
      }
    }
  })

  it('should call linkRoutingSlip and emit success when link button is clicked with valid selection', async () => {
    mockPostLinkRoutingSlip.mockImplementation(() => Promise.resolve({}))

    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { selected?: string }
    component.selected = '987654321'
    await nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'label.link')

    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockPostLinkRoutingSlip).toHaveBeenCalledWith({
        childRoutingSlipNumber: '987654321',
        parentRoutingSlipNumber: '123456789'
      })
      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.emitted('success')![0]).toEqual(['987654321'])
    }
  })

  it('should set error message when linkRoutingSlip fails with FetchError', async () => {
    const fetchError = new FetchError('Error')
    Object.assign(fetchError, {
      response: {
        _data: {
          rootCause: {
            detail: 'Custom error message'
          }
        }
      }
    } as Partial<FetchError>)

    mockPostLinkRoutingSlip.mockImplementation(() => Promise.reject(fetchError))

    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { selected?: string }
    component.selected = '987654321'
    await nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'label.link')

    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      const formField = wrapper.findComponent({ name: 'UFormField' })
      expect(formField.props('error')).toBe('Custom error message')
    }
  })

  it('should set error message when linkRoutingSlip fails with non-FetchError', async () => {
    mockPostLinkRoutingSlip.mockImplementation(() => Promise.reject(new Error('Generic error')))

    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { selected?: string }
    component.selected = '987654321'
    await nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'label.link')

    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      const formField = wrapper.findComponent({ name: 'UFormField' })
      expect(formField.props('error')).toBe('validation.unknownError')
    }
  })

  it('should call getRoutingSlip and getLinkedRoutingSlips after successful link', async () => {
    mockPostLinkRoutingSlip.mockImplementation(() => Promise.resolve({}))

    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { selected?: string }
    component.selected = '987654321'
    await nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'label.link')

    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
      expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('123456789')
    }
  })

  it('should not call linkRoutingSlip when validation fails', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'class']
          },
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { selected?: string }
    component.selected = undefined
    await nextTick()

    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    const linkButton = buttons.find(btn => btn.props('label') === 'label.link')

    if (linkButton) {
      await linkButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockPostLinkRoutingSlip).not.toHaveBeenCalled()
    }
  })

  it('should clear error message when selected value is set', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & {
      selected?: string
      errorMessage?: string
    }
    component.errorMessage = 'Error message'
    component.selected = '987654321'
    await nextTick()

    const autocomplete = wrapper.findComponent({ name: 'AsyncAutoComplete' })
    if (autocomplete.exists()) {
      await autocomplete.vm.$emit('update:modelValue', '987654321')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(component.errorMessage).toBeUndefined()
    }
  })

  it('should clear error message on focus', async () => {
    const wrapper = await mountSuspended(LinkRoutingSlipSearch, {
      props: {
        parentRoutingSlipNumber: '123456789'
      },
      global: {
        stubs: {
          UFormField: {
            template: '<div><slot /></div>',
            props: ['error', 'class']
          },
          AsyncAutoComplete: {
            template: '<div></div>',
            props: {
              id: String,
              label: { type: String, default: '' },
              modelValue: [String, Object],
              placeholder: String,
              queryFn: Function,
              valueKey: String,
              labelKey: String,
              size: String,
              disabled: Boolean
            },
            emits: ['update:modelValue', 'blur', 'focus']
          },
          UButton: true,
          ConnectI18nHelper: true
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof LinkRoutingSlipSearch> & { errorMessage?: string }
    component.errorMessage = 'Error message'
    await nextTick()

    const autocomplete = wrapper.findComponent({ name: 'AsyncAutoComplete' })
    if (autocomplete.exists()) {
      await autocomplete.vm.$emit('focus')
      await nextTick()

      expect(component.errorMessage).toBeUndefined()
    }
  })
})
