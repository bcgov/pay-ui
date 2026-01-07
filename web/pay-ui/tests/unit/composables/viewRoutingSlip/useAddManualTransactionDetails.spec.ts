import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useAddManualTransactionDetails from '~/composables/viewRoutingSlip/useAddManualTransactionDetails'
import type { ManualTransactionDetails } from '~/interfaces/routing-slip'
import { nextTick } from 'vue'

vi.mock('lodash', () => ({
  cloneDeep: vi.fn(val => JSON.parse(JSON.stringify(val)))
}))

interface UseAddManualTransactionDetailsProps {
  index?: number
  manualTransaction?: ManualTransactionDetails | null
}

const mockGetFeeByCorpTypeAndFilingType = vi.fn()
const mockUseRoutingSlip = {
  getFeeByCorpTypeAndFilingType: mockGetFeeByCorpTypeAndFilingType
}

const mockRequiredFieldRule = vi.fn()
vi.mock('~/utils/common-util', async () => {
  const actual = await vi.importActual<typeof import('~/utils/common-util')>('~/utils/common-util')
  return {
    default: {
      ...actual.default,
      requiredFieldRule: () => mockRequiredFieldRule
    }
  }
})

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)

const mockT = vi.fn((key: string) => key)
mockNuxtImport('useI18n', () => () => ({
  t: mockT
}))

describe('useAddManualTransactionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFeeByCorpTypeAndFilingType.mockResolvedValue(100.50)
  })

  it('should be defined, return all expected properties, and initialize correctly', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)
    expect(composable).toBeDefined()
    expect(composable.manualTransactionDetails).toBeDefined()
    expect(composable.removeManualTransactionRowEventHandler).toBeDefined()
    expect(composable.delayedCalculateTotal).toBeDefined()
    expect(composable.calculateTotal).toBeDefined()
    expect(composable.emitManualTransactionDetails).toBeDefined()
    expect(composable.handleQuantityChange).toBeDefined()
    expect(composable.handleReferenceNumberChange).toBeDefined()
    expect(composable.errorMessage).toBeDefined()
    expect(composable.totalFormatted).toBeDefined()
    expect(composable.referenceNumberRules).toBeDefined()
    expect(composable.quantityRules).toBeDefined()
    expect(composable.errors).toBeDefined()
    expect(composable.validate).toBeDefined()
  })

  it('should initialize and update manualTransactionDetails from props', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 123,
      futureEffective: true,
      priority: true,
      total: 200.00,
      referenceNumber: 'REF123',
      quantity: 2,
      availableAmountForManualTransaction: 1000,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      }
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.manualTransactionDetails.value.futureEffective).toBe(true)
    expect(composable.manualTransactionDetails.value.priority).toBe(true)
    expect(composable.manualTransactionDetails.value.total).toBe(200.00)
    expect(composable.manualTransactionDetails.value.referenceNumber).toBe('REF123')
    expect(composable.manualTransactionDetails.value.quantity).toBe(2)
    expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)

    const mockTransaction2: Partial<ManualTransactionDetails> = {
      key: 2,
      availableAmountForManualTransaction: 1000,
      quantity: 1,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false
    }
    props.manualTransaction = mockTransaction2
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)
  })

  it('should calculate total correctly and handle missing data, errors, and null fees', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      priority: false,
      futureEffective: false,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      total: 0
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    await composable.calculateTotal()

    expect(mockGetFeeByCorpTypeAndFilingType).toHaveBeenCalledWith({
      corpTypeCode: 'BC',
      filingTypeCode: 'OTANN',
      requestParams: {
        quantity: 1,
        priority: false,
        futureEffective: false
      }
    })
    expect(composable.manualTransactionDetails.value.total).toBe(100.50)

    const props2 = reactive({})
    const composable2 = useAddManualTransactionDetails(props2, mockEmit)
    await composable2.calculateTotal()
    expect(mockGetFeeByCorpTypeAndFilingType).toHaveBeenCalledTimes(1)
    expect(composable2.manualTransactionDetails.value.total).toBe(0)

    mockGetFeeByCorpTypeAndFilingType.mockRejectedValueOnce(new Error('API Error'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await composable.calculateTotal()
    expect(composable.manualTransactionDetails.value.total).toBe(0)
    expect(consoleErrorSpy).toHaveBeenCalled()

    mockGetFeeByCorpTypeAndFilingType.mockResolvedValueOnce(null)
    await composable.calculateTotal()
    expect(composable.manualTransactionDetails.value.total).toBe(0)
    consoleErrorSpy.mockRestore()
  })

  it('should emit updateManualTransaction and removeManualTransactionRow correctly based on index', async () => {
    const mockEmit = vi.fn()
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 1,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false,
      availableAmountForManualTransaction: 0
    }

    const props = reactive({ manualTransaction: mockTransaction, index: 0 })
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    Object.assign(composable.manualTransactionDetails, mockTransaction)
    composable.emitManualTransactionDetails()

    expect(mockEmit).toHaveBeenCalledWith('updateManualTransaction', {
      transaction: composable.manualTransactionDetails.value,
      index: 0
    })

    const props2 = reactive({})
    const composable2 = useAddManualTransactionDetails(props2, mockEmit)
    composable2.emitManualTransactionDetails()
    expect(mockEmit).toHaveBeenCalledTimes(1)

    const props3 = reactive({ index: 5 })
    const composable3 = useAddManualTransactionDetails(props3, mockEmit)
    composable3.removeManualTransactionRowEventHandler()
    expect(mockEmit).toHaveBeenCalledWith('removeManualTransactionRow', 5)

    const props4 = reactive({})
    const composable4 = useAddManualTransactionDetails(props4, mockEmit)
    composable4.removeManualTransactionRowEventHandler()
    expect(mockEmit).toHaveBeenCalledTimes(2)
  })

  it('should validate filingType and quantity with various scenarios', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    let isValid = composable.validate()
    expect(isValid).toBe(true)
    expect(composable.errors.value.filingType).toBe('')
    expect(composable.errors.value.quantity).toBe('')

    const props2 = reactive({})
    const composable2 = useAddManualTransactionDetails(props2, mockEmit)
    isValid = composable2.validate()
    expect(isValid).toBe(false)
    expect(composable2.errors.value.filingType).toBe('This field is required')
    expect(composable2.errors.value.quantity).toBe('This field is required')

    composable.manualTransactionDetails.value.quantity = undefined
    isValid = composable.validate()
    expect(isValid).toBe(false)
    expect(composable.errors.value.quantity).toBe('This field is required')

    composable.manualTransactionDetails.value.quantity = 0
    isValid = composable.validate()
    expect(isValid).toBe(false)
    expect(composable.errors.value.quantity).toBe('This field is required')

    composable.manualTransactionDetails.value.quantity = -1
    isValid = composable.validate()
    expect(isValid).toBe(false)
    expect(composable.errors.value.quantity).toBe('Quantity should be greater than 0')
  })

  it('should handle error messages, formatted totals, validation rules, and prop updates', async () => {
    const mockTransaction1: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 1,
      total: 1500,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      priority: false,
      futureEffective: false
    }

    const props = reactive({ manualTransaction: mockTransaction1 })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.errorMessage.value).toBe('text.amountExceedsBalance')

    const mockTransaction2: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 1,
      total: 500,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      priority: false,
      futureEffective: false
    }
    props.manualTransaction = mockTransaction2
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(composable.errorMessage.value).toBeUndefined()

    const mockTransaction3: Partial<ManualTransactionDetails> = {
      key: 1,
      total: 123.45,
      quantity: 1,
      referenceNumber: '',
      priority: false,
      futureEffective: false,
      availableAmountForManualTransaction: 0
    }
    props.manualTransaction = mockTransaction3
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(composable.totalFormatted.value).toBe('$123.45')

    const props2 = reactive({ manualTransaction: null })
    const composable2 = useAddManualTransactionDetails(props2, mockEmit)
    expect(composable2.totalFormatted.value).toBe('$0.00')

    expect(composable.referenceNumberRules.length).toBe(1)
    expect(composable.referenceNumberRules[0]?.('a'.repeat(21)))
      .toBe('Incorporation/Reference Number should not be more than 20 characters')
    expect(composable.referenceNumberRules[0]?.('valid')).toBe(true)

    expect(composable.quantityRules.length).toBe(2)
    expect(composable.quantityRules[0]?.(0)).toBe('This field is required')
    expect(composable.quantityRules[0]?.(1)).toBe(true)
    expect(composable.quantityRules[1]?.(-1)).toBe('Quantity should be greater than 0')
    expect(composable.quantityRules[1]?.(1)).toBe(true)

    const mockTransaction4: Partial<ManualTransactionDetails> = {
      key: 2,
      availableAmountForManualTransaction: 1000,
      quantity: 1,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false
    }
    props.manualTransaction = mockTransaction4
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)
  })
})
