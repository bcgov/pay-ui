import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useRoutingSlipTransaction from '~/composables/viewRoutingSlip/useRoutingSlipTransaction'
import { createPinia, setActivePinia } from 'pinia'
import type { ManualTransactionDetails } from '~/interfaces/routing-slip'

vi.mock('lodash', () => ({
  cloneDeep: vi.fn(val => JSON.parse(JSON.stringify(val)))
}))

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

const mockT = vi.fn((key: string) => key)
mockNuxtImport('useI18n', () => () => ({
  t: mockT
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

  it('should be defined, return all expected properties, and initialize with default values', () => {
    const composable = useRoutingSlipTransaction()
    expect(composable).toBeDefined()
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
    expect(composable.validateTotalAmount).toBeDefined()
    expect(composable.removeManualTransactionRow).toBeDefined()
    expect(composable.updateManualTransactionDetails).toBeDefined()
    expect(composable.hideManualTransaction).toBeDefined()
    expect(composable.status).toBeDefined()
    expect(composable.showAddManualTransaction.value).toBe(false)
    expect(composable.manualTransactionsList.value).toEqual([])
    expect(composable.status.value).toBe('')
  })

  it('should manage manual transaction list, show/hide, and calculate available amounts', () => {
    const composable = useRoutingSlipTransaction()
    composable.showManualTransaction()
    expect(composable.showAddManualTransaction.value).toBe(true)
    expect(composable.manualTransactionsList.value.length).toBe(1)

    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    const initialLength = composable.manualTransactionsList.value.length
    composable.showManualTransaction()
    expect(composable.showAddManualTransaction.value).toBe(true)
    expect(composable.manualTransactionsList.value.length).toBe(initialLength)

    composable.addManualTransactionRow()
    expect(composable.manualTransactionsList.value.length).toBeGreaterThan(0)
    expect(composable.manualTransactionsList.value[0]).toHaveProperty('key')
    expect(composable.manualTransactionsList.value[0]?.futureEffective).toBe(false)
    expect(composable.manualTransactionsList.value[0]?.priority).toBe(false)

    composable.manualTransactionsList.value.push({ key: 2 } as Partial<ManualTransactionDetails>)
    composable.removeManualTransactionRow(0)
    expect(composable.manualTransactionsList.value.length).toBeGreaterThan(0)

    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 200 } as Partial<ManualTransactionDetails>)
    let available = composable.availableAmountForManualTransaction()
    expect(available).toBe(700.00)

    composable.manualTransactionsList.value = []
    available = composable.availableAmountForManualTransaction()
    expect(available).toBe(1000.00)

    composable.manualTransactionsList.value.push({ total: undefined } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    available = composable.availableAmountForManualTransaction()
    expect(available).toBe(900.00)

    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ key: 2 } as Partial<ManualTransactionDetails>)
    expect(composable.isLastChild(0)).toBe(true)
    expect(composable.isLastChild(1)).toBe(false)

    composable.hideManualTransaction()
    expect(composable.showAddManualTransaction.value).toBe(false)
  })

  it('should add manual transactions with validation, error handling, and reset behavior', async () => {
    const composable = useRoutingSlipTransaction()
    const validateFn = vi.fn(() => false)

    await composable.addManualTransactions(validateFn)
    expect(validateFn).toHaveBeenCalled()
    expect(mockSaveManualTransactions).not.toHaveBeenCalled()

    const mockForm = {
      checkValidity: vi.fn(() => true)
    } as unknown as HTMLFormElement
    composable.formRoutingSlipManualTransactions.value = mockForm
    composable.manualTransactionsList.value.push({ total: 1500 } as Partial<ManualTransactionDetails>)

    await composable.addManualTransactions()
    expect(composable.status.value).toBe('text.cantAddTransactions')
    expect(mockSaveManualTransactions).not.toHaveBeenCalled()

    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({ total: 200 } as Partial<ManualTransactionDetails>)

    await composable.addManualTransactions()
    expect(mockSaveManualTransactions).toHaveBeenCalledTimes(2)
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(composable.manualTransactionsList.value.length).toBe(0)
    expect(composable.showAddManualTransaction.value).toBe(false)
    expect(composable.status.value).toBe('')

    composable.manualTransactionsList.value.push({ total: 100 } as Partial<ManualTransactionDetails>)
    mockSaveManualTransactions.mockImplementation(() => Promise.reject(new Error('Save failed')))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.addManualTransactions()
    expect(composable.manualTransactionsList.value.length).toBe(1)
    expect(consoleErrorSpy).toHaveBeenCalled()

    vi.clearAllMocks()
    mockStore.routingSlip.number = undefined as unknown as string
    await composable.addManualTransactions()
    expect(mockSaveManualTransactions).toHaveBeenCalled()
    expect(mockGetRoutingSlip).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
    mockStore.routingSlip.number = '123456789'
  })

  it('should update manual transaction details and handle edge cases', () => {
    const composable = useRoutingSlipTransaction()
    composable.manualTransactionsList.value.push({
      key: 1,
      filingType: 'OLD',
      futureEffective: false,
      priority: false,
      total: 0
    } as Partial<ManualTransactionDetails>)

    const updatedTransaction = {
      filingType: { code: 'NEW', description: 'New Filing' } as Partial<ManualTransactionDetails['filingType']>,
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
    expect(transaction?.filingType).toBeDefined()
    const filingType = transaction?.filingType as { code?: string, description?: string } | undefined
    if (filingType) {
      expect(filingType.code).toBe('NEW')
      expect(filingType.description).toBe('New Filing')
    }
    expect(transaction?.futureEffective).toBe(true)
    expect(transaction?.priority).toBe(true)
    expect(transaction?.quantity).toBe(5)
    expect(transaction?.referenceNumber).toBe('REF-123')
    expect(transaction?.total).toBe(100)
    expect(composable.status.value).toBe('')

    composable.updateManualTransactionDetails({
      index: 999,
      transaction: { total: 100 } as Partial<ManualTransactionDetails>
    })
    expect(composable.manualTransactionsList.value[0]?.total).toBe(100)
  })

  it('should update available amounts, handle hide/reset, and return routing slip status', () => {
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

    let secondTransaction = composable.manualTransactionsList.value[1]
    expect(secondTransaction?.availableAmountForManualTransaction).toBe(800)

    composable.manualTransactionsList.value = []
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

    secondTransaction = composable.manualTransactionsList.value[1]
    expect(secondTransaction?.availableAmountForManualTransaction).toBe(1000)

    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.showAddManualTransaction.value = true
    composable.hideManualTransaction()
    expect(composable.manualTransactionsList.value.length).toBe(0)
    expect(composable.showAddManualTransaction.value).toBe(false)

    composable.addManualTransactionRow()
    const row = composable.manualTransactionsList.value[0]
    expect(row).toHaveProperty('key')
    expect(row?.futureEffective).toBe(false)
    expect(row?.priority).toBe(false)
    expect(row?.total).toBeUndefined()
    expect(row?.referenceNumber).toBeUndefined()
    expect(row?.filingType).toBeUndefined()
    expect(row?.availableAmountForManualTransaction).toBe(1000.00)

    mockIsRoutingSlipAChild.value = true
    expect(composable.isRoutingSlipAChild.value).toBe(true)
    mockIsRoutingSlipVoid.value = true
    expect(composable.isRoutingSlipVoid.value).toBe(true)
  })

  it('should handle error scenarios, available amount edge cases, status resets, and filing type updates', async () => {
    const composable = useRoutingSlipTransaction()
    const mockForm = {
      checkValidity: vi.fn(() => true)
    } as unknown as HTMLFormElement
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
    expect(mockSaveManualTransactions).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()

    composable.manualTransactionsList.value = []
    mockStore.routingSlip.remainingAmount = undefined as unknown as number
    let available = composable.availableAmountForManualTransaction()
    expect(available).toBe(0)
    mockStore.routingSlip.remainingAmount = 1000.00

    mockStore.routingSlip.remainingAmount = 0
    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({ total: 50 } as Partial<ManualTransactionDetails>)
    available = composable.availableAmountForManualTransaction()
    expect(available).toBe(-50)

    mockStore.routingSlip.remainingAmount = 100
    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({ total: 150 } as Partial<ManualTransactionDetails>)
    available = composable.availableAmountForManualTransaction()
    expect(available).toBe(-50)

    mockStore.routingSlip.remainingAmount = 1000
    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({
      key: 1,
      total: 200,
      availableAmountForManualTransaction: 1000
    } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({
      key: 2,
      total: undefined,
      availableAmountForManualTransaction: 1000
    } as Partial<ManualTransactionDetails>)
    composable.manualTransactionsList.value.push({
      key: 3,
      total: undefined,
      availableAmountForManualTransaction: 1000
    } as Partial<ManualTransactionDetails>)

    composable.updateManualTransactionDetails({
      index: 1,
      transaction: { total: 300, filingType: { code: 'TYPE2' } } as Partial<ManualTransactionDetails>
    })

    const thirdTransaction = composable.manualTransactionsList.value[2]
    expect(thirdTransaction?.availableAmountForManualTransaction).toBe(700)

    composable.manualTransactionsList.value = []
    available = composable.availableAmountForManualTransaction()
    expect(available).toBe(1000)

    composable.status.value = 'error-status'
    composable.addManualTransactionRow()
    expect(composable.status.value).toBe('')

    composable.manualTransactionsList.value.push({ key: 1 } as Partial<ManualTransactionDetails>)
    composable.status.value = 'error-status'
    composable.removeManualTransactionRow(0)
    expect(composable.status.value).toBe('')

    composable.manualTransactionsList.value.push({
      key: 1,
      filingType: { code: 'OLD' }
    } as Partial<ManualTransactionDetails>)

    const newFilingType = { code: 'NEW', description: 'New Filing Type' }
    composable.updateManualTransactionDetails({
      index: 0,
      transaction: {
        filingType: newFilingType as ManualTransactionDetails['filingType'],
        total: 100
      } as Partial<ManualTransactionDetails>
    })

    const transaction = composable.manualTransactionsList.value[0]
    expect(transaction?.filingType).toBeDefined()
    expect(transaction?.total).toBe(100)

    composable.manualTransactionsList.value = []
    composable.manualTransactionsList.value.push({
      key: 1,
      total: undefined,
      availableAmountForManualTransaction: 1000
    } as Partial<ManualTransactionDetails>)

    composable.updateManualTransactionDetails({
      index: 999,
      transaction: { total: 500 } as Partial<ManualTransactionDetails>
    })

    const transaction2 = composable.manualTransactionsList.value[0]
    expect(transaction2?.availableAmountForManualTransaction).toBe(1000)
  })
})
