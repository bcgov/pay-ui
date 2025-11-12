/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import { routingSlipMock, linkedRoutingSlipsWithChildren } from '../test-data/mock-routing-slip'

vi.mock('~/composables/useRoutingSlip', () => ({
  useRoutingSlip: () => ({
    routingSlip: ref(routingSlipMock),
    linkedRoutingSlips: ref(linkedRoutingSlipsWithChildren),
    isRoutingSlipAChild: ref(false),
    isRoutingSlipLinked: ref(true),
    updateRoutingSlipChequeNumber: vi.fn(),
    updateRoutingSlipAmount: vi.fn(),
    adjustRoutingSlip: vi.fn().mockResolvedValue(routingSlipMock),
    getRoutingSlip: vi.fn().mockResolvedValue(routingSlipMock)
  })
}))

vi.mock('#app', () => ({
  useRoute: () => ({
    params: { slipId: '123456789' },
    query: {}
  })
}))

describe('usePaymentInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(totalAmount.value).toBe('$2,500.00')
  })

  it('computes remainingAmount correctly', () => {
    const { remainingAmount } = usePaymentInformation()
    expect(remainingAmount.value).toBe('$1,000.00')
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
    expect(displayEditRoutingSlip.value).toBe(true)
  })

  it('calls adjustRoutingSlip when adjustRoutingSlipHandler is called', async () => {
    const mockAdjustRoutingSlip = vi.fn().mockResolvedValue(routingSlipMock)
    const mockGetRoutingSlip = vi.fn().mockResolvedValue(routingSlipMock)

    vi.mocked(useRoutingSlip).mockReturnValue({
      routingSlip: ref(routingSlipMock),
      linkedRoutingSlips: ref(linkedRoutingSlipsWithChildren),
      isRoutingSlipAChild: ref(false),
      isRoutingSlipLinked: ref(true),
      updateRoutingSlipChequeNumber: vi.fn(),
      updateRoutingSlipAmount: vi.fn(),
      adjustRoutingSlip: mockAdjustRoutingSlip,
      getRoutingSlip: mockGetRoutingSlip
    } as any)

    const { adjustRoutingSlipHandler, editPayment } = usePaymentInformation()

    editPayment()
    await adjustRoutingSlipHandler()

    expect(mockAdjustRoutingSlip).toHaveBeenCalled()
    expect(mockGetRoutingSlip).toHaveBeenCalled()
  })

  it('generates correct navigation path', () => {
    const { navigateTo } = usePaymentInformation()
    const path = navigateTo('123', '456')
    expect(path).toContain('456')
  })

  it('calls updateRoutingSlipChequeNumber when adjustRoutingSlipChequeNumber is called', () => {
    const mockUpdateChequeNumber = vi.fn()

    vi.mocked(useRoutingSlip).mockReturnValue({
      routingSlip: ref(routingSlipMock),
      linkedRoutingSlips: ref(linkedRoutingSlipsWithChildren),
      isRoutingSlipAChild: ref(false),
      isRoutingSlipLinked: ref(true),
      updateRoutingSlipChequeNumber: mockUpdateChequeNumber,
      updateRoutingSlipAmount: vi.fn(),
      adjustRoutingSlip: vi.fn(),
      getRoutingSlip: vi.fn()
    } as any)

    const { adjustRoutingSlipChequeNumber } = usePaymentInformation()
    adjustRoutingSlipChequeNumber('999', 0)

    expect(mockUpdateChequeNumber).toHaveBeenCalledWith({
      chequeNum: '999',
      paymentIndex: 0
    })
  })

  it('calls updateRoutingSlipAmount when adjustRoutingSlipAmount is called', () => {
    const mockUpdateAmount = vi.fn()

    vi.mocked(useRoutingSlip).mockReturnValue({
      routingSlip: ref(routingSlipMock),
      linkedRoutingSlips: ref(linkedRoutingSlipsWithChildren),
      isRoutingSlipAChild: ref(false),
      isRoutingSlipLinked: ref(true),
      updateRoutingSlipChequeNumber: vi.fn(),
      updateRoutingSlipAmount: mockUpdateAmount,
      adjustRoutingSlip: vi.fn(),
      getRoutingSlip: vi.fn()
    } as any)

    const { adjustRoutingSlipAmount } = usePaymentInformation()
    adjustRoutingSlipAmount(1000, false, 0)

    expect(mockUpdateAmount).toHaveBeenCalledWith({
      amount: 1000,
      paymentIndex: 0,
      isRoutingSlipPaidInUsd: false
    })
  })
})
