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
})
