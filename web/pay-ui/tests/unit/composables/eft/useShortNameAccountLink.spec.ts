import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameAccountLink } from '~/composables/eft/useShortNameAccountLink'
import { ShortNameLinkStatus, ShortNamePaymentActions } from '~/utils/constants'

const mockPayApi = vi.fn()
const mockToast = { add: vi.fn() }

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

mockNuxtImport('useToast', () => () => mockToast)

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
    it.each([
      ['with links', [{ id: 1, accountId: 100, accountName: 'Test Account', shortNameId: 123, statusCode: 'LINKED', statementsOwing: [{ statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 0 }] }], true, '/eft-shortnames/123/links'],
      ['empty response', [], false, '/eft-shortnames/123/links']
    ])('should load links %s', async (_, mockLinks, expectedIsLinked, expectedUrl) => {
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, links, isLinked } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(links.value).toEqual(mockLinks)
      expect(isLinked.value).toBe(expectedIsLinked)
      expect(mockPayApi).toHaveBeenCalledWith(expectedUrl, { method: 'GET' })
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
      mockPayApi.mockResolvedValueOnce({}).mockResolvedValueOnce({ items: [] })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { unlinkAccount } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await unlinkAccount(456)

      expect(result).toBe(true)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/links/456',
        { method: 'PATCH', body: { statusCode: ShortNameLinkStatus.INACTIVE } }
      )
      expect(mockToast.add).toHaveBeenCalledWith({
        description: 'Account unlinked successfully.',
        icon: 'i-mdi-check-circle',
        color: 'success'
      })
    })

    it('should handle unlink error with specific EFT error message', async () => {
      const eftError = {
        response: {
          _data: {
            type: 'EFT_SHORT_NAME_LINK_INVALID_STATUS'
          }
        }
      }
      mockPayApi.mockRejectedValue(eftError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { unlinkAccount } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await unlinkAccount(456)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        description: 'Invalid status for linking this short name.',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      consoleSpy.mockRestore()
    })
  })

  describe('applyPayment', () => {
    it.each([
      ['without statement', undefined, { action: ShortNamePaymentActions.APPLY_CREDITS, accountId: '100' }, true],
      ['to specific statement', 789, { action: ShortNamePaymentActions.APPLY_CREDITS, accountId: '100', statementId: 789 }, true],
      ['with zero statement ID', 0, { action: ShortNamePaymentActions.APPLY_CREDITS, accountId: '100', statementId: 0 }, true]
    ])('should apply payment %s', async (_, statementId, expectedBody, expectedResult) => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await applyPayment(100, statementId)

      expect(result).toBe(expectedResult)
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123/payment',
        { method: 'POST', body: expectedBody }
      )
    })

    it('should handle error with specific EFT error message', async () => {
      const eftError = {
        response: {
          _data: {
            type: 'EFT_INSUFFICIENT_CREDITS'
          }
        }
      }
      mockPayApi.mockRejectedValue(eftError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { applyPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await applyPayment(100)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        description: 'Insufficient credits available for this refund.',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
      consoleSpy.mockRestore()
    })
  })

  describe('cancelPayment', () => {
    it.each([
      ['with statement ID', 789, { action: ShortNamePaymentActions.CANCEL, accountId: 100, statementId: 789 }, true],
      ['without statement ID', undefined, { action: ShortNamePaymentActions.CANCEL, accountId: 100, statementId: undefined }, true]
    ])('should cancel payment %s', async (_, statementId, expectedBody, expectedResult) => {
      mockPayApi.mockResolvedValue({})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100, statementId)

      expect(result).toBe(expectedResult)
      expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/123/payment', { method: 'POST', body: expectedBody })
    })

    it('should handle error with specific EFT error message', async () => {
      const eftError = {
        response: {
          _data: {
            type: 'EFT_PAYMENT_ACTION_UNSUPPORTED'
          }
        }
      }
      mockPayApi.mockRejectedValue(eftError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { cancelPayment } = useShortNameAccountLink(shortNameId, creditsRemaining)

      const result = await cancelPayment(100)

      expect(result).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        description: 'This payment action is not supported.',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
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

  describe('button visibility', () => {
    const baseItem = {
      id: 1,
      accountId: 100,
      shortNameId: 123,
      statusCode: 'LINKED',
      statementsOwing: [],
      hasInsufficientFunds: false,
      unpaidStatementIds: ''
    }

    it.each([
      ['showUnlinkAccountButton', 'parent row no amounts', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: false, hasPayableStatement: false, amountOwing: 0, pendingPaymentAmountTotal: 0 }, true],
      ['showUnlinkAccountButton', 'child rows', { ...baseItem, isParentRow: false, hasMultipleStatements: false, hasPendingPayment: false, hasPayableStatement: false, amountOwing: 0, pendingPaymentAmountTotal: 0 }, false],
      ['showUnlinkAccountButton', 'pending payments', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: true, hasPayableStatement: true, amountOwing: 100, pendingPaymentAmountTotal: 50 }, false],
      ['showApplyPaymentButton', 'parent can apply', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: false, hasPayableStatement: true, amountOwing: 500, pendingPaymentAmountTotal: 0, statementId: 1 }, true],
      ['showApplyPaymentButton', 'child can apply', { ...baseItem, isParentRow: false, hasMultipleStatements: false, hasPendingPayment: false, hasPayableStatement: true, amountOwing: 250, pendingPaymentAmountTotal: 0, statementId: 1 }, true],
      ['showApplyPaymentButton', 'no amount owing', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: false, hasPayableStatement: false, amountOwing: 0, pendingPaymentAmountTotal: 0 }, false],
      ['showApplyPaymentButton', 'pending payments', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: true, hasPayableStatement: true, amountOwing: 500, pendingPaymentAmountTotal: 200 }, false],
      ['showCancelPaymentButton', 'can cancel', { ...baseItem, isParentRow: true, hasMultipleStatements: false, hasPendingPayment: true, hasPayableStatement: true, amountOwing: 500, pendingPaymentAmountTotal: 200 }, true],
      ['showCancelPaymentButton', 'child can cancel', { ...baseItem, isParentRow: false, hasMultipleStatements: false, hasPendingPayment: true, hasPayableStatement: true, amountOwing: 250, pendingPaymentAmountTotal: 100, statementId: 1 }, true],
      ['showCancelPaymentButton', 'multiple statements', { ...baseItem, isParentRow: true, hasMultipleStatements: true, hasPendingPayment: true, hasPayableStatement: true, amountOwing: 500, pendingPaymentAmountTotal: 200 }, false]
    ])('%s should handle %s', (method, _, item, expected) => {
      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const composable = useShortNameAccountLink(shortNameId, creditsRemaining) as any

      expect(composable[method](item)).toBe(expected)
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

  describe('edge cases', () => {
    it.each([
      ['empty statements owing', [], 0],
      ['negative pending payment', [{ statementId: 1, amountOwing: 500, pendingPaymentsCount: 1, pendingPaymentsAmount: -100 }], -100],
      ['zero pending count with amount', [{ statementId: 1, amountOwing: 500, pendingPaymentsCount: 0, pendingPaymentsAmount: 100 }], 100]
    ])('should handle %s', async (_, statementsOwing, expectedValue) => {
      const mockLinks = [{ id: 1, accountId: 100, shortNameId: 123, statusCode: 'LINKED', statementsOwing }]
      mockPayApi.mockResolvedValue({ items: mockLinks })

      const shortNameId = ref(123)
      const creditsRemaining = ref(1000)
      const { loadShortNameLinks, processedRows } = useShortNameAccountLink(shortNameId, creditsRemaining)

      await loadShortNameLinks()

      expect(processedRows.value).toHaveLength(1)
      if (statementsOwing.length === 0) {
        expect(processedRows.value[0]?.amountOwing).toBe(expectedValue)
      } else {
        expect(processedRows.value[0]?.pendingPaymentAmountTotal).toBe(expectedValue)
      }
    })

    it('should handle shortNameId changes', async () => {
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
  })
})
