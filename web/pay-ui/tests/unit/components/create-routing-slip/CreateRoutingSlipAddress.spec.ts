import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { CreateRoutingSlipAddress } from '#components'

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
})
