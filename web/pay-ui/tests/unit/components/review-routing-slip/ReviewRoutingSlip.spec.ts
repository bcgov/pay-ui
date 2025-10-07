/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ReviewRoutingSlip } from '#components'
import { createTestingPinia } from '@pinia/testing'

const baseChequeState = {
  details: { id: '123', date: '2025-10-07T10:00:00.000Z', entity: 'BC123' },
  payment: {
    paymentType: PaymentTypes.CHEQUE,
    isUSD: false,
    paymentItems: {
      1: { uuid: '1', date: '2025-10-05T00:00:00.000Z', amountCAD: '150.75', amountUSD: '110.25', identifier: '1234' }
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
      1: { uuid: '1', date: '2025-10-05T00:00:00.000Z', amountCAD: '150.75', amountUSD: '110.25', identifier: '1234' }
    }
  },
  address: { name: 'Test Org', address: { street: '123 Main St' } }
}

describe('ReviewRoutingSlip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all sections', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            'create-routing-slip-store': { state: baseChequeState }
          }
        })]
      }
    })

    const itemRows = wrapper.findAllComponents({ name: 'ReviewRoutingSlipRow' })

    expect(itemRows[0]!.props('label')).toBe('Routing Slip - Unique ID')
    expect(itemRows[0]!.props('value')).toBe('123')

    expect(itemRows[1]!.props('label')).toBe('Date')
    expect(itemRows[1]!.props('value')).toBe('October 7, 2025')

    expect(itemRows[2]!.props('label')).toBe('Entity Number')
    expect(itemRows[2]!.props('value')).toBe('BC123')

    const table = wrapper.findComponent({ name: 'UTable' })
    expect(table.exists()).toBe(true)
    const tableData = table.props('data')
    expect(tableData[0].date).toBe('October 4, 2025')
    expect(tableData[0].amountCAD).toBe('150.75')

    const address = wrapper.findComponent({ name: 'ConnectAddressDisplay' })
    expect(address.exists()).toBe(true)
    expect(address.props('address')).toEqual(expect.objectContaining({ street: '123 Main St' }))
  })

  it('renders correct table columns when payment type is CHEQUE', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseChequeState } }
        })]
      }
    })

    const table = wrapper.findComponent({ name: 'UTable' })
    const columns = table.props('columns') as any[]

    expect(columns).toHaveLength(3)
    expect(columns.find(c => c.accessorKey === 'identifier')).toBeDefined()
    expect(columns.find(c => c.accessorKey === 'date')).toBeDefined()
    expect(columns.find(c => c.accessorKey === 'amountCAD')).toBeDefined()
  })

  it('renders the correct table columns when payment type is CASH', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseCashState } }
        })]
      }
    })

    const table = wrapper.findComponent({ name: 'UTable' })
    const columns = table.props('columns') as any[]

    expect(columns).toHaveLength(2)
    expect(columns.find(c => c.accessorKey === 'date')).toBeUndefined()
    expect(columns.find(c => c.accessorKey === 'identifier')).toBeDefined()
    expect(columns.find(c => c.accessorKey === 'amountCAD')).toBeDefined()
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
          }
        })]
      }
    })

    const table = wrapper.findComponent({ name: 'UTable' })
    const columns = table.props('columns') as any[]

    expect(columns).toHaveLength(4)
    expect(columns.find(c => c.accessorKey === 'amountUSD')).toBeDefined()
  })

  it('renders total amount when payment type is CHEQUE', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseChequeState } }
        })]
      }
    })

    const itemRows = wrapper.findAllComponents({ name: 'ReviewRoutingSlipRow' })
    expect(itemRows.some(item => item.props().label === 'Total Amount'))
  })

  it('should not render total amount when payment type is CASH', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip, {
      global: {
        plugins: [createTestingPinia({
          initialState: { 'create-routing-slip-store': { state: baseCashState } }
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
          }
        })]
      }
    })

    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const backButton = allButtons.find(btn => btn.text() === 'Back to Edit')!
    await backButton.vm.$emit('click')

    expect(useCreateRoutingSlipStore().reviewMode).toBe(false)
  })

  it('should emit a `create` event when the `Create` button is clicked', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip)
    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const createButton = allButtons.find(btn => btn.text() === 'Create')!
    await createButton.vm.$emit('click')

    expect(wrapper.emitted()).toHaveProperty('create')
  })

  it('should emit a `cancel` event when the `Cancel` button is clicked', async () => {
    const wrapper = await mountSuspended(ReviewRoutingSlip)
    const allButtons = wrapper.findAllComponents({ name: 'UButton' })
    const cancelButton = allButtons.find(btn => btn.text() === 'Cancel')!
    await cancelButton.vm.$emit('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
  })
})
