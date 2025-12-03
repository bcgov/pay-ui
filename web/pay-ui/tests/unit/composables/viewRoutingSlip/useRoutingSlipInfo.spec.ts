import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRoutingSlipInfo } from '~/composables/viewRoutingSlip/useRoutingSlipInfo'

const {
  mockUpdateRoutingSlipStatus,
  mockUpdateRoutingSlipRefundStatus,
  mockGetRoutingSlip,
  mockUpdateRoutingSlipComments,
  mockUseRoutingSlip,
  mockToggleLoading,
  mockUseLoader,
  mockOpenPlaceRoutingSlipToNSFModal,
  mockOpenVoidRoutingSlipModal,
  mockUsePayModals,
  mockUsePayApi
} = vi.hoisted(() => {
  const mockUpdateRoutingSlipStatus = vi.fn()
  const mockUpdateRoutingSlipRefundStatus = vi.fn()
  const mockGetRoutingSlip = vi.fn()
  const mockUpdateRoutingSlipComments = vi.fn()

  const mockUseRoutingSlip = {
    updateRoutingSlipStatus: mockUpdateRoutingSlipStatus,
    updateRoutingSlipRefundStatus: mockUpdateRoutingSlipRefundStatus,
    getRoutingSlip: mockGetRoutingSlip,
    updateRoutingSlipComments: mockUpdateRoutingSlipComments
  }

  const mockToggleLoading = vi.fn()
  const mockUseLoader = {
    toggleLoading: mockToggleLoading
  }

  const mockOpenPlaceRoutingSlipToNSFModal = vi.fn()
  const mockOpenVoidRoutingSlipModal = vi.fn()
  const mockUsePayModals = {
    openPlaceRoutingSlipToNSFModal: mockOpenPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal: mockOpenVoidRoutingSlipModal
  }

  const mockUsePayApi = {
    updateRoutingSlipRefund: vi.fn()
  }

  return {
    mockUpdateRoutingSlipStatus,
    mockUpdateRoutingSlipRefundStatus,
    mockGetRoutingSlip,
    mockUpdateRoutingSlipComments,
    mockUseRoutingSlip,
    mockToggleLoading,
    mockUseLoader,
    mockOpenPlaceRoutingSlipToNSFModal,
    mockOpenVoidRoutingSlipModal,
    mockUsePayModals,
    mockUsePayApi
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
})
