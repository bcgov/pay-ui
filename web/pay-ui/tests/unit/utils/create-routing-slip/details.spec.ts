/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { FetchError } from 'ofetch'
import { FASErrorCode } from '~/enums/api-errors'

const mockPayApi = {
  getRoutingSlip: vi.fn()
}
mockNuxtImport('usePayApi', () => () => mockPayApi)

describe('Create Routing Slip - Details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoutingSlipDetailsSchema', () => {
    const detailsSchema = getRoutingSlipDetailsSchema()
    const validData = { id: '123456789', date: '2025-01-01', entity: 'BC123' }

    it('should fail when id less than 9 characters', async () => {
      const result = await detailsSchema.safeParseAsync({ ...validData, id: '123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]!.message).toBe('A Routing Slip Number must be 9 characters long')
      }
    })

    it('should pass when slip number not found in api', async () => {
      mockPayApi.getRoutingSlip.mockResolvedValue(null)
      const result = await detailsSchema.safeParseAsync(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when id found in api', async () => {
      mockPayApi.getRoutingSlip.mockResolvedValue({ id: 123 })
      const result = await detailsSchema.safeParseAsync(validData)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.message)
          .toBe('Routing Slip number already present. Enter a new number or edit details of this routing slip.')
        expect(issue.path).toEqual(['id'])
      }
    })

    it('should fail when api 400`s with FAS_INVALID_ROUTING_SLIP_DIGITS error', async () => {
      const fetchError = new FetchError('Bad Request')
      fetchError.response = {
        status: 400,
        _data: { type: FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS }
      } as any
      mockPayApi.getRoutingSlip.mockRejectedValue(fetchError)

      const result = await detailsSchema.safeParseAsync(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.message)
          .toBe('Routing Slip number is invalid. Enter a new number or edit details of this routing slip.')
        expect(issue.path).toEqual(['id'])
      }
    })

    it('should pass for any other error status', async () => {
      const fetchError500 = new FetchError('Server Error')
      fetchError500.response = { status: 500 } as any
      mockPayApi.getRoutingSlip.mockRejectedValue(fetchError500)

      const result500 = await detailsSchema.safeParseAsync(validData)
      expect(result500.success).toBe(true)

      const fetchError401 = new FetchError('Server Error')
      fetchError401.response = { status: 500 } as any
      mockPayApi.getRoutingSlip.mockRejectedValue(fetchError401)

      const result401 = await detailsSchema.safeParseAsync(validData)
      expect(result401.success).toBe(true)

      const fetchError403 = new FetchError('Server Error')
      fetchError403.response = { status: 500 } as any
      mockPayApi.getRoutingSlip.mockRejectedValue(fetchError403)

      const result403 = await detailsSchema.safeParseAsync(validData)
      expect(result403.success).toBe(true)
    })
  })
})
