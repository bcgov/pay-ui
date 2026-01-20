export enum EFTErrorCode {
  PARTIAL_REFUND_MISSING_LINKS = 'EFT_PARTIAL_REFUND_MISSING_LINKS',
  PARTIAL_REFUND = 'EFT_PARTIAL_REFUND',
  CREDIT_AMOUNT_UNEXPECTED = 'EFT_CREDIT_AMOUNT_UNEXPECTED',
  INSUFFICIENT_CREDITS = 'EFT_INSUFFICIENT_CREDITS',
  PAYMENT_ACTION_ACCOUNT_ID_REQUIRED = 'EFT_PAYMENT_ACTION_ACCOUNT_ID_REQUIRED',
  PAYMENT_ACTION_STATEMENT_ID_INVALID = 'EFT_PAYMENT_ACTION_STATEMENT_ID_INVALID',
  PAYMENT_ACTION_STATEMENT_ID_REQUIRED = 'EFT_PAYMENT_ACTION_STATEMENT_ID_REQUIRED',
  PAYMENT_ACTION_UNPAID_STATEMENT = 'EFT_PAYMENT_ACTION_UNPAID_STATEMENT',
  PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS = 'EFT_PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS',
  PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID = 'EFT_PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID',
  PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS = 'EFT_PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS',
  PAYMENT_ACTION_UNSUPPORTED = 'EFT_PAYMENT_ACTION_UNSUPPORTED',
  SHORT_NAME_ACCOUNT_ID_REQUIRED = 'EFT_SHORT_NAME_ACCOUNT_ID_REQUIRED',
  SHORT_NAME_ALREADY_MAPPED = 'EFT_SHORT_NAME_ALREADY_MAPPED',
  SHORT_NAME_LINK_INVALID_STATUS = 'EFT_SHORT_NAME_LINK_INVALID_STATUS',
  SHORT_NAME_NOT_LINKED = 'EFT_SHORT_NAME_NOT_LINKED',
  REFUND_SAME_USER_APPROVAL_FORBIDDEN = 'EFT_REFUND_SAME_USER_APPROVAL_FORBIDDEN',
  REFUND_CHEQUE_STATUS_INVALID_ACTION = 'EFT_REFUND_CHEQUE_STATUS_INVALID_ACTION'
}

export const EFTErrorMessage: Record<EFTErrorCode, string> = {
  [EFTErrorCode.PARTIAL_REFUND_MISSING_LINKS]: 'Cannot process partial refund - missing linked accounts.',
  [EFTErrorCode.PARTIAL_REFUND]: 'Partial refund is not allowed.',
  [EFTErrorCode.CREDIT_AMOUNT_UNEXPECTED]: 'The credit amount does not match the expected value.',
  [EFTErrorCode.INSUFFICIENT_CREDITS]: 'Insufficient credits available for this refund.',
  [EFTErrorCode.PAYMENT_ACTION_ACCOUNT_ID_REQUIRED]: 'Account ID is required for this payment action.',
  [EFTErrorCode.PAYMENT_ACTION_STATEMENT_ID_INVALID]: 'The statement ID provided is invalid.',
  [EFTErrorCode.PAYMENT_ACTION_STATEMENT_ID_REQUIRED]: 'Statement ID is required for this payment action.',
  [EFTErrorCode.PAYMENT_ACTION_UNPAID_STATEMENT]: 'Cannot perform this action on an unpaid statement.',
  [EFTErrorCode.PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS]: 'Cannot reverse payment - exceeds 60 day limit.',
  [EFTErrorCode.PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID]: 'Invalid credit link status for this action.',
  [EFTErrorCode.PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS]: 'Cannot reverse invoice - unexpected invoice status.',
  [EFTErrorCode.PAYMENT_ACTION_UNSUPPORTED]: 'This payment action is not supported.',
  [EFTErrorCode.SHORT_NAME_ACCOUNT_ID_REQUIRED]: 'Account ID is required for this short name.',
  [EFTErrorCode.SHORT_NAME_ALREADY_MAPPED]: 'This short name is already mapped to an account.',
  [EFTErrorCode.SHORT_NAME_LINK_INVALID_STATUS]: 'Invalid status for linking this short name.',
  [EFTErrorCode.SHORT_NAME_NOT_LINKED]: 'This short name is not linked to an account.',
  [EFTErrorCode.REFUND_SAME_USER_APPROVAL_FORBIDDEN]: 'You cannot approve your own refund request.',
  [EFTErrorCode.REFUND_CHEQUE_STATUS_INVALID_ACTION]: 'Invalid cheque status action.'
}

export enum FASErrorCode {
  RS_ALREADY_A_PARENT = 'RS_ALREADY_A_PARENT',
  RS_ALREADY_LINKED = 'RS_ALREADY_LINKED',
  RS_PARENT_ALREADY_LINKED = 'RS_PARENT_ALREADY_LINKED',
  RS_CANT_LINK_TO_SAME = 'RS_CANT_LINK_TO_SAME',
  RS_CHILD_HAS_TRANSACTIONS = 'RS_CHILD_HAS_TRANSACTIONS',
  RS_IN_INVALID_STATUS = 'RS_IN_INVALID_STATUS',
  RS_CANT_LINK_NSF = 'RS_CANT_LINK_NSF',
  RS_HAS_TRANSACTIONS = 'RS_HAS_TRANSACTIONS',
  RS_INSUFFICIENT_FUNDS = 'RS_INSUFFICIENT_FUNDS',
  RS_DOESNT_EXIST = 'RS_DOESNT_EXIST',
  RS_NOT_ACTIVE = 'RS_NOT_ACTIVE',
  FAS_INVALID_PAYMENT_METHOD = 'FAS_INVALID_PAYMENT_METHOD',
  FAS_INVALID_ROUTING_SLIP_NUMBER = 'FAS_INVALID_ROUTING_SLIP_NUMBER',
  FAS_INVALID_ROUTING_SLIP_DIGITS = 'FAS_INVALID_ROUTING_SLIP_DIGITS',
  FAS_INVALID_RS_STATUS_CHANGE = 'FAS_INVALID_RS_STATUS_CHANGE'
}

export const FASErrorMessage: Record<FASErrorCode, string> = {
  [FASErrorCode.RS_ALREADY_A_PARENT]: 'This routing slip is already a parent and cannot be linked.',
  [FASErrorCode.RS_ALREADY_LINKED]: 'This routing slip is already linked to another slip.',
  [FASErrorCode.RS_PARENT_ALREADY_LINKED]: 'The parent routing slip is already linked.',
  [FASErrorCode.RS_CANT_LINK_TO_SAME]: 'Cannot link a routing slip to itself.',
  [FASErrorCode.RS_CHILD_HAS_TRANSACTIONS]: 'Cannot link - child routing slip has existing transactions.',
  [FASErrorCode.RS_IN_INVALID_STATUS]: 'The routing slip status is invalid for this action.',
  [FASErrorCode.RS_CANT_LINK_NSF]: 'Cannot link NSF routing slips.',
  [FASErrorCode.RS_HAS_TRANSACTIONS]: 'Cannot perform action - routing slip has existing transactions.',
  [FASErrorCode.RS_INSUFFICIENT_FUNDS]: 'Insufficient funds on routing slip.',
  [FASErrorCode.RS_DOESNT_EXIST]: 'The routing slip does not exist.',
  [FASErrorCode.RS_NOT_ACTIVE]: 'The routing slip is not active.',
  [FASErrorCode.FAS_INVALID_PAYMENT_METHOD]: 'Invalid payment method for routing slip.',
  [FASErrorCode.FAS_INVALID_ROUTING_SLIP_NUMBER]: 'Invalid routing slip number.',
  [FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS]: 'Routing slip number must have valid digits.',
  [FASErrorCode.FAS_INVALID_RS_STATUS_CHANGE]: 'Invalid routing slip status change.'
}
