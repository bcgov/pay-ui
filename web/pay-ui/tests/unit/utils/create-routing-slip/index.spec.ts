import { z } from 'zod'

vi.mock('~/utils/create-routing-slip/details', () => (
  { getRoutingSlipDetailsSchema: vi.fn(() => z.object({ detailsField: z.string() })) })
)
vi.mock('~/utils/create-routing-slip/payment', () => (
  { getRoutingSlipPaymentSchema: vi.fn(() => z.object({ paymentField: z.string() })) })
)
vi.mock('~/utils/validation', () => (
  { getRoutingSlipAddressSchema: vi.fn(() => z.object({ addressField: z.string() })) })
)
vi.mock('~/utils/date', () => (
  { getToday: vi.fn(() => ({ toISO: () => '2025-10-03T00:00:00.000Z' })) })
)

const mockUUID = 'mock-uuid-12345'
vi.stubGlobal('crypto', { randomUUID: () => mockUUID })

describe('Create Routing Slip - index', async () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoutingSlipSchema', () => {
    it('should combine schemas', () => {
      const schema = getRoutingSlipSchema()

      expect(vi.mocked(getRoutingSlipDetailsSchema)).toHaveBeenCalledOnce()
      expect(vi.mocked(getRoutingSlipPaymentSchema)).toHaveBeenCalledOnce()
      expect(vi.mocked(getRoutingSlipAddressSchema)).toHaveBeenCalledOnce()

      const shape = schema.shape
      expect(shape).toHaveProperty('details')
      expect(shape).toHaveProperty('payment')
      expect(shape).toHaveProperty('address')

      const result = schema.safeParse({
        details: { detailsField: 'valid' },
        payment: { paymentField: 'valid' },
        address: { addressField: 'valid' }
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createEmptyPaymentItem', () => {
    it('should return a payment item with a unique ID and empty fields', () => {
      const item = createEmptyPaymentItem()

      expect(item).toEqual({
        uuid: mockUUID,
        amountCAD: '',
        amountUSD: '',
        identifier: '',
        date: ''
      })
    })
  })

  describe('createEmptyCRSState', () => {
    it('should return a `create routing slip` object', () => {
      const state = createEmptyCRSState()

      expect(state.details).toEqual({
        id: '',
        date: '2025-10-03T00:00:00.000Z',
        entity: ''
      })
      expect(state.payment.paymentType).toBe(PaymentTypes.CHEQUE)
      expect(state.payment.isUSD).toBe(false)
      expect(state.payment.paymentItems).toHaveProperty(mockUUID)
      expect(state.payment.paymentItems[mockUUID]?.uuid).toBe(mockUUID)
    })
  })

  describe('createRoutingSlipPayload', () => {
    const baseRoutingSlipData: RoutingSlipSchema = {
      details: {
        id: '123456789',
        date: '2025-10-07T10:00:00.000Z',
        entity: 'BC1234567'
      },
      payment: {
        paymentType: PaymentTypes.CHEQUE,
        paymentItems: {
          1: {
            uuid: '1',
            identifier: 'CHK-001',
            date: '2025-10-05T00:00:00.000Z',
            amountCAD: '150.75',
            amountUSD: '110.25'
          }
        },
        isUSD: true
      },
      address: {
        name: 'Test Org',
        address: {
          street: '123 Main St',
          streetAdditional: 'Suite 200',
          city: 'Victoria',
          region: 'BC',
          postalCode: 'V1X 1X1',
          country: 'CA',
          locationDescription: 'Front desk'
        }
      }
    }

    it('should map RoutingSlipSchema to CreateRoutingSlipPayload', () => {
      const payload = createRoutingSlipPayload(baseRoutingSlipData)

      expect(payload.contactName).toBe('Test Org')
      expect(payload.number).toBe('123456789')
      expect(payload.routingSlipDate).toBe('2025-10-07')
      expect(payload.paymentAccount.accountName).toBe('BC1234567')

      expect(payload.mailingAddress.street).toBe('123 Main St')
      expect(payload.mailingAddress.deliveryInstructions).toBe('Front desk')
    })

    it('should map a single payment item', () => {
      const payload = createRoutingSlipPayload(baseRoutingSlipData)

      expect(payload.payments).toHaveLength(1)
      const payment = payload.payments[0]!
      expect(payment.chequeReceiptNumber).toBe('CHK-001')
      expect(payment.paidAmount).toBe(150.75)
      expect(payment.paidUsdAmount).toBe(110.25)
      expect(payment.paymentDate).toBe('2025-10-05')
      expect(payment.paymentMethod).toBe(PaymentTypes.CHEQUE)
    })

    it('should map multiple payment items', () => {
      const multiItemData = {
        ...baseRoutingSlipData,
        payment: {
          ...baseRoutingSlipData.payment,
          paymentItems: {
            1: { ...baseRoutingSlipData.payment.paymentItems['1']! },
            2: {
              uuid: '2',
              identifier: 'CHK-002',
              date: '2025-10-06T00:00:00.000Z',
              amountCAD: '50',
              amountUSD: '35'
            }
          }
        }
      }

      const payload = createRoutingSlipPayload(multiItemData)

      expect(payload.payments).toHaveLength(2)
      expect(payload.payments[1]!.chequeReceiptNumber).toBe('CHK-002')
      expect(payload.payments[1]!.paidAmount).toBe(50)
    })

    it('should set paid amounts to 0 if empty or invalid', () => {
      const dataWithInvalidAmounts: RoutingSlipSchema = {
        ...baseRoutingSlipData,
        payment: {
          ...baseRoutingSlipData.payment,
          paymentItems: {
            1: {
              ...baseRoutingSlipData.payment.paymentItems['1']!,
              amountCAD: '',
              amountUSD: 'not a number'
            }
          }
        }
      }

      const payload = createRoutingSlipPayload(dataWithInvalidAmounts)
      const payment = payload.payments[0]!

      expect(payment.paidAmount).toBe(0)
      expect(payment.paidUsdAmount).toBe(0)
    })

    it('should return empty array if no payment items', () => {
      const noPayItems: RoutingSlipSchema = {
        ...baseRoutingSlipData,
        payment: {
          ...baseRoutingSlipData.payment,
          paymentItems: {}
        }
      }

      const payload = createRoutingSlipPayload(noPayItems)
      expect(payload.payments).toEqual([])
    })
  })
})
