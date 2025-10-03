import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

vi.mock('~/utils/create-routing-slip/details', () => (
  { getRoutingSlipDetailsSchema: vi.fn(() => z.object({ detailsField: z.string() })) })
)
vi.mock('~/utils/create-routing-slip/payment', () => (
  { getRoutingSlipPaymentSchema: vi.fn(() => z.object({ paymentField: z.string() })) })
)
vi.mock('~/utils/create-routing-slip/address', () => (
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
})
