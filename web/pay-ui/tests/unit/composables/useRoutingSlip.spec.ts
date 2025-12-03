import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'
import { SlipStatus } from '~/enums/slip-status'

const mockStore = {
  routingSlip: {
    number: '123456',
    status: SlipStatus.ACTIVE,
    invoices: [{ id: 1 }],
    parentNumber: null,
    payments: [
      {
        chequeReceiptNumber: 'CHQ001',
        paidAmount: 100,
        paidUsdAmount: 0,
        paymentMethod: 'CHEQUE'
      }
    ]
  },
  linkedRoutingSlips: {
    children: []
  },
  routingSlipDetails: {
    number: '123456'
  }
}

const mockGetRoutingSlip = vi.fn()
const mockUpdateRoutingSlipStatus = vi.fn()
const mockUpdateRoutingSlipRefundStatus = vi.fn()
const mockUpdateRoutingSlipComments = vi.fn()
const mockAdjustRoutingSlip = vi.fn()
const mockSaveLinkRoutingSlip = vi.fn()
const mockGetLinkedRoutingSlips = vi.fn()
const mockGetDailyReportByDate = vi.fn()
const mockGetAutoCompleteRoutingSlips = vi.fn()
const mockGetFeeByCorpTypeAndFilingType = vi.fn()
const mockSaveManualTransactions = vi.fn()
const mockCancelRoutingSlipInvoice = vi.fn()

const mockUsePayApi = {
  getRoutingSlip: vi.fn(),
  updateRoutingSlipStatus: vi.fn(),
  updateRoutingSlipRefund: vi.fn(),
  updateRoutingSlipRefundStatus: vi.fn(),
  updateRoutingSlipComments: vi.fn(),
  adjustRoutingSlip: vi.fn(),
  saveLinkRoutingSlip: vi.fn(),
  getLinkedRoutingSlips: vi.fn(),
  getDailyReport: vi.fn(),
  getSearchRoutingSlip: vi.fn(),
  getFeeByCorpTypeAndFilingType: vi.fn(),
  saveManualTransactions: vi.fn(),
  cancelRoutingSlipInvoice: vi.fn(),
  postRoutingSlip: vi.fn()
}

const {
  mockToggleLoading,
  mockUseLoader,
  mockUseCreateRoutingSlipStore,
  mockNavigateTo,
  mockUseToast,
  mockGetErrorStatus
} = vi.hoisted(() => {
  const mockToggleLoading = vi.fn()
  const mockUseLoader = {
    toggleLoading: mockToggleLoading
  }

  const mockUseCreateRoutingSlipStore = () => ({
    state: {},
    $reset: vi.fn()
  })

  const mockNavigateTo = vi.fn()
  const mockUseToast = () => ({
    add: vi.fn()
  })

  const mockGetErrorStatus = vi.fn()

  return {
    mockToggleLoading,
    mockUseLoader,
    mockUseCreateRoutingSlipStore,
    mockNavigateTo,
    mockUseToast,
    mockGetErrorStatus
  }
})

mockNuxtImport('usePayApi', () => () => mockUsePayApi)
mockNuxtImport('useCreateRoutingSlipStore', () => mockUseCreateRoutingSlipStore)
mockNuxtImport('useToast', () => mockUseToast)
mockNuxtImport('getErrorStatus', () => mockGetErrorStatus)

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => mockUseLoader
}))

vi.mock('~/stores/routing-slip-store', () => ({
  useRoutingSlipStore: () => ({
    store: mockStore
  })
}))

vi.mock('~/utils/create-routing-slip', () => ({
  createRoutingSlipPayload: vi.fn(() => ({}))
}))

describe('useRoutingSlip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.routingSlip = {
      number: '123456',
      status: SlipStatus.ACTIVE,
      invoices: [{ id: 1 }],
      parentNumber: null,
      payments: [
        {
          chequeReceiptNumber: 'CHQ001',
          paidAmount: 100,
          paidUsdAmount: 0,
          paymentMethod: 'CHEQUE'
        }
      ]
    }
    mockStore.linkedRoutingSlips = {
      children: []
    }
  })

  it('should be defined', () => {
    const composable = useRoutingSlip()
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const composable = useRoutingSlip()
    expect(composable.invoiceCount).toBeDefined()
    expect(composable.isRoutingSlipAChild).toBeDefined()
    expect(composable.isRoutingSlipLinked).toBeDefined()
    expect(composable.isRoutingSlipVoid).toBeDefined()
    expect(composable.updateRoutingSlipChequeNumber).toBeDefined()
    expect(composable.updateRoutingSlipAmount).toBeDefined()
    expect(composable.createRoutingSlip).toBeDefined()
    expect(composable.checkRoutingNumber).toBeDefined()
    expect(composable.getRoutingSlip).toBeDefined()
    expect(composable.updateRoutingSlipStatus).toBeDefined()
    expect(composable.updateRoutingSlipRefundStatus).toBeDefined()
    expect(composable.adjustRoutingSlip).toBeDefined()
    expect(composable.resetRoutingSlipDetails).toBeDefined()
    expect(composable.saveLinkRoutingSlip).toBeDefined()
    expect(composable.getLinkedRoutingSlips).toBeDefined()
    expect(composable.getDailyReportByDate).toBeDefined()
    expect(composable.getAutoCompleteRoutingSlips).toBeDefined()
    expect(composable.getFeeByCorpTypeAndFilingType).toBeDefined()
    expect(composable.saveManualTransactions).toBeDefined()
    expect(composable.cancelRoutingSlipInvoice).toBeDefined()
    expect(composable.updateRoutingSlipComments).toBeDefined()
  })

  it('should calculate invoiceCount correctly', () => {
    const composable = useRoutingSlip()
    expect(composable.invoiceCount.value).toBe(1)
  })

  it('should return false for isRoutingSlipAChild when no parentNumber', () => {
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipAChild.value).toBe(false)
  })

  it('should return true for isRoutingSlipAChild when parentNumber exists', () => {
    mockStore.routingSlip.parentNumber = '123' as any
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipAChild.value).toBe(true)
  })

  it('should return false for isRoutingSlipVoid when status is not VOID', () => {
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipVoid.value).toBe(false)
  })

  it('should return true for isRoutingSlipVoid when status is VOID', () => {
    mockStore.routingSlip.status = SlipStatus.VOID
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipVoid.value).toBe(true)
  })

  it('should update routing slip cheque number', () => {
    const composable = useRoutingSlip()
    composable.updateRoutingSlipChequeNumber({
      chequeNum: 'CHQ002',
      paymentIndex: 0
    })
    expect(mockStore.routingSlip.payments[0]?.chequeReceiptNumber).toBe('CHQ002')
  })

  it('should update routing slip amount', () => {
    const composable = useRoutingSlip()
    composable.updateRoutingSlipAmount({
      amount: 200,
      paymentIndex: 0,
      isRoutingSlipPaidInUsd: false
    })
    expect(mockStore.routingSlip.payments[0]?.paidAmount).toBe(200)
  })

  it('should update routing slip USD amount', () => {
    const composable = useRoutingSlip()
    composable.updateRoutingSlipAmount({
      amount: 150,
      paymentIndex: 0,
      isRoutingSlipPaidInUsd: true
    })
    expect(mockStore.routingSlip.payments[0]?.paidUsdAmount).toBe(150)
  })
})
