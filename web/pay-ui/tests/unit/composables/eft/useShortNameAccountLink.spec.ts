import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameAccountLink } from '~/composables/eft/useShortNameAccountLink'
import { ShortNameLinkStatus, ShortNamePaymentActions } from '~/utils/constants'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

describe('useShortNameAccountLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const shortNameId = ref(123)
    const creditsRemaining = ref(1000)
    const { links, loading, isLinked, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

    expect(links.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(isLinked.value).toBe(false)
    expect(processedRows.value).toEqual([])
  })

  describe('loadShortNameLinks', () => {
    it('should load links successfully', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          accountName: 'Test Account',
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [{ statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, links, isLinked } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(links.value).toEqual(mockLinks)
      expect(isLinked.value).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/123/links', { method: 'GET' })
    })

    it('should handle empty response', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, isLinked } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(isLinked.value).toBe(false)
    })

    it('should handle API error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, links } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(links.value).toEqual([])
      consoleSpy.mockRestore()
    })
  })

  describe('unlinkAccount', () => {
    it('should unlink account successfully', async () => {
      mockPayApi
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ items: [] })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { unlinkAccount } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await unlinkAccount(456)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/links/456',
        { method: 'PATCH', body: { statusCode: ShortNameLinkStatus.INACTIVE } }
      )
    })

    it('should return false on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { unlinkAccount } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await unlinkAccount(456)

      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('applyPayment', () => {
    it('should apply payment to account without statement', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await applyPayment(100)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.APPLY_CREDITS,
            accountId: '100'
          }
        }
      )
    })

    it('should apply payment to specific statement', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await applyPayment(100, 789)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.APPLY_CREDITS,
            accountId: '100',
            statementId: 789
          }
        }
      )
    })

    it('should return false on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await applyPayment(100)

      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('cancelPayment', () => {
    it('should cancel payment', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100, 789)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.CANCEL,
            accountId: 100,
            statementId: 789
          }
        }
      )
    })

    it('should return false on error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100)

      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('processedRows', () => {
    it('should create parent rows from links', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          accountName: 'Test Account',
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value).toHaveLength(1)
      expect(processedRows.value[0].isParentRow).toBe(true)
      expect(processedRows.value[0].amountOwing).toBe(500)
      expect(processedRows.value[0].hasMultipleStatements).toBe(false)
    })

    it('should calculate multiple statements correctly', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          accountName: 'Test Account',
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 300, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 },
            { statementId: 2, amountOwing: 200, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].hasMultipleStatements).toBe(true)
      expect(processedRows.value[0].amountOwing).toBe(500)
      expect(processedRows.value[0].unpaidStatementIds).toBe('1, 2')
    })

    it('should truncate unpaid statement IDs when more than 2', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 100, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 },
            { statementId: 2, amountOwing: 100, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 },
            { statementId: 3, amountOwing: 100, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].unpaidStatementIds).toBe('1, 2,...')
    })

    it('should detect pending payments', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 1, pendingPaymentsAmount: 200 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].hasPendingPayment).toBe(true)
      expect(processedRows.value[0].pendingPaymentAmountTotal).toBe(200)
    })

    it('should detect insufficient funds', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(100)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].hasInsufficientFunds).toBe(true)
      expect(processedRows.value[0].insufficientFundMessage).toBeDefined()
    })
  })

  describe('toggleStatementsView', () => {
    it('should expand and collapse statements', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 300, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 },
            { statementId: 2, amountOwing: 200, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const {
        loadShortNameLinks, processedRows, toggleStatementsView, isStatementsExpanded
      } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()
      expect(processedRows.value).toHaveLength(1)
      expect(isStatementsExpanded(100)).toBe(false)

      toggleStatementsView(100)
      expect(isStatementsExpanded(100)).toBe(true)
      expect(processedRows.value).toHaveLength(3)

      toggleStatementsView(100)
      expect(isStatementsExpanded(100)).toBe(false)
      expect(processedRows.value).toHaveLength(1)
    })
  })

  describe('showUnlinkAccountButton', () => {
    it('should return true when account can be unlinked', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showUnlinkAccountButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [{ statementId: 1, amountOwing: 0, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: false,
        hasInsufficientFunds: false,
        amountOwing: 0,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: ''
      }

      expect(showUnlinkAccountButton(item)).toBe(true)
    })

    it('should return false for child rows', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showUnlinkAccountButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: false,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: false,
        hasInsufficientFunds: false,
        amountOwing: 0,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: ''
      }

      expect(showUnlinkAccountButton(item)).toBe(false)
    })

    it('should return false when there are pending payments', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showUnlinkAccountButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [{ statementId: 1, amountOwing: 100, pendingPaymentsCount: 1, pendingPaymentsAmount: 50 }],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: true,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 100,
        pendingPaymentAmountTotal: 50,
        unpaidStatementIds: '1'
      }

      expect(showUnlinkAccountButton(item)).toBe(false)
    })
  })

  describe('showApplyPaymentButton', () => {
    it('should return true when payment can be applied', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showApplyPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 500,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: '1'
      }

      expect(showApplyPaymentButton(item)).toBe(true)
    })

    it('should return false when no amount owing', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showApplyPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: false,
        hasInsufficientFunds: false,
        amountOwing: 0,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: ''
      }

      expect(showApplyPaymentButton(item)).toBe(false)
    })

    it('should return false when there are pending payments', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showApplyPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: true,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 500,
        pendingPaymentAmountTotal: 200,
        unpaidStatementIds: '1'
      }

      expect(showApplyPaymentButton(item)).toBe(false)
    })
  })

  describe('showCancelPaymentButton', () => {
    it('should return true when payment can be cancelled', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showCancelPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: true,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 500,
        pendingPaymentAmountTotal: 200,
        unpaidStatementIds: '1'
      }

      expect(showCancelPaymentButton(item)).toBe(true)
    })

    it('should return false when multiple statements', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showCancelPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: true,
        hasPendingPayment: true,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 500,
        pendingPaymentAmountTotal: 200,
        unpaidStatementIds: '1, 2'
      }

      expect(showCancelPaymentButton(item)).toBe(false)
    })
  })

  describe('pendingRows', () => {
    it('should filter pending rows with amount owing', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: ShortNameLinkStatus.PENDING,
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        },
        {
          id: 2,
          accountId: 101,
          shortNameId: 123,
          statusCode: ShortNameLinkStatus.LINKED,
          statementsOwing: [
            { statementId: 2, amountOwing: 300, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, pendingRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(pendingRows.value).toHaveLength(1)
      expect(pendingRows.value[0].statusCode).toBe(ShortNameLinkStatus.PENDING)
    })

    it('should filter out rows with zero amount owing', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: ShortNameLinkStatus.PENDING,
          statementsOwing: [
            { statementId: 1, amountOwing: 0, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, pendingRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(pendingRows.value).toHaveLength(0)
    })

    it('should return empty array when no pending links', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: ShortNameLinkStatus.LINKED,
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, pendingRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(pendingRows.value).toHaveLength(0)
    })
  })

  describe('edge cases and error scenarios', () => {
    it('should handle empty statements owing array', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          accountName: 'Test',
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: []
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value).toHaveLength(1)
      expect(processedRows.value[0].amountOwing).toBe(0)
    })

    it('should handle negative pending payment amounts', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 1, pendingPaymentsAmount: -100 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].pendingPaymentAmountTotal).toBe(-100)
    })

    it('should handle zero pending payment count with amount', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 100 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].hasPendingPayment).toBe(false)
    })

    it('should handle insufficient funds with exact match', async () => {
      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: [
            { statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }
          ]
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(500)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].hasInsufficientFunds).toBe(false)
    })

    it('should reload when shortNameId changes', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()
      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/123/links', { method: 'GET' })

      mockPayApi.mockClear()
      shortNameId.value = 456
      await loadShortNameLinks()
      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/456/links', { method: 'GET' })
    })

    it('should handle very large statement IDs list', async () => {
      const statements = Array.from({ length: 10 }, (_, i) => ({
        statementId: i + 1,
        amountOwing: 100,
        pendingPaymentsCount: 0,
        pendingPaymentsAmount: 0
      }))

      const mockLinks = [
        {
          id: 1,
          accountId: 100,
          shortNameId: 123,
          statusCode: 'LINKED',
          statementsOwing: statements
        }
      ]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(5000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value[0].unpaidStatementIds).toBe('1, 2,...')
    })
  })

  describe('apply payment with statement ID', () => {
    it('should apply payment to specific statement when provided', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await applyPayment(100, 555)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.APPLY_CREDITS,
            accountId: '100',
            statementId: 555
          }
        }
      )
    })

    it('should handle apply payment with zero statement ID', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await applyPayment(100, 0)

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.APPLY_CREDITS,
            accountId: '100',
            statementId: 0
          }
        }
      )
    })
  })

  describe('cancel payment scenarios', () => {
    it('should cancel payment without statement ID', async () => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.CANCEL,
            accountId: 100,
            statementId: undefined
          }
        }
      )
    })

    it('should handle cancel payment API error', async () => {
      mockPayApi.mockRejectedValue(new Error('Cancel failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100, 789)

      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('button visibility logic', () => {
    it('should show unlink button for parent row with no amounts', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showUnlinkAccountButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: true,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: false,
        hasInsufficientFunds: false,
        amountOwing: 0,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: ''
      }

      expect(showUnlinkAccountButton(item)).toBe(true)
    })

    it('should show apply payment for child rows', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showApplyPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: false,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 250,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: '1',
        statementId: 1
      }

      expect(showApplyPaymentButton(item)).toBe(true)
    })

    it('should show cancel button for child rows with pending', () => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { showCancelPaymentButton } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const item = {
        id: 1,
        accountId: 100,
        shortNameId: 123,
        statusCode: 'LINKED',
        statementsOwing: [],
        isParentRow: false,
        hasMultipleStatements: false,
        hasPendingPayment: true,
        hasPayableStatement: true,
        hasInsufficientFunds: false,
        amountOwing: 250,
        pendingPaymentAmountTotal: 100,
        unpaidStatementIds: '1',
        statementId: 1
      }

      expect(showCancelPaymentButton(item)).toBe(true)
    })
  })
})
