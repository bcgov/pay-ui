import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import {
  routingSlipMock,
  linkedRoutingSlipsWithChildren,
  linkedRoutingSlipsWithChequeChildren
} from '../test-data/mock-routing-slip'
import { createPinia, setActivePinia } from 'pinia'

const mockUpdateRoutingSlipChequeNumber = vi.fn()
const mockUpdateRoutingSlipAmount = vi.fn()
const mockAdjustRoutingSlip = vi.fn().mockResolvedValue(routingSlipMock)
const mockGetRoutingSlip = vi.fn().mockResolvedValue(routingSlipMock)

const mockUseRoutingSlip = {
  adjustRoutingSlip: mockAdjustRoutingSlip,
  getRoutingSlip: mockGetRoutingSlip,
  isRoutingSlipAChild: ref(false),
  isRoutingSlipLinked: ref(true),
  updateRoutingSlipAmount: mockUpdateRoutingSlipAmount,
  updateRoutingSlipChequeNumber: mockUpdateRoutingSlipChequeNumber
}

const mockStore = reactive({
  routingSlip: { ...routingSlipMock },
  linkedRoutingSlips: { ...linkedRoutingSlipsWithChildren },
  routingSlipBeforeEdit: {}
})

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))

mockNuxtImport('useRoute', () => () => ({
  params: { slipId: '123456789' },
  query: {}
}))

describe('usePaymentInformation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset store to initial state
    mockStore.routingSlip = { ...routingSlipMock }
    mockStore.linkedRoutingSlips = { ...linkedRoutingSlipsWithChildren }
    mockStore.routingSlipBeforeEdit = {}
    mockUseRoutingSlip.isRoutingSlipAChild.value = false
    mockUseRoutingSlip.isRoutingSlipLinked.value = true
    mockAdjustRoutingSlip.mockResolvedValue(routingSlipMock)
    mockGetRoutingSlip.mockResolvedValue(routingSlipMock)
  })

  it('initializes with correct default values', () => {
    const {
      isExpanded,
      isEditable,
      hasPaymentChanges
    } = usePaymentInformation()

    expect(isExpanded.value).toBe(false)
    expect(isEditable.value).toBe(false)
    expect(hasPaymentChanges.value).toBe(false)
  })

  it('computes isPaymentCheque correctly', () => {
    const { isPaymentCheque } = usePaymentInformation()
    expect(isPaymentCheque.value).toBe(true)
  })

  it('computes totalAmount correctly', () => {
    const { totalAmount } = usePaymentInformation()
    // Total from parent (2000) + child (500) = 2500
    expect(totalAmount.value).toBe('$2500.00')
  })

  it('computes remainingAmount correctly', () => {
    const { remainingAmount } = usePaymentInformation()
    expect(remainingAmount.value).toBe('$1000.00')
  })

  it('computes isRoutingSlipPaidInUsd correctly', () => {
    const { isRoutingSlipPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipPaidInUsd.value).toBe(true)
  })

  it('computes isRoutingSlipLinked correctly', () => {
    const { isRoutingSlipLinked } = usePaymentInformation()
    expect(isRoutingSlipLinked.value).toBe(true)
  })

  it('computes isRoutingSlipAChild correctly', () => {
    const { isRoutingSlipAChild } = usePaymentInformation()
    expect(isRoutingSlipAChild.value).toBe(false)
  })

  it('toggles isExpanded when viewPaymentInformation is called', () => {
    const { isExpanded, viewPaymentInformation } = usePaymentInformation()

    expect(isExpanded.value).toBe(false)
    viewPaymentInformation()
    expect(isExpanded.value).toBe(true)
    viewPaymentInformation()
    expect(isExpanded.value).toBe(false)
  })

  it('sets isEditable to true when editPayment is called', () => {
    const { isEditable, editPayment } = usePaymentInformation()

    expect(isEditable.value).toBe(false)
    editPayment()
    expect(isEditable.value).toBe(true)
  })

  it('sets isEditable to false when cancelEditPayment is called', () => {
    const { isEditable, editPayment, cancelEditPayment } = usePaymentInformation()

    editPayment()
    expect(isEditable.value).toBe(true)
    cancelEditPayment()
    expect(isEditable.value).toBe(false)
  })

  it('computes enableEditRoutingSlip correctly for ACTIVE status', () => {
    const { enableEditRoutingSlip } = usePaymentInformation()
    expect(enableEditRoutingSlip.value).toBe(true)
  })

  it('computes displayEditRoutingSlip correctly', () => {
    const { displayEditRoutingSlip, viewPaymentInformation } = usePaymentInformation()

    // Initially false because not expanded
    expect(displayEditRoutingSlip.value).toBe(false)

    // Expand to show edit button
    viewPaymentInformation()
    expect(displayEditRoutingSlip.value).toBeTruthy()
  })

  it('calls adjustRoutingSlip when adjustRoutingSlipHandler is called', async () => {
    const { adjustRoutingSlipHandler, editPayment, isEditable } = usePaymentInformation()

    editPayment()
    expect(isEditable.value).toBe(true)

    await adjustRoutingSlipHandler()

    expect(isEditable.value).toBe(false)
  })

  it('generates correct navigation path', () => {
    const { navigateTo } = usePaymentInformation()
    const path = navigateTo('123', '456')
    expect(path).toContain('456')
  })

  it('adjustRoutingSlipChequeNumber updates cheque number', () => {
    const { adjustRoutingSlipChequeNumber } = usePaymentInformation()

    expect(() => {
      adjustRoutingSlipChequeNumber('999', 0)
    }).not.toThrow()
  })

  it('adjustRoutingSlipAmount updates amount', () => {
    const { adjustRoutingSlipAmount } = usePaymentInformation()

    expect(() => {
      adjustRoutingSlipAmount(1000, false, 0)
    }).not.toThrow()
  })

  it('should compute totalAmount for non-linked routing slip', () => {
    mockUseRoutingSlip.isRoutingSlipLinked.value = false
    mockStore.routingSlip.total = 1500
    const { totalAmount } = usePaymentInformation()
    expect(totalAmount.value).toBe('$1500.00')
  })

  it('should compute totalAmount for child routing slip', () => {
    mockUseRoutingSlip.isRoutingSlipAChild.value = true
    mockUseRoutingSlip.isRoutingSlipLinked.value = true
    mockStore.routingSlip.total = 500
    const { totalAmount } = usePaymentInformation()
    expect(totalAmount.value).toBe('$500.00')
  })

  it('should return $0.00 when total is 0', () => {
    mockUseRoutingSlip.isRoutingSlipLinked.value = false
    mockStore.routingSlip.total = 0
    const { totalAmount } = usePaymentInformation()
    expect(totalAmount.value).toBe('$0.00')
  })

  it('should return $0.00 when remainingAmount is undefined', () => {
    mockStore.routingSlip.remainingAmount = undefined
    const { remainingAmount } = usePaymentInformation()
    expect(remainingAmount.value).toBe('$0.00')
  })

  it('should compute isRoutingSlipPaidInUsd as falsy when totalUsd is 0', () => {
    mockStore.routingSlip.totalUsd = 0
    const { isRoutingSlipPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipPaidInUsd.value).toBeFalsy()
    expect(isRoutingSlipPaidInUsd.value).not.toBe(true)
  })

  it('should compute isRoutingSlipPaidInUsd as falsy when totalUsd is undefined', () => {
    mockStore.routingSlip.totalUsd = undefined
    const { isRoutingSlipPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipPaidInUsd.value).toBeFalsy()
    expect(isRoutingSlipPaidInUsd.value).not.toBe(true)
  })

  it('should compute isRoutingSlipChildPaidInUsd correctly', () => {
    mockStore.linkedRoutingSlips = { ...linkedRoutingSlipsWithChequeChildren }
    const { isRoutingSlipChildPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipChildPaidInUsd.value).toBe(true)
  })

  it('should compute isRoutingSlipChildPaidInUsd as false when no children', () => {
    mockStore.linkedRoutingSlips = { children: [] }
    const { isRoutingSlipChildPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipChildPaidInUsd.value).toBe(false)
  })

  it('should compute enableEditRoutingSlip for COMPLETE status', () => {
    mockStore.routingSlip.status = 'COMPLETE'
    const { enableEditRoutingSlip } = usePaymentInformation()
    expect(enableEditRoutingSlip.value).toBe(true)
  })

  it('should compute enableEditRoutingSlip for CORRECTION status', () => {
    mockStore.routingSlip.status = 'CORRECTION'
    const { enableEditRoutingSlip } = usePaymentInformation()
    expect(enableEditRoutingSlip.value).toBe(true)
  })

  it('should compute enableEditRoutingSlip as false for VOID status', () => {
    mockStore.routingSlip.status = 'VOID'
    const { enableEditRoutingSlip } = usePaymentInformation()
    expect(enableEditRoutingSlip.value).toBe(false)
  })

  it('should compute hasPaymentChanges as true when changes exist', () => {
    mockStore.routingSlipBeforeEdit = { ...routingSlipMock, total: 3000 }
    mockStore.routingSlip.total = 2000
    const { hasPaymentChanges } = usePaymentInformation()
    expect(hasPaymentChanges.value).toBe(true)
  })

  it('should compute hasPaymentChanges as false when no changes', () => {
    mockStore.routingSlipBeforeEdit = { ...routingSlipMock }
    const { hasPaymentChanges } = usePaymentInformation()
    expect(hasPaymentChanges.value).toBe(false)
  })

  it('should emit paymentAdjusted event when adjustRoutingSlipHandler is called', async () => {
    const emit = vi.fn()
    const { adjustRoutingSlipHandler, editPayment } = usePaymentInformation(emit)

    editPayment()
    await adjustRoutingSlipHandler()

    expect(emit).toHaveBeenCalledWith('paymentAdjusted')
  })

  it('should not emit when emit is not provided', async () => {
    const { adjustRoutingSlipHandler, editPayment } = usePaymentInformation()

    editPayment()
    await adjustRoutingSlipHandler()

    expect(mockAdjustRoutingSlip).toHaveBeenCalled()
  })

  it('should restore routing slip when cancelEditPayment is called', () => {
    const originalRoutingSlip = { ...mockStore.routingSlip }
    mockStore.routingSlipBeforeEdit = { ...originalRoutingSlip }
    mockStore.routingSlip.total = 9999

    const { cancelEditPayment } = usePaymentInformation()
    cancelEditPayment()

    expect(mockStore.routingSlip.total).toBe(originalRoutingSlip.total)
  })

  it('should save routing slip before edit when editPayment is called', () => {
    const { editPayment } = usePaymentInformation()
    editPayment()

    expect(Object.keys(mockStore.routingSlipBeforeEdit).length).toBeGreaterThan(0)
  })

  it('should toggle isEditable when adjustRoutingSlipStatus is called', () => {
    const { isEditable, adjustRoutingSlipStatus } = usePaymentInformation()

    expect(isEditable.value).toBe(false)
    adjustRoutingSlipStatus()
    expect(isEditable.value).toBe(true)
    adjustRoutingSlipStatus()
    expect(isEditable.value).toBe(false)
  })

  it('should toggle isEditable when cancelRoutingSlipAdjust is called', () => {
    const { isEditable, editPayment, cancelRoutingSlipAdjust } = usePaymentInformation()

    editPayment()
    expect(isEditable.value).toBe(true)
    cancelRoutingSlipAdjust()
    expect(isEditable.value).toBe(false)
  })

  it('should compute isPaymentCheque as false for cash payment', () => {
    mockStore.routingSlip.payments = [{ paymentMethod: 'CASH' }]
    const { isPaymentCheque } = usePaymentInformation()
    expect(isPaymentCheque.value).toBe(false)
  })

  it('should compute isPaymentCheque as false when no payments', () => {
    mockStore.routingSlip.payments = []
    const { isPaymentCheque } = usePaymentInformation()
    expect(isPaymentCheque.value).toBe(false)
  })

  it('should compute isPaymentCheque as false when payments is undefined', () => {
    mockStore.routingSlip.payments = undefined
    const { isPaymentCheque } = usePaymentInformation()
    expect(isPaymentCheque.value).toBeFalsy()
  })

  it('should call updateRoutingSlipChequeNumber with correct params', () => {
    const { adjustRoutingSlipChequeNumber } = usePaymentInformation()
    adjustRoutingSlipChequeNumber('CHQ123', 1)

    expect(mockUpdateRoutingSlipChequeNumber).toHaveBeenCalledWith({
      chequeNum: 'CHQ123',
      paymentIndex: 1
    })
  })

  it('should call updateRoutingSlipAmount with correct params for USD', () => {
    const { adjustRoutingSlipAmount } = usePaymentInformation()
    adjustRoutingSlipAmount(500, true, 2)

    expect(mockUpdateRoutingSlipAmount).toHaveBeenCalledWith({
      amount: 500,
      paymentIndex: 2,
      isRoutingSlipPaidInUsd: true
    })
  })

  it('should call updateRoutingSlipAmount with correct params for CAD', () => {
    const { adjustRoutingSlipAmount } = usePaymentInformation()
    adjustRoutingSlipAmount(750, false, 0)

    expect(mockUpdateRoutingSlipAmount).toHaveBeenCalledWith({
      amount: 750,
      paymentIndex: 0,
      isRoutingSlipPaidInUsd: false
    })
  })
})
