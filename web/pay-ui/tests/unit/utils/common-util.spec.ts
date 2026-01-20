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
    it.each([
      [new Date('2025-09-26T10:00:00.000Z'), undefined, 'Sep 26, 2025'],
      [new Date('2025-09-26T10:00:00.000Z'), 'yyyy-MM-dd', '2025-09-26'],
      ['invalid-date', undefined, ''],
      [null as unknown as Date | string, undefined, ''],
      [undefined as unknown as Date | string, undefined, '']
    ])('should format %p with format %p to %p', (input, format, expected) => {
      expect(commonUtil.formatDisplayDate(input, format)).toBe(expected)
    })

    it('should format string dates', () => {
      const stringResult = commonUtil.formatDisplayDate('2025-09-26T00:00:00.000Z')
      expect(stringResult).toContain('Sep')
      expect(stringResult).toContain('2025')
    })
  })

  describe('statusListColor', () => {
    it.each([
      [SlipStatus.ACTIVE, true, 'text-success'],
      [SlipStatus.ACTIVE, false, 'success'],
      [SlipStatus.COMPLETE, true, 'text-success'],
      [SlipStatus.NSF, true, 'text-error'],
      [SlipStatus.VOID, true, 'text-error'],
      [SlipStatus.REFUNDPROCESSED, true, 'text-success'],
      [SlipStatus.REFUNDPROCESSED, false, 'success'],
      [SlipStatus.WRITEOFFCOMPLETED, true, 'text-success'],
      [SlipStatus.LINKED, true, 'text-error'],
      [SlipStatus.REFUNDREQUEST, true, 'text-error'],
      [SlipStatus.REFUNDAUTHORIZED, true, 'text-error'],
      [SlipStatus.WRITEOFFAUTHORIZED, true, 'text-error'],
      [SlipStatus.WRITEOFFREQUESTED, true, 'text-error'],
      ['UNKNOWN_STATUS', true, 'text-'],
      ['UNKNOWN_STATUS', false, '']
    ])('should return %s for status %s with prependText=%s', (status, prependText, expected) => {
      expect(commonUtil.statusListColor(status, prependText)).toBe(expected)
    })
  })

  describe('string formatting', () => {
    it.each([
      [100, '$100'],
      ['50.50', '$50.50']
    ])('appendCurrencySymbol should format %p as %s', (input, expected) => {
      expect(commonUtil.appendCurrencySymbol(input)).toBe(expected)
    })

    it.each([
      [{ name: 'John', email: '', age: null, city: 'Vancouver' }, { name: 'John', city: 'Vancouver' }],
      [{ remainingAmount: '$1,234.56', name: 'Test' }, { remainingAmount: '1234.56', name: 'Test' }]
    ])('cleanObject should clean %p', (input, expected) => {
      expect(commonUtil.cleanObject(input)).toEqual(expected)
    })

    it.each([
      [{ name: 'John Doe', age: '30' }, 'name=John%20Doe&age=30'],
      [{ name: '', age: '30' }, 'name=&age=30']
    ])('createQueryParams should create query string from %p', (params, expected) => {
      expect(commonUtil.createQueryParams(params)).toBe(expected)
    })

    it.each([
      ['https://example.com', { query: { name: 'John', age: '30' } }, 'https://example.com?name=John&age=30'],
      ['https://example.com', { query: {} }, 'https://example.com']
    ])('appendQueryParamsIfNeeded should append params to %s', (url, route, expected) => {
      expect(commonUtil.appendQueryParamsIfNeeded(url, route)).toBe(expected)
    })
  })

  describe('address conversion', () => {
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

    it('should handle missing fields with empty strings', () => {
      const address = { city: 'Vancouver' }
      const result = commonUtil.convertAddressForComponent(address as Partial<Address>)
      expect(result.addressCity).toBe('Vancouver')
      expect(result.addressCountry).toBe('')
    })
  })

  describe('status helpers', () => {
    it.each([
      ['isRefundProcessStatus', SlipStatus.REFUNDREQUEST, true],
      ['isRefundProcessStatus', SlipStatus.REFUNDAUTHORIZED, true],
      ['isRefundProcessStatus', SlipStatus.REFUNDPROCESSED, true],
      ['isRefundProcessStatus', SlipStatus.REFUNDREJECTED, true],
      ['isRefundProcessStatus', SlipStatus.REFUNDUPLOADED, true],
      ['isRefundProcessStatus', SlipStatus.ACTIVE, false],
      ['isRefundRequestStatus', SlipStatus.REFUNDREQUEST, true],
      ['isRefundRequestStatus', SlipStatus.ACTIVE, false],
      ['isRefundRequestStatus', SlipStatus.REFUNDPROCESSED, false],
      ['isEditEnabledBystatus', SlipStatus.REFUNDPROCESSED, false],
      ['isEditEnabledBystatus', SlipStatus.NSF, false],
      ['isEditEnabledBystatus', SlipStatus.REFUNDAUTHORIZED, false],
      ['isEditEnabledBystatus', SlipStatus.LINKED, false],
      ['isEditEnabledBystatus', SlipStatus.ACTIVE, true],
      ['isEditEnabledBystatus', SlipStatus.COMPLETE, true],
      ['isEditEnabledBystatus', SlipStatus.VOID, true]
    ])('%s(%s) should return %s', (method, status, expected) => {
      expect(commonUtil[method](status)).toBe(expected)
    })
  })

  describe('isDeepEqual', () => {
    it.each([
      [{ name: 'John', age: 30 }, { name: 'John', age: 30 }, true, 'equal objects'],
      [{ name: 'John', age: 30 }, { name: 'Jane', age: 30 }, false, 'different values'],
      [{ name: 'John' }, { name: 'John', age: 30 }, false, 'different lengths'],
      [{ user: { name: 'John', age: 30 } }, { user: { name: 'John', age: 30 } }, true, 'nested objects'],
      [{ name: null }, { name: null }, true, 'null values'],
      [{ name: undefined }, { name: undefined }, true, 'undefined values'],
      [{ items: [1, 2, 3] }, { items: [1, 2, 3] }, true, 'arrays as values'],
      [{ name: null }, { name: undefined }, false, 'null vs undefined']
    ])('should handle %s', (obj1, obj2, expected) => {
      expect(commonUtil.isDeepEqual(obj1, obj2)).toBe(expected)
    })
  })

  describe('number formatting', () => {
    it.each([
      ['formatAmount', 1234.56, '$1,234.56'],
      ['formatAmount', 1000, '$1,000.00'],
      ['formatAmount', 0, '$0.00'],
      ['formatAmount', -1234.56, '-$1,234.56'],
      ['formatAmount', 999999999.99, '$999,999,999.99'],
      ['formatAmount', 123.456, '$123.46'],
      ['formatToTwoDecimals', 1234.5, '1,234.50'],
      ['formatToTwoDecimals', 1000, '1,000.00'],
      ['formatToTwoDecimals', '1234.5', '1,234.50'],
      ['formatToTwoDecimals', -1234.5, '-1,234.50'],
      ['formatToTwoDecimals', 0, '0.00'],
      ['formatToTwoDecimals', 0.1, '0.10']
    ])('%s(%p) should return %s', (method, input, expected) => {
      expect(commonUtil[method](input)).toBe(expected)
    })
  })

  describe('validation rules', () => {
    it.each([
      ['test', 'This field is required', true],
      ['', 'This field is required', 'This field is required'],
      [null, 'This field is required', 'This field is required'],
      ['', 'Custom error', 'Custom error']
    ])('requiredFieldRule should validate %p with message %s', (value, message, expected) => {
      const rules = commonUtil.requiredFieldRule(message === 'This field is required' ? undefined : message)
      const rule = rules[0]
      expect(rule(value)).toBe(expected)
    })

    it('should validate required email', () => {
      const rules = commonUtil.emailRules(false)
      expect(rules[0]('test@example.com')).toBe(true)
      expect(rules[0]('')).toBe('Email address is required')
      expect(rules[1]('invalid-email')).toBe('Valid email is required')
    })

    it('should validate optional email', () => {
      const rules = commonUtil.emailRules(true)
      expect(rules[0]('')).toBe(true)
      expect(rules[0]('test@example.com')).toBe(true)
      expect(rules[0]('invalid')).toBe('Valid email is required')
    })
  })

  describe('helper utilities', () => {
    it.each([
      [{ accountId: '123', accountName: 'Test Account' }, '123 Test Account'],
      [{}, 'undefined undefined'],
      [{ accountId: 123 }, '123 undefined']
    ])('formatAccountDisplayName should format %p', (item, expected) => {
      expect(commonUtil.formatAccountDisplayName(item)).toBe(expected)
    })

    it.each([
      [[{ value: 'EFT', text: 'Direct Deposit' }, { value: 'CHEQUE', text: 'Cheque' }], 'EFT', 'Direct Deposit'],
      [[{ value: 'EFT', text: 'Direct Deposit' }], 'CHEQUE', undefined]
    ])('getRefundMethodText should return text for value', (methods, value, expected) => {
      expect(commonUtil.getRefundMethodText(methods, value)).toBe(expected)
    })

    it.each([
      ['$1,234.56', 123456],
      ['abc123def', 123],
      ['abc', 0]
    ])('extractAndConvertStringToNumber should extract from %s', (input, expected) => {
      expect(commonUtil.extractAndConvertStringToNumber(input)).toBe(expected)
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

    it('should create blob, trigger download, and revoke URL', async () => {
      commonUtil.fileDownload('test data', 'test.txt')

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(200)

      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })
})
