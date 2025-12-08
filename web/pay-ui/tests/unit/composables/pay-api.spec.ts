import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { SlipStatus } from '~/enums/slip-status'
import { PatchActions } from '~/utils/constants'
import type { RoutingSlip, Payment } from '~/interfaces/routing-slip'

const {
  mockPayApi,
  mockCreateQueryParams
} = vi.hoisted(() => {
  const mockPayApi = vi.fn()
  const mockCreateQueryParams = vi.fn((params: Record<string, string>) => {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
  })

  return {
    mockPayApi,
    mockCreateQueryParams
  }
})

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    createQueryParams: mockCreateQueryParams
  }
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

  describe('createRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const routingSlipRequest: RoutingSlip = { number: '123456', status: 'ACTIVE' }
      const mockResponse: RoutingSlip = { number: '123456', status: 'ACTIVE' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.createRoutingSlip(routingSlipRequest)

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips', {
        method: 'POST',
        body: routingSlipRequest
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('adjustRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const payments: Payment[] = [{ chequeReceiptNumber: 'CHQ001', paidAmount: 100 }]
      const mockResponse: RoutingSlip = { number: '123456', status: 'ACTIVE', payments }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.adjustRoutingSlip(payments, '123456')

      expect(mockPayApi).toHaveBeenCalledWith(
        `/fas/routing-slips/123456?action=${PatchActions.UPDATE_STATUS}`,
        {
          method: 'PATCH',
          body: {
            status: SlipStatus.CORRECTION,
            payments
          }
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateRoutingSlipStatus', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const mockResponse = { number: '123456', status: 'COMPLETE' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.updateRoutingSlipStatus('COMPLETE', '123456')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/fas/routing-slips/123456?action=updateStatus',
        {
          method: 'PATCH',
          body: { status: 'COMPLETE' }
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateRoutingSlipRefundStatus', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const mockResponse = { number: '123456', status: 'REFUND_REQUESTED' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.updateRoutingSlipRefundStatus('AUTHORIZED', '123456')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/fas/routing-slips/123456?action=updateRefundStatus',
        {
          method: 'PATCH',
          body: { refund_status: 'AUTHORIZED' }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle error and throw', async () => {
      const mockError = new Error('API Error')
      mockPayApi.mockRejectedValue(mockError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(payApi.updateRoutingSlipRefundStatus('AUTHORIZED', '123456')).rejects.toThrow(mockError)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Routing slip refund status update failed', mockError)
      consoleErrorSpy.mockRestore()
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

  describe('getRoutingSlipComments', () => {
    it('should call $payApi with correct url', async () => {
      const mockResponse = { comments: [{ id: 1, comment: 'Test comment' }] }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.getRoutingSlipComments('123456')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/123456/comments')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateRoutingSlipComments', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const data = { comment: { businessId: '123456', comment: 'Test comment' } }
      const mockResponse = { id: 1, comment: 'Test comment' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.updateRoutingSlipComments(data, '123456')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/123456/comments', {
        method: 'POST',
        body: data
      })
      expect(result).toEqual(mockResponse)
    })

    it('should return null when response is falsy', async () => {
      const data = { comment: { businessId: '123456', comment: 'Test comment' } }
      mockPayApi.mockResolvedValue(null)

      const result = await payApi.updateRoutingSlipComments(data, '123456')

      expect(result).toBeNull()
    })

    it('should throw error when API call fails', async () => {
      const data = { comment: { businessId: '123456', comment: 'Test comment' } }
      const mockError = new Error('API Error')
      mockPayApi.mockRejectedValue(mockError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(payApi.updateRoutingSlipComments(data, '123456')).rejects.toThrow(mockError)
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('updateRoutingSlipRefund', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const details = JSON.stringify({ status: 'REFUND_REQUESTED' })
      const mockResponse = { success: true }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.updateRoutingSlipRefund(details, '123456')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/123456/refunds', {
        method: 'POST',
        body: details
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSearchRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const searchParams = { routingSlipNumber: '123456' }
      const mockResponse = { items: [{ number: '123456' }], total: 1 }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.getSearchRoutingSlip(searchParams)

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/queries', {
        method: 'POST',
        body: searchParams
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('saveLinkRoutingSlip', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const linkParams = { childRoutingSlipNumber: 'child123', parentRoutingSlipNumber: 'parent456' }
      mockPayApi.mockResolvedValue(undefined)

      await payApi.saveLinkRoutingSlip(linkParams)

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/links', {
        method: 'POST',
        body: linkParams
      })
    })
  })

  describe('getLinkedRoutingSlips', () => {
    it('should call $payApi with correct url and method', async () => {
      const mockResponse = { children: [{ number: 'child123' }], parent: { number: 'parent456' } }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.getLinkedRoutingSlips('123456')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/123456/links', {
        method: 'GET'
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getDailyReport', () => {
    it('should call $payApi with correct url, method and headers', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })
      mockPayApi.mockResolvedValue(mockBlob)

      const result = await payApi.getDailyReport('2025-01-01')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/2025-01-01/reports', {
        method: 'POST',
        headers: { Accept: 'application/pdf' }
      })
      expect(result).toEqual(mockBlob)
    })

    it('should use custom type when provided', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' })
      mockPayApi.mockResolvedValue(mockBlob)

      await payApi.getDailyReport('2025-01-01', 'text/csv')

      expect(mockPayApi).toHaveBeenCalledWith('/fas/routing-slips/2025-01-01/reports', {
        method: 'POST',
        headers: { Accept: 'text/csv' }
      })
    })
  })

  describe('getSearchFilingType', () => {
    it('should call $payApi with correct url and return items', async () => {
      const mockResponse = {
        items: [
          { filingTypeCode: { code: 'OTANN', description: 'Annual Report' } },
          { filingTypeCode: { code: 'OTADD', description: 'Address Change' } }
        ]
      }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.getSearchFilingType('annual')

      expect(mockPayApi).toHaveBeenCalledWith('/fees/schedules?description=annual', {
        method: 'GET'
      })
      expect(result).toEqual(mockResponse.items)
    })
  })

  describe('getFeeByCorpTypeAndFilingType', () => {
    it('should call $payApi with correct url and query params', async () => {
      const mockResponse = { total: 100.50, fees: [] }
      mockPayApi.mockResolvedValue(mockResponse)
      mockCreateQueryParams.mockReturnValue('quantity=1&priority=false')

      const params = {
        corpTypeCode: 'BC',
        filingTypeCode: 'OTANN',
        requestParams: { quantity: 1, priority: false }
      }

      const result = await payApi.getFeeByCorpTypeAndFilingType(params)

      expect(mockCreateQueryParams).toHaveBeenCalledWith({ quantity: 1, priority: false } as
        unknown as Record<string, string>)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/fees/BC/OTANN?quantity=1&priority=false',
        { method: 'GET' }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('saveManualTransactions', () => {
    it('should call $payApi with correct url, method and payload', async () => {
      const transactions = {
        businessInfo: { corpType: 'BC' },
        filingInfo: { filingTypes: [{ filingTypeCode: 'OTANN' }] },
        accountInfo: { routingSlip: '123456' }
      }
      const mockResponse = { id: 1, invoiceNumber: 'INV001' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.saveManualTransactions(transactions)

      expect(mockPayApi).toHaveBeenCalledWith('/payment-requests', {
        method: 'POST',
        body: transactions
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('cancelRoutingSlipInvoice', () => {
    it('should call $payApi with correct url and method', async () => {
      const mockResponse = { success: true, message: 'Invoice cancelled' }
      mockPayApi.mockResolvedValue(mockResponse)

      const result = await payApi.cancelRoutingSlipInvoice(123)

      expect(mockPayApi).toHaveBeenCalledWith('/payment-requests/123/refunds', {
        method: 'POST'
      })
      expect(result).toEqual(mockResponse)
    })
  })
})
