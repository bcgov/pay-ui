import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useEftRefund } from '~/composables/eft/useEftRefund'
import { EFTRefundStatus } from '~/utils/constants'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

describe('useEftRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEftRefunds', () => {
    it('should fetch refunds for a short name ID', async () => {
      const mockRefunds = [{ id: 1, shortNameId: 123 }]
      mockPayApi.mockResolvedValue(mockRefunds)

      const { getEftRefunds } = useEftRefund()
      const result = await getEftRefunds(123)

      expect(result).toEqual(mockRefunds)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund?shortNameId=123',
        { method: 'GET' }
      )
    })

    it('should include statuses when provided', async () => {
      const mockRefunds = [{ id: 1 }]
      mockPayApi.mockResolvedValue(mockRefunds)

      const { getEftRefunds } = useEftRefund()
      await getEftRefunds(123, ['PENDING_APPROVAL', 'APPROVED'])

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund?shortNameId=123&statuses=PENDING_APPROVAL%2CAPPROVED',
        { method: 'GET' }
      )
    })

    it('should not include statuses param when empty array', async () => {
      mockPayApi.mockResolvedValue([])

      const { getEftRefunds } = useEftRefund()
      await getEftRefunds(123, [])

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund?shortNameId=123',
        { method: 'GET' }
      )
    })
  })

  describe('getPendingRefunds', () => {
    it('should fetch only pending approval refunds', async () => {
      const mockRefunds = [{ id: 1, status: 'PENDING_APPROVAL' }]
      mockPayApi.mockResolvedValue(mockRefunds)

      const { getPendingRefunds } = useEftRefund()
      const result = await getPendingRefunds(123)

      expect(result).toEqual(mockRefunds)
      expect(mockPayApi).toHaveBeenCalledWith(
        expect.stringContaining('statuses=PENDING_APPROVAL'),
        { method: 'GET' }
      )
    })
  })

  describe('getEftRefund', () => {
    it('should fetch a single refund by ID', async () => {
      const mockRefund = { id: 456, refundAmount: 100 }
      mockPayApi.mockResolvedValue(mockRefund)

      const { getEftRefund } = useEftRefund()
      const result = await getEftRefund(456)

      expect(result).toEqual(mockRefund)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/456',
        { method: 'GET' }
      )
    })

    it('should return null when response is falsy', async () => {
      mockPayApi.mockResolvedValue(null)

      const { getEftRefund } = useEftRefund()
      const result = await getEftRefund(456)

      expect(result).toBeNull()
    })
  })

  describe('createEftRefund', () => {
    it('should create a refund request', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: 500,
        refundEmail: 'test@example.com',
        comment: 'Test refund'
      }
      const mockResponse = { id: 789, ...mockRequest }
      mockPayApi.mockResolvedValue(mockResponse)

      const { createEftRefund } = useEftRefund()
      const result = await createEftRefund(mockRequest)

      expect(result).toEqual(mockResponse)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: mockRequest }
      )
    })

    it('should include optional fields when provided', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'CHEQUE',
        refundAmount: 500,
        refundEmail: 'test@example.com',
        comment: 'Test refund',
        casSupplierNumber: 'SUP123',
        casSupplierSite: 'SITE1',
        entityName: 'Test Entity',
        street: '123 Main St',
        city: 'Vancouver',
        region: 'BC',
        country: 'CA',
        postalCode: 'V6B 1A1'
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: mockRequest }
      )
    })
  })

  describe('approveRefund', () => {
    it('should approve a refund', async () => {
      mockPayApi.mockResolvedValue({})

      const { approveRefund } = useEftRefund()
      await approveRefund(789)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        { method: 'PATCH', body: { status: EFTRefundStatus.APPROVED } }
      )
    })
  })

  describe('declineRefund', () => {
    it('should decline a refund without reason', async () => {
      mockPayApi.mockResolvedValue({})

      const { declineRefund } = useEftRefund()
      await declineRefund(789)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        {
          method: 'PATCH',
          body: { status: EFTRefundStatus.DECLINED, declineReason: undefined }
        }
      )
    })

    it('should decline a refund with reason', async () => {
      mockPayApi.mockResolvedValue({})

      const { declineRefund } = useEftRefund()
      await declineRefund(789, 'Invalid request')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        {
          method: 'PATCH',
          body: { status: EFTRefundStatus.DECLINED, declineReason: 'Invalid request' }
        }
      )
    })
  })

  describe('updateChequeStatus', () => {
    it('should update cheque status', async () => {
      mockPayApi.mockResolvedValue({})

      const { updateChequeStatus } = useEftRefund()
      await updateChequeStatus(789, 'PROCESSED')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        { method: 'PATCH', body: { chequeStatus: 'PROCESSED' } }
      )
    })

    it('should update to cheque undeliverable status', async () => {
      mockPayApi.mockResolvedValue({})

      const { updateChequeStatus } = useEftRefund()
      await updateChequeStatus(789, 'CHEQUE_UNDELIVERABLE')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        { method: 'PATCH', body: { chequeStatus: 'CHEQUE_UNDELIVERABLE' } }
      )
    })

    it('should handle API error during status update', async () => {
      mockPayApi.mockRejectedValue(new Error('Update failed'))

      const { updateChequeStatus } = useEftRefund()

      await expect(updateChequeStatus(789, 'PROCESSED')).rejects.toThrow('Update failed')
    })

    it('should update to MAILED status', async () => {
      mockPayApi.mockResolvedValue({})

      const { updateChequeStatus } = useEftRefund()
      await updateChequeStatus(456, 'MAILED')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/456',
        { method: 'PATCH', body: { chequeStatus: 'MAILED' } }
      )
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle network timeout', async () => {
      mockPayApi.mockRejectedValue(new Error('Network timeout'))

      const { getEftRefunds } = useEftRefund()

      await expect(getEftRefunds(123)).rejects.toThrow('Network timeout')
    })

    it('should handle malformed response', async () => {
      mockPayApi.mockResolvedValue('not an object')

      const { getEftRefunds } = useEftRefund()
      const result = await getEftRefunds(123)

      expect(result).toBe('not an object')
    })

    it('should handle large refund amounts', async () => {
      const largeAmount = 999999999.99
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: largeAmount,
        refundEmail: 'test@example.com',
        comment: 'Large refund'
      }
      mockPayApi.mockResolvedValue({ id: 1, ...mockRequest })

      const { createEftRefund } = useEftRefund()
      const result = await createEftRefund(mockRequest)

      expect(result.refundAmount).toBe(largeAmount)
    })

    it('should handle empty comment in refund request', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: 100,
        refundEmail: 'test@example.com',
        comment: ''
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: mockRequest }
      )
    })

    it('should handle special characters in email', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: 100,
        refundEmail: 'test+special@example.co.uk',
        comment: 'Test'
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: expect.objectContaining({ refundEmail: 'test+special@example.co.uk' }) }
      )
    })
  })

  describe('getEftRefunds with multiple status codes', () => {
    it('should handle APPROVED and DECLINED statuses', async () => {
      mockPayApi.mockResolvedValue([
        { id: 1, status: 'APPROVED' },
        { id: 2, status: 'DECLINED' }
      ])

      const { getEftRefunds } = useEftRefund()
      await getEftRefunds(123, ['APPROVED', 'DECLINED'])

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund?shortNameId=123&statuses=APPROVED%2CDECLINED',
        { method: 'GET' }
      )
    })

    it('should fetch all statuses with full list', async () => {
      mockPayApi.mockResolvedValue([])

      const { getEftRefunds } = useEftRefund()
      await getEftRefunds(123, ['PENDING_APPROVAL', 'APPROVED', 'DECLINED', 'REFUND_UPLOADED'])

      expect(mockPayApi).toHaveBeenCalledWith(
        expect.stringContaining('statuses=PENDING_APPROVAL%2CAPPROVED%2CDECLINED%2CREFUND_UPLOADED'),
        { method: 'GET' }
      )
    })
  })

  describe('createEftRefund validation scenarios', () => {
    it('should handle minimum refund amount', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: 0.01,
        refundEmail: 'test@example.com',
        comment: 'Minimum'
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: mockRequest }
      )
    })

    it('should handle CHEQUE method with full address', async () => {
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'CHEQUE',
        refundAmount: 1000,
        refundEmail: 'test@example.com',
        comment: 'Full address test',
        entityName: 'Company Inc.',
        street: '123 Main Street, Suite 500',
        city: 'Victoria',
        region: 'BC',
        country: 'Canada',
        postalCode: 'V8W 1A1'
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: mockRequest }
      )
    })

    it('should handle long comment text', async () => {
      const longComment = 'A'.repeat(500)
      const mockRequest = {
        shortNameId: 123,
        refundMethod: 'EFT',
        refundAmount: 100,
        refundEmail: 'test@example.com',
        comment: longComment
      }
      mockPayApi.mockResolvedValue({ id: 1 })

      const { createEftRefund } = useEftRefund()
      await createEftRefund(mockRequest)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund',
        { method: 'POST', body: expect.objectContaining({ comment: longComment }) }
      )
    })
  })

  describe('approveRefund scenarios', () => {
    it('should handle multiple rapid approval calls', async () => {
      mockPayApi.mockResolvedValue({})

      const { approveRefund } = useEftRefund()
      await Promise.all([
        approveRefund(1),
        approveRefund(2),
        approveRefund(3)
      ])

      expect(mockPayApi).toHaveBeenCalledTimes(3)
    })

    it('should throw error on approval failure', async () => {
      mockPayApi.mockRejectedValue(new Error('Approval failed'))

      const { approveRefund } = useEftRefund()

      await expect(approveRefund(999)).rejects.toThrow('Approval failed')
    })
  })

  describe('declineRefund scenarios', () => {
    it('should handle very long decline reason', async () => {
      const longReason = 'This is a very long decline reason. '.repeat(20)
      mockPayApi.mockResolvedValue({})

      const { declineRefund } = useEftRefund()
      await declineRefund(123, longReason)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/123',
        {
          method: 'PATCH',
          body: { status: EFTRefundStatus.DECLINED, declineReason: longReason }
        }
      )
    })

    it('should handle decline with special characters in reason', async () => {
      mockPayApi.mockResolvedValue({})

      const { declineRefund } = useEftRefund()
      await declineRefund(789, 'Declined: «Invalid» <reason>')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/shortname-refund/789',
        {
          method: 'PATCH',
          body: { status: EFTRefundStatus.DECLINED, declineReason: 'Declined: «Invalid» <reason>' }
        }
      )
    })
  })
})
