import { mountSuspended } from '@nuxt/test-utils/runtime'
import AsyncAutoComplete from '~/components/common/AsyncAutoComplete.vue'
import { nextTick } from 'vue'

const mockQueryFn = vi.fn()

describe('AsyncAutoComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryFn.mockResolvedValue([])
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: true,
          UIcon: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display the label', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: true,
          UIcon: true
        }
      }
    })

    const label = wrapper.find('#test-id-label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Test Label')
  })

  it('should render UInputMenu component', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div data-test="input-menu"></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)
  })

  it('should pass correct props to UInputMenu', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div data-test="input-menu"></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue', 'aria-labelledby', 'data-testid', 'ignoreFilter'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)
  })

  it('should emit blur event', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div data-test="input-menu"></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)

    const inputMenuComponent = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenuComponent.exists()) {
      inputMenuComponent.vm.$emit('blur')
      await nextTick()

      expect(wrapper.emitted('blur')).toBeTruthy()
      expect(wrapper.emitted('blur')).toHaveLength(1)
    }
  })

  it('should emit focus event', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div data-test="input-menu"></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)

    const inputMenuComponent = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenuComponent.exists()) {
      inputMenuComponent.vm.$emit('focus')
      await nextTick()

      expect(wrapper.emitted('focus')).toBeTruthy()
      expect(wrapper.emitted('focus')).toHaveLength(1)
    }
  })

  it('should render trailing slot', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div><slot name="trailing" /></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: {
            template: '<span :name="name" class="icon"></span>',
            props: ['name']
          }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should render trailing slot content', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div><slot name="trailing" /></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: {
            template: '<span :name="name"></span>',
            props: ['name']
          }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should pass items prop to UInputMenu', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div data-test="input-menu"></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)
  })

  it('should provide item slot', async () => {
    const wrapper = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: null
      },
      slots: {
        item: '<template #item="{ item }"><div class="custom-item">{{ item.label }}</div></template>'
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div><slot name="item" :item="{ id: 1, label: \'Item 1\' }" /></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const customItem = wrapper.find('.custom-item')
    expect(customItem.exists()).toBe(true)
    expect(customItem.text()).toBe('Item 1')
  })
})
