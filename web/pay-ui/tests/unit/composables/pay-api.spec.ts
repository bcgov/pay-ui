import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockPayApi = vi.fn()
mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi
}))

describe('usePayApi', () => {
  const payApi = usePayApi()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCodes', () => {
    it('should call $payApi with the correct url', async () => {
      mockPayApi.mockResolvedValue({ codes: [] })
      const codeType = 'routing_slip_statuses'

      await payApi.getCodes(codeType)

      expect(mockPayApi).toHaveBeenCalledOnce()
      expect(mockPayApi).toHaveBeenCalledWith(`/codes/${codeType}`)
    })

    it('should return destructured `codes` property', async () => {
      const mockResponse = {
        codes: [
          { code: 'ACTIVE', description: 'Active' },
          { code: 'HOLD', description: 'On Hold' }
        ]
      }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.getCodes('some-type')
      expect(result).toEqual(mockResponse.codes)
    })
  })

  describe('getRoutingSlip', () => {
    it('should call $payApi with the correct url', async () => {
      mockPayApi.mockResolvedValue({})
      const routingNumber = '123456789'

      await payApi.getRoutingSlip(routingNumber)

      expect(mockPayApi).toHaveBeenCalledOnce()
      expect(mockPayApi).toHaveBeenCalledWith(`/fas/routing-slips/${routingNumber}`)
    })

    it('should return the full response', async () => {
      const mockRoutingSlip = {
        id: 123,
        number: '123456789',
        status: 'ACTIVE'
      }
      mockPayApi.mockResolvedValue(mockRoutingSlip)

      const result = await payApi.getRoutingSlip('123456789')
      expect(result).toEqual(mockRoutingSlip)
    })
  })

  describe('postRoutingSlip', () => {
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

    it('should call the $payApi with the correct url, method, and payload', async () => {
      const payload = createRoutingSlipPayload(baseRoutingSlipData)
      const mockApiResponse = { id: 987, status: 'ACTIVE' }
      mockPayApi.mockResolvedValue(mockApiResponse)

      const result = await payApi.postRoutingSlip(payload)

      expect(mockPayApi).toHaveBeenCalledOnce()
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips', {
        method: 'POST',
        body: payload
      })

      expect(result).toEqual(mockApiResponse)
    })
  })
})
