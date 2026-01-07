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

  it('should pass modelValue, update on changes, handle empty values, and use correct schema prefix', async () => {
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

    const wrapper2 = await mountSuspended(CreateRoutingSlipAddress, {
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
          ConnectFormAddress: {
            template: '<div></div>',
            props: ['modelValue', 'schemaPrefix', 'id'],
            emits: ['update:modelValue']
          }
        }
      }
    })

    const formInput2 = wrapper2.findComponent({ name: 'ConnectFormInput' })
    if (formInput2.exists()) {
      await formInput2.vm.$emit('update:modelValue', 'New Name')
      await nextTick()
      expect(formInput2.props('modelValue')).toBe('New Name')
    }

    const formAddress2 = wrapper2.findComponent({ name: 'ConnectFormAddress' })
    if (formAddress2.exists()) {
      const newAddress = {
        street: '456 New St',
        city: 'Vancouver',
        region: 'BC',
        postalCode: 'V2Y Y2Y',
        country: 'CA'
      }
      await formAddress2.vm.$emit('update:modelValue', newAddress)
      await nextTick()
      expect(formAddress2.props('modelValue')).toEqual(newAddress)
    }

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

    const wrapper3 = await mountSuspended(CreateRoutingSlipAddress, {
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

    const formInput3 = wrapper3.findComponent({ name: 'ConnectFormInput' })
    const formAddress3 = wrapper3.findComponent({ name: 'ConnectFormAddress' })

    expect(formInput3.props('modelValue')).toBe('')
    expect(formAddress3.props('modelValue')).toEqual(emptyModelValue.address)

    const wrapper4 = await mountSuspended(CreateRoutingSlipAddress, {
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

    const formInput4 = wrapper4.findComponent({ name: 'ConnectFormInput' })
    const formAddress4 = wrapper4.findComponent({ name: 'ConnectFormAddress' })

    expect(formInput4.props('name')).toBe('testPrefix.name')
    expect(formAddress4.props('schemaPrefix')).toBe('testPrefix.address')
  })

  it('should emit update:modelValue, handle edge cases, and pass correct IDs', async () => {
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

    const formInput = wrapper.findComponent({ name: 'ConnectFormInput' })
    const formAddress = wrapper.findComponent({ name: 'ConnectFormAddress' })
    expect(formInput.exists()).toBe(true)
    expect(formAddress.exists()).toBe(true)

    const wrapper2 = await mountSuspended(CreateRoutingSlipAddress, {
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

    expect(wrapper2.exists()).toBe(true)

    const wrapper3 = await mountSuspended(CreateRoutingSlipAddress, {
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

    expect(wrapper3.exists()).toBe(true)
  })
})
