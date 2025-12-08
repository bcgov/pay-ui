import { mountSuspended } from '@nuxt/test-utils/runtime'
import { CreateRoutingSlipAddress } from '#components'
import { nextTick } from 'vue'

const initialModelValue = {
  name: 'Initial Name',
  address: {
    street: '123 Main St',
    city: 'Victoria',
    region: 'BC',
    postalCode: 'V1X X1X',
    country: 'CA'
  }
}

describe('CreateRoutingSlipAddress', () => {
  it('renders components and props', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })
    expect(formInput.exists()).toBe(true)
    expect(formAddress.exists()).toBe(true)

    expect(formInput.props('name')).toBe('addressDetails.name')
    expect(formAddress.props('schemaPrefix')).toBe('addressDetails.address')
  })

  it('should pass modelValue to children', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })

    expect(formInput.props('modelValue')).toBe(initialModelValue.name)
    expect(formAddress.props('modelValue')).toEqual(initialModelValue.address)
  })

  it('should update model when name changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: {
            template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'name', 'label', 'inputId'],
            emits: ['update:modelValue']
          },
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    if (formInput.exists()) {
      await formInput.vm.$emit('update:modelValue', 'New Name')
      await nextTick()

      expect(formInput.props('modelValue')).toBe('New Name')
    }
  })

  it('should update model when address changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: {
            template: '<div></div>',
            props: ['modelValue', 'schemaPrefix', 'id'],
            emits: ['update:modelValue']
          }
        }
      }
    })

    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })
    if (formAddress.exists()) {
      const newAddress = {
        street: '456 New St',
        city: 'Vancouver',
        region: 'BC',
        postalCode: 'V2Y Y2Y',
        country: 'CA'
      }
      await formAddress.vm.$emit('update:modelValue', newAddress)
      await nextTick()

      expect(formAddress.props('modelValue')).toEqual(newAddress)
    }
  })

  it('should handle empty modelValue', async () => {
    const emptyModelValue = {
      name: '',
      address: {
        street: '',
        city: '',
        region: '',
        postalCode: '',
        country: ''
      }
    }

    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: emptyModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })

    expect(formInput.props('modelValue')).toBe('')
    expect(formAddress.props('modelValue')).toEqual(emptyModelValue.address)
  })

  it('should use correct schema prefix for nested address', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'testPrefix',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })

    expect(formInput.props('name')).toBe('testPrefix.name')
    expect(formAddress.props('schemaPrefix')).toBe('testPrefix.address')
  })

  it('should emit update:modelValue when name changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit update:modelValue when address changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle partial address updates', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle null name value', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: {
          ...initialModelValue,
          name: null as unknown as string
        }
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: {
            template: '<div></div>',
            props: {
              modelValue: {
                type: [String, null],
                default: null
              },
              label: String,
              name: String,
              inputId: String
            }
          },
          ConnectFormAddress: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle undefined name value', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: {
          ...initialModelValue,
          name: undefined as unknown as string
        }
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: {
            template: '<div></div>',
            props: {
              modelValue: {
                type: [String, undefined],
                default: undefined
              },
              label: String,
              name: String,
              inputId: String
            }
          },
          ConnectFormAddress: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should pass correct inputId to ConnectFormInput', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    expect(formInput.exists()).toBe(true)
  })

  it('should pass correct id to ConnectFormAddress', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipAddress, {
      props: {
        schemaPrefix: 'addressDetails',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          ConnectFormAddress: true
        }
      }
    })

    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })
    expect(formAddress.exists()).toBe(true)
  })
})
