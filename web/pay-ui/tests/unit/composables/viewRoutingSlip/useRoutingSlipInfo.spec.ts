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
  _mockOpenAuthorizeWriteOffModal,
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
  const _mockOpenAuthorizeWriteOffModal = vi.fn()
  const mockUsePayModals = {
    openPlaceRoutingSlipToNSFModal: _mockOpenPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal: _mockOpenVoidRoutingSlipModal,
    openErrorDialog: _mockOpenErrorDialog,
    openAuthorizeWriteOffModal: _mockOpenAuthorizeWriteOffModal
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
    _mockOpenAuthorizeWriteOffModal,
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

const mockStore: {
  routingSlip: {
    number: string
    status: string | null
    createdOn: string | null
    paymentAccount: { accountName: string } | null
    contactName: string
    mailingAddress: {
      street?: string
      city?: string
      region?: string
      postalCode?: string
      country?: string
      deliveryInstructions?: string
    } | undefined
    refunds: Refund[]
    allowedStatuses: string[]
    refundAmount: number | null
    remainingAmount: number | null
    refundStatus: string | null
  }
} = {
  routingSlip: {
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
    expect(composable.showRefundReview).toBeDefined()
    expect(composable.editableChequeAdvice).toBeDefined()
    expect(composable.handleRefundReviewAuthorize).toBeDefined()
    expect(composable.handleRefundReviewCancel).toBeDefined()
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

  it('should handle REFUNDAUTHORIZED status by showing refund review', async () => {
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name',
        mailingAddress: { street: '123 Main St', city: 'Vancouver' },
        chequeAdvice: 'Existing advice'
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.REFUNDAUTHORIZED)

    expect(composable.showRefundReview.value).toBe(true)
    expect(composable.editableChequeAdvice.value).toBe('Existing advice')
  })

  it('should handle REFUNDAUTHORIZED status with no existing cheque advice', async () => {
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name',
        mailingAddress: { street: '123 Main St', city: 'Vancouver' }
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.REFUNDAUTHORIZED)

    expect(composable.showRefundReview.value).toBe(true)
    expect(composable.editableChequeAdvice.value).toBe('')
  })

  it('should handle WRITEOFFAUTHORIZED status by opening modal', async () => {
    const composable = useRoutingSlipInfo()
    await composable.handleStatusSelect(SlipStatus.WRITEOFFAUTHORIZED)

    expect(_mockOpenAuthorizeWriteOffModal).toHaveBeenCalled()
  })

  it('should handle refund review authorize successfully', async () => {
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name',
        mailingAddress: { street: '123 Main St', city: 'Vancouver' },
        chequeAdvice: 'Original advice'
      }
    }] as Refund[]
    mockUsePayApi.updateRoutingSlipRefund.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})
    _mockOpenAuthorizeWriteOffModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })

    const composable = useRoutingSlipInfo()
    composable.editableChequeAdvice.value = 'Updated advice'
    composable.showRefundReview.value = true

    await composable.handleRefundReviewAuthorize()

    expect(_mockOpenAuthorizeWriteOffModal).toHaveBeenCalled()
    expect(mockUsePayApi.updateRoutingSlipRefund).toHaveBeenCalled()
    expect(_mockToggleLoading).toHaveBeenCalledWith(true)
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    expect(composable.showRefundReview.value).toBe(false)
  })

  it('should handle refund review authorize with empty cheque advice', async () => {
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name',
        mailingAddress: { street: '123 Main St', city: 'Vancouver' }
      }
    }] as Refund[]
    mockUsePayApi.updateRoutingSlipRefund.mockResolvedValue({})
    _mockGetRoutingSlip.mockResolvedValue({})
    _mockOpenAuthorizeWriteOffModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })

    const composable = useRoutingSlipInfo()
    composable.editableChequeAdvice.value = '   '
    composable.showRefundReview.value = true

    await composable.handleRefundReviewAuthorize()

    const callArg = mockUsePayApi.updateRoutingSlipRefund.mock.calls[0]?.[0] as string
    const payload = JSON.parse(callArg)
    expect(payload.details.chequeAdvice).toBeUndefined()
  })

  it('should handle refund review authorize error', async () => {
    mockUsePayApi.updateRoutingSlipRefund.mockRejectedValue(new Error('API Error'))
    _mockOpenAuthorizeWriteOffModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlipInfo()
    composable.showRefundReview.value = true

    await composable.handleRefundReviewAuthorize()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error authorizing refund:', expect.any(Error))
    expect(_mockToggleLoading).toHaveBeenCalledWith(false)
    consoleErrorSpy.mockRestore()
  })

  it('should not authorize refund review when routing slip number is missing', async () => {
    mockStore.routingSlip.number = '' as string

    const composable = useRoutingSlipInfo()
    await composable.handleRefundReviewAuthorize()

    expect(_mockOpenAuthorizeWriteOffModal).not.toHaveBeenCalled()
  })

  it('should handle refund review cancel', () => {
    const composable = useRoutingSlipInfo()
    composable.showRefundReview.value = true
    composable.editableChequeAdvice.value = 'Some advice'

    composable.handleRefundReviewCancel()

    expect(composable.showRefundReview.value).toBe(false)
    expect(composable.editableChequeAdvice.value).toBe('')
  })

  it('should return correct isRefundStatusUndeliverable computed', () => {
    mockStore.routingSlip.refundStatus = 'CHEQUE_UNDELIVERABLE'
    const composable1 = useRoutingSlipInfo()
    expect(composable1.isRefundStatusUndeliverable.value).toBe(true)

    mockStore.routingSlip.refundStatus = 'PROCESSED'
    const composable2 = useRoutingSlipInfo()
    expect(composable2.isRefundStatusUndeliverable.value).toBe(false)

    mockStore.routingSlip.refundStatus = null
    const composable3 = useRoutingSlipInfo()
    expect(composable3.isRefundStatusUndeliverable.value).toBe(false)
  })

  it('should return correct canUpdateRefundStatus computed', () => {
    mockStore.routingSlip.refundStatus = 'PROCESSED'
    const composable1 = useRoutingSlipInfo()
    expect(composable1.canUpdateRefundStatus.value).toBe(true)

    mockStore.routingSlip.refundStatus = 'CHEQUE_UNDELIVERABLE'
    const composable2 = useRoutingSlipInfo()
    expect(composable2.canUpdateRefundStatus.value).toBe(true)

    mockStore.routingSlip.refundStatus = 'PROCESSING'
    const composable3 = useRoutingSlipInfo()
    expect(composable3.canUpdateRefundStatus.value).toBe(false)

    mockStore.routingSlip.refundStatus = null
    const composable4 = useRoutingSlipInfo()
    expect(composable4.canUpdateRefundStatus.value).toBe(false)
  })

  it('should return correct shouldShowRefundStatusSection computed', () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    const composable1 = useRoutingSlipInfo()
    composable1.showRefundForm.value = false
    expect(composable1.shouldShowRefundStatusSection.value).toBe(true)

    mockStore.routingSlip.status = SlipStatus.REFUNDPROCESSED
    const composable2 = useRoutingSlipInfo()
    composable2.showRefundForm.value = false
    expect(composable2.shouldShowRefundStatusSection.value).toBe(true)

    mockStore.routingSlip.status = SlipStatus.ACTIVE
    const composable3 = useRoutingSlipInfo()
    expect(composable3.shouldShowRefundStatusSection.value).toBe(false)

    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    const composable4 = useRoutingSlipInfo()
    composable4.showRefundForm.value = true
    expect(composable4.shouldShowRefundStatusSection.value).toBe(false)
  })

  it('should return dash for formattedDate when date is null or invalid', () => {
    mockStore.routingSlip.createdOn = null as unknown as string
    const composable1 = useRoutingSlipInfo()
    expect(composable1.formattedDate.value).toBe('-')

    mockStore.routingSlip.createdOn = 'invalid-date'
    const composable2 = useRoutingSlipInfo()
    expect(composable2.formattedDate.value).toBe('-')
  })

  it('should return empty string for statusColor when status is null', () => {
    mockStore.routingSlip.status = null as unknown as string
    const composable = useRoutingSlipInfo()
    expect(composable.statusColor.value).toBe('')
  })

  it('should return dash for statusLabel when status is null', () => {
    mockStore.routingSlip.status = null as unknown as string
    const composable = useRoutingSlipInfo()
    expect(composable.statusLabel.value).toBe('-')
  })

  it('should prioritize refund mailing address over routing slip mailing address', () => {
    const refundAddress = {
      street: '456 Refund St',
      city: 'RefundCity',
      region: 'RC',
      postalCode: 'R1R 1R1',
      country: 'CA'
    }
    const slipAddress = {
      street: '123 Slip St',
      city: 'SlipCity',
      region: 'SC',
      postalCode: 'S1S 1S1',
      country: 'CA'
    }

    mockStore.routingSlip.mailingAddress = slipAddress
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name',
        mailingAddress: refundAddress
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.mailingAddress.value).toEqual(refundAddress)
  })

  it('should fall back to routing slip mailing address when refund has no address', () => {
    const slipAddress = {
      street: '123 Slip St',
      city: 'SlipCity',
      region: 'SC',
      postalCode: 'S1S 1S1',
      country: 'CA'
    }

    mockStore.routingSlip.mailingAddress = slipAddress
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Test Name'
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.mailingAddress.value).toEqual(slipAddress)
  })

  it('should prioritize refund contact name over routing slip contact name', () => {
    mockStore.routingSlip.contactName = 'Slip Contact'
    mockStore.routingSlip.refunds = [{
      details: {
        name: 'Refund Contact',
        mailingAddress: { street: '123 Main St' }
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.contactName.value).toBe('Refund Contact')
  })

  it('should return deliveryInstructions from mailing address', () => {
    mockStore.routingSlip.mailingAddress = {
      street: '123 Main St',
      city: 'Vancouver',
      deliveryInstructions: 'Leave at door'
    }
    mockStore.routingSlip.refunds = []

    const composable = useRoutingSlipInfo()
    expect(composable.deliveryInstructions.value).toBe('Leave at door')
  })

  it('should use refundFormInitialData with contactName fallback when refund has no name', () => {
    mockStore.routingSlip.contactName = 'Fallback Contact'
    mockStore.routingSlip.refunds = [{
      details: {
        mailingAddress: { street: '123 Main St' }
      }
    }] as Refund[]

    const composable = useRoutingSlipInfo()
    expect(composable.refundFormInitialData.value.name).toBe('Fallback Contact')
  })

  it('should return shouldShowNameAndAddress false when no contact and no address', () => {
    mockStore.routingSlip.contactName = ''
    mockStore.routingSlip.mailingAddress = undefined
    mockStore.routingSlip.refunds = []

    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = false
    expect(composable.shouldShowNameAndAddress.value).toBe(false)
  })

  it('should return shouldShowNameAndAddress true when only mailing address exists', () => {
    mockStore.routingSlip.contactName = ''
    mockStore.routingSlip.mailingAddress = {
      street: '123 Main St',
      city: 'Vancouver'
    }
    mockStore.routingSlip.refunds = []

    const composable = useRoutingSlipInfo()
    composable.showRefundForm.value = false
    expect(composable.shouldShowNameAndAddress.value).toBe(true)
  })
})
