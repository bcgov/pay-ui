import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import RefundRequestForm from '~/components/RoutingSlip/RefundRequestForm.vue'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string, fallback?: string) => fallback || key
}))

describe('RefundRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display refund amount, entity number, and handle missing values', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
      props: {
        refundAmount: 500.50
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('$500.50')

    const wrapper2 = await mountSuspended(RefundRequestForm, {
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()
    expect(wrapper2.text()).toContain('$0.00')
    expect(wrapper2.text()).toContain('-')

    const wrapper3 = await mountSuspended(RefundRequestForm, {
      props: {
        entityNumber: 'BC1234567'
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()
    expect(wrapper3.text()).toContain('BC1234567')
  })

  it('should populate form with initial data', async () => {
    const initialData = {
      name: 'John Doe',
      mailingAddress: {
        street: '123 Main St',
        city: 'Victoria',
        region: 'BC',
        postalCode: 'V1X 1X1',
        country: 'CA',
        deliveryInstructions: 'Leave at door'
      },
      chequeAdvice: 'Test advice'
    }

    const wrapper = await mountSuspended(RefundRequestForm, {
      props: {
        initialData
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: {
            template: '<input />',
            props: ['modelValue', 'label', 'name', 'inputId', 'type']
          },
          ConnectFormAddress: {
            template: '<div></div>',
            props: ['modelValue', 'id', 'schemaPrefix']
          },
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    expect(component.formState.name).toBe('John Doe')
    expect(component.formState.address.street).toBe('123 Main St')
    expect(component.formState.address.city).toBe('Victoria')
    expect(component.formState.chequeAdvice).toBe('Test advice')
  })

  it('should emit submit event with form data when form is submitted', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    component.formState.name = 'Test Name'
    component.formState.address.street = '123 Main St'
    component.formState.address.city = 'Victoria'
    component.formState.address.region = 'BC'
    component.formState.address.postalCode = 'V1X 1X1'
    component.formState.address.country = 'CA'
    component.formState.chequeAdvice = 'Test advice'

    await component.onSubmit()
    await nextTick()

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      name: 'Test Name',
      mailingAddress: {
        street: '123 Main St',
        city: 'Victoria',
        region: 'BC',
        postalCode: 'V1X 1X1',
        country: 'CA'
      },
      chequeAdvice: 'Test advice'
    }])
  })

  it('should include deliveryInstructions when it has a value', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    component.formState.name = 'Test Name'
    component.formState.address.street = '123 Main St'
    component.formState.address.city = 'Victoria'
    component.formState.address.region = 'BC'
    component.formState.address.postalCode = 'V1X 1X1'
    component.formState.address.country = 'CA'
    component.formState.address.locationDescription = 'Leave at front door'

    await component.onSubmit()
    await nextTick()

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      name: 'Test Name',
      mailingAddress: {
        street: '123 Main St',
        city: 'Victoria',
        region: 'BC',
        postalCode: 'V1X 1X1',
        country: 'CA',
        deliveryInstructions: 'Leave at front door'
      },
      chequeAdvice: undefined
    }])
  })

  it('should handle cancel, form state updates, empty data, formatting, and render fields/buttons', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: {
            template: '<input data-test="form-input" />',
            props: ['modelValue', 'label', 'name', 'inputId', 'type']
          },
          ConnectFormAddress: {
            template: '<div data-test="form-address"></div>',
            props: ['modelValue', 'id', 'schemaPrefix']
          },
          UButton: {
            template: '<button data-test="button" @click="$emit(\'click\')"></button>',
            props: ['label', 'type', 'variant', 'size']
          }
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    await component.onCancel()
    await nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()

    const formInputs = wrapper.findAll('[data-test="form-input"]')
    const addressInput = wrapper.find('[data-test="form-address"]')
    expect(formInputs.length).toBeGreaterThanOrEqual(2)
    expect(addressInput.exists()).toBe(true)

    const buttons = wrapper.findAll('[data-test="button"]')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    const wrapper2 = await mountSuspended(RefundRequestForm, {
      props: {
        initialData: {
          name: 'Initial Name',
          mailingAddress: {
            street: 'Initial Street',
            city: 'Initial City'
          }
        }
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: {
            template: '<input />',
            props: ['modelValue', 'label', 'name', 'inputId', 'type']
          },
          ConnectFormAddress: {
            template: '<div></div>',
            props: ['modelValue', 'id', 'schemaPrefix']
          },
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component2 = wrapper2.vm as any
    expect(component2.formState.name).toBe('Initial Name')
    expect(component2.formState.address.street).toBe('Initial Street')
    expect(component2.formState.address.city).toBe('Initial City')

    await wrapper2.setProps({
      initialData: {
        name: 'Updated Name',
        mailingAddress: {
          street: 'Updated Street',
          city: 'Updated City'
        }
      }
    })
    await nextTick()
    expect(component2.formState.name).toBe('Updated Name')
    expect(component2.formState.address.street).toBe('Updated Street')
    expect(component2.formState.address.city).toBe('Updated City')

    const wrapper3 = await mountSuspended(RefundRequestForm, {
      props: {
        initialData: {}
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component3 = wrapper3.vm as any
    expect(component3.formState.name).toBe('')
    expect(component3.formState.address.street).toBe('')
    expect(component3.formState.chequeAdvice).toBe('')

    const wrapper4 = await mountSuspended(RefundRequestForm, {
      props: {
        refundAmount: 1234.56
      },
      global: {
        stubs: {
          UForm: {
            template: '<div><slot /></div>',
            props: ['state', 'schema'],
            emits: ['error', 'submit']
          },
          ConnectFormInput: {
            template: '<input />',
            props: ['modelValue', 'label', 'name', 'inputId', 'type']
          },
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component4 = wrapper4.vm as any
    expect(component4.formattedRefundAmount).toBe('$1234.56')

    component4.formState.chequeAdvice = 'Test advice'
    await nextTick()
    expect(component4.chequeAdviceModel.value).toBe('Test advice')

    component4.formState.chequeAdvice = undefined
    await nextTick()
    expect(component4.chequeAdviceModel.value).toBe('')
  })
})
