import commonUtil from '~/utils/common-util'
import { SlipStatus } from '~/enums/slip-status'
import type { Address } from '~/interfaces/address'

describe('common-util', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDisplayDate', () => {
    it('should format a Date object with default format', () => {
      const date = new Date('2025-09-26T10:00:00.000Z')
      const result = commonUtil.formatDisplayDate(date)
      expect(result).toBe('Sep 26, 2025')
    })

    it('should format a date string with default format', () => {
      const result = commonUtil.formatDisplayDate('2025-09-26T00:00:00.000Z')
      expect(result).toContain('Sep')
      expect(result).toContain('2025')
    })

    it('should format with custom format', () => {
      const date = new Date('2025-09-26T10:00:00.000Z')
      const result = commonUtil.formatDisplayDate(date, 'yyyy-MM-dd')
      expect(result).toBe('2025-09-26')
    })

    it('should return empty string for invalid date', () => {
      const result = commonUtil.formatDisplayDate('invalid-date')
      expect(result).toBe('')
    })

    it('should return empty string for null/undefined', () => {
      expect(commonUtil.formatDisplayDate(null as unknown as Date | string)).toBe('')
      expect(commonUtil.formatDisplayDate(undefined as unknown as Date | string)).toBe('')
    })
  })

  describe('statusListColor', () => {
    it('should return success color for ACTIVE status', () => {
      expect(commonUtil.statusListColor(SlipStatus.ACTIVE)).toBe('text-success')
      expect(commonUtil.statusListColor(SlipStatus.ACTIVE, false)).toBe('success')
    })

    it('should return success color for COMPLETE status', () => {
      expect(commonUtil.statusListColor(SlipStatus.COMPLETE)).toBe('text-success')
    })

    it('should return error color for NSF status', () => {
      expect(commonUtil.statusListColor(SlipStatus.NSF)).toBe('text-error')
    })

    it('should return error color for VOID status', () => {
      expect(commonUtil.statusListColor(SlipStatus.VOID)).toBe('text-error')
    })

    it('should return text- prefix for unknown status when textColor is true', () => {
      const result = commonUtil.statusListColor('UNKNOWN_STATUS')
      expect(result).toBe('text-')
    })

    it('should return empty string for unknown status when textColor is false', () => {
      const result = commonUtil.statusListColor('UNKNOWN_STATUS', false)
      expect(result).toBe('')
    })
  })

  describe('appendCurrencySymbol', () => {
    it('should append dollar sign to number', () => {
      expect(commonUtil.appendCurrencySymbol(100)).toBe('$100')
    })

    it('should append dollar sign to string', () => {
      expect(commonUtil.appendCurrencySymbol('50.50')).toBe('$50.50')
    })
  })

  describe('cleanObject', () => {
    it('should remove empty strings and null values', () => {
      const obj = {
        name: 'John',
        email: '',
        age: null,
        city: 'Vancouver'
      }
      const result = commonUtil.cleanObject(obj)
      expect(result).toEqual({ name: 'John', city: 'Vancouver' })
    })

    it('should clean remainingAmount string', () => {
      const obj = {
        remainingAmount: '$1,234.56',
        name: 'Test'
      }
      const result = commonUtil.cleanObject(obj)
      expect(result.remainingAmount).toBe('1234.56')
    })
  })

  describe('createQueryParams', () => {
    it('should create query string from object', () => {
      const params = {
        name: 'John Doe',
        age: '30'
      }
      const result = commonUtil.createQueryParams(params)
      expect(result).toBe('name=John%20Doe&age=30')
    })

    it('should handle empty values', () => {
      const params = {
        name: '',
        age: '30'
      }
      const result = commonUtil.createQueryParams(params)
      expect(result).toBe('name=&age=30')
    })
  })

  describe('appendQueryParamsIfNeeded', () => {
    it('should append query params to URL', () => {
      const targetUrl = 'https://example.com'
      const route = {
        query: {
          name: 'John',
          age: '30'
        }
      }
      const result = commonUtil.appendQueryParamsIfNeeded(targetUrl, route)
      expect(result).toBe('https://example.com?name=John&age=30')
    })

    it('should return URL without query params if query is empty', () => {
      const targetUrl = 'https://example.com'
      const route = {
        query: {}
      }
      const result = commonUtil.appendQueryParamsIfNeeded(targetUrl, route)
      expect(result).toBe('https://example.com')
    })
  })

  describe('convertAddressForComponent', () => {
    it('should convert Address to BaseAddressModel', () => {
      const address = {
        city: 'Vancouver',
        country: 'CA',
        region: 'BC',
        deliveryInstructions: 'Ring doorbell',
        postalCode: 'V6B 1A1',
        street: '123 Main St',
        streetAdditional: 'Suite 100'
      }
      const result = commonUtil.convertAddressForComponent(address)
      expect(result).toEqual({
        addressCity: 'Vancouver',
        addressCountry: 'CA',
        addressRegion: 'BC',
        deliveryInstructions: 'Ring doorbell',
        postalCode: 'V6B 1A1',
        streetAddress: '123 Main St',
        streetAddressAdditional: 'Suite 100'
      })
    })

    it('should handle missing fields with empty strings', () => {
      const address = {
        city: 'Vancouver'
      }
      const result = commonUtil.convertAddressForComponent(address as Partial<Address>)
      expect(result.addressCity).toBe('Vancouver')
      expect(result.addressCountry).toBe('')
    })
  })

  describe('convertAddressForAuth', () => {
    it('should convert BaseAddressModel to Address', () => {
      const baseAddress = {
        addressCity: 'Vancouver',
        addressCountry: 'CA',
        addressRegion: 'BC',
        deliveryInstructions: 'Ring doorbell',
        postalCode: 'V6B 1A1',
        streetAddress: '123 Main St',
        streetAddressAdditional: 'Suite 100'
      }
      const result = commonUtil.convertAddressForAuth(baseAddress)
      expect(result).toEqual({
        city: 'Vancouver',
        country: 'CA',
        region: 'BC',
        deliveryInstructions: 'Ring doorbell',
        postalCode: 'V6B 1A1',
        street: '123 Main St',
        streetAdditional: 'Suite 100'
      })
    })
  })

  describe('isRefundProcessStatus', () => {
    it('should return true for REFUNDREQUEST status', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.REFUNDREQUEST)).toBe(true)
    })

    it('should return true for REFUNDAUTHORIZED status', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.REFUNDAUTHORIZED)).toBe(true)
    })

    it('should return true for REFUNDPROCESSED status', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.REFUNDPROCESSED)).toBe(true)
    })

    it('should return false for ACTIVE status', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.ACTIVE)).toBe(false)
    })
  })

  describe('isRefundRequestStatus', () => {
    it('should return true for REFUNDREQUEST status', () => {
      expect(commonUtil.isRefundRequestStatus(SlipStatus.REFUNDREQUEST)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(commonUtil.isRefundRequestStatus(SlipStatus.ACTIVE)).toBe(false)
      expect(commonUtil.isRefundRequestStatus(SlipStatus.REFUNDPROCESSED)).toBe(false)
    })
  })

  describe('isEditEnabledBystatus', () => {
    it('should return false for REFUNDPROCESSED status', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.REFUNDPROCESSED)).toBe(false)
    })

    it('should return false for NSF status', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.NSF)).toBe(false)
    })

    it('should return true for ACTIVE status', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.ACTIVE)).toBe(true)
    })
  })

  describe('isDeepEqual', () => {
    it('should return true for equal objects', () => {
      const obj1 = { name: 'John', age: 30 }
      const obj2 = { name: 'John', age: 30 }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(true)
    })

    it('should return false for different objects', () => {
      const obj1 = { name: 'John', age: 30 }
      const obj2 = { name: 'Jane', age: 30 }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(false)
    })

    it('should return false for objects with different lengths', () => {
      const obj1 = { name: 'John' }
      const obj2 = { name: 'John', age: 30 }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(false)
    })

    it('should handle nested objects', () => {
      const obj1 = { user: { name: 'John', age: 30 } }
      const obj2 = { user: { name: 'John', age: 30 } }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(true)
    })
  })

  describe('formatAmount', () => {
    it('should format amount as CAD currency', () => {
      expect(commonUtil.formatAmount(1234.56)).toBe('$1,234.56')
      expect(commonUtil.formatAmount(1000)).toBe('$1,000.00')
    })

    it('should handle zero', () => {
      expect(commonUtil.formatAmount(0)).toBe('$0.00')
    })
  })

  describe('formatToTwoDecimals', () => {
    it('should format number to two decimals', () => {
      expect(commonUtil.formatToTwoDecimals(1234.5)).toBe('1,234.50')
      expect(commonUtil.formatToTwoDecimals(1000)).toBe('1,000.00')
    })

    it('should format string to two decimals', () => {
      expect(commonUtil.formatToTwoDecimals('1234.5')).toBe('1,234.50')
    })
  })

  describe('requiredFieldRule', () => {
    it('should return validation rule that requires value', () => {
      const rules = commonUtil.requiredFieldRule()
      const rule = rules[0]
      expect(rule).toBeDefined()
      if (rule) {
        expect(rule('test')).toBe(true)
        expect(rule('')).toBe('This field is required')
        expect(rule(null)).toBe('This field is required')
      }
    })

    it('should use custom error message', () => {
      const rules = commonUtil.requiredFieldRule('Custom error')
      const rule = rules[0]
      expect(rule).toBeDefined()
      if (rule) {
        expect(rule('')).toBe('Custom error')
      }
    })
  })

  describe('emailRules', () => {
    it('should validate email when not optional', () => {
      const rules = commonUtil.emailRules(false)
      const rule1 = rules[0]
      const rule2 = rules[1]
      expect(rule1('test@example.com')).toBe(true)
      expect(rule1('')).toBe('Email address is required')
      expect(rule2).toBeDefined()
      if (rule2) {
        expect(rule2('invalid-email')).toBe('Valid email is required')
      }
    })

    it('should allow empty email when optional', () => {
      const rules = commonUtil.emailRules(true)
      const rule1 = rules[0]
      expect(rule1).toBeDefined()
      if (rule1) {
        expect(rule1('')).toBe(true)
        expect(rule1('test@example.com')).toBe(true)
        expect(rule1('invalid')).toBe('Valid email is required')
      }
    })
  })

  describe('formatAccountDisplayName', () => {
    it('should format account display name', () => {
      const item = { accountId: '123', accountName: 'Test Account' }
      expect(commonUtil.formatAccountDisplayName(item)).toBe('123 Test Account')
    })

    it('should handle missing fields', () => {
      expect(commonUtil.formatAccountDisplayName({})).toBe('undefined undefined')
      expect(commonUtil.formatAccountDisplayName({ accountId: 123 })).toBe('123 undefined')
    })
  })

  describe('getRefundMethodText', () => {
    it('should return text for matching value', () => {
      const methods = [
        { value: 'EFT', text: 'Direct Deposit' },
        { value: 'CHEQUE', text: 'Cheque' }
      ]
      expect(commonUtil.getRefundMethodText(methods, 'EFT')).toBe('Direct Deposit')
    })

    it('should return undefined for non-matching value', () => {
      const methods = [
        { value: 'EFT', text: 'Direct Deposit' }
      ]
      expect(commonUtil.getRefundMethodText(methods, 'CHEQUE')).toBeUndefined()
    })
  })

  describe('extractAndConvertStringToNumber', () => {
    it('should extract numbers from string', () => {
      expect(commonUtil.extractAndConvertStringToNumber('$1,234.56')).toBe(123456)
      expect(commonUtil.extractAndConvertStringToNumber('abc123def')).toBe(123)
    })

    it('should return 0 for string with no numbers', () => {
      expect(commonUtil.extractAndConvertStringToNumber('abc')).toBe(0)
    })
  })

  describe('fileDownload', () => {
    let originalURL: typeof URL
    let mockCreateObjectURL: ReturnType<typeof vi.fn>
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>

    beforeEach(() => {
      originalURL = global.URL
      mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      mockRevokeObjectURL = vi.fn()

      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      } as unknown as typeof URL

      vi.spyOn(document, 'createElement').mockReturnValue({
        style: { display: '' },
        href: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        download: undefined
      } as unknown as HTMLElement)

      vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as HTMLElement))
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as HTMLElement))

      vi.useFakeTimers()
    })

    afterEach(() => {
      global.URL = originalURL
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('should create blob and trigger download', () => {
      commonUtil.fileDownload('test data', 'test.txt')

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalled()
    })

    it('should revoke object URL after download', async () => {
      commonUtil.fileDownload('data', 'file.txt')

      await vi.advanceTimersByTimeAsync(200)

      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('statusListColor - additional statuses', () => {
    it('should return success color for REFUNDPROCESSED', () => {
      expect(commonUtil.statusListColor(SlipStatus.REFUNDPROCESSED)).toBe('text-success')
      expect(commonUtil.statusListColor(SlipStatus.REFUNDPROCESSED, false)).toBe('success')
    })

    it('should return success color for WRITEOFFCOMPLETED', () => {
      expect(commonUtil.statusListColor(SlipStatus.WRITEOFFCOMPLETED)).toBe('text-success')
    })

    it('should return error color for LINKED', () => {
      expect(commonUtil.statusListColor(SlipStatus.LINKED)).toBe('text-error')
    })

    it('should return error color for REFUNDREQUEST', () => {
      expect(commonUtil.statusListColor(SlipStatus.REFUNDREQUEST)).toBe('text-error')
    })

    it('should return error color for REFUNDAUTHORIZED', () => {
      expect(commonUtil.statusListColor(SlipStatus.REFUNDAUTHORIZED)).toBe('text-error')
    })

    it('should return error color for WRITEOFFAUTHORIZED', () => {
      expect(commonUtil.statusListColor(SlipStatus.WRITEOFFAUTHORIZED)).toBe('text-error')
    })

    it('should return error color for WRITEOFFREQUESTED', () => {
      expect(commonUtil.statusListColor(SlipStatus.WRITEOFFREQUESTED)).toBe('text-error')
    })
  })

  describe('isRefundProcessStatus - additional statuses', () => {
    it('should return true for REFUNDREJECTED', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.REFUNDREJECTED)).toBe(true)
    })

    it('should return true for REFUNDUPLOADED', () => {
      expect(commonUtil.isRefundProcessStatus(SlipStatus.REFUNDUPLOADED)).toBe(true)
    })
  })

  describe('isEditEnabledBystatus - additional statuses', () => {
    it('should return false for REFUNDAUTHORIZED', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.REFUNDAUTHORIZED)).toBe(false)
    })

    it('should return false for LINKED', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.LINKED)).toBe(false)
    })

    it('should return true for COMPLETE', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.COMPLETE)).toBe(true)
    })

    it('should return true for VOID', () => {
      expect(commonUtil.isEditEnabledBystatus(SlipStatus.VOID)).toBe(true)
    })
  })

  describe('isDeepEqual - edge cases', () => {
    it('should handle null values', () => {
      const obj1 = { name: null }
      const obj2 = { name: null }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(true)
    })

    it('should handle undefined values', () => {
      const obj1 = { name: undefined }
      const obj2 = { name: undefined }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(true)
    })

    it('should handle arrays as objects', () => {
      const obj1 = { items: [1, 2, 3] }
      const obj2 = { items: [1, 2, 3] }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(true)
    })

    it('should handle different null vs undefined', () => {
      const obj1 = { name: null }
      const obj2 = { name: undefined }
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(false)
    })
  })

  describe('formatAmount - edge cases', () => {
    it('should handle negative amounts', () => {
      expect(commonUtil.formatAmount(-1234.56)).toBe('-$1,234.56')
    })

    it('should handle very large amounts', () => {
      expect(commonUtil.formatAmount(999999999.99)).toBe('$999,999,999.99')
    })

    it('should handle decimal precision', () => {
      expect(commonUtil.formatAmount(123.456)).toBe('$123.46')
    })
  })

  describe('formatToTwoDecimals - edge cases', () => {
    it('should handle negative numbers', () => {
      expect(commonUtil.formatToTwoDecimals(-1234.5)).toBe('-1,234.50')
    })

    it('should handle zero', () => {
      expect(commonUtil.formatToTwoDecimals(0)).toBe('0.00')
    })

    it('should handle very small numbers', () => {
      expect(commonUtil.formatToTwoDecimals(0.1)).toBe('0.10')
    })
  })
})
