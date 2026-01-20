import {
  getEFTErrorMessage,
  getFASErrorMessage,
  getErrorMessage,
  extractErrorType,
  isEFTError,
  isFASError
} from '~/utils/api-error-handler'
import { EFTErrorCode, FASErrorCode } from '~/enums/api-errors'

describe('api-error-handler', () => {
  describe('extractErrorType', () => {
    it.each([
      ['response._data.type', { response: { _data: { type: 'TEST_ERROR' } } }, 'TEST_ERROR'],
      ['response.data.type', { response: { data: { type: 'TEST_ERROR' } } }, 'TEST_ERROR'],
      ['data.type', { data: { type: 'TEST_ERROR' } }, 'TEST_ERROR'],
      ['null', null, undefined],
      ['undefined', undefined, undefined],
      ['empty object', {}, undefined],
      ['string', 'error', undefined],
      ['number', 123, undefined]
    ])('should extract error type from %s', (_, error, expected) => {
      expect(extractErrorType(error)).toBe(expected)
    })

    it('should prioritize response._data.type over response.data.type', () => {
      const error = {
        response: {
          _data: { type: 'ERROR_1' },
          data: { type: 'ERROR_2' }
        }
      }
      expect(extractErrorType(error)).toBe('ERROR_1')
    })

    it('should prioritize response.data.type over data.type', () => {
      const error = {
        response: {
          data: { type: 'ERROR_1' }
        },
        data: { type: 'ERROR_2' }
      }
      expect(extractErrorType(error)).toBe('ERROR_1')
    })
  })

  describe('getEFTErrorMessage', () => {
    it.each([
      [EFTErrorCode.PARTIAL_REFUND_MISSING_LINKS, 'Cannot process partial refund - missing linked accounts.'],
      [EFTErrorCode.PARTIAL_REFUND, 'Partial refund is not allowed.'],
      [EFTErrorCode.CREDIT_AMOUNT_UNEXPECTED, 'The credit amount does not match the expected value.'],
      [EFTErrorCode.INSUFFICIENT_CREDITS, 'Insufficient credits available for this refund.'],
      [EFTErrorCode.PAYMENT_ACTION_ACCOUNT_ID_REQUIRED, 'Account ID is required for this payment action.'],
      [EFTErrorCode.PAYMENT_ACTION_STATEMENT_ID_INVALID, 'The statement ID provided is invalid.'],
      [EFTErrorCode.PAYMENT_ACTION_STATEMENT_ID_REQUIRED, 'Statement ID is required for this payment action.'],
      [EFTErrorCode.PAYMENT_ACTION_UNPAID_STATEMENT, 'Cannot perform this action on an unpaid statement.'],
      [EFTErrorCode.PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS, 'Cannot reverse payment - exceeds 60 day limit.'],
      [EFTErrorCode.PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID, 'Invalid credit link status for this action.'],
      [EFTErrorCode.PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS, 'Cannot reverse invoice - unexpected invoice status.'],
      [EFTErrorCode.PAYMENT_ACTION_UNSUPPORTED, 'This payment action is not supported.'],
      [EFTErrorCode.SHORT_NAME_ACCOUNT_ID_REQUIRED, 'Account ID is required for this short name.'],
      [EFTErrorCode.SHORT_NAME_ALREADY_MAPPED, 'This short name is already mapped to an account.'],
      [EFTErrorCode.SHORT_NAME_LINK_INVALID_STATUS, 'Invalid status for linking this short name.'],
      [EFTErrorCode.SHORT_NAME_NOT_LINKED, 'This short name is not linked to an account.'],
      [EFTErrorCode.REFUND_SAME_USER_APPROVAL_FORBIDDEN, 'You cannot approve your own refund request.'],
      [EFTErrorCode.REFUND_CHEQUE_STATUS_INVALID_ACTION, 'Invalid cheque status action.']
    ])('should return message for %s', (errorCode, expectedMessage) => {
      const error = { response: { _data: { type: errorCode } } }
      expect(getEFTErrorMessage(error)).toBe(expectedMessage)
    })

    it('should return generic message with error type for unknown EFT error', () => {
      const error = { response: { _data: { type: 'UNKNOWN_EFT_ERROR' } } }
      expect(getEFTErrorMessage(error)).toBe('An error occurred: UNKNOWN_EFT_ERROR')
    })

    it('should return generic message when error type cannot be extracted', () => {
      expect(getEFTErrorMessage(null)).toBe('An error occurred while processing your request.')
      expect(getEFTErrorMessage({})).toBe('An error occurred while processing your request.')
      expect(getEFTErrorMessage(undefined)).toBe('An error occurred while processing your request.')
    })
  })

  describe('getFASErrorMessage', () => {
    it.each([
      [FASErrorCode.RS_ALREADY_A_PARENT, 'This routing slip is already a parent and cannot be linked.'],
      [FASErrorCode.RS_ALREADY_LINKED, 'This routing slip is already linked to another slip.'],
      [FASErrorCode.RS_PARENT_ALREADY_LINKED, 'The parent routing slip is already linked.'],
      [FASErrorCode.RS_CANT_LINK_TO_SAME, 'Cannot link a routing slip to itself.'],
      [FASErrorCode.RS_CHILD_HAS_TRANSACTIONS, 'Cannot link - child routing slip has existing transactions.'],
      [FASErrorCode.RS_IN_INVALID_STATUS, 'The routing slip status is invalid for this action.'],
      [FASErrorCode.RS_CANT_LINK_NSF, 'Cannot link NSF routing slips.'],
      [FASErrorCode.RS_HAS_TRANSACTIONS, 'Cannot perform action - routing slip has existing transactions.'],
      [FASErrorCode.RS_INSUFFICIENT_FUNDS, 'Insufficient funds on routing slip.'],
      [FASErrorCode.RS_DOESNT_EXIST, 'The routing slip does not exist.'],
      [FASErrorCode.RS_NOT_ACTIVE, 'The routing slip is not active.'],
      [FASErrorCode.FAS_INVALID_PAYMENT_METHOD, 'Invalid payment method for routing slip.'],
      [FASErrorCode.FAS_INVALID_ROUTING_SLIP_NUMBER, 'Invalid routing slip number.'],
      [FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS, 'Routing slip number must have valid digits.'],
      [FASErrorCode.FAS_INVALID_RS_STATUS_CHANGE, 'Invalid routing slip status change.']
    ])('should return message for %s', (errorCode, expectedMessage) => {
      const error = { response: { _data: { type: errorCode } } }
      expect(getFASErrorMessage(error)).toBe(expectedMessage)
    })

    it('should return generic message with error type for unknown FAS error', () => {
      const error = { response: { _data: { type: 'UNKNOWN_FAS_ERROR' } } }
      expect(getFASErrorMessage(error)).toBe('An error occurred: UNKNOWN_FAS_ERROR')
    })

    it('should return generic message when error type cannot be extracted', () => {
      expect(getFASErrorMessage(null)).toBe('An error occurred while processing your request.')
      expect(getFASErrorMessage({})).toBe('An error occurred while processing your request.')
      expect(getFASErrorMessage(undefined)).toBe('An error occurred while processing your request.')
    })
  })

  describe('getErrorMessage', () => {
    it('should return EFT error message for EFT error codes', () => {
      const error = { response: { _data: { type: EFTErrorCode.INSUFFICIENT_CREDITS } } }
      expect(getErrorMessage(error)).toBe('Insufficient credits available for this refund.')
    })

    it('should return FAS error message for FAS error codes', () => {
      const error = { response: { _data: { type: FASErrorCode.RS_INSUFFICIENT_FUNDS } } }
      expect(getErrorMessage(error)).toBe('Insufficient funds on routing slip.')
    })

    it('should prioritize EFT errors over FAS errors when both could match', () => {
      const eftError = { response: { _data: { type: EFTErrorCode.PARTIAL_REFUND } } }
      expect(getErrorMessage(eftError)).toBe('Partial refund is not allowed.')
    })

    it('should return generic message with error type for unknown error', () => {
      const error = { response: { _data: { type: 'UNKNOWN_ERROR' } } }
      expect(getErrorMessage(error)).toBe('An error occurred: UNKNOWN_ERROR')
    })

    it('should return generic message when error type cannot be extracted', () => {
      expect(getErrorMessage(null)).toBe('An error occurred while processing your request.')
      expect(getErrorMessage({})).toBe('An error occurred while processing your request.')
    })
  })

  describe('isEFTError', () => {
    it.each([
      [EFTErrorCode.INSUFFICIENT_CREDITS, true],
      [EFTErrorCode.SHORT_NAME_NOT_LINKED, true],
      [EFTErrorCode.REFUND_SAME_USER_APPROVAL_FORBIDDEN, true]
    ])('should return true for %s', (errorCode, expected) => {
      const error = { response: { _data: { type: errorCode } } }
      expect(isEFTError(error, errorCode)).toBe(expected)
    })

    it('should return false for different EFT error code', () => {
      const error = { response: { _data: { type: EFTErrorCode.INSUFFICIENT_CREDITS } } }
      expect(isEFTError(error, EFTErrorCode.PARTIAL_REFUND)).toBe(false)
    })

    it('should return false for FAS error code', () => {
      const error = { response: { _data: { type: FASErrorCode.RS_INSUFFICIENT_FUNDS } } }
      expect(isEFTError(error, EFTErrorCode.INSUFFICIENT_CREDITS)).toBe(false)
    })

    it('should return false when error type cannot be extracted', () => {
      expect(isEFTError(null, EFTErrorCode.INSUFFICIENT_CREDITS)).toBe(false)
      expect(isEFTError({}, EFTErrorCode.INSUFFICIENT_CREDITS)).toBe(false)
    })
  })

  describe('isFASError', () => {
    it.each([
      [FASErrorCode.RS_INSUFFICIENT_FUNDS, true],
      [FASErrorCode.RS_DOESNT_EXIST, true],
      [FASErrorCode.FAS_INVALID_PAYMENT_METHOD, true]
    ])('should return true for %s', (errorCode, expected) => {
      const error = { response: { _data: { type: errorCode } } }
      expect(isFASError(error, errorCode)).toBe(expected)
    })

    it('should return false for different FAS error code', () => {
      const error = { response: { _data: { type: FASErrorCode.RS_INSUFFICIENT_FUNDS } } }
      expect(isFASError(error, FASErrorCode.RS_DOESNT_EXIST)).toBe(false)
    })

    it('should return false for EFT error code', () => {
      const error = { response: { _data: { type: EFTErrorCode.INSUFFICIENT_CREDITS } } }
      expect(isFASError(error, FASErrorCode.RS_INSUFFICIENT_FUNDS)).toBe(false)
    })

    it('should return false when error type cannot be extracted', () => {
      expect(isFASError(null, FASErrorCode.RS_INSUFFICIENT_FUNDS)).toBe(false)
      expect(isFASError({}, FASErrorCode.RS_INSUFFICIENT_FUNDS)).toBe(false)
    })
  })
})
