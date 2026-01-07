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

  it('initializes with correct defaults, computes all values correctly, and handles expand/edit toggles', () => {
    const {
      isExpanded,
      isEditable,
      hasPaymentChanges,
      isPaymentCheque,
      totalAmount,
      remainingAmount,
      isRoutingSlipPaidInUsd,
      isRoutingSlipLinked,
      isRoutingSlipAChild,
      enableEditRoutingSlip,
      displayEditRoutingSlip,
      viewPaymentInformation,
      editPayment,
      cancelEditPayment
    } = usePaymentInformation()

    expect(isExpanded.value).toBe(false)
    expect(isEditable.value).toBe(false)
    expect(hasPaymentChanges.value).toBe(false)
    expect(isPaymentCheque.value).toBe(true)
    expect(totalAmount.value).toBe('$2500.00')
    expect(remainingAmount.value).toBe('$1000.00')
    expect(isRoutingSlipPaidInUsd.value).toBe(true)
    expect(isRoutingSlipLinked.value).toBe(true)
    expect(isRoutingSlipAChild.value).toBe(false)
    expect(enableEditRoutingSlip.value).toBe(true)
    expect(displayEditRoutingSlip.value).toBe(false)

    viewPaymentInformation()
    expect(isExpanded.value).toBe(true)
    expect(displayEditRoutingSlip.value).toBeTruthy()
    viewPaymentInformation()
    expect(isExpanded.value).toBe(false)

    editPayment()
    expect(isEditable.value).toBe(true)
    cancelEditPayment()
    expect(isEditable.value).toBe(false)
  })

  it('calls adjustRoutingSlip when adjustRoutingSlipHandler is called and handles emit', async () => {
    const { adjustRoutingSlipHandler, editPayment, isEditable } = usePaymentInformation()

    editPayment()
    expect(isEditable.value).toBe(true)

    await adjustRoutingSlipHandler()
    expect(isEditable.value).toBe(false)

    const emit = vi.fn()
    const composable2 = usePaymentInformation(emit)
    composable2.editPayment()
    await composable2.adjustRoutingSlipHandler()
    expect(emit).toHaveBeenCalledWith('paymentAdjusted')
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

  it('should compute totalAmount, remainingAmount, USD flags, edit flags, payment changes, '
    + 'and handle all payment operations', () => {
    mockUseRoutingSlip.isRoutingSlipLinked.value = false
    mockStore.routingSlip.total = 1500
    let { totalAmount } = usePaymentInformation()
    expect(totalAmount.value).toBe('$1500.00')

    mockUseRoutingSlip.isRoutingSlipAChild.value = true
    mockUseRoutingSlip.isRoutingSlipLinked.value = true
    mockStore.routingSlip.total = 500
    totalAmount = usePaymentInformation().totalAmount
    expect(totalAmount.value).toBe('$500.00')

    mockUseRoutingSlip.isRoutingSlipLinked.value = false
    mockStore.routingSlip.total = 0
    totalAmount = usePaymentInformation().totalAmount
    expect(totalAmount.value).toBe('$0.00')

    mockStore.routingSlip.remainingAmount = undefined
    const { remainingAmount } = usePaymentInformation()
    expect(remainingAmount.value).toBe('$0.00')

    mockStore.routingSlip.totalUsd = 0
    let { isRoutingSlipPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipPaidInUsd.value).toBeFalsy()

    mockStore.routingSlip.totalUsd = undefined
    isRoutingSlipPaidInUsd = usePaymentInformation().isRoutingSlipPaidInUsd
    expect(isRoutingSlipPaidInUsd.value).toBeFalsy()

    mockStore.linkedRoutingSlips = { ...linkedRoutingSlipsWithChequeChildren }
    let { isRoutingSlipChildPaidInUsd } = usePaymentInformation()
    expect(isRoutingSlipChildPaidInUsd.value).toBe(true)

    mockStore.linkedRoutingSlips = { children: [] }
    isRoutingSlipChildPaidInUsd = usePaymentInformation().isRoutingSlipChildPaidInUsd
    expect(isRoutingSlipChildPaidInUsd.value).toBe(false)

    mockStore.routingSlip.status = 'COMPLETE'
    let { enableEditRoutingSlip } = usePaymentInformation()
    expect(enableEditRoutingSlip.value).toBe(true)

    mockStore.routingSlip.status = 'CORRECTION'
    enableEditRoutingSlip = usePaymentInformation().enableEditRoutingSlip
    expect(enableEditRoutingSlip.value).toBe(true)

    mockStore.routingSlip.status = 'VOID'
    enableEditRoutingSlip = usePaymentInformation().enableEditRoutingSlip
    expect(enableEditRoutingSlip.value).toBe(false)

    mockStore.routingSlip.status = 'ACTIVE'
    mockStore.routingSlipBeforeEdit = { ...routingSlipMock, total: 3000 }
    mockStore.routingSlip.total = 2000
    let { hasPaymentChanges } = usePaymentInformation()
    expect(hasPaymentChanges.value).toBe(true)

    mockStore.routingSlipBeforeEdit = { ...routingSlipMock }
    mockStore.routingSlip = { ...routingSlipMock }
    hasPaymentChanges = usePaymentInformation().hasPaymentChanges
    expect(hasPaymentChanges.value).toBe(false)

    const originalRoutingSlip = { ...mockStore.routingSlip }
    mockStore.routingSlipBeforeEdit = { ...originalRoutingSlip }
    mockStore.routingSlip.total = 9999
    const composable1 = usePaymentInformation()
    composable1.cancelEditPayment()
    expect(mockStore.routingSlip.total).toBe(originalRoutingSlip.total)

    composable1.editPayment()
    expect(Object.keys(mockStore.routingSlipBeforeEdit).length).toBeGreaterThan(0)

    const composable2 = usePaymentInformation()
    expect(composable2.isEditable.value).toBe(false)
    composable2.adjustRoutingSlipStatus()
    expect(composable2.isEditable.value).toBe(true)
    composable2.adjustRoutingSlipStatus()
    expect(composable2.isEditable.value).toBe(false)

    composable2.editPayment()
    expect(composable2.isEditable.value).toBe(true)
    composable2.cancelRoutingSlipAdjust()
    expect(composable2.isEditable.value).toBe(false)

    mockStore.routingSlip.payments = [{ paymentMethod: 'CASH' }]
    let { isPaymentCheque } = usePaymentInformation()
    expect(isPaymentCheque.value).toBe(false)

    mockStore.routingSlip.payments = []
    isPaymentCheque = usePaymentInformation().isPaymentCheque
    expect(isPaymentCheque.value).toBe(false)

    mockStore.routingSlip.payments = undefined
    isPaymentCheque = usePaymentInformation().isPaymentCheque
    expect(isPaymentCheque.value).toBeFalsy()

    const composable3 = usePaymentInformation()
    composable3.adjustRoutingSlipChequeNumber('CHQ123', 1)
    expect(mockUpdateRoutingSlipChequeNumber).toHaveBeenCalledWith({
      chequeNum: 'CHQ123',
      paymentIndex: 1
    })

    composable3.adjustRoutingSlipAmount(500, true, 2)
    expect(mockUpdateRoutingSlipAmount).toHaveBeenCalledWith({
      amount: 500,
      paymentIndex: 2,
      isRoutingSlipPaidInUsd: true
    })

    composable3.adjustRoutingSlipAmount(750, false, 0)
    expect(mockUpdateRoutingSlipAmount).toHaveBeenCalledWith({
      amount: 750,
      paymentIndex: 0,
      isRoutingSlipPaidInUsd: false
    })
  })
})
