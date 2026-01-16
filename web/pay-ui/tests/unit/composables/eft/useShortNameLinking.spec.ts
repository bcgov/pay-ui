import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameLinking } from '~/composables/eft/useShortNameLinking'
import { ShortNameResponseStatus } from '~/utils/constants'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

describe('useShortNameLinking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatementsSummary', () => {
    it('should return total due amount', async () => {
      mockPayApi.mockResolvedValue({ totalDue: 1500.50 })

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(1500.50)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/accounts/ACC123/statements/summary',
        { method: 'GET' }
      )
    })

    it('should return 0 when totalDue is missing', async () => {
      mockPayApi.mockResolvedValue({})

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(0)
    })

    it('should return 0 on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(0)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getStatementId', () => {
    it('should return the first statement ID', async () => {
      mockPayApi.mockResolvedValue({ items: [{ id: 456 }, { id: 789 }] })

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBe(456)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/accounts/ACC123/statements?page=1&limit=1',
        { method: 'GET' }
      )
    })

    it('should return null when no statements exist', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBeNull()
      consoleSpy.mockRestore()
    })
  })

  describe('searchEftAccounts', () => {
    it('should search and return accounts', async () => {
      const mockAccounts = [
        { accountId: 'ACC1', accountName: 'Account 1' },
        { accountId: 'ACC2', accountName: 'Account 2' }
      ]
      mockPayApi.mockResolvedValue({ items: mockAccounts })

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('test query')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        accountId: 'ACC1',
        accountName: 'Account 1',
        statusCode: undefined,
        totalDue: 0
      })
    })

    it('should encode search query', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const { searchEftAccounts } = useShortNameLinking()
      await searchEftAccounts('test & special')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/accounts/search/eft?searchText=test%20%26%20special',
        { method: 'GET' }
      )
    })

    it('should return empty array when no accounts found', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('nonexistent')

      expect(result).toEqual([])
    })

    it('should return empty array on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('test')

      expect(result).toEqual([])
      consoleSpy.mockRestore()
    })
  })

  describe('getAccountLinkDetails', () => {
    it('should fetch details for multiple accounts', async () => {
      const accountIds = ['ACC1', 'ACC2']
      mockPayApi
        .mockResolvedValueOnce({
          items: [
            { accountId: 'ACC1', statusCode: 'LINKED' }
          ]
        })
        .mockResolvedValueOnce({ totalDue: 100 })
        .mockResolvedValueOnce({ totalDue: 200 })

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(accountIds)

      expect(result.get('ACC1')).toEqual({ statusCode: 'LINKED', totalDue: 100 })
      expect(result.get('ACC2')).toEqual({ statusCode: undefined, totalDue: 200 })
    })

    it('should return empty map on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(['ACC1'])

      expect(result.size).toBe(0)
      consoleSpy.mockRestore()
    })
  })

  describe('linkShortNameToAccount', () => {
    it('should successfully link short name to account', async () => {
      const mockResponse = { shortNameId: 123, accountId: 'ACC1' }
      mockPayApi.mockResolvedValue(mockResponse)

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result).toEqual({ success: true, data: mockResponse })
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/links',
        { method: 'POST', body: { accountId: 'ACC1' } }
      )
    })

    it('should handle already mapped error', async () => {
      const mockError = {
        response: {
          data: { type: ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED }
        }
      }
      mockPayApi.mockRejectedValue(mockError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe(ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED)
      consoleSpy.mockRestore()
    })

    it('should handle unknown error', async () => {
      mockPayApi.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('UNKNOWN_ERROR')
      consoleSpy.mockRestore()
    })
  })

  describe('isAlreadyMappedError', () => {
    it('should return true for already mapped error', () => {
      const { isAlreadyMappedError } = useShortNameLinking()
      const result = isAlreadyMappedError(ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED)
      expect(result).toBe(true)
    })

    it('should return false for other errors', () => {
      const { isAlreadyMappedError } = useShortNameLinking()
      expect(isAlreadyMappedError('SOME_OTHER_ERROR')).toBe(false)
      expect(isAlreadyMappedError(undefined)).toBe(false)
    })
  })

  describe('getStatementsSummary edge cases', () => {
    it('should handle null response', async () => {
      mockPayApi.mockResolvedValue(null)

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(0)
    })

    it('should handle zero totalDue', async () => {
      mockPayApi.mockResolvedValue({ totalDue: 0 })

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(0)
    })

    it('should handle negative totalDue', async () => {
      mockPayApi.mockResolvedValue({ totalDue: -50.25 })

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(-50.25)
    })

    it('should handle very large totalDue', async () => {
      mockPayApi.mockResolvedValue({ totalDue: 9999999.99 })

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(9999999.99)
    })
  })

  describe('searchEftAccounts advanced scenarios', () => {
    it('should handle empty search query', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('')

      expect(mockPayApi).toHaveBeenCalledWith(
        '/accounts/search/eft?searchText=',
        { method: 'GET' }
      )
      expect(result).toEqual([])
    })

    it('should handle search with special characters', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const { searchEftAccounts } = useShortNameLinking()
      await searchEftAccounts('test@#$%^&*()')

      expect(mockPayApi).toHaveBeenCalled()
    })

    it('should handle very long search query', async () => {
      const longQuery = 'a'.repeat(500)
      mockPayApi.mockResolvedValue({ items: [] })

      const { searchEftAccounts } = useShortNameLinking()
      await searchEftAccounts(longQuery)

      expect(mockPayApi).toHaveBeenCalled()
    })

    it('should handle accounts with missing fields', async () => {
      const mockAccounts = [
        { accountId: 'ACC1' },
        { accountName: 'Account 2' }
      ]
      mockPayApi.mockResolvedValue({ items: mockAccounts })

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('test')

      expect(result).toHaveLength(2)
      expect(result[0].accountId).toBe('ACC1')
      expect(result[1].accountName).toBe('Account 2')
    })

    it('should handle malformed API response', async () => {
      mockPayApi.mockResolvedValue({ wrongField: [] })

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('test')

      expect(result).toEqual([])
    })
  })

  describe('getAccountLinkDetails complex scenarios', () => {
    it('should handle empty account IDs array', async () => {
      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails([])

      expect(result.size).toBe(0)
    })

    it('should handle single account', async () => {
      mockPayApi
        .mockResolvedValueOnce({ items: [{ accountId: 'ACC1', statusCode: 'LINKED' }] })
        .mockResolvedValueOnce({ totalDue: 500 })

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(['ACC1'])

      expect(result.size).toBe(1)
      expect(result.get('ACC1')).toEqual({ statusCode: 'LINKED', totalDue: 500 })
    })

    it('should handle many accounts', async () => {
      const accountIds = Array.from({ length: 10 }, (_, i) => `ACC${i + 1}`)

      mockPayApi.mockResolvedValueOnce({ items: [] })
      accountIds.forEach(() => {
        mockPayApi.mockResolvedValueOnce({ totalDue: 100 })
      })

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(accountIds)

      expect(result.size).toBe(10)
    })

    it('should handle partial API failures gracefully', async () => {
      mockPayApi
        .mockResolvedValueOnce({ items: [{ accountId: 'ACC1', statusCode: 'LINKED' }] })
        .mockResolvedValueOnce({ totalDue: 100 })
        .mockRejectedValueOnce(new Error('Failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(['ACC1', 'ACC2'])

      expect(result.size).toBe(2)
      expect(result.get('ACC1')).toEqual({ statusCode: 'LINKED', totalDue: 100 })
      expect(result.get('ACC2')).toEqual({ statusCode: undefined, totalDue: 0 })
      consoleSpy.mockRestore()
    })
  })

  describe('getStatementId edge cases', () => {
    it('should handle null items in response', async () => {
      mockPayApi.mockResolvedValue({ items: null })

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBeNull()
    })

    it('should handle undefined items in response', async () => {
      mockPayApi.mockResolvedValue({})

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBeNull()
    })

    it('should handle statement with missing id', async () => {
      mockPayApi.mockResolvedValue({ items: [{ amount: 100 }] })

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBeNull()
    })
  })

  describe('linkShortNameToAccount advanced scenarios', () => {
    it('should handle numeric account ID', async () => {
      mockPayApi.mockResolvedValue({ shortNameId: 123, accountId: 456 })

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 456 as number)

      expect(result.success).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/links',
        { method: 'POST', body: { accountId: 456 } }
      )
    })

    it('should handle error without response data', async () => {
      mockPayApi.mockRejectedValue(new Error('Simple error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('UNKNOWN_ERROR')
      consoleSpy.mockRestore()
    })

    it('should handle error with different status code', async () => {
      const mockError = {
        response: {
          data: { type: 'DIFFERENT_ERROR' }
        }
      }
      mockPayApi.mockRejectedValue(mockError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('DIFFERENT_ERROR')
      consoleSpy.mockRestore()
    })

    it('should handle network timeout', async () => {
      mockPayApi.mockRejectedValue({ code: 'ECONNABORTED' })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      consoleSpy.mockRestore()
    })
  })
})
