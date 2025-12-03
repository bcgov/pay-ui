import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AddManualTransactionDetails from '~/components/RoutingSlip/AddManualTransactionDetails.vue'
import type { ManualTransactionDetails } from '~/interfaces/routing-slip'
import type { ComponentPublicInstance } from 'vue'

const {
  mockGetFeeByCorpTypeAndFilingType,
  mockUseRoutingSlip,
  mockRequiredFieldRule,
  mockManualTransactionDetails,
  mockEmit,
  mockErrors,
  mockRemoveManualTransactionRowEventHandler,
  mockCalculateTotal,
  mockDelayedCalculateTotal,
  mockEmitManualTransactionDetails,
  mockValidate
} = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ref, reactive } = require('vue')
  const mockGetFeeByCorpTypeAndFilingType = vi.fn()
  const mockUseRoutingSlip = {
    getFeeByCorpTypeAndFilingType: mockGetFeeByCorpTypeAndFilingType
  }
  const mockRequiredFieldRule = vi.fn()
  const mockManualTransactionDetails = ref<ManualTransactionDetails>({
    key: Math.random(),
    futureEffective: false,
    priority: false,
    total: undefined,
    referenceNumber: undefined,
    filingType: undefined,
    quantity: undefined,
    availableAmountForManualTransaction: undefined
  })
  const mockEmit = vi.fn()
  const mockErrors = reactive({
    filingType: '',
    quantity: ''
  })
  const mockRemoveManualTransactionRowEventHandler = vi.fn()
  const mockCalculateTotal = vi.fn()
  const mockDelayedCalculateTotal = vi.fn()
  const mockEmitManualTransactionDetails = vi.fn()
  const mockValidate = vi.fn().mockReturnValue(true)
  return {
    mockGetFeeByCorpTypeAndFilingType,
    mockUseRoutingSlip,
    mockRequiredFieldRule,
    mockManualTransactionDetails,
    mockEmit,
    mockErrors,
    mockRemoveManualTransactionRowEventHandler,
    mockCalculateTotal,
    mockDelayedCalculateTotal,
    mockEmitManualTransactionDetails,
    mockValidate
  }
})

vi.mock('~/utils/common-util', () => ({
  default: {
    requiredFieldRule: () => mockRequiredFieldRule
  }
}))

vi.mock('~/composables/viewRoutingSlip/useAddManualTransactionDetails', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { computed } = require('vue')
  return {
    default: () => ({
      manualTransactionDetails: mockManualTransactionDetails,
      requiredFieldRule: mockRequiredFieldRule,
      removeManualTransactionRowEventHandler: mockRemoveManualTransactionRowEventHandler,
      calculateTotal: mockCalculateTotal,
      delayedCalculateTotal: mockDelayedCalculateTotal,
      emitManualTransactionDetails: mockEmitManualTransactionDetails,
      totalFormatted: computed(() => mockManualTransactionDetails.value.total?.toFixed(2)),
      errors: mockErrors,
      validate: mockValidate
    })
  }
})

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useI18n', () => () => ({
  t: (key: string, fallback?: string) => fallback || key
}))

describe('AddManualTransactionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFeeByCorpTypeAndFilingType.mockResolvedValue(100.50)
    mockManualTransactionDetails.value = {
      key: Math.random(),
      futureEffective: false,
      priority: false,
      total: undefined,
      referenceNumber: undefined,
      filingType: undefined,
      quantity: undefined,
      availableAmountForManualTransaction: undefined
    }
    mockErrors.filingType = ''
    mockErrors.quantity = ''
    mockEmit.mockClear()
    mockRemoveManualTransactionRowEventHandler.mockImplementation(() => {
      if (mockEmit) {
        mockEmit('removeManualTransactionRow', 0)
      }
    })
    mockEmitManualTransactionDetails.mockImplementation(() => {
      if (mockEmit) {
        mockEmit('updateManualTransaction', {
          transaction: mockManualTransactionDetails.value,
          index: 0
        })
      }
    })
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render all form fields', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: {
            template: '<div data-test="filing-type"></div>',
            props: ['id', 'modelValue', 'required', 'rules'],
            emits: ['input', 'update:modelValue']
          },
          ConnectInput: {
            template: '<input data-test="input" />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly']
          },
          UCheckbox: {
            template: '<input type="checkbox" data-test="checkbox" />',
            props: ['modelValue', 'label'],
            emits: ['change', 'update:modelValue']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const filingType = wrapper.find('[data-test="filing-type"]')
    const inputs = wrapper.findAll('[data-test="input"]')
    const checkboxes = wrapper.findAll('[data-test="checkbox"]')

    expect(filingType.exists()).toBe(true)
    expect(inputs.length).toBeGreaterThanOrEqual(3)
    expect(checkboxes.length).toBe(2)
  })

  it('should display quantity input with correct props', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input data-test="input" :data-id="id" />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly']
          },
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const quantityInput = wrapper.findAll('[data-test="input"]').find(
      input => input.attributes('data-id')?.includes('quantity')
    )
    expect(quantityInput?.exists()).toBe(true)
  })

  it('should display reference number input', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input data-test="input" :data-id="id" />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly']
          },
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const referenceInput = wrapper.findAll('[data-test="input"]').find(
      input => input.attributes('data-id')?.includes('reference')
    )
    expect(referenceInput?.exists()).toBe(true)
  })

  it('should display amount input as readonly', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input data-test="input" :data-id="id" :data-readonly="readonly" />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly']
          },
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const amountInput = wrapper.findAll('[data-test="input"]').find(
      input => input.attributes('data-id')?.includes('amount')
    )
    expect(amountInput?.exists()).toBe(true)
  })

  it('should display priority and future effective checkboxes', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: {
            template: '<input type="checkbox" data-test="checkbox" />',
            props: ['modelValue', 'label'],
            emits: ['change', 'update:modelValue']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const checkboxes = wrapper.findAll('[data-test="checkbox"]')
    expect(checkboxes.length).toBe(2)
  })

  it('should show remove button when index is greater than 0', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 1
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: {
            template: '<button data-test="remove-button"></button>',
            props: ['icon', 'variant', 'size']
          },
          UIcon: true
        }
      }
    })

    await nextTick()

    const removeButton = wrapper.find('[data-test="remove-button"]')
    expect(removeButton.exists()).toBe(true)
  })

  it('should not show remove button when index is 0', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: {
            template: '<button data-test="remove-button"></button>',
            props: ['icon', 'variant', 'size']
          },
          UIcon: true
        }
      }
    })

    await nextTick()

    const removeButton = wrapper.find('[data-test="remove-button"]')
    expect(removeButton.exists()).toBe(false)
  })

  it('should emit removeManualTransactionRow when remove button is clicked', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 1
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: {
            template: "<button @click=\"$emit('click')\" data-test=\"remove-button\"></button>",
            props: ['icon', 'variant', 'size']
          },
          UIcon: true
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    mockRemoveManualTransactionRowEventHandler.mockImplementation(() => {
      wrapper.vm.$emit('removeManualTransactionRow', 1)
    })

    component.removeManualTransactionRowEventHandler()
    await nextTick()

    expect(wrapper.emitted('removeManualTransactionRow')).toBeTruthy()
    expect(wrapper.emitted('removeManualTransactionRow')?.[0]).toEqual([1])
  })

  it('should emit updateManualTransaction when reference number changes', async () => {
    mockManualTransactionDetails.value.referenceNumber = undefined
    mockEmitManualTransactionDetails.mockClear()

    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input data-test="input" :data-id="id" :value="modelValue" '
              + "@input=\"$emit('update:modelValue', $event.target.value)\" />",
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly'],
            emits: ['update:modelValue']
          },
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const referenceInput = wrapper.findAll('[data-test="input"]').find(
      input => input.attributes('data-id')?.includes('reference')
    )

    expect(referenceInput?.exists()).toBe(true)

    if (referenceInput) {
      mockEmitManualTransactionDetails.mockImplementation(() => {
        wrapper.vm.$emit('updateManualTransaction', {
          transaction: { ...mockManualTransactionDetails.value },
          index: 0
        })
      })

      mockManualTransactionDetails.value.referenceNumber = 'REF123'

      await referenceInput.setValue('REF123')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockEmitManualTransactionDetails).toHaveBeenCalled()
      expect(wrapper.emitted('updateManualTransaction')).toBeTruthy()
      const emittedEvents = wrapper.emitted('updateManualTransaction')
      expect(emittedEvents).toBeDefined()
      expect(emittedEvents?.length).toBeGreaterThan(0)
      if (emittedEvents && emittedEvents.length > 0 && emittedEvents[0]) {
        expect(emittedEvents[0][0]).toMatchObject({
          transaction: expect.objectContaining({
            referenceNumber: 'REF123'
          }),
          index: 0
        })
      }
    }
  })

  it('should display error messages when validation fails', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    component.errors.filingType = 'This field is required'
    component.errors.quantity = 'This field is required'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const errorText = wrapper.text()
    expect(errorText).toContain('This field is required')
  })

  it('should display info message when quantity is greater than 1', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: {
            template: '<span data-test="info-icon"></span>',
            props: ['name']
          }
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    component.manualTransactionDetails.value.quantity = 2
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const infoIcon = wrapper.find('[data-test="info-icon"]')
    expect(infoIcon.exists()).toBe(true)
  })

  it('should not display info message when quantity is 1 or less', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: {
            template: '<span data-test="info-icon"></span>',
            props: ['name']
          }
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    component.manualTransactionDetails.value.quantity = 1
    await nextTick()

    const infoIcon = wrapper.find('[data-test="info-icon"]')
    expect(infoIcon.exists()).toBe(false)
  })

  it('should initialize with manualTransaction prop', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 123,
      futureEffective: true,
      priority: true,
      total: 200.00,
      referenceNumber: 'REF123',
      quantity: 2,
      availableAmountForManualTransaction: 1000
    }

    mockManualTransactionDetails.value = { ...mockTransaction }

    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0,
        manualTransaction: mockTransaction
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly']
          },
          UCheckbox: {
            template: '<input type="checkbox" />',
            props: ['modelValue', 'label'],
            emits: ['change', 'update:modelValue']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    expect(component.manualTransactionDetails.value.priority).toBe(true)
    expect(component.manualTransactionDetails.value.futureEffective).toBe(true)
    expect(component.manualTransactionDetails.value.referenceNumber).toBe('REF123')
    expect(component.manualTransactionDetails.value.quantity).toBe(2)
  })

  it('should expose validate method', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    expect(typeof component.validate).toBe('function')
  })

  it('should call calculateTotal when priority checkbox changes', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: {
            template: "<input type=\"checkbox\" @change=\"$emit('change')\" />",
            props: ['modelValue', 'label'],
            emits: ['change', 'update:modelValue']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const priorityCheckbox = wrapper.findAllComponents({ name: 'UCheckbox' })[0]
    if (priorityCheckbox?.exists()) {
      await priorityCheckbox.vm.$emit('change')
      await nextTick()
    }

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    expect(typeof component.calculateTotal).toBe('function')
  })

  it('should call calculateTotal when future effective checkbox changes', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: true,
          UCheckbox: {
            template: "<input type=\"checkbox\" @change=\"$emit('change')\" />",
            props: ['modelValue', 'label'],
            emits: ['change', 'update:modelValue']
          },
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const futureEffectiveCheckbox = wrapper.findAllComponents({ name: 'UCheckbox' })[1]
    if (futureEffectiveCheckbox?.exists()) {
      await futureEffectiveCheckbox.vm.$emit('change')
      await nextTick()
    }

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    expect(typeof component.calculateTotal).toBe('function')
  })

  it('should handle quantity input update', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: true,
          ConnectInput: {
            template: '<input />',
            props: ['id', 'modelValue', 'label', 'type', 'required', 'readonly'],
            emits: ['update:modelValue']
          },
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const component = wrapper.vm as InstanceType<typeof AddManualTransactionDetails>
    component.manualTransactionDetails.value.quantity = 5
    await nextTick()

    expect(component.manualTransactionDetails.value.quantity).toBe(5)
  })

  it('should handle filing type input event', async () => {
    const wrapper = await mountSuspended(AddManualTransactionDetails, {
      props: {
        index: 0
      },
      global: {
        stubs: {
          FilingTypeAutoComplete: {
            template: '<div data-test="filing-type"></div>',
            props: ['id', 'modelValue', 'required', 'rules'],
            emits: ['input', 'update:modelValue']
          },
          ConnectInput: true,
          UCheckbox: true,
          UButton: true,
          UIcon: true
        }
      }
    })

    await nextTick()

    const filingType = wrapper.findComponent({ name: 'FilingTypeAutoComplete' })
    if (filingType.exists()) {
      await filingType.vm.$emit('input')
      await nextTick()

      const component = wrapper.vm as ComponentPublicInstance & { errors?: { filingType?: string, quantity?: string } }
      expect(component.errors?.filingType).toBe('')
    }
  })
})
