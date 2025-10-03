/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockUUIDs = ['1', '2', '3']
let uuidIndex = 0
vi.stubGlobal('crypto', {
  randomUUID: () => {
    const id = mockUUIDs[uuidIndex]
    uuidIndex = (uuidIndex + 1) % mockUUIDs.length
    return id
  }
})

describe('useCreateRoutingSlipStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    uuidIndex = 0
  })

  it('should have the correct default state', () => {
    const store = useCreateRoutingSlipStore()

    expect(store.state.payment.paymentType).toBe(PaymentTypes.CHEQUE)
    expect(store.state.payment.isUSD).toBe(false)
    expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(1)
    expect(store.state.payment.paymentItems['1']).toBeDefined()
  })

  describe('Computed', () => {
    it('isCheque should return true when paymentType is CHEQUE', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentType = PaymentTypes.CHEQUE
      expect(store.isCheque).toBe(true)
    })

    it('isCheque should return false when paymentType is CASH', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentType = PaymentTypes.CASH
      expect(store.isCheque).toBe(false)
    })

    it('totalCAD should total amountCAD', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentItems = {
        1: { amountCAD: '100.50' } as any,
        2: { amountCAD: '50.25' } as any,
        3: { amountCAD: '10' } as any
      }
      expect(store.totalCAD).toBe('160.75')
    })

    it('totalCAD should return "0.00" for an empty list', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentItems = {}
      expect(store.totalCAD).toBe('0.00')
    })

    it('totalCAD should ignore empty or invalid inputs', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentItems = {
        1: { amountCAD: '25.50' } as any,
        2: { amountCAD: '' } as any,
        3: { amountCAD: 'invalid' } as any
      }
      expect(store.totalCAD).toBe('25.50')
    })
  })

  describe('Actions', () => {
    it('addCheque should add a new item to the record', () => {
      const store = useCreateRoutingSlipStore()
      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(1)

      store.addCheque()

      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(2)
      expect(store.state.payment.paymentItems['2']).toBeDefined()
      expect(store.state.payment.paymentItems['2']?.amountCAD).toBe('')
    })

    it('removeCheque should remove an item by uuid', () => {
      const store = useCreateRoutingSlipStore()
      store.addCheque()
      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(2)

      store.removeCheque('1')

      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(1)
      expect(store.state.payment.paymentItems['1']).toBeUndefined()
      expect(store.state.payment.paymentItems['2']).toBeDefined()
    })

    it('resetPaymentState should reset the payment state', () => {
      const store = useCreateRoutingSlipStore()
      store.addCheque()
      store.state.payment.isUSD = true
      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(2)

      store.resetPaymentState()

      expect(store.state.payment.isUSD).toBe(false)
      expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(1)
      expect(store.state.payment.paymentItems['3']).toBeDefined()
    })

    it('resetUSDAmounts should reset all items amountUSD', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentItems = {
        1: { amountUSD: '10.00' } as any,
        2: { amountUSD: '20.00' } as any
      }

      store.resetUSDAmounts()

      expect(store.state.payment.paymentItems['1']?.amountUSD).toBe('')
      expect(store.state.payment.paymentItems['2']?.amountUSD).toBe('')
    })

    it('$reset should reset the state', () => {
      const store = useCreateRoutingSlipStore()
      store.state.details.id = '123456789'
      store.state.payment.isUSD = true
      store.state.address.name = 'Test Name'

      store.$reset()

      const expected = createEmptyCRSState()

      expect(store.state.details).toEqual(expected.details)
      expect(store.state.address).toEqual(expected.address)
      expect(store.state.payment.isUSD).toBe(false)

      const paymentItems = Object.values(store.state.payment.paymentItems)
      expect(paymentItems).toHaveLength(1)
      expect(paymentItems[0]).toEqual(
        expect.objectContaining({
          amountCAD: '',
          amountUSD: '',
          date: '',
          identifier: ''
        })
      )
    })
  })
})
