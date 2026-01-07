import { createPinia, setActivePinia } from 'pinia'
import { useRoutingSlipStore } from '~/stores/routing-slip-store'
import type { RoutingSlip, LinkedRoutingSlips, Payment } from '~/interfaces/routing-slip'

describe('useRoutingSlipStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should be defined and return a store object with default values', () => {
    const store = useRoutingSlipStore()
    expect(store).toBeDefined()
    const { store: storeObj } = store
    expect(storeObj).toBeDefined()
    expect(storeObj.routingSlip).toEqual({})
    expect(storeObj.linkedRoutingSlips).toBeUndefined()
    expect(storeObj.routingSlipDetails).toEqual({})
    expect(storeObj.routingSlipAddress).toEqual({})
    expect(storeObj.accountInfo).toEqual({})
    expect(storeObj.chequePayment).toEqual([])
    expect(storeObj.cashPayment).toEqual({})
    expect(storeObj.isPaymentMethodCheque).toBe(true)
    expect(storeObj.isAmountPaidInUsd).toBe(false)
    expect(storeObj.searchRoutingSlipResult).toEqual([])
    expect(storeObj.searchRoutingSlipParams).toEqual({
      page: 1,
      limit: 50
    })
    expect(storeObj.searchRoutingSlipTableHeaders).toBeDefined()
    expect(Array.isArray(storeObj.searchRoutingSlipTableHeaders)).toBe(true)
    expect(storeObj.routingSlipBeforeEdit).toEqual({})
  })

  it('should allow updating all store properties', () => {
    const { store } = useRoutingSlipStore()

    const newRoutingSlip = { number: '123456789', status: 'ACTIVE' } as Partial<RoutingSlip>
    store.routingSlip = newRoutingSlip
    expect(store.routingSlip).toEqual(newRoutingSlip)

    const linkedSlips = { parent: { number: '123' }, children: [] } as Partial<LinkedRoutingSlips>
    store.linkedRoutingSlips = linkedSlips
    expect(store.linkedRoutingSlips).toEqual(linkedSlips)

    const results = [
      { number: '123', status: 'ACTIVE' },
      { number: '456', status: 'COMPLETED' }
    ] as Partial<RoutingSlip>[]
    store.searchRoutingSlipResult = results
    expect(store.searchRoutingSlipResult).toEqual(results)
    expect(store.searchRoutingSlipResult.length).toBe(2)

    store.searchRoutingSlipParams.page = 2
    store.searchRoutingSlipParams.limit = 100
    expect(store.searchRoutingSlipParams.page).toBe(2)
    expect(store.searchRoutingSlipParams.limit).toBe(100)

    store.isPaymentMethodCheque = false
    expect(store.isPaymentMethodCheque).toBe(false)

    store.isAmountPaidInUsd = true
    expect(store.isAmountPaidInUsd).toBe(true)

    const payments = [
      { id: '1', amount: 100 },
      { id: '2', amount: 200 }
    ] as Partial<Payment>[]
    store.chequePayment = payments
    expect(store.chequePayment).toEqual(payments)
    expect(store.chequePayment.length).toBe(2)

    const payment = { id: '1', amount: 100 } as Partial<Payment>
    store.cashPayment = payment
    expect(store.cashPayment).toEqual(payment)
  })

  it('should share state across store instances (Pinia singleton)', () => {
    const { store: store1 } = useRoutingSlipStore()
    const { store: store2 } = useRoutingSlipStore()

    store1.routingSlip = { number: '111' } as Partial<RoutingSlip>

    // Pinia stores are singletons, so they share the same state
    expect(store1.routingSlip.number).toBe('111')
    expect(store2.routingSlip.number).toBe('111')
  })

  it('should be reactive', () => {
    const { store } = useRoutingSlipStore()
    const initialValue = store.routingSlip
    store.routingSlip = { number: '999' } as Partial<RoutingSlip>
    expect(store.routingSlip).not.toEqual(initialValue)
    expect(store.routingSlip.number).toBe('999')
  })
})
