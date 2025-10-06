import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { CreateRoutingSlipDetails } from '#components'

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
})
