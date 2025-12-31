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

  it('should be defined', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)
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

  it('should initialize manualTransactionDetails as empty object when no prop provided', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    expect(composable.manualTransactionDetails).toBeDefined()
  })

  it('should initialize manualTransactionDetails from prop when provided', async () => {
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
  })

  it('should not use .value to access manualTransactionDetails (it is reactive, not ref)', () => {
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails({}, mockEmit)

    expect(composable.manualTransactionDetails).toBeDefined()
  })

  it('should update manualTransactionDetails when prop changes', async () => {
    const mockTransaction1: Partial<ManualTransactionDetails> = {
      key: 1,
      availableAmountForManualTransaction: 500,
      quantity: 1,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false
    }
    const props = reactive({ manualTransaction: mockTransaction1 })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(500)

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

  it('should calculate total when filingType and quantity are provided', async () => {
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
  })

  it('should set total to 0 when filingType or quantity is missing', async () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    await composable.calculateTotal()

    expect(mockGetFeeByCorpTypeAndFilingType).not.toHaveBeenCalled()
    expect(composable.manualTransactionDetails.value.total).toBe(0)
  })

  it('should handle errors in calculateTotal and set total to 0', async () => {
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

    mockGetFeeByCorpTypeAndFilingType.mockRejectedValueOnce(new Error('API Error'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await composable.calculateTotal()

    expect(composable.manualTransactionDetails.value.total).toBe(0)
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should convert null fee to 0', async () => {
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

    mockGetFeeByCorpTypeAndFilingType.mockResolvedValueOnce(null)

    await composable.calculateTotal()

    expect(composable.manualTransactionDetails.value.total).toBe(0)
  })

  it('should emit updateManualTransaction when emitManualTransactionDetails is called', async () => {
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
  })

  it('should not emit when index is undefined', () => {
    const mockEmit = vi.fn()
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props, mockEmit)

    composable.emitManualTransactionDetails()

    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('should emit removeManualTransactionRow when removeManualTransactionRowEventHandler is called', () => {
    const mockEmit = vi.fn()
    const props = reactive({ index: 5 })
    const composable = useAddManualTransactionDetails(props, mockEmit)

    composable.removeManualTransactionRowEventHandler()

    expect(mockEmit).toHaveBeenCalledWith('removeManualTransactionRow', 5)
  })

  it('should not emit removeManualTransactionRow when index is undefined', () => {
    const mockEmit = vi.fn()
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props, mockEmit)

    composable.removeManualTransactionRowEventHandler()

    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('should validate and return true when filingType and quantity are valid', async () => {
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

    const isValid = composable.validate()

    expect(isValid).toBe(true)
    expect(composable.errors.value.filingType).toBe('')
    expect(composable.errors.value.quantity).toBe('')
  })

  it('should validate and return false when filingType is missing', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    const isValid = composable.validate()

    expect(isValid).toBe(false)
    expect(composable.errors.value.filingType).toBe('This field is required')
    expect(composable.errors.value.quantity).toBe('This field is required')
  })

  it('should validate and return false when quantity is missing or invalid', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
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

  it('should return error message when amount exceeds balance', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 1,
      total: 1500,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      priority: false,
      futureEffective: false
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.errorMessage.value).toBe('text.amountExceedsBalance')
  })

  it('should return empty error message when amount is valid', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 1,
      total: 500,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      priority: false,
      futureEffective: false
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.errorMessage.value).toBeUndefined()
  })

  it('should return formatted total from manualTransaction prop', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      total: 123.45,
      quantity: 1,
      referenceNumber: '',
      priority: false,
      futureEffective: false,
      availableAmountForManualTransaction: 0
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.totalFormatted.value).toBe('$123.45')
  })

  it('should return $0.00 for totalFormatted when total is not set', () => {
    const props = reactive({ manualTransaction: null })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    expect(composable.totalFormatted.value).toBe('$0.00')
  })

  it('should have correct referenceNumberRules', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    expect(composable.referenceNumberRules.length).toBe(1)
    expect(composable.referenceNumberRules[0]?.('a'.repeat(21)))
      .toBe('Incorporation/Reference Number should not be more than 20 characters')
    expect(composable.referenceNumberRules[0]?.('valid')).toBe(true)
  })

  it('should have correct quantityRules', () => {
    const props = reactive({})
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props, mockEmit)

    expect(composable.quantityRules.length).toBe(2)
    expect(composable.quantityRules[0]?.(0)).toBe('This field is required')
    expect(composable.quantityRules[0]?.(1)).toBe(true)
    expect(composable.quantityRules[1]?.(-1)).toBe('Quantity should be greater than 0')
    expect(composable.quantityRules[1]?.(1)).toBe(true)
  })

  it('should update availableAmountForManualTransaction when prop changes', async () => {
    const mockTransaction1: Partial<ManualTransactionDetails> = {
      key: 1,
      availableAmountForManualTransaction: 500,
      quantity: 1,
      referenceNumber: '',
      total: 0,
      priority: false,
      futureEffective: false
    }
    const props = reactive({ manualTransaction: mockTransaction1 })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(500)

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

  it('should initialize manualTransactionDetails when prop is provided', async () => {
    const mockTransaction: Partial<ManualTransactionDetails> = {
      key: 1,
      quantity: 5,
      total: 200,
      availableAmountForManualTransaction: 1000,
      referenceNumber: '',
      priority: false,
      futureEffective: false
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const mockEmit = vi.fn()
    const composable = useAddManualTransactionDetails(props as UseAddManualTransactionDetailsProps, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    Object.assign(composable.manualTransactionDetails.value, mockTransaction)

    expect(composable.manualTransactionDetails.value).toBeDefined()
    expect(composable.manualTransactionDetails.value.key).toBeDefined()
  })
})
