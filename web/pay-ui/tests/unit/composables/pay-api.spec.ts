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
      const body = createRoutingSlipPayload(baseRoutingSlipData)
      const mockApiResponse = { id: 987, status: 'ACTIVE' }
      mockPayApi.mockResolvedValue(mockApiResponse)

      const result = await payApi.postRoutingSlip(body)

      expect(mockPayApi).toHaveBeenCalledOnce()
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips', {
        method: 'POST',
        body
      })

      expect(result).toEqual(mockApiResponse)
    })
  })

  describe('postSearchRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const body: RoutingSlipSearchParams = { routingSlipNumber: '123456789' }
      const mockResponse: { items: RoutingSlip[] } = { items: [{ number: '123456789', status: 'ACTIVE' }] }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.postSearchRoutingSlip(body)

      expect(mockPayApi).toHaveBeenCalledTimes(1)
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/queries', {
        method: 'POST',
        body
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw an error if $payApi fails', async () => {
      const body: RoutingSlipSearchParams = { routingSlipNumber: '123456789' }
      const mockError = new Error('API Error 404')

      mockPayApi.mockRejectedValue(mockError)

      await expect(payApi.postSearchRoutingSlip(body)).rejects.toThrow(mockError)
      expect(mockPayApi).toHaveBeenCalledTimes(1)
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/queries', {
        method: 'POST',
        body
      })
    })
  })

  describe('postLinkRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const body: LinkRoutingSlipParams = { childRoutingSlipNumber: 'child123', parentRoutingSlipNumber: 'parent456' }

      mockPayApi.mockResolvedValue(undefined)

      await payApi.postLinkRoutingSlip(body)

      expect(mockPayApi).toHaveBeenCalledTimes(1)
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/links', {
        method: 'POST',
        body
      })
    })

    it('should throw an error if $payApi fails', async () => {
      const body: LinkRoutingSlipParams = { childRoutingSlipNumber: 'child123', parentRoutingSlipNumber: 'parent456' }
      const mockError = new Error('API Error 500')

      mockPayApi.mockRejectedValue(mockError)

      await expect(payApi.postLinkRoutingSlip(body)).rejects.toThrow(mockError)
      expect(mockPayApi).toHaveBeenCalledTimes(1)
      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/links', {
        method: 'POST',
        body
      })
    })
  })
})
