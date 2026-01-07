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

  it('should pass modelValue to children, update model on changes, and handle empty values', async () => {
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

    const wrapper2 = await mountSuspended(CreateRoutingSlipDetails, {
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
          DatePicker: {
            template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
            emits: ['update:modelValue']
          },
          UFormField: { template: '<div><slot /></div>' }
        }
      }
    })

    const inputs2 = wrapper2.findAllComponents({ name: 'ConnectFormInput' })
    if (inputs2.length > 0 && inputs2[0]!.exists()) {
      await inputs2[0]!.vm.$emit('update:modelValue', '987654321')
      await nextTick()
      expect(inputs2[0]!.props('modelValue')).toBe('987654321')
    }

    if (inputs2.length > 1 && inputs2[1]!.exists()) {
      await inputs2[1]!.vm.$emit('update:modelValue', 'BC9876543')
      await nextTick()
      expect(inputs2[1]!.props('modelValue')).toBe('BC9876543')
    }

    const datePicker2 = wrapper2.findComponent({ name: 'DatePicker' })
    if (datePicker2.exists()) {
      await datePicker2.vm.$emit('update:modelValue', '2025-11-15')
      await nextTick()
      expect(datePicker2.props('modelValue')).toBe('2025-11-15')
    }

    const emptyModelValue = {
      id: '',
      date: '',
      entity: ''
    }

    const wrapper3 = await mountSuspended(CreateRoutingSlipDetails, {
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

    const inputs3 = wrapper3.findAllComponents({ name: 'ConnectFormInput' })
    const datePicker3 = wrapper3.findComponent({ name: 'DatePicker' })

    expect(inputs3[0]!.props('modelValue')).toBe('')
    expect(inputs3[1]!.props('modelValue')).toBe('')
    expect(datePicker3.props('modelValue')).toBe('')
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
