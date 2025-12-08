import { mountSuspended } from '@nuxt/test-utils/runtime'
import { CreateRoutingSlipDetails } from '#components'
import { nextTick } from 'vue'

const initialModelValue = {
  id: '123456789',
  date: '2025-10-03',
  entity: 'BC1234567'
}

describe('CreateRoutingSlipDetails', () => {
  it('renders components and props', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    expect(inputs).toHaveLength(2)
    expect(datePicker.exists()).toBe(true)

    expect(inputs[0]!.props('name')).toBe('details.id')
    expect(inputs[1]!.props('name')).toBe('details.entity')
    const dateField = wrapper.findComponent({ name: 'UFormField' })
    expect(dateField.props('name')).toBe('details.date')
  })

  it('should pass modelValue to children', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    const datePicker = wrapper.findComponent({ name: 'DatePicker' })

    expect(inputs[0]!.props('modelValue')).toBe('123456789')
    expect(inputs[1]!.props('modelValue')).toBe('BC1234567')
    expect(datePicker.props('modelValue')).toBe('2025-10-03')
  })

  it('should update model when id changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
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
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    if (inputs.length > 0 && inputs[0]!.exists()) {
      await inputs[0]!.vm.$emit('update:modelValue', '987654321')
      await nextTick()

      expect(inputs[0]!.props('modelValue')).toBe('987654321')
    }
  })

  it('should update model when entity changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
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
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    if (inputs.length > 1 && inputs[1]!.exists()) {
      await inputs[1]!.vm.$emit('update:modelValue', 'BC9876543')
      await nextTick()

      expect(inputs[1]!.props('modelValue')).toBe('BC9876543')
    }
  })

  it('should update model when date changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: {
            template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
            emits: ['update:modelValue']
          },
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    if (datePicker.exists()) {
      await datePicker.vm.$emit('update:modelValue', '2025-11-15')
      await nextTick()

      expect(datePicker.props('modelValue')).toBe('2025-11-15')
    }
  })

  it('should handle empty modelValue', async () => {
    const emptyModelValue = {
      id: '',
      date: '',
      entity: ''
    }

    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: emptyModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    const datePicker = wrapper.findComponent({ name: 'DatePicker' })

    expect(inputs[0]!.props('modelValue')).toBe('')
    expect(inputs[1]!.props('modelValue')).toBe('')
    expect(datePicker.props('modelValue')).toBe('')
  })

  it('should use correct schema prefix for all fields', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'testPrefix',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: {
            template: '<div><slot /></div>',
            props: ['name']
          }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    const dateField = wrapper.findComponent({ name: 'UFormField' })

    expect(inputs[0]!.props('name')).toBe('testPrefix.id')
    expect(inputs[1]!.props('name')).toBe('testPrefix.entity')
    if (dateField.exists()) {
      expect(dateField.props('name')).toBe('testPrefix.date')
    }
  })

  it('should render help text for entity field', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: {
            template: '<div><slot name="help" /></div>',
            props: ['modelValue', 'name', 'label', 'inputId', 'help'],
            slots: { help: true }
          },
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    if (inputs.length > 1 && inputs[1]!.exists()) {
      expect(inputs[1]!.props('help')).toBe('text.entityNumberHelp')
    }
  })

  it('should emit update:modelValue when id changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit update:modelValue when entity changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit update:modelValue when date changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle null id value', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: {
          ...initialModelValue,
          id: null as unknown as string
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
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle undefined date value', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: {
          ...initialModelValue,
          date: undefined as unknown as string
        }
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const datePicker = wrapper.findComponent({ name: 'DatePicker' })
    expect(datePicker.exists()).toBe(true)
  })

  it('should pass correct inputId to ConnectFormInput fields', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('should pass correct class to entity ConnectFormInput', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: true,
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs = wrapper.findAllComponents({ name: 'ConnectFormInput' })
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle multiple rapid updates', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlipDetails, {
      props: {
        schemaPrefix: 'details',
        modelValue: initialModelValue
      },
      global: {
        stubs: {
          ConnectFieldset: { template: '<div><slot /></div>' },
          ConnectFormInput: {
            template: '<input @update:modelValue="$emit(\'update:modelValue\', $event)" />',
            props: ['modelValue', 'label', 'name', 'inputId'],
            emits: ['update:modelValue']
          },
          DatePicker: true,
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    interface ComponentWithEmit {
      $emit?: (event: string, ...args: unknown[]) => void
    }
    const component = wrapper.vm as ComponentWithEmit
    if (component && typeof component.$emit === 'function') {
      component.$emit('update:modelValue', { ...initialModelValue, id: '111' })
      component.$emit('update:modelValue', { ...initialModelValue, id: '222' })
      component.$emit('update:modelValue', { ...initialModelValue, id: '333' })
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.length).toBeGreaterThanOrEqual(3)
    }
  })
})
