import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'
import { SlipStatus } from '~/enums/slip-status'
import { CreateRoutingSlipStatus } from '~/utils/constants'
import { ApiErrors } from '~/enums/api-errors'
import type { RoutingSlip, RoutingSlipDetails } from '~/interfaces/routing-slip'
import type { Invoice } from '~/interfaces/invoice'

const mockStore = {
  routingSlip: {
    number: '123456',
    status: SlipStatus.ACTIVE,
    invoices: [{ id: 1 }],
    parentNumber: null as string | null,
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
    children: [] as RoutingSlip[]
  },
  routingSlipDetails: {
    number: '123456'
  },
  accountInfo: undefined,
  chequePayment: undefined,
  cashPayment: undefined,
  isPaymentMethodCheque: undefined,
  routingSlipAddress: undefined
}

const _mockGetRoutingSlip = vi.fn()
const _mockUpdateRoutingSlipStatus = vi.fn()
const _mockUpdateRoutingSlipRefundStatus = vi.fn()
const _mockUpdateRoutingSlipComments = vi.fn()
const _mockAdjustRoutingSlip = vi.fn()
const _mockSaveLinkRoutingSlip = vi.fn()
const _mockGetLinkedRoutingSlips = vi.fn()
const _mockGetDailyReportByDate = vi.fn()
const _mockGetAutoCompleteRoutingSlips = vi.fn()
const _mockGetFeeByCorpTypeAndFilingType = vi.fn()
const _mockSaveManualTransactions = vi.fn()
const _mockCancelRoutingSlipInvoice = vi.fn()

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
  postSearchRoutingSlip: vi.fn(),
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
  const _mockToggleLoading = vi.fn()
  const mockUseLoader = {
    toggleLoading: _mockToggleLoading
  }

  const mockUseCreateRoutingSlipStore = () => ({
    state: {},
    $reset: vi.fn()
  })

  const mockNavigateTo = vi.fn()
  const mockToastInstance = { add: vi.fn() }
  const mockUseToast = () => mockToastInstance

  const mockGetErrorStatus = vi.fn()

  return {
    mockToggleLoading: _mockToggleLoading,
    mockUseLoader,
    mockUseCreateRoutingSlipStore,
    mockNavigateTo,
    mockUseToast,
    mockGetErrorStatus,
    mockToastInstance
  }
})

mockNuxtImport('usePayApi', () => () => mockUsePayApi)
mockNuxtImport('useToast', () => mockUseToast)
mockNuxtImport('getErrorStatus', () => mockGetErrorStatus)
mockNuxtImport('navigateTo', () => mockNavigateTo)
vi.mock('~/composables/pay-api', () => ({
  usePayApi: () => mockUsePayApi
}))
vi.mock('~/utils/common-util', () => ({
  default: {
    isRefundProcessStatus: vi.fn((status: SlipStatus) => {
      return status === SlipStatus.REFUNDREQUEST || status === SlipStatus.REFUNDAUTHORIZED
    }),
    formatDisplayDate: vi.fn((date: Date | string, _format: string) => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
      return date
    })
  }
}))
vi.mock('~/composables/pay-api', () => ({
  usePayApi: () => mockUsePayApi
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => mockUseLoader
}))

vi.mock('~/stores/routing-slip-store', () => ({
  useRoutingSlipStore: () => ({
    store: mockStore
  }),
  useCreateRoutingSlipStore: mockUseCreateRoutingSlipStore
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
    mockStore.routingSlip.parentNumber = '123' as string | null
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

  it('should return true for isRoutingSlipLinked when linkedRoutingSlips has children', () => {
    mockStore.linkedRoutingSlips = {
      children: [{ number: '123', status: SlipStatus.ACTIVE }] as RoutingSlip[]
    }
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipLinked.value).toBe(true)
  })

  it('should return false for isRoutingSlipLinked when no children and no parent', () => {
    mockStore.linkedRoutingSlips = {
      children: []
    }
    mockStore.routingSlip.parentNumber = null
    const composable = useRoutingSlip()
    expect(composable.isRoutingSlipLinked.value).toBe(false)
  })

  it('should create routing slip successfully', async () => {
    const mockResponse = { number: '123456789' }
    mockUsePayApi.postRoutingSlip.mockResolvedValue(mockResponse)
    mockNavigateTo.mockResolvedValue(undefined)

    const composable = useRoutingSlip()
    await composable.createRoutingSlip()

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(mockUsePayApi.postRoutingSlip).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalledWith('/view-routing-slip/123456789')
  })

  it('should handle error when creating routing slip', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.postRoutingSlip.mockRejectedValue(mockError)
    mockGetErrorStatus.mockReturnValue('500')

    const composable = useRoutingSlip()
    await composable.createRoutingSlip()

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should return EXISTS when routing number exists', async () => {
    mockStore.routingSlipDetails = { number: '123456' }
    mockUsePayApi.getRoutingSlip.mockResolvedValue({ number: '123456' })

    const composable = useRoutingSlip()
    const result = await composable.checkRoutingNumber()

    expect(result).toBe(CreateRoutingSlipStatus.EXISTS)
  })

  it('should return VALID when routing number does not exist', async () => {
    mockStore.routingSlipDetails = { number: '123456' } as RoutingSlipDetails
    mockUsePayApi.getRoutingSlip.mockResolvedValue(undefined)

    const composable = useRoutingSlip()
    const result = await composable.checkRoutingNumber()

    expect(result).toBe(CreateRoutingSlipStatus.VALID)
  })

  it('should return INVALID_DIGITS when API returns 400 with invalid digits error', async () => {
    mockStore.routingSlipDetails = { number: '123456' }
    const mockError = {
      response: {
        status: 400,
        data: { type: ApiErrors.FAS_INVALID_ROUTING_SLIP_DIGITS }
      }
    }
    mockUsePayApi.getRoutingSlip.mockRejectedValue(mockError)

    const composable = useRoutingSlip()
    const result = await composable.checkRoutingNumber()

    expect(result).toBe(CreateRoutingSlipStatus.INVALID_DIGITS)
  })

  it('should return VALID when API error is not invalid digits', async () => {
    mockStore.routingSlipDetails = { number: '123456' }
    const mockError = {
      response: {
        status: 500,
        data: { message: 'Server error' }
      }
    }
    mockUsePayApi.getRoutingSlip.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.checkRoutingNumber()

    expect(result).toBe(CreateRoutingSlipStatus.VALID)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should get routing slip successfully', async () => {
    const mockResponse: RoutingSlip = { number: '123456', status: SlipStatus.ACTIVE }
    mockUsePayApi.getRoutingSlip.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    await composable.getRoutingSlip({ routingSlipNumber: '123456' })

    expect(mockStore.routingSlip).toEqual(mockResponse)
    expect(mockUsePayApi.getRoutingSlip).toHaveBeenCalledWith('123456')
  })

  it('should handle error when getting routing slip', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.getRoutingSlip.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    await composable.getRoutingSlip({ routingSlipNumber: '123456' })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should update routing slip status for non-refund status', async () => {
    const mockResponse = { number: '123456', status: SlipStatus.COMPLETE }
    mockUsePayApi.updateRoutingSlipStatus.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipStatus({ status: SlipStatus.COMPLETE })

    expect(result).toEqual(mockResponse)
    expect(mockStore.routingSlip).toEqual(mockResponse)
    expect(mockUsePayApi.updateRoutingSlipStatus).toHaveBeenCalledWith(SlipStatus.COMPLETE, '123456')
  })

  it('should update routing slip status for refund status', async () => {
    const mockResponse = { number: '123456' }
    mockUsePayApi.updateRoutingSlipRefund.mockResolvedValue(mockResponse)
    const mockRoutingSlip: RoutingSlip = { number: '123456', status: SlipStatus.REFUNDREQUEST }
    mockUsePayApi.getRoutingSlip.mockResolvedValue(mockRoutingSlip)

    const composable = useRoutingSlip()
    const statusDetails = { status: SlipStatus.REFUNDREQUEST }
    const result = await composable.updateRoutingSlipStatus(statusDetails)

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.updateRoutingSlipRefund).toHaveBeenCalledWith(statusDetails, '123456')
  })

  it('should handle error when updating routing slip status', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.updateRoutingSlipStatus.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipStatus({ status: SlipStatus.COMPLETE })

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should update routing slip refund status', async () => {
    const mockResponse = { number: '123456' }
    mockUsePayApi.updateRoutingSlipRefundStatus.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipRefundStatus('APPROVED')

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.updateRoutingSlipRefundStatus).toHaveBeenCalledWith('APPROVED', '123456')
  })

  it('should handle error when updating refund status', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.updateRoutingSlipRefundStatus.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipRefundStatus('APPROVED')

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should update routing slip comments', async () => {
    const mockResponse = { number: '123456' }
    mockUsePayApi.updateRoutingSlipComments.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipComments('Test comment')

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.updateRoutingSlipComments).toHaveBeenCalledWith(
      { comment: { businessId: '123456', comment: 'Test comment' } },
      '123456'
    )
  })

  it('should handle error when updating comments', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.updateRoutingSlipComments.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.updateRoutingSlipComments('Test comment')

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should adjust routing slip', async () => {
    const mockPayments = [{ chequeReceiptNumber: 'CHQ001', paidAmount: 200 }]
    const mockResponse = { number: '123456', payments: mockPayments }
    mockUsePayApi.adjustRoutingSlip.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.adjustRoutingSlip(mockPayments)

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.adjustRoutingSlip).toHaveBeenCalledWith(mockPayments, '123456')
  })

  it('should handle error when adjusting routing slip', async () => {
    const mockPayments = [{ chequeReceiptNumber: 'CHQ001', paidAmount: 200 }]
    const mockError = new Error('API Error')
    mockUsePayApi.adjustRoutingSlip.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.adjustRoutingSlip(mockPayments)

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should reset routing slip details', () => {
    const composable = useRoutingSlip()
    composable.resetRoutingSlipDetails()

    expect(mockStore.routingSlipDetails).toBeUndefined()
    expect(mockStore.accountInfo).toBeUndefined()
    expect(mockStore.chequePayment).toBeUndefined()
    expect(mockStore.cashPayment).toBeUndefined()
    expect(mockStore.isPaymentMethodCheque).toBeUndefined()
    expect(mockStore.routingSlipAddress).toBeUndefined()
  })

  it('should save link routing slip successfully', async () => {
    mockUsePayApi.saveLinkRoutingSlip.mockResolvedValue(undefined)

    const composable = useRoutingSlip()
    const result = await composable.saveLinkRoutingSlip('987654')

    expect(result).toEqual({ error: false })
    expect(mockUsePayApi.saveLinkRoutingSlip).toHaveBeenCalledWith({
      childRoutingSlipNumber: '123456',
      parentRoutingSlipNumber: '987654'
    })
  })

  it('should handle 400 error when saving link routing slip', async () => {
    const mockError = {
      response: {
        status: 400,
        data: { message: 'Invalid link' }
      }
    }
    mockUsePayApi.saveLinkRoutingSlip.mockRejectedValue(mockError)

    const composable = useRoutingSlip()
    const result = await composable.saveLinkRoutingSlip('987654')

    expect(result).toEqual({ error: true, details: { message: 'Invalid link' } })
  })

  it('should handle non-400 error when saving link routing slip', async () => {
    const mockError = {
      response: {
        status: 500,
        data: { message: 'Server error' }
      }
    }
    mockUsePayApi.saveLinkRoutingSlip.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.saveLinkRoutingSlip('987654')

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should get linked routing slips successfully', async () => {
    const mockResponse = { children: [{ number: '111' }], parent: { number: '222' } }
    mockUsePayApi.getLinkedRoutingSlips.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    await composable.getLinkedRoutingSlips('123456')

    expect(mockStore.linkedRoutingSlips).toEqual(mockResponse)
    expect(mockUsePayApi.getLinkedRoutingSlips).toHaveBeenCalledWith('123456')
  })

  it('should handle error when getting linked routing slips', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.getLinkedRoutingSlips.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    await composable.getLinkedRoutingSlips('123456')

    expect(mockStore.linkedRoutingSlips).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should get daily report by date', async () => {
    const mockResponse = { report: 'data' }
    mockUsePayApi.getDailyReport.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.getDailyReportByDate('2025-01-01', 'type1')

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.getDailyReport).toHaveBeenCalled()
  })

  it('should handle error when getting daily report', async () => {
    const mockError = new Error('API Error')
    mockUsePayApi.getDailyReport.mockRejectedValue(mockError)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useRoutingSlip()
    const result = await composable.getDailyReportByDate('2025-01-01', 'type1')

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should get auto complete routing slips', async () => {
    const mockResponse = {
      items: [
        { number: '123456', status: SlipStatus.ACTIVE },
        { number: '789012', status: SlipStatus.COMPLETE }
      ]
    }
    mockUsePayApi.postSearchRoutingSlip.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.getAutoCompleteRoutingSlips('123')

    expect(result).toEqual(mockResponse.items)
    expect(mockUsePayApi.postSearchRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123' })
  })

  it('should return empty array when no items in auto complete response', async () => {
    mockUsePayApi.postSearchRoutingSlip.mockResolvedValue({})

    const composable = useRoutingSlip()
    const result = await composable.getAutoCompleteRoutingSlips('123')

    expect(result).toEqual([])
  })

  it('should get fee by corp type and filing type', async () => {
    const mockResponse = { total: 100.50 }
    mockUsePayApi.getFeeByCorpTypeAndFilingType.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.getFeeByCorpTypeAndFilingType({
      corpTypeCode: 'BC',
      filingTypeCode: 'OTANN',
      requestParams: {}
    })

    expect(result).toBe(100.50)
    expect(mockUsePayApi.getFeeByCorpTypeAndFilingType).toHaveBeenCalledWith({
      corpTypeCode: 'BC',
      filingTypeCode: 'OTANN',
      requestParams: {}
    })
  })

  it('should return null when fee response has no total', async () => {
    mockUsePayApi.getFeeByCorpTypeAndFilingType.mockResolvedValue({})

    const composable = useRoutingSlip()
    const result = await composable.getFeeByCorpTypeAndFilingType({
      corpTypeCode: 'BC',
      filingTypeCode: 'OTANN',
      requestParams: {}
    })

    expect(result).toBeNull()
  })

  it('should save manual transactions', async () => {
    const mockResponse: Invoice = { id: 1, references: [{ invoiceNumber: 'INV001' }] }
    mockUsePayApi.saveManualTransactions.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.saveManualTransactions({
      referenceNumber: 'REF123',
      filingType: {
        filingTypeCode: { code: 'OTANN', description: 'Annual' },
        corpTypeCode: { code: 'BC', description: 'BC Company', product: 'BC' }
      },
      quantity: 1,
      priority: false,
      futureEffective: false
    })

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.saveManualTransactions).toHaveBeenCalled()
  })

  it('should cancel routing slip invoice', async () => {
    const mockResponse = { success: true }
    mockUsePayApi.cancelRoutingSlipInvoice.mockResolvedValue(mockResponse)

    const composable = useRoutingSlip()
    const result = await composable.cancelRoutingSlipInvoice(123)

    expect(result).toEqual(mockResponse)
    expect(mockUsePayApi.cancelRoutingSlipInvoice).toHaveBeenCalledWith(123)
  })
})
