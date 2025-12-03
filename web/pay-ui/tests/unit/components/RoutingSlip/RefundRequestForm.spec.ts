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

  it('should display refund amount when provided', async () => {
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
  })

  it('should display default refund amount when not provided', async () => {
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
    expect(wrapper.text()).toContain('$0.00')
  })

  it('should display entity number when provided', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
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
    expect(wrapper.text()).toContain('BC1234567')
  })

  it('should display dash when entity number is not provided', async () => {
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
    expect(wrapper.text()).toContain('-')
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
        streetAdditional: '',
        city: 'Victoria',
        region: 'BC',
        postalCode: 'V1X 1X1',
        country: 'CA',
        deliveryInstructions: ''
      },
      chequeAdvice: 'Test advice'
    }])
  })

  it('should emit cancel event when cancel button is clicked', async () => {
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
          UButton: {
            template: '<button @click="$emit(\'click\')"></button>',
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
  })

  it('should update form state when initialData prop changes', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
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
    const component = wrapper.vm as any
    expect(component.formState.name).toBe('Initial Name')
    expect(component.formState.address.street).toBe('Initial Street')
    expect(component.formState.address.city).toBe('Initial City')

    await wrapper.setProps({
      initialData: {
        name: 'Updated Name',
        mailingAddress: {
          street: 'Updated Street',
          city: 'Updated City'
        }
      }
    })
    await nextTick()

    expect(component.formState.name).toBe('Updated Name')
    expect(component.formState.address.street).toBe('Updated Street')
    expect(component.formState.address.city).toBe('Updated City')
  })

  it('should handle empty initialData gracefully', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
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
    const component = wrapper.vm as any
    expect(component.formState.name).toBe('')
    expect(component.formState.address.street).toBe('')
    expect(component.formState.chequeAdvice).toBe('')
  })

  it('should format refund amount correctly', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
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
          ConnectFormInput: true,
          ConnectFormAddress: true,
          UButton: true
        }
      }
    })

    await nextTick()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    expect(component.formattedRefundAmount).toBe('$1234.56')
  })

  it('should handle chequeAdvice model correctly', async () => {
    const wrapper = await mountSuspended(RefundRequestForm, {
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
    const component = wrapper.vm as any
    component.formState.chequeAdvice = 'Test advice'
    await nextTick()

    expect(component.chequeAdviceModel.value).toBe('Test advice')

    component.formState.chequeAdvice = undefined
    await nextTick()

    expect(component.chequeAdviceModel.value).toBe('')
  })

  it('should render all form fields', async () => {
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
          UButton: true
        }
      }
    })

    await nextTick()

    const formInputs = wrapper.findAll('[data-test="form-input"]')
    const addressInput = wrapper.find('[data-test="form-address"]')

    expect(formInputs.length).toBeGreaterThanOrEqual(2)
    expect(addressInput.exists()).toBe(true)
  })

  it('should render submit and cancel buttons', async () => {
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
          UButton: {
            template: '<button data-test="button"></button>',
            props: ['label', 'type', 'variant', 'size']
          }
        }
      }
    })

    await nextTick()

    const buttons = wrapper.findAll('[data-test="button"]')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
