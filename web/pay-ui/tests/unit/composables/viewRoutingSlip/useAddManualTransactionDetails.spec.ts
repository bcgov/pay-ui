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

  describe('handlers', () => {
    const filingType = {
      corpTypeCode: { code: 'BC', product: 'BC' },
      filingTypeCode: { code: 'OTANN' }
    }

    it('handleQuantityChange sets quantity, error and debounces the fee calculation', async () => {
      const mockEmit = vi.fn()
      const composable = useAddManualTransactionDetails(reactive({ index: 3 }), mockEmit)
      composable.manualTransactionDetails.value.filingType = filingType as never

      composable.handleQuantityChange('0')
      expect(composable.errors.value.quantity).toBe('This field is required')

      composable.handleQuantityChange('-2')
      expect(composable.errors.value.quantity).toBe('Quantity should be greater than 0')

      composable.handleQuantityChange('4')
      expect(composable.manualTransactionDetails.value.quantity).toBe(4)
      expect(composable.errors.value.quantity).toBe('')

      await new Promise(resolve => setTimeout(resolve, 250))
      expect(mockGetFeeByCorpTypeAndFilingType).toHaveBeenCalledTimes(1)
      expect(mockGetFeeByCorpTypeAndFilingType).toHaveBeenCalledWith({
        corpTypeCode: 'BC',
        filingTypeCode: 'OTANN',
        requestParams: { quantity: 4, priority: false, futureEffective: false }
      })
      expect(composable.manualTransactionDetails.value.total).toBe(100.5)
      expect(mockEmit).toHaveBeenCalledWith('updateManualTransaction', expect.objectContaining({ index: 3 }))
    })

    it('handleReferenceNumberChange trims, validates and emits', () => {
      const mockEmit = vi.fn()
      const composable = useAddManualTransactionDetails(reactive({ index: 0 }), mockEmit)

      composable.handleReferenceNumberChange('  REF1  ')
      expect(composable.manualTransactionDetails.value.referenceNumber).toBe('REF1')
      expect(composable.errors.value.referenceNumber).toBe('')
      expect(mockEmit).toHaveBeenCalledTimes(1)

      composable.handleReferenceNumberChange('x'.repeat(21))
      expect(composable.errors.value.referenceNumber).toContain('not be more than 20')

      composable.handleReferenceNumberChange(undefined as unknown as string)
      expect(composable.errors.value.referenceNumber).toBe('')
    })

    it('validate flags missing filing type, quantity and long reference number', () => {
      const composable = useAddManualTransactionDetails(reactive({ index: 0 }), vi.fn())
      composable.manualTransactionDetails.value.referenceNumber = 'y'.repeat(25)

      expect(composable.validate()).toBe(false)
      expect(composable.errors.value.filingType).toBe('This field is required')
      expect(composable.errors.value.quantity).toBe('This field is required')
      expect(composable.errors.value.referenceNumber).toContain('not be more than 20')
    })

    it('validate passes with complete data and clears prior errors', () => {
      const composable = useAddManualTransactionDetails(reactive({ index: 0 }), vi.fn())
      composable.errors.value.filingType = 'old'
      composable.manualTransactionDetails.value.filingType = filingType as never
      composable.manualTransactionDetails.value.quantity = 2
      composable.manualTransactionDetails.value.referenceNumber = 'ok'

      expect(composable.validate()).toBe(true)
      expect(composable.errors.value).toEqual({ filingType: '', quantity: '', referenceNumber: '' })
    })

    it('calculateTotal resets total to 0 when filing type or quantity is missing', async () => {
      const mockEmit = vi.fn()
      const composable = useAddManualTransactionDetails(reactive({ index: 1 }), mockEmit)
      composable.manualTransactionDetails.value.total = 50

      await composable.calculateTotal()

      expect(composable.manualTransactionDetails.value.total).toBe(0)
      expect(mockGetFeeByCorpTypeAndFilingType).not.toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalledWith('updateManualTransaction', expect.anything())
    })

    it('calculateTotal passes priority/futureEffective flags and falls back to 0 on null fee', async () => {
      const composable = useAddManualTransactionDetails(reactive({ index: 1 }), vi.fn())
      Object.assign(composable.manualTransactionDetails.value, {
        filingType, quantity: 1, priority: true, futureEffective: true
      })
      mockGetFeeByCorpTypeAndFilingType.mockResolvedValueOnce(null)

      await composable.calculateTotal()

      expect(mockGetFeeByCorpTypeAndFilingType).toHaveBeenCalledWith(expect.objectContaining({
        requestParams: { quantity: 1, priority: true, futureEffective: true }
      }))
      expect(composable.manualTransactionDetails.value.total).toBe(0)
    })

    it('calculateTotal logs the API error body and zeroes the total', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const composable = useAddManualTransactionDetails(reactive({ index: 1 }), vi.fn())
      Object.assign(composable.manualTransactionDetails.value, { filingType, quantity: 1, total: 9 })
      mockGetFeeByCorpTypeAndFilingType.mockRejectedValueOnce({ response: { data: 'boom' } })

      await composable.calculateTotal()

      expect(composable.manualTransactionDetails.value.total).toBe(0)
      expect(spy).toHaveBeenCalledWith('error', 'boom')
      spy.mockRestore()
    })

    it('does not emit when no index is provided', () => {
      const mockEmit = vi.fn()
      const composable = useAddManualTransactionDetails(reactive({}), mockEmit)

      composable.emitManualTransactionDetails()
      composable.removeManualTransactionRowEventHandler()

      expect(mockEmit).not.toHaveBeenCalled()
    })

    it('errorMessage is set only when quantity exceeds the available amount', () => {
      const composable = useAddManualTransactionDetails(reactive({ index: 0 }), vi.fn())
      Object.assign(composable.manualTransactionDetails.value, {
        quantity: 1, total: 20, availableAmountForManualTransaction: 10
      })
      expect(composable.errorMessage.value).toBe('text.amountExceedsBalance')

      composable.manualTransactionDetails.value.availableAmountForManualTransaction = 50
      expect(composable.errorMessage.value).toBeUndefined()
    })
  })
})
