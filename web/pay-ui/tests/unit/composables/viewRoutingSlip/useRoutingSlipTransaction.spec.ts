import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useRoutingSlipTransaction from '~/composables/viewRoutingSlip/useRoutingSlipTransaction'
import { createPinia, setActivePinia } from 'pinia'
import type { ManualTransactionDetails } from '~/interfaces/routing-slip'

const mockGetRoutingSlip = vi.fn()
const mockIsRoutingSlipAChild = ref(false)
const mockIsRoutingSlipVoid = ref(false)
const mockSaveManualTransactions = vi.fn()
const mockUseRoutingSlip = {
  getRoutingSlip: mockGetRoutingSlip,
  isRoutingSlipAChild: mockIsRoutingSlipAChild,
  isRoutingSlipVoid: mockIsRoutingSlipVoid,
  saveManualTransactions: mockSaveManualTransactions
}

const mockToggleLoading = vi.fn()
const mockIsLoading = ref(false)

const mockStore = {
  routingSlip: {
    number: '123456789',
    remainingAmount: 1000.00
  }
}

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    isLoading: mockIsLoading,
    toggleLoading: mockToggleLoading
  })
}))

describe('useRoutingSlipTransaction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsLoading.value = false
    mockIsRoutingSlipAChild.value = false
    mockIsRoutingSlipVoid.value = false
    mockGetRoutingSlip.mockImplementation(() => Promise.resolve({}))
    mockSaveManualTransactions.mockImplementation(() => Promise.resolve({}))
    mockStore.routingSlip.number = '123456789'
    mockStore.routingSlip.remainingAmount = 1000.00
  })

  it('should be defined', () => {
    const composable = useRoutingSlipTransaction()
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const composable = useRoutingSlipTransaction()
    expect(composable.formRoutingSlipManualTransactions).toBeDefined()
    expect(composable.showAddManualTransaction).toBeDefined()
    expect(composable.manualTransactionsList).toBeDefined()
    expect(composable.isRoutingSlipAChild).toBeDefined()
    expect(composable.isRoutingSlipVoid).toBeDefined()
    expect(composable.isLoading).toBeDefined()
    expect(composable.showManualTransaction).toBeDefined()
    expect(composable.addManualTransactionRow).toBeDefined()
    expect(composable.addManualTransactions).toBeDefined()
    expect(composable.isLastChild).toBeDefined()
    expect(composable.availableAmountForManualTransaction).toBeDefined()
    expect(composable.isValid).toBeDefined()
    expect(composable.removeManualTransactionRow).toBeDefined()
    expect(composable.updateManualTransactionDetails).toBeDefined()
    expect(composable.hideManualTransaction).toBeDefined()
    expect(composable.status).toBeDefined()
  })

  it('should initialize with default values', () => {
    const composable = useRoutingSlipTransaction()
    expect(composable.showAddManualTransaction.value).toBe(false)
    expect(composable.manualTransactionsList.value).toEqual([])
    expect(composable.status.value).toBe('')
  })

  it('should show manual transaction and add row when list is empty', () => {
    const composable = useRoutingSlipTransaction()
    composable.showManualTransaction()

    expect(composable.showAddManualTransaction.value).toBe(true)
    expect(composable.manualTransactionsList.value.length).toBe(1)
  })

  it('should show manual transaction without adding row when list is not empty', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    const initialLength = composable.manualTransactionsList.value.length

    composable.showManualTransaction()

    expect(composable.showAddManualTransaction.value).toBe(true)
    expect(composable.manualTransactionsList.value.length).toBe(initialLength)
  })

  it('should add manual transaction row', () => {
    const composable = useRoutingSlipTransaction()
    composable.addManualTransactionRow()

    expect(composable.manualTransactionsList.value.length).toBe(1)
    expect(composable.manualTransactionsList.value[0]).toHaveProperty('key')
    expect(composable.manualTransactionsList.value[0]?.futureEffective).toBe(false)
    expect(composable.manualTransactionsList.value[0]?.priority).toBe(false)
    expect(composable.status.value).toBe('')
  })

  it('should remove manual transaction row', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ key: 2 } as Partial<ManualTransactionDetails>)

    composable.removeManualTransactionRow(0)

    expect(composable.manualTransactionsList.value.length).toBe(1)
    expect(composable.manualTransactionsList.value[0]?.key).toBe(2)
    expect(composable.status.value).toBe('')
  })

  it('should calculate available amount for manual transaction', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 200 } as Partial<ManualTransactionDetails>)

    const available = composable.availableAmountForManualTransaction()

    expect(available).toBe(700.00) // 1000 - 100 - 200
  })

  it('should return full remaining amount when no transactions', () => {
    const composable = useRoutingSlipTransaction()
    const available = composable.availableAmountForManualTransaction()

    expect(available).toBe(1000.00)
  })

  it('should handle undefined total in available amount calculation', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ total: undefined } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)

    const available = composable.availableAmountForManualTransaction()

    expect(available).toBe(900.00) // 1000 - 0 - 100
  })

  it('should return false for isLastChild when index is last', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ key: 2 } as Partial<ManualTransactionDetails>)

    expect(composable.isLastChild(0)).toBe(true)
    expect(composable.isLastChild(1)).toBe(false)
  })

  it('should toggle showAddManualTransaction through showManualTransaction', () => {
    const composable = useRoutingSlipTransaction()
    composable.showManualTransaction()
    expect(composable.showAddManualTransaction.value).toBe(true)

    composable.hideManualTransaction()
    expect(composable.showAddManualTransaction.value).toBe(false)
  })

  it('should return false for isValid when form is not set', () => {
    const composable = useRoutingSlipTransaction()
    expect(composable.isValid()).toBe(false)
  })

  it('should return form validity when form is set', () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm

    expect(composable.isValid()).toBe(true)
    expect(mockForm.checkValidity).toHaveBeenCalled()
  })

  it('should not add transactions when validation function returns false', async () => {
    const composable = useRoutingSlipTransaction()
    const validateFn = vi.fn(() => false)

    await composable.addManualTransactions(validateFn)

    expect(validateFn).toHaveBeenCalled()
    expect(mockSaveManualTransactions).not.toHaveBeenCalled()
  })

  it('should set error status when amount exceeds available', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 1500 } as Partial<ManualTransactionDetails>) // Exceeds 1000

    await composable.addManualTransactions()

    expect(composable.status.value).toBe('cantAddTransactions')
    expect(mockSaveManualTransactions).not.toHaveBeenCalled()
  })

  it('should save manual transactions when valid', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 200 } as Partial<ManualTransactionDetails>)

    await composable.addManualTransactions()

    expect(mockSaveManualTransactions).toHaveBeenCalledTimes(2)
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should reset manual transaction after successful save', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.showAddManualTransaction.value = true
    composable.status.value = 'some-status'

    await composable.addManualTransactions()

    // resetManualTransaction is called internally, verify the result
    expect(composable.manualTransactionsList.value.length).toBe(0)
    expect(composable.showAddManualTransaction.value).toBe(false)
    expect(composable.status.value).toBe('')
  })

  it('should not reset when save fails', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    mockSaveManualTransactions.mockImplementation(() => Promise.reject(new Error('Save failed')))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.addManualTransactions()

    expect(composable.manualTransactionsList.value.length).toBe(1) // Not reset
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should call reportValidity when form is invalid', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => false),
      reportValidity: vi.fn()

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm

    await composable.addManualTransactions()

    expect(mockForm.reportValidity).toHaveBeenCalled()
    expect(mockSaveManualTransactions).not.toHaveBeenCalled()
  })

  it('should not call getRoutingSlip when routingSlip number is missing', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    mockStore.routingSlip.number = undefined as unknown as string

    await composable.addManualTransactions()

    expect(mockSaveManualTransactions).toHaveBeenCalled()
    expect(mockGetRoutingSlip).not.toHaveBeenCalled()
  })

  it('should update manual transaction details', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({
      key: 1,
      filingType: 'OLD',
      futureEffective: false,
      priority: false,
      total: 0
    } as Partial<ManualTransactionDetails>)

    const updatedTransaction = {
      filingType: { code: 'NEW' },
      futureEffective: true,
      priority: true,
      quantity: 5,
      referenceNumber: 'REF-123',
      total: 100
    }

    composable.updateManualTransactionDetails({
      index: 0,
      transaction: updatedTransaction
    })

    const transaction = composable.manualTransactionsList.value[0]
    expect(transaction?.filingType).toEqual({ code: 'NEW' })
    expect(transaction?.futureEffective).toBe(true)
    expect(transaction?.priority).toBe(true)
    expect(transaction?.quantity).toBe(5)
    expect(transaction?.referenceNumber).toBe('REF-123')
    expect(transaction?.total).toBe(100)
    expect(composable.status.value).toBe('')
  })

  it('should not update when index is out of bounds', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)

    composable.updateManualTransactionDetails({
      index: 999,
      transaction: { total: 100 } as Partial<ManualTransactionDetails>
    })

    expect(composable.manualTransactionsList.value[0]?.total).toBeUndefined()
  })

  it('should update available amount for manual transaction after update', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({
      key: 1,
      total: undefined,
      availableAmountForManualTransaction: 1000,
      filingType: { code: 'TYPE1' }

    } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({
      key: 2,
      total: undefined,
      availableAmountForManualTransaction: 1000,
      filingType: { code: 'TYPE2' }
    } as Partial<ManualTransactionDetails>)

    composable.updateManualTransactionDetails({
      index: 0,
      transaction: { total: 200, filingType: { code: 'TYPE1' } } as Partial<ManualTransactionDetails>
    })

    const secondTransaction = composable.manualTransactionsList.value[1]
    expect(secondTransaction?.availableAmountForManualTransaction).toBe(800) // 1000 - 200
  })

  it('should carry over available amount when previous total is undefined', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({
      key: 1,
      total: undefined,
      availableAmountForManualTransaction: 1000,
      filingType: { code: 'TYPE1' }

    } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({
      key: 2,
      total: undefined,
      availableAmountForManualTransaction: 1000,
      filingType: { code: 'TYPE2' }
    } as Partial<ManualTransactionDetails>)

    composable.updateManualTransactionDetails({
      index: 0,
      transaction: { total: undefined, filingType: { code: 'TYPE1' } } as Partial<ManualTransactionDetails>
    })

    const secondTransaction = composable.manualTransactionsList.value[1]
    expect(secondTransaction?.availableAmountForManualTransaction).toBe(1000) // Carried over
  })

  it('should reset manual transaction when addManualTransactions succeeds', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.showAddManualTransaction.value = true
    composable.status.value = 'some-status'

    await composable.addManualTransactions()

    // resetManualTransaction is called internally after successful save
    expect(composable.status.value).toBe('')
    expect(composable.showAddManualTransaction.value).toBe(false)
    expect(composable.manualTransactionsList.value.length).toBe(0)
  })

  it('should hide manual transaction', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.showAddManualTransaction.value = true

    composable.hideManualTransaction()

    expect(composable.manualTransactionsList.value.length).toBe(0)
    expect(composable.showAddManualTransaction.value).toBe(false)
  })

  it('should get default row with correct structure when adding row', () => {
    const composable = useRoutingSlipTransaction()
    composable.addManualTransactionRow()

    const row = composable.manualTransactionsList.value[0]
    expect(row).toHaveProperty('key')
    expect(row?.futureEffective).toBe(false)
    expect(row?.priority).toBe(false)
    expect(row?.total).toBeUndefined()
    expect(row?.referenceNumber).toBeUndefined()
    expect(row?.filingType).toBeUndefined()
    expect(row?.availableAmountForManualTransaction).toBe(1000.00)
  })

  it('should return isRoutingSlipAChild from useRoutingSlip', () => {
    const composable = useRoutingSlipTransaction()
    mockIsRoutingSlipAChild.value = true
    expect(composable.isRoutingSlipAChild.value).toBe(true)
  })

  it('should return isRoutingSlipVoid from useRoutingSlip', () => {
    const composable = useRoutingSlipTransaction()
    mockIsRoutingSlipVoid.value = true
    expect(composable.isRoutingSlipVoid.value).toBe(true)
  })

  it('should stop saving transactions on first error', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)

    } as Partial<HTMLFormElement> & { checkValidity: () => boolean, reportValidity?: () => void }
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 200 } as Partial<ManualTransactionDetails>)

    let callCount = 0
    mockSaveManualTransactions.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new Error('First save failed'))
      }
      return Promise.resolve({})
    })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.addManualTransactions()

    expect(mockSaveManualTransactions).toHaveBeenCalledTimes(1) // Stops after first error
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should handle missing remainingAmount in availableAmountForManualTransaction', () => {
    const composable = useRoutingSlipTransaction()
    mockStore.routingSlip.remainingAmount = undefined as unknown as number

    const available = composable.availableAmountForManualTransaction()

    expect(available).toBe(0)
  })
})
