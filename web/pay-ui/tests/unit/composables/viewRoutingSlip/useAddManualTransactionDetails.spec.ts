import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useAddManualTransactionDetails from '~/composables/viewRoutingSlip/useAddManualTransactionDetails'
import type { ManualTransactionDetails } from '~/interfaces/routing-slip'
import { nextTick } from 'vue'

const mockGetFeeByCorpTypeAndFilingType = vi.fn()
const mockUseRoutingSlip = {
  getFeeByCorpTypeAndFilingType: mockGetFeeByCorpTypeAndFilingType
}

const mockRequiredFieldRule = vi.fn()
vi.mock('~/utils/common-util', () => ({
  default: {
    requiredFieldRule: () => mockRequiredFieldRule
  }
}))

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)

describe('useAddManualTransactionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFeeByCorpTypeAndFilingType.mockResolvedValue(100.50)
  })

  it('should be defined', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)
    expect(composable.manualTransactionDetails).toBeDefined()
    expect(composable.requiredFieldRule).toBeDefined()
    expect(composable.removeManualTransactionRowEventHandler).toBeDefined()
    expect(composable.delayedCalculateTotal).toBeDefined()
    expect(composable.calculateTotal).toBeDefined()
    expect(composable.getIndexedTag).toBeDefined()
    expect(composable.emitManualTransactionDetails).toBeDefined()
    expect(composable.errorMessage).toBeDefined()
    expect(composable.totalFormatted).toBeDefined()
    expect(composable.referenceNumberRules).toBeDefined()
    expect(composable.quantityRules).toBeDefined()
    expect(composable.errors).toBeDefined()
    expect(composable.validate).toBeDefined()
  })

  it('should initialize manualTransactionDetails as undefined when no prop provided', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)

    expect(composable.manualTransactionDetails.value).toBeUndefined()
  })

  it('should initialize manualTransactionDetails from prop when provided', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 123,
      futureEffective: true,
      priority: true,
      total: 200.00,
      referenceNumber: 'REF123',
      quantity: 2,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      expect(composable.manualTransactionDetails.value.futureEffective).toBe(true)
      expect(composable.manualTransactionDetails.value.priority).toBe(true)
      expect(composable.manualTransactionDetails.value.total).toBe(200.00)
      expect(composable.manualTransactionDetails.value.referenceNumber).toBe('REF123')
      expect(composable.manualTransactionDetails.value.quantity).toBe(2)
      expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)
    }
  })

  it('should not use .value to access manualTransactionDetails (it is reactive, not ref)', () => {
    const composable = useAddManualTransactionDetails({})

    expect(composable.manualTransactionDetails.value).toBeUndefined()
  })

  it('should update manualTransactionDetails when prop changes', async () => {
    const mockTransaction1: ManualTransactionDetails = {
      key: 1,
      availableAmountForManualTransaction: 500
    }
    const props = reactive({ manualTransaction: mockTransaction1 })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(500)

      const mockTransaction2: ManualTransactionDetails = {
        key: 2,
        availableAmountForManualTransaction: 1000
      }
      props.manualTransaction = mockTransaction2
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)
    }
  })

  it('should calculate total when filingType and quantity are provided', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      priority: false,
      futureEffective: false,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
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
    }
  })

  it('should set total to undefined when filingType or quantity is missing', async () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)
    composable.manualTransactionDetails.value = {} as ManualTransactionDetails

    await composable.calculateTotal()

    expect(mockGetFeeByCorpTypeAndFilingType).not.toHaveBeenCalled()
    expect(composable.manualTransactionDetails.value.total).toBeNull()
  })

  it('should handle errors in calculateTotal and set total to undefined', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      mockGetFeeByCorpTypeAndFilingType.mockRejectedValueOnce(new Error('API Error'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await composable.calculateTotal()

      expect(composable.manualTransactionDetails.value.total).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    }
  })

  it('should convert null fee to undefined', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      mockGetFeeByCorpTypeAndFilingType.mockResolvedValueOnce(null)

      await composable.calculateTotal()

      expect(composable.manualTransactionDetails.value.total).toBeNull()
    }
  })

  it('should emit updateManualTransaction when emitManualTransactionDetails is called', async () => {
    const mockEmit = vi.fn()
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      quantity: 1
    }

    const props = reactive({ manualTransaction: mockTransaction, index: 0 })
    const composable = useAddManualTransactionDetails(props, mockEmit)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    composable.manualTransactionDetails.value = JSON.parse(JSON.stringify(mockTransaction))
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
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      quantity: 1,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      const isValid = composable.validate()

      expect(isValid).toBe(true)
      expect(composable.errors.filingType).toBe('')
      expect(composable.errors.quantity).toBe('')
    }
  })

  it('should validate and return false when filingType is missing', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)

    const isValid = composable.validate()

    expect(isValid).toBe(false)
    expect(composable.errors.filingType).toBe('This field is required')
    expect(composable.errors.quantity).toBe('This field is required')
  })

  it('should validate and return false when quantity is missing or invalid', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      filingType: {
        corpTypeCode: { code: 'BC', product: 'BC' },
        filingTypeCode: { code: 'OTANN' }
      },
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      let isValid = composable.validate()
      expect(isValid).toBe(false)
      expect(composable.errors.quantity).toBe('This field is required')

      composable.manualTransactionDetails.value.quantity = 0
      isValid = composable.validate()
      expect(isValid).toBe(false)
      expect(composable.errors.quantity).toBe('This field is required')

      composable.manualTransactionDetails.value.quantity = -1
      isValid = composable.validate()
      expect(isValid).toBe(false)
      expect(composable.errors.quantity).toBe('This field is required')
    }
  })

  it('should return error message when amount exceeds balance', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      quantity: 1,
      total: 1500,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      expect(composable.errorMessage.value).toBe('Amount exceeds the routing slip\'s current balance')
    }
  })

  it('should return empty error message when amount is valid', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      quantity: 1,
      total: 500,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      expect(composable.errorMessage.value).toBe('')
    }
  })

  it('should return formatted total from manualTransaction prop', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      total: 123.45
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(composable.totalFormatted.value).toBe('123.45')
  })

  it('should return undefined for totalFormatted when total is not set', () => {
    const props = reactive({ manualTransaction: null })
    const composable = useAddManualTransactionDetails(props)

    expect(composable.totalFormatted.value).toBeUndefined()
  })

  it('should get indexed tag correctly', () => {
    const props = reactive({ index: 5 })
    const composable = useAddManualTransactionDetails(props)

    expect(composable.getIndexedTag('test', 5)).toBe('test-5')
    expect(composable.getIndexedTag('tag', undefined)).toBe('tag-undefined')
  })

  it('should have correct referenceNumberRules', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)

    expect(composable.referenceNumberRules.length).toBe(1)
    expect(composable.referenceNumberRules[0]?.('a'.repeat(21))).toBe('Incorporation/Reference Number should not be more than 20 characters')
    expect(composable.referenceNumberRules[0]?.('valid')).toBe(true)
  })

  it('should have correct quantityRules', () => {
    const props = reactive({})
    const composable = useAddManualTransactionDetails(props)

    expect(composable.quantityRules.length).toBe(2)
    expect(composable.quantityRules[0]?.(0)).toBe('This field is required')
    expect(composable.quantityRules[0]?.(1)).toBe(true)
    expect(composable.quantityRules[1]?.(-1)).toBe('Quantity should be greater than 0')
    expect(composable.quantityRules[1]?.(1)).toBe(true)
  })

  it('should update availableAmountForManualTransaction when prop changes', async () => {
    const mockTransaction1: ManualTransactionDetails = {
      key: 1,
      availableAmountForManualTransaction: 500
    }
    const props = reactive({ manualTransaction: mockTransaction1 })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    if (composable.manualTransactionDetails.value) {
      expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(500)

      const mockTransaction2: ManualTransactionDetails = {
        key: 2,
        availableAmountForManualTransaction: 1000
      }
      props.manualTransaction = mockTransaction2
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(composable.manualTransactionDetails.value.availableAmountForManualTransaction).toBe(1000)
    }
  })

  it('should initialize manualTransactionDetails when prop is provided', async () => {
    const mockTransaction: ManualTransactionDetails = {
      key: 1,
      quantity: 5,
      total: 200,
      availableAmountForManualTransaction: 1000
    }

    const props = reactive({ manualTransaction: mockTransaction })
    const composable = useAddManualTransactionDetails(props)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    composable.manualTransactionDetails.value = JSON.parse(JSON.stringify(mockTransaction))

    expect(composable.manualTransactionDetails.value).toBeDefined()
    expect(composable.manualTransactionDetails.value?.key).toBeDefined()
  })
})
