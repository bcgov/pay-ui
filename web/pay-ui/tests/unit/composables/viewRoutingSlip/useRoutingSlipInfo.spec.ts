import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRoutingSlipInfo } from '~/composables/viewRoutingSlip/useRoutingSlipInfo'
import type { Refund } from '~/interfaces/routing-slip'
import { SlipStatus } from '~/enums/slip-status'

const {
  _mockUpdateRoutingSlipStatus,
  _mockUpdateRoutingSlipRefundStatus,
  _mockGetRoutingSlip,
  _mockUpdateRoutingSlipComments,
  mockUseRoutingSlip,
  _mockToggleLoading,
  mockUseLoader,
  _mockOpenPlaceRoutingSlipToNSFModal,
  _mockOpenVoidRoutingSlipModal,
  _mockOpenErrorDialog,
  mockUsePayModals,
  mockUsePayApi,
  mockInvoiceCount
} = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ref } = require('vue')
  const _mockUpdateRoutingSlipStatus = vi.fn()
  const _mockUpdateRoutingSlipRefundStatus = vi.fn()
  const _mockGetRoutingSlip = vi.fn()
  const _mockUpdateRoutingSlipComments = vi.fn()
  const mockInvoiceCount = ref(0)

  const mockUseRoutingSlip = {
    updateRoutingSlipStatus: _mockUpdateRoutingSlipStatus,
    updateRoutingSlipRefundStatus: _mockUpdateRoutingSlipRefundStatus,
    getRoutingSlip: _mockGetRoutingSlip,
    updateRoutingSlipComments: _mockUpdateRoutingSlipComments,
    invoiceCount: mockInvoiceCount
  }

  const _mockToggleLoading = vi.fn()
  const mockUseLoader = {
    toggleLoading: _mockToggleLoading
  }

  const _mockOpenPlaceRoutingSlipToNSFModal = vi.fn()
  const _mockOpenVoidRoutingSlipModal = vi.fn()
  const _mockOpenErrorDialog = vi.fn()
  const mockUsePayModals = {
    openPlaceRoutingSlipToNSFModal: _mockOpenPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal: _mockOpenVoidRoutingSlipModal,
    openErrorDialog: _mockOpenErrorDialog
  }

  const mockUsePayApi = {
    updateRoutingSlipRefund: vi.fn()
  }

  return {
    _mockUpdateRoutingSlipStatus,
    _mockUpdateRoutingSlipRefundStatus,
    _mockGetRoutingSlip,
    _mockUpdateRoutingSlipComments,
    mockUseRoutingSlip,
    _mockToggleLoading,
    mockUseLoader,
    _mockOpenPlaceRoutingSlipToNSFModal,
    _mockOpenVoidRoutingSlipModal,
    _mockOpenErrorDialog,
    mockUsePayModals,
    mockUsePayApi,
    mockInvoiceCount
  }
})

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('usePayModals', () => () => mockUsePayModals)
mockNuxtImport('usePayApi', () => () => mockUsePayApi)
mockNuxtImport('useI18n', () => () => ({
  t: (key: string, fallback?: string) => fallback || key
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => mockUseLoader
}))

const mockStore = {
  routingSlip: {
    number: '123456',
    status: 'ACTIVE',
    createdOn: '2025-01-01T00:00:00Z',
    paymentAccount: {
      accountName: 'Test Account'
    },
    contactName: 'Test Contact',
    mailingAddress: undefined,
    refunds: [] as Refund[],
    allowedStatuses: ['ACTIVE', 'HOLD'],
    refundAmount: null as number | null,
    remainingAmount: null as number | null,
    refundStatus: null as string | null
  }
}

vi.mock('~/stores/routing-slip-store', () => ({
  useRoutingSlipStore: () => ({
    store: mockStore
  })
}))

describe('useRoutingSlipInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoiceCount.value = 0
    mockStore.routingSlip = {
      number: '123456',
      status: 'ACTIVE',
      createdOn: '2025-01-01T00:00:00Z',
      paymentAccount: {
        accountName: 'Test Account'
      },
      contactName: 'Test Contact',
      mailingAddress: undefined,
      refunds: [],
      allowedStatuses: ['ACTIVE', 'HOLD'],
      refundAmount: null,
      remainingAmount: null,
      refundStatus: null
    }
  })

  it('should be defined', () => {
    const composable = useRoutingSlipInfo()
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.routingSlip).toBeDefined()
    expect(composable.formattedDate).toBeDefined()
    expect(composable.statusColor).toBeDefined()
    expect(composable.statusLabel).toBeDefined()
    expect(composable.entityNumber).toBeDefined()
    expect(composable.contactName).toBeDefined()
    expect(composable.mailingAddress).toBeDefined()
    expect(composable.deliveryInstructions).toBeDefined()
    expect(composable.allowedStatuses).toBeDefined()
    expect(composable.refundAmount).toBeDefined()
    expect(composable.shouldShowRefundAmount).toBeDefined()
    expect(composable.refundFormInitialData).toBeDefined()
    expect(composable.refundStatus).toBeDefined()
    expect(composable.chequeAdvice).toBeDefined()
    expect(composable.isRefundRequested).toBeDefined()
    expect(composable.isRefundStatusUndeliverable).toBeDefined()
    expect(composable.canUpdateRefundStatus).toBeDefined()
    expect(composable.shouldShowRefundStatusSection).toBeDefined()
    expect(composable.shouldShowNameAndAddress).toBeDefined()
    expect(composable.handleStatusSelect).toBeDefined()
    expect(composable.handleRefundStatusSelect).toBeDefined()
    expect(composable.showRefundForm).toBeDefined()
    expect(composable.handleRefundFormSubmit).toBeDefined()
    expect(composable.handleRefundFormCancel).toBeDefined()
  })

  it('should format date correctly', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.formattedDate.value).toBe('Dec 31, 2024')
  })

  it('should return status label', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.statusLabel.value).toBeDefined()
  })

  it('should return entity number from payment account', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.entityNumber.value).toBe('Test Account')
  })

  it('should return contact name', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.contactName.value).toBe('Test Contact')
  })

  it('should return allowed statuses', () => {
    const composable = useRoutingSlipInfo()
    expect(composable.allowedStatuses.value).toHaveLength(2)
  })

  it('should handle status select for REFUNDREQUEST', async () => {
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.REFUNDREQUEST)
    expect(composable.showRefundForm.value).toBe(true)
  })

  it('should handle status select for NSF', async () => {
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.NSF)
    expect(_mockOpenPlaceRoutingSlipToNSFModal).toHaveBeenCalled()
  })

  it('should handle status select for VOID', async () => {
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.VOID)
    expect(_mockOpenVoidRoutingSlipModal).toHaveBeenCalled()
    expect(_mockOpenErrorDialog).not.toHaveBeenCalled()
  })

  it('should show error dialog when trying to void routing slip with invoices', async () => {
    mockInvoiceCount.value = 5
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.VOID)
    expect(_mockOpenErrorDialog).toHaveBeenCalled()
    expect(_mockOpenVoidRoutingSlipModal).not.toHaveBeenCalled()
  })

  it('should handle status select for other statuses', async () => {
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.COMPLETE)
    expect(_mockUpdateRoutingSlipStatus).toHaveBeenCalledWith({ status: SlipStatus.COMPLETE })
  })

  it('should not handle status select when routing slip number is missing', async () => {
    mockStore.routingSlip.number = '' as string
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.COMPLETE)
    expect(_mockUpdateRoutingSlipStatus).not.toHaveBeenCalled()
  })

  it('should handle refund form submit', async () => {
    const mockDetails = {
      name: 'Test Name',
      mailingAddress: {
        street: '123 Main St',
        city: 'Vancouver',
        region: 'BC',
        postalCode: 'V1A 1A1',
        country: 'CA'
      },
      chequeAdvice: 'Test advice'
    }
    mockUsePayApi.updateRoutingSlipRefund.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})

    const composable = useRoutingSlipInfo()
    await composable.handleRefundFormSubmit(mockDetails)

    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(mockUsePayApi.updateRoutingSlipRefund).toHaveBeenCalled()
    expect(_mockGetRoutingSlip).toHaveBeenCalled()
    expect(composable.showRefundForm.value).toBe(false)
  })

  it('should handle error when submitting refund form', async () => {
    const mockDetails = {
      name: 'Test Name',
      mailingAddress: undefined,
      chequeAdvice: undefined
    }
    const mockError = new Error('API Error')
    mockUsePayApi.updateRoutingSlipRefund.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlipInfo()
    await composable.handleRefundFormSubmit(mockDetails)

    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should not submit refund form when routing slip number is missing', async () => {
    mockStore.routingSlip.number = '' as string
    const composable = useRoutingSlipInfo()
    await composable.handleRefundFormSubmit({
      name: 'Test Name',
      mailingAddress: undefined,
      chequeAdvice: undefined
    })
    expect(mockUsePayApi.updateRoutingSlipRefund).not.toHaveBeenCalled()
  })

  it('should handle refund form cancel', () => {
    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = true
    composable.handleRefundFormCancel()
    expect(composable.showRefundForm.value).toBe(false)
  })

  it('should handle refund status select', async () => {
    mockStore.routingSlip.refundStatus = 'PROCESSED'
    _mockUpdateRoutingSlipRefundStatus.mockResolvedValue({})
    _mockUpdateRoutingSlipComments.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})

    const composable = useRoutingSlipInfo()
    await composable.handleRefundStatusSelect('AUTHORIZED')

    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(_mockUpdateRoutingSlipRefundStatus).toHaveBeenCalledWith('AUTHORIZED')
    expect(_mockUpdateRoutingSlipComments).toHaveBeenCalled()
    expect(_mockGetRoutingSlip).toHaveBeenCalled()
  })

  it('should handle refund status select with callback', async () => {
    const mockCallback = vi.fn()
    _mockUpdateRoutingSlipRefundStatus.mockResolvedValue({})
    _mockUpdateRoutingSlipComments.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})

    const composable = useRoutingSlipInfo()
    await composable.handleRefundStatusSelect('AUTHORIZED', mockCallback)

    expect(mockCallback).toHaveBeenCalled()
  })

  it('should handle error when updating refund status', async () => {
    const mockError = new Error('API Error')
    _mockUpdateRoutingSlipRefundStatus.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlipInfo()
    await composable.handleRefundStatusSelect('AUTHORIZED')

    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should not update refund status when routing slip number is missing', async () => {
    mockStore.routingSlip.number = '' as string
    const composable = useRoutingSlipInfo()
    await composable.handleRefundStatusSelect('AUTHORIZED')
    expect(_mockUpdateRoutingSlipRefundStatus).not.toHaveBeenCalled()
  })

  it('should return refund form initial data from refund details', () => {
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Refund Name',
        mailingAddress: {
          street: '123 Main St',
          city: 'Vancouver'
        },
        chequeAdvice: 'Test advice'
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.refundFormInitialData.value.name).toBe('Refund Name')
    expect(composable.refundFormInitialData.value.chequeAdvice).toBe('Test advice')
  })

  it('should return refund form initial data from contact name when no refund details', () => {
    mockStore.routingSlip.refunds = []
    mockStore.routingSlip.contactName = 'Contact Name'

    const composable = useRoutingSlipInfo()
    expect(composable.refundFormInitialData.value.name).toBe('Contact Name')
  })

  it('should return refund status text', () => {
    mockStore.routingSlip.refundStatus = 'PROCESSED'
    const composable = useRoutingSlipInfo()
    expect(composable.refundStatus.value).toBeDefined()
  })

  it('should return cheque advice from refund details', () => {
    mockStore.routingSlip.refunds = [{
      details: {
        chequeAdvice: 'Test advice'
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.chequeAdvice.value).toBe('Test advice')
  })

  it('should return empty cheque advice when no refund details', () => {
    mockStore.routingSlip.refunds = []
    const composable = useRoutingSlipInfo()
    expect(composable.chequeAdvice.value).toBe('')
  })

  it('should return true for isRefundRequested when status is REFUNDREQUEST', () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    const composable = useRoutingSlipInfo()
    expect(composable.isRefundRequested.value).toBe(true)
  })

  it('should return false for isRefundRequested when status is not REFUNDREQUEST', () => {
    mockStore.routingSlip.status = SlipStatus.ACTIVE
    const composable = useRoutingSlipInfo()
    expect(composable.isRefundRequested.value).toBe(false)
  })

  it('should return true for shouldShowRefundAmount when conditions are met', () => {
    mockStore.routingSlip.refundAmount = 100
    mockStore.routingSlip.status = SlipStatus.COMPLETE
    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = false
    expect(composable.shouldShowRefundAmount.value).toBe(true)
  })

  it('should return false for shouldShowRefundAmount when refund form is shown', () => {
    mockStore.routingSlip.refundAmount = 100
    mockStore.routingSlip.status = SlipStatus.COMPLETE
    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = true
    expect(composable.shouldShowRefundAmount.value).toBe(false)
  })

  it('should return true for shouldShowNameAndAddress when contact name exists', () => {
    mockStore.routingSlip.contactName = 'Test Contact'
    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = false
    expect(composable.shouldShowNameAndAddress.value).toBe(true)
  })

  it('should return false for shouldShowNameAndAddress when refund form is shown', () => {
    mockStore.routingSlip.contactName = 'Test Contact'
    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = true
    expect(composable.shouldShowNameAndAddress.value).toBe(false)
  })
})
