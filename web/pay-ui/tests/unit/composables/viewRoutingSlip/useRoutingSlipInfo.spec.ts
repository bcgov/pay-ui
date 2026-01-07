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

  it('should be defined and return all expected properties', () => {
    const composable = useRoutingSlipInfo()
    expect(composable).toBeDefined()
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

  it('should return basic computed properties and handle all status select scenarios', async () => {
    const composable = useRoutingSlipInfo()
    expect(composable.formattedDate.value).toBe('Dec 31, 2024')
    expect(composable.statusLabel.value).toBeDefined()
    expect(composable.entityNumber.value).toBe('Test Account')
    expect(composable.contactName.value).toBe('Test Contact')
    expect(composable.allowedStatuses.value).toHaveLength(2)

    await composable.handleStatusSelect(SlipStatus.REFUNDREQUEST)
    expect(composable.showRefundForm.value).toBe(true)

    await composable.handleStatusSelect(SlipStatus.NSF)
    expect(_mockOpenPlaceRoutingSlipToNSFModal).toHaveBeenCalled()

    await composable.handleStatusSelect(SlipStatus.VOID)
    expect(_mockOpenVoidRoutingSlipModal).toHaveBeenCalled()
    expect(_mockOpenErrorDialog).not.toHaveBeenCalled()

    mockInvoiceCount.value = 5
    await composable.handleStatusSelect(SlipStatus.VOID)
    expect(_mockOpenErrorDialog).toHaveBeenCalled()
    expect(_mockOpenVoidRoutingSlipModal).toHaveBeenCalledTimes(1)

    await composable.handleStatusSelect(SlipStatus.COMPLETE)
    expect(_mockUpdateRoutingSlipStatus).toHaveBeenCalledWith({ status: SlipStatus.COMPLETE })

    mockStore.routingSlip.number = '' as string
    await composable.handleStatusSelect(SlipStatus.COMPLETE)
    expect(_mockUpdateRoutingSlipStatus).toHaveBeenCalledTimes(1)
  })

  it('should handle refund form submit, cancel, and error scenarios', async () => {
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

    const mockError = new Error('API Error')
    mockUsePayApi.updateRoutingSlipRefund.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.handleRefundFormSubmit({
      name: 'Test Name',
      mailingAddress: undefined,
      chequeAdvice: undefined
    })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()

    composable.showRefundForm.value = true
    composable.handleRefundFormCancel()
    expect(composable.showRefundForm.value).toBe(false)

    vi.clearAllMocks()
    mockStore.routingSlip.number = '' as string
    await composable.handleRefundFormSubmit({
      name: 'Test Name',
      mailingAddress: undefined,
      chequeAdvice: undefined
    })
    expect(mockUsePayApi.updateRoutingSlipRefund).not.toHaveBeenCalled()
  })

  it('should handle refund status select with callback, error, and missing routing slip number', async () => {
    mockStore.routingSlip.refundStatus = 'PROCESSED'
    _mockUpdateRoutingSlipRefundStatus.mockResolvedValue({})
    _mockUpdateRoutingSlipComments.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})

    const composable = useRoutingSlipInfo()
    const mockCallback = vi.fn()
    await composable.handleRefundStatusSelect('AUTHORIZED', mockCallback)

    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(_mockUpdateRoutingSlipRefundStatus).toHaveBeenCalledWith('AUTHORIZED')
    expect(_mockUpdateRoutingSlipComments).toHaveBeenCalled()
    expect(_mockGetRoutingSlip).toHaveBeenCalled()
    expect(mockCallback).toHaveBeenCalled()

    const mockError = new Error('API Error')
    _mockUpdateRoutingSlipRefundStatus.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.handleRefundStatusSelect('AUTHORIZED')
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()

    vi.clearAllMocks()
    mockStore.routingSlip.number = '' as string
    await composable.handleRefundStatusSelect('AUTHORIZED')
    expect(_mockUpdateRoutingSlipRefundStatus).not.toHaveBeenCalled()
  })

  it('should return refund-related computed properties correctly', () => {
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

    const composable1 = useRoutingSlipInfo()
    expect(composable1.refundFormInitialData.value.name).toBe('Refund Name')
    expect(composable1.refundFormInitialData.value.chequeAdvice).toBe('Test advice')
    expect(composable1.chequeAdvice.value).toBe('Test advice')

    mockStore.routingSlip.refunds = []
    mockStore.routingSlip.contactName = 'Contact Name'
    const composable2 = useRoutingSlipInfo()
    expect(composable2.refundFormInitialData.value.name).toBe('Contact Name')
    expect(composable2.chequeAdvice.value).toBe('')

    mockStore.routingSlip.refundStatus = 'PROCESSED'
    const composable3 = useRoutingSlipInfo()
    expect(composable3.refundStatus.value).toBeDefined()

    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    const composable4 = useRoutingSlipInfo()
    expect(composable4.isRefundRequested.value).toBe(true)

    mockStore.routingSlip.status = SlipStatus.ACTIVE
    const composable5 = useRoutingSlipInfo()
    expect(composable5.isRefundRequested.value).toBe(false)
  })

  it('should return correct visibility flags based on form state', () => {
    mockStore.routingSlip.refundAmount = 100
    mockStore.routingSlip.status = SlipStatus.COMPLETE
    mockStore.routingSlip.contactName = 'Test Contact'
    const composable = useRoutingSlipInfo()

    composable.showRefundForm.value = false
    expect(composable.shouldShowRefundAmount.value).toBe(true)
    expect(composable.shouldShowNameAndAddress.value).toBe(true)

    composable.showRefundForm.value = true
    expect(composable.shouldShowRefundAmount.value).toBe(false)
    expect(composable.shouldShowNameAndAddress.value).toBe(false)
  })
})
