/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockNavigateTo } = vi.hoisted(() => ({ mockNavigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => mockNavigateTo)

const mockPayApi = { postRoutingSlip: vi.fn() }
mockNuxtImport('usePayApi', () => () => mockPayApi)

const mockToast = { add: vi.fn() }
mockNuxtImport('useToast', () => () => mockToast)

mockNuxtImport('useLocalePath', () => () => vi.fn((path: string) => path))

const mockUUIDs = ['1', '2', '3']
let uuidIndex = 0
vi.stubGlobal('crypto', {
  randomUUID: () => {
    const id = mockUUIDs[uuidIndex]
    uuidIndex = (uuidIndex + 1) % mockUUIDs.length
    return id
  }
})

vi.mock('~/utils/create-routing-slip', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    createRoutingSlipPayload: vi.fn((data: any) => ({ payload: data }))
  }
})

describe('useCreateRoutingSlipStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    uuidIndex = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should have the correct default state', () => {
    const store = useCreateRoutingSlipStore()

    expect(store.state.payment.paymentType).toBe(PaymentTypes.CHEQUE)
    expect(store.state.payment.isUSD).toBe(false)
    expect(Object.keys(store.state.payment.paymentItems)).toHaveLength(1)
    expect(store.state.payment.paymentItems['1']).toBeDefined()
    expect(store.loading).toBe(false)
    expect(store.reviewMode).toBe(false)
  })

  describe('Computed', () => {
    it('isCheque should return true when paymentType is CHEQUE and false when CASH', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentType = PaymentTypes.CHEQUE
      expect(store.isCheque).toBe(true)

      store.state.payment.paymentType = PaymentTypes.CASH
      expect(store.isCheque).toBe(false)
    })

    it('totalCAD should total amountCAD, return "0.00" for empty list, and ignore invalid inputs', () => {
      const store = useCreateRoutingSlipStore()
      store.state.payment.paymentItems = {
        1: { amountCAD: '100.50' } as any,
        2: { amountCAD: '50.25' } as any,
        3: { amountCAD: '10' } as any
      }
      expect(store.totalCAD).toBe('160.75')

      store.state.payment.paymentItems = {}
      expect(store.totalCAD).toBe('0.00')

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
      store.loading = true
      store.reviewMode = true

      store.$reset()

      const expected = createEmptyCRSState()

      expect(store.state.details).toEqual(expected.details)
      expect(store.state.address).toEqual(expected.address)
      expect(store.state.payment.isUSD).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.reviewMode).toBe(false)

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
