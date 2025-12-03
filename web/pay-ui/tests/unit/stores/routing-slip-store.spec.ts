import { createPinia, setActivePinia } from 'pinia'
import { useRoutingSlipStore } from '~/stores/routing-slip-store'

describe('useRoutingSlipStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should be defined', () => {
    const store = useRoutingSlipStore()
    expect(store).toBeDefined()
  })

  it('should return a store object with default values', () => {
    const { store } = useRoutingSlipStore()
    expect(store).toBeDefined()
    expect(store.routingSlip).toEqual({})
    expect(store.linkedRoutingSlips).toBeUndefined()
    expect(store.routingSlipDetails).toEqual({})
    expect(store.routingSlipAddress).toEqual({})
    expect(store.accountInfo).toEqual({})
    expect(store.chequePayment).toEqual([])
    expect(store.cashPayment).toEqual({})
    expect(store.isPaymentMethodCheque).toBe(true)
    expect(store.isAmountPaidInUsd).toBe(false)
    expect(store.searchRoutingSlipResult).toEqual([])
    expect(store.searchRoutingSlipParams).toEqual({
      page: 1,
      limit: 50,
      total: Infinity
    })
    expect(store.searchRoutingSlipTableHeaders).toBeDefined()
    expect(Array.isArray(store.searchRoutingSlipTableHeaders)).toBe(true)
    expect(store.routingSlipBeforeEdit).toEqual({})
  })

  it('should allow updating routingSlip', () => {
    const { store } = useRoutingSlipStore()
    const newRoutingSlip = { number: '123456789', status: 'ACTIVE' } as any
    store.routingSlip = newRoutingSlip
    expect(store.routingSlip).toEqual(newRoutingSlip)
  })

  it('should allow updating linkedRoutingSlips', () => {
    const { store } = useRoutingSlipStore()
    const linkedSlips = { parent: { number: '123' }, children: [] } as any
    store.linkedRoutingSlips = linkedSlips
    expect(store.linkedRoutingSlips).toEqual(linkedSlips)
  })

  it('should allow updating searchRoutingSlipResult', () => {
    const { store } = useRoutingSlipStore()
    const results = [
      { number: '123', status: 'ACTIVE' },
      { number: '456', status: 'COMPLETED' }
    ] as any[]
    store.searchRoutingSlipResult = results
    expect(store.searchRoutingSlipResult).toEqual(results)
    expect(store.searchRoutingSlipResult.length).toBe(2)
  })

  it('should allow updating searchRoutingSlipParams', () => {
    const { store } = useRoutingSlipStore()
    store.searchRoutingSlipParams.page = 2
    store.searchRoutingSlipParams.limit = 100
    store.searchRoutingSlipParams.total = 50
    
    expect(store.searchRoutingSlipParams.page).toBe(2)
    expect(store.searchRoutingSlipParams.limit).toBe(100)
    expect(store.searchRoutingSlipParams.total).toBe(50)
  })

  it('should allow updating isPaymentMethodCheque', () => {
    const { store } = useRoutingSlipStore()
    store.isPaymentMethodCheque = false
    expect(store.isPaymentMethodCheque).toBe(false)
  })

  it('should allow updating isAmountPaidInUsd', () => {
    const { store } = useRoutingSlipStore()
    store.isAmountPaidInUsd = true
    expect(store.isAmountPaidInUsd).toBe(true)
  })

  it('should allow updating chequePayment array', () => {
    const { store } = useRoutingSlipStore()
    const payments = [
      { id: '1', amount: 100 },
      { id: '2', amount: 200 }
    ] as any[]
    store.chequePayment = payments
    expect(store.chequePayment).toEqual(payments)
    expect(store.chequePayment.length).toBe(2)
  })

  it('should allow updating cashPayment', () => {
    const { store } = useRoutingSlipStore()
    const payment = { id: '1', amount: 100 } as any
    store.cashPayment = payment
    expect(store.cashPayment).toEqual(payment)
  })

  it('should share state across store instances (Pinia singleton)', () => {
    const { store: store1 } = useRoutingSlipStore()
    const { store: store2 } = useRoutingSlipStore()
    
    store1.routingSlip = { number: '111' } as any
    
    // Pinia stores are singletons, so they share the same state
    expect(store1.routingSlip.number).toBe('111')
    expect(store2.routingSlip.number).toBe('111')
  })

  it('should be reactive', () => {
    const { store } = useRoutingSlipStore()
    const initialValue = store.routingSlip
    store.routingSlip = { number: '999' } as any
    expect(store.routingSlip).not.toEqual(initialValue)
    expect(store.routingSlip.number).toBe('999')
  })
})

