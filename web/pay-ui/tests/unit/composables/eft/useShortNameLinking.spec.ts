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
    it.each([
      ['with totalDue', { totalDue: 1500.50 }, 1500.50],
      ['missing totalDue', {}, 0],
      ['null response', null, 0],
      ['zero totalDue', { totalDue: 0 }, 0],
      ['negative totalDue', { totalDue: -50.25 }, -50.25],
      ['large totalDue', { totalDue: 9999999.99 }, 9999999.99]
    ])('should handle %s', async (_, mockResponse, expected) => {
      mockPayApi.mockResolvedValue(mockResponse)

      const { getStatementsSummary } = useShortNameLinking()
      const result = await getStatementsSummary('ACC123')

      expect(result).toBe(expected)
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
    it.each([
      ['with statements', { items: [{ id: 456 }, { id: 789 }] }, 456],
      ['no statements', { items: [] }, null],
      ['null items', { items: null }, null],
      ['undefined items', {}, null],
      ['missing id', { items: [{ amount: 100 }] }, null]
    ])('should handle %s', async (_, mockResponse, expected) => {
      mockPayApi.mockResolvedValue(mockResponse)

      const { getStatementId } = useShortNameLinking()
      const result = await getStatementId('ACC123')

      expect(result).toBe(expected)
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
    it.each([
      ['with results', { items: [{ accountId: 'ACC1', accountName: 'Account 1' }] }, 1],
      ['no accounts', { items: [] }, 0],
      ['missing fields', { items: [{ accountId: 'ACC1' }, { accountName: 'Account 2' }] }, 2],
      ['malformed response', { wrongField: [] }, 0]
    ])('should handle %s', async (_, mockResponse, expectedLength) => {
      mockPayApi.mockResolvedValue(mockResponse)

      const { searchEftAccounts } = useShortNameLinking()
      const result = await searchEftAccounts('test')

      expect(result).toHaveLength(expectedLength)
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
    it.each([
      ['multiple accounts', ['ACC1', 'ACC2'], 2],
      ['single account', ['ACC1'], 1],
      ['empty array', [], 0]
    ])('should handle %s', async (_, accountIds, expectedSize) => {
      mockPayApi.mockResolvedValueOnce({ items: [{ accountId: 'ACC1', statusCode: 'LINKED' }] })
      accountIds.forEach(() => mockPayApi.mockResolvedValueOnce({ totalDue: 100 }))

      const { getAccountLinkDetails } = useShortNameLinking()
      const result = await getAccountLinkDetails(accountIds)

      expect(result.size).toBe(expectedSize)
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
    })

    it.each([
      ['already mapped', { response: { data: { type: ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED } } }, ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED],
      ['different error', { response: { data: { type: 'DIFFERENT_ERROR' } } }, 'DIFFERENT_ERROR'],
      ['unknown error', new Error('Network error'), 'UNKNOWN_ERROR'],
      ['network timeout', { code: 'ECONNABORTED' }, 'UNKNOWN_ERROR']
    ])('should handle %s', async (_, mockError, expectedErrorType) => {
      mockPayApi.mockRejectedValue(mockError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { linkShortNameToAccount } = useShortNameLinking()
      const result = await linkShortNameToAccount(123, 'ACC1')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe(expectedErrorType)
      consoleSpy.mockRestore()
    })
  })

  describe('isAlreadyMappedError', () => {
    it.each([
      [ShortNameResponseStatus.EFT_SHORT_NAME_ALREADY_MAPPED, true],
      ['SOME_OTHER_ERROR', false],
      [undefined, false]
    ])('should return %s for %s', (errorType, expected) => {
      const { isAlreadyMappedError } = useShortNameLinking()
      expect(isAlreadyMappedError(errorType)).toBe(expected)
    })
  })
})
