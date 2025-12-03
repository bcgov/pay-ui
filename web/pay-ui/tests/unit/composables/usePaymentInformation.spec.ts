import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import { routingSlipMock, linkedRoutingSlipsWithChildren } from '../test-data/mock-routing-slip'
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
})
