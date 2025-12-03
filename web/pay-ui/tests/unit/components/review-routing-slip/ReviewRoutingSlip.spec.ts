import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ReviewRoutingSlip } from '#components'
import { createTestingPinia } from '@pinia/testing'

const baseChequeState = {
  details: { id: '123', date: '2025-10-07T10:00:00.000Z', entity: 'BC123' },
  payment: {
    paymentType: PaymentTypes.CHEQUE,
    isUSD: false,
    paymentItems: {
      1: { uuid: '1', date: '2025-10-05T10:00:00.000Z', amountCAD: '150.75', amountUSD: '110.25', identifier: '1234' }
    }
  },
  address: { name: 'Test Org', address: { street: '123 Main St' } }
}

const baseCashState = {
  details: { id: '123', date: '2025-10-07T10:00:00.000Z', entity: 'BC123' },
  payment: {
    paymentType: PaymentTypes.CASH,
    isUSD: false,
    paymentItems: {
      1: { uuid: '1', date: '2025-10-05T10:00:00.000Z', amountCAD: '150.75', amountUSD: '110.25', identifier: '1234' }
    }
  },
  address: { name: 'Test Org', address: { street: '123 Main St' } }
}

describe('ReviewRoutingSlip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all sections', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            'create-routing-slip-store': { state: baseChequeState }
          },
          createSpy: vi.fn
        })],
        stubs: {
          ConnectInput: true,
          ConnectAddressDisplay: true
        }
      }
    })

    const itemRows = wrapper.findAllComponents({ name: 'ReviewRoutingSlipRow' })

    expect(itemRows.length).toBeGreaterThan(0)
    expect(itemRows[0]!.props('label')).toBe('Routing Slip - Unique ID')
    expect(itemRows[0]!.props('value')).toBe('123')

    expect(itemRows[1]!.props('label')).toBe('Date')
    expect(itemRows[1]!.props('value')).toContain('October 7, 2025')

    expect(itemRows[2]!.props('label')).toBe('Entity Number')
    expect(itemRows[2]!.props('value')).toBe('BC123')

    const chequeInput = wrapper.find('[id="review-cheque-number-0"]')
    expect(chequeInput.exists()).toBe(true)

    const address = wrapper.findComponent({ name: 'ConnectAddressDisplay' })
    expect(address.exists()).toBe(true)
    expect(address.props('address')).toEqual(expect.objectContaining({ street: '123 Main St' }))
  })

  it('renders correct table columns when payment type is CHEQUE', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseChequeState } },
          createSpy: vi.fn
        })],
        stubs: {
          ConnectInput: true
        }
      }
    })

    const chequeNumberInput = wrapper.find('[id="review-cheque-number-0"]')
    expect(chequeNumberInput.exists()).toBe(true)

    const chequeDateInput = wrapper.find('[id="review-cheque-date-0"]')
    expect(chequeDateInput.exists()).toBe(true)

    const amountCADInput = wrapper.find('[id="review-amount-cad-0"]')
    expect(amountCADInput.exists()).toBe(true)
  })

  it('renders the correct table columns when payment type is CASH', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseCashState } },
          createSpy: vi.fn
        })],
        stubs: {
          ConnectInput: true
        }
      }
    })

    const receiptNumberInput = wrapper.find('[id="review-receipt-number-0"]')
    expect(receiptNumberInput.exists()).toBe(true)

    const chequeDateInput = wrapper.find('[id="review-cheque-date-0"]')
    expect(chequeDateInput.exists()).toBe(false)

    const amountCADInput = wrapper.find('[id="review-amount-cad-0"]')
    expect(amountCADInput.exists()).toBe(true)
  })

  it('renders amountUSD column when isUSD', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            'create-routing-slip-store': {
              state: {
                ...baseChequeState,
                payment: {
                  ...baseChequeState.payment,
                  isUSD: true
                }
              }
            }
          },
          createSpy: vi.fn
        })],
        stubs: {
          ConnectInput: true
        }
      }
    })

    const amountUSDInput = wrapper.find('[id="review-amount-usd-0"]')
    expect(amountUSDInput.exists()).toBe(true)
  })

  it('renders total amount when payment type is CHEQUE', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseChequeState } },
          createSpy: vi.fn
        })],
        stubs: {
          ConnectInput: true
        }
      }
    })

    const itemRows = wrapper.findAllComponents({ name: 'ReviewRoutingSlipRow' })
    expect(itemRows.some(item => item.props().label === 'Total Amount')).toBe(true)
  })

  it('should not render total amount when payment type is CASH', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseCashState } },
          createSpy: vi.fn
        })]
      }
    })

    const itemRows = wrapper.findAllComponents({ name: 'ReviewRoutingSlipRow' })
    expect(itemRows.some(item => item.props().label === 'Total Amount')).toBe(false)
  })

  it('should set reviewMode to false when `Back to Edit` is clicked', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            'create-routing-slip-store': {
              state: baseCashState,
              reviewMode: true
            }
          },
          createSpy: vi.fn
        })]
      }
    })

    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const backButton = allButtons.find(btn => btn.text() === 'Back to Edit')!
    await backButton.vm.$emit('click')

    expect(useCreateRoutingSlipStore().reviewMode).toBe(false)
  })

  it('should emit a `create` event when the `Create` button is clicked', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      }
    })
    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const createButton = allButtons.find(btn => btn.text() === 'Create')!
    await createButton.vm.$emit('click')

    expect(wrapper.emitted()).toHaveProperty('create')
  })

  it('should emit a `cancel` event when the `Cancel` button is clicked', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      }
    })
    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const cancelButton = allButtons.find(btn => btn.text() === 'Cancel')!
    await cancelButton.vm.$emit('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
  })
})
