import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRoutingSlipInfo } from '~/composables/viewRoutingSlip/useRoutingSlipInfo'
import type { Refund } from '~/interfaces/routing-slip'
import { SlipStatus } from '~/enums/slip-status'
import { chequeRefundCodes } from '~/utils/constants'

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
  _mockOpenAuthorizeRefundModal,
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
  const _mockOpenAuthorizeRefundModal = vi.fn()
  const mockUsePayModals = {
    openPlaceRoutingSlipToNSFModal: _mockOpenPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal: _mockOpenVoidRoutingSlipModal,
    openErrorDialog: _mockOpenErrorDialog,
    openAuthorizeWriteOffModal: _mockOpenAuthorizeWriteOffModal,
    openAuthorizeRefundModal: _mockOpenAuthorizeRefundModal
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
    _mockOpenAuthorizeRefundModal,
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
    routingSlipDate: string | null
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
    routingSlipDate: '2025-01-01',
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
      routingSlipDate: '2025-01-01',
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
    expect(composable.formattedDate.value).toBe('January 01, 2025')
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
    _mockOpenAuthorizeRefundModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })

    const composable = useRoutingSlipInfo()
    composable.editableChequeAdvice.value = 'Updated advice'
    composable.showRefundReview.value = true

    await composable.handleRefundReviewAuthorize()

    expect(_mockOpenAuthorizeRefundModal).toHaveBeenCalled()
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
    _mockOpenAuthorizeRefundModal.mockImplementation(async (callback: () => Promise<void>) => {
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
    _mockOpenAuthorizeRefundModal.mockImplementation(async (callback: () => Promise<void>) => {
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

    expect(_mockOpenAuthorizeRefundModal).not.toHaveBeenCalled()
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
    mockStore.routingSlip.routingSlipDate = null as unknown as string
    const composable1 = useRoutingSlipInfo()
    expect(composable1.formattedDate.value).toBe('-')

    mockStore.routingSlip.routingSlipDate = 'invalid-date'
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

  describe('additional branches', () => {
    const fresh = () => useRoutingSlipInfo()
    const slip = () => mockStore.routingSlip as Record<string, unknown>

    it('computes refundAmount, preferring refundAmount over remainingAmount', () => {
      expect(fresh().refundAmount.value).toBe(0)
      slip().remainingAmount = 5
      expect(fresh().refundAmount.value).toBe(5)
      slip().refundAmount = 9
      expect(fresh().refundAmount.value).toBe(9)
    })

    it('shows the refund amount only for non-active slips with an amount and no open form', () => {
      slip().remainingAmount = 5
      expect(fresh().shouldShowRefundAmount.value).toBe(false)
      slip().status = SlipStatus.COMPLETE
      expect(fresh().shouldShowRefundAmount.value).toBe(true)
      const withForm = fresh()
      withForm.showRefundForm.value = true
      expect(withForm.shouldShowRefundAmount.value).toBe(false)
    })

    it('filters allowedStatuses to known dropdown values and tolerates a missing list', () => {
      slip().allowedStatuses = ['ACTIVE', 'NOT_A_STATUS']
      expect(fresh().allowedStatuses.value).toEqual(['ACTIVE'])
      slip().allowedStatuses = undefined
      expect(fresh().allowedStatuses.value).toEqual([])
    })

    it('returns an empty entityNumber without a payment account', () => {
      slip().paymentAccount = null
      expect(useRoutingSlipInfo().entityNumber.value).toBe('')
    })

    it('uses the refund details for refundFormInitialData, falling back to the contact name', () => {
      slip().refunds = [{ details: { name: 'Refund Name', chequeAdvice: 'adv' } }]
      expect(fresh().refundFormInitialData.value).toMatchObject({ name: 'Refund Name', chequeAdvice: 'adv' })
      expect(fresh().chequeAdvice.value).toBe('adv')
      slip().refunds = [{ details: { chequeAdvice: 'adv' } }]
      expect(fresh().refundFormInitialData.value.name).toBe('Test Contact')
    })

    it('returns blank refundFormInitialData with no refund and no contact', () => {
      slip().contactName = ''
      slip().mailingAddress = { city: 'Victoria' }
      const data = useRoutingSlipInfo().refundFormInitialData.value
      expect(data).toEqual({ name: '', mailingAddress: { city: 'Victoria' }, chequeAdvice: undefined })
    })

    it('computes refund status text with processing fallback and N/A-safe uppercase', () => {
      const processing = fresh().refundStatus.value
      expect(processing).toBe(processing.toUpperCase())
      slip().refundStatus = chequeRefundCodes.CHEQUE_UNCASHED
      expect(fresh().refundStatus.value).not.toBe(processing)
      slip().refundStatus = 'UNKNOWN_CODE'
      expect(fresh().refundStatus.value).toBe(processing)
    })

    it('flags refund request/uncashed states', () => {
      expect(fresh().isRefundRequested.value).toBe(false)
      slip().status = SlipStatus.REFUNDREQUEST
      expect(fresh().isRefundRequested.value).toBe(true)
      slip().refundStatus = chequeRefundCodes.CHEQUE_UNCASHED
      expect(fresh().isRefundStatusUncashed.value).toBe(true)
      expect(fresh().canUpdateRefundStatus.value).toBe(true)
    })

    it('shouldShowNameAndAddress is true for contact name, false when the address is blank', () => {
      expect(fresh().shouldShowNameAndAddress.value).toBe(true)
      slip().contactName = ''
      slip().mailingAddress = { deliveryInstructions: 'only instructions' }
      expect(fresh().shouldShowNameAndAddress.value).toBe(false)
      for (const key of ['street', 'city', 'region', 'postalCode', 'country']) {
        slip().mailingAddress = { [key]: 'x' }
        expect(fresh().shouldShowNameAndAddress.value).toBe(true)
      }
    })

    it('shouldShowNameAndAddress uses the refund contact name', () => {
      slip().contactName = ''
      slip().refunds = [{ details: { name: 'R' } }]
      expect(useRoutingSlipInfo().shouldShowNameAndAddress.value).toBe(true)
    })

    it('handleStatusSelect does nothing without a slip number', async () => {
      slip().number = ''
      const composable = useRoutingSlipInfo()
      await composable.handleStatusSelect(SlipStatus.NSF)
      await composable.handleStatusSelect(SlipStatus.REFUNDREQUEST)
      expect(composable.showRefundForm.value).toBe(false)
      expect(_mockOpenPlaceRoutingSlipToNSFModal).not.toHaveBeenCalled()
    })

    it('runs the status update from NSF, VOID and write-off modal callbacks', async () => {
      const composable = useRoutingSlipInfo()
      for (const [status, modalFn] of [
        [SlipStatus.NSF, _mockOpenPlaceRoutingSlipToNSFModal],
        [SlipStatus.VOID, _mockOpenVoidRoutingSlipModal],
        [SlipStatus.WRITEOFFAUTHORIZED, _mockOpenAuthorizeWriteOffModal]
      ] as const) {
        _mockUpdateRoutingSlipStatus.mockClear()
        modalFn.mockImplementationOnce(async (cb: () => Promise<void>) => { await cb() })
        await composable.handleStatusSelect(status)
        expect(_mockUpdateRoutingSlipStatus).toHaveBeenCalledWith({ status })
      }
      expect(_mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456' })
    })

    it('blocks VOID with an error dialog when invoices exist', async () => {
      mockInvoiceCount.value = 2
      await useRoutingSlipInfo().handleStatusSelect(SlipStatus.VOID)
      expect(_mockOpenErrorDialog).toHaveBeenCalledWith(
        'error.voidRoutingSlip.title',
        'error.voidRoutingSlip.description'
      )
      expect(_mockOpenVoidRoutingSlipModal).not.toHaveBeenCalled()
    })

    it('updates a plain status directly and recovers from failures', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const composable = useRoutingSlipInfo()
      await composable.handleStatusSelect(SlipStatus.HOLD)
      expect(_mockUpdateRoutingSlipStatus).toHaveBeenCalledWith({ status: SlipStatus.HOLD })
      expect(_mockToggleLoading).toHaveBeenLastCalledWith(false)

      _mockUpdateRoutingSlipStatus.mockRejectedValueOnce(new Error('boom'))
      await composable.handleStatusSelect(SlipStatus.HOLD)
      expect(spy).toHaveBeenCalled()
      expect(_mockToggleLoading).toHaveBeenLastCalledWith(false)
      spy.mockRestore()
    })

    it('handleRefundFormSubmit and review authorize ignore a missing slip number', async () => {
      slip().number = ''
      const composable = useRoutingSlipInfo()
      await composable.handleRefundFormSubmit({} as never)
      await composable.handleRefundReviewAuthorize()
      expect(mockUsePayApi.updateRoutingSlipRefund).not.toHaveBeenCalled()
      expect(_mockOpenAuthorizeRefundModal).not.toHaveBeenCalled()
    })

    it('handleRefundStatusSelect records a comment and invokes the callback', async () => {
      const cb = vi.fn()
      slip().refundStatus = chequeRefundCodes.PROCESSED
      await useRoutingSlipInfo().handleRefundStatusSelect(chequeRefundCodes.CHEQUE_UNCASHED, cb)
      expect(_mockUpdateRoutingSlipRefundStatus).toHaveBeenCalledWith(chequeRefundCodes.CHEQUE_UNCASHED)
      expect(_mockUpdateRoutingSlipComments).toHaveBeenCalledWith(
        expect.stringMatching(/^Refund status updated from .+ to .+$/)
      )
      expect(cb).toHaveBeenCalledOnce()
      expect(_mockGetRoutingSlip).toHaveBeenCalled()
    })

    it('handleRefundStatusSelect works without a callback', async () => {
      await useRoutingSlipInfo().handleRefundStatusSelect(chequeRefundCodes.PROCESSED)
      expect(_mockUpdateRoutingSlipComments).toHaveBeenCalled()
    })
  })
})
