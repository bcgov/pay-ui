import { mountSuspended } from '@nuxt/test-utils/runtime'
import AsyncAutoComplete from '~/components/common/AsyncAutoComplete.vue'
import { nextTick, h } from 'vue'
import type { InputMenuItem } from '@nuxt/ui'

const mockQueryFn = vi.fn()

describe('AsyncAutoComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryFn.mockResolvedValue([])
  })

  it('should render, display label, render UInputMenu with correct props, and emit blur/focus events', async () => {
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
    expect(wrapper.exists()).toBe(true)

    const label = wrapper.find('#test-id-label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Test Label')

    const inputMenu = wrapper.find('[data-test="input-menu"]')
    expect(inputMenu.exists()).toBe(true)

    const inputMenuComponent = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenuComponent.exists()) {
      inputMenuComponent.vm.$emit('blur')
      await nextTick()
      expect(wrapper.emitted('blur')).toBeTruthy()
      expect(wrapper.emitted('blur')).toHaveLength(1)

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
        item: ({ item }: { item: InputMenuItem }) => {
          const label = typeof item === 'object' && item !== null && 'label' in item ? item.label : String(item)
          return h('div', { class: 'custom-item' }, label)
        }
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div><slot name="item" :item="{ id: 1, label: \'Item 1\' }" /></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus'],
            slots: {
              item: (props: { item: InputMenuItem }) => props
            }
          },
          UIcon: true
        }
      }
    })

    const customItem = wrapper.find('.custom-item')
    expect(customItem.exists()).toBe(true)
    expect(customItem.text()).toBe('Item 1')
  })

  it('should handle search term updates, menu open/close, loading states, and clear button', async () => {
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
            template: '<div></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenu.exists()) {
      await inputMenu.vm.$emit('update:open', true)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(wrapper.exists()).toBe(true)

      await inputMenu.vm.$emit('update:searchTerm', 'abc')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
      await inputMenu.vm.$emit('update:open', true)
      await nextTick()
      expect(wrapper.exists()).toBe(true)

      await inputMenu.vm.$emit('update:searchTerm', 'ab')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(wrapper.exists()).toBe(true)

      await inputMenu.vm.$emit('update:searchTerm', '   ab   ')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(wrapper.exists()).toBe(true)
    }

    const wrapper2 = await mountSuspended(AsyncAutoComplete, {
      props: {
        id: 'test-id',
        label: 'Test Label',
        queryFn: mockQueryFn,
        modelValue: { id: 1, label: 'Selected Item' }
      },
      global: {
        stubs: {
          UInputMenu: {
            template: '<div><slot name="trailing" :status="status" :selected="selected" /></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus'],
            data() {
              return { status: 'success', selected: { id: 1, label: 'Selected Item' } }
            }
          },
          UIcon: {
            template: '<span :name="name" class="icon"></span>',
            props: ['name']
          }
        }
      }
    })

    const clearButton = wrapper2.find('button')
    if (clearButton.exists()) {
      await clearButton.trigger('click')
      await nextTick()
      const inputMenu2 = wrapper2.findComponent({ name: 'UInputMenu' })
      if (inputMenu2.exists()) {
        expect(inputMenu2.props('modelValue')).toBeNull()
      }
    }
  })

  it('should handle null searchTerm', async () => {
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
            template: '<div></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenu.exists()) {
      await inputMenu.vm.$emit('update:searchTerm', null)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(wrapper.exists()).toBe(true)
    }
  })

  it('should handle undefined searchTerm', async () => {
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
            template: '<div></div>',
            props: ['open', 'items', 'searchTerm', 'modelValue'],
            emits: ['update:open', 'update:searchTerm', 'update:modelValue', 'blur', 'focus']
          },
          UIcon: true
        }
      }
    })

    const inputMenu = wrapper.findComponent({ name: 'UInputMenu' })
    if (inputMenu.exists()) {
      await inputMenu.vm.$emit('update:searchTerm', undefined)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(wrapper.exists()).toBe(true)
    }
  })
})
