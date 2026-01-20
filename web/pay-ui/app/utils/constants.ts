export enum LDFlags {
  EnableDetailsFilter = 'enable-transactions-detail-filter',
  EnableEFTRefundByCheque = 'enable-eft-refund-by-cheque'
}

export enum RouteNames {
  HOME = 'home',
  CREATE_ROUTING_SLIP = 'create-routing-slip',
  VIEW_ROUTING_SLIP = 'view-routing-slip',
  VIEW_ROUTING_SLIP_CHILD = 'view-routing-slip-child',
  SIGN_IN = 'signin',
  SIGN_OUT = 'signout',
  NOT_FOUND = 'notfound',
  UNAUTHORIZED = 'unauthorized',
  MANAGE_SHORTNAMES = 'manage-shortnames',
  SHORTNAME_DETAILS = 'shortnamedetails',
  SHORTNAME_REFUND = 'shortnamerefund',
  SHORTNAME_REFUND_SELECTION = 'shortnamerefundselection'
}

export enum DateFilterCodes {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LASTWEEK = 'LASTWEEK',
  LASTMONTH = 'LASTMONTH',
  CUSTOMRANGE = 'CUSTOMRANGE'
}

export enum PaymentMethods {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE'
}

export enum SlipStatusDropdown {
  ACTIVE = 'ACTIVE',
  NSF = 'NSF',
  HOLD = 'HOLD',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  WRITE_OFF_REQUESTED = 'WRITE_OFF_REQUESTED',
  CANCEL_REFUND_REQUEST = 'CANCEL_REFUND_REQUEST',
  REFUND_AUTHORIZED = 'REFUND_AUTHORIZED',
  WRITE_OFF_AUTHORIZED = 'WRITE_OFF_AUTHORIZED',
  CANCEL_WRITE_OFF_REQUEST = 'CANCEL_WRITE_OFF_REQUEST',
  VOID = 'VOID'
}

export enum SlipStatusLabel {
  ACTIVE = 'ACTIVE',
  NSF = 'NSF',
  HOLD = 'HOLD',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  WRITE_OFF_REQUESTED = 'WRITE_OFF_REQUESTED',
  CANCEL_REFUND_REQUEST = 'CANCEL_REFUND_REQUEST',
  REFUND_AUTHORIZED = 'REFUND_AUTHORIZED',
  WRITE_OFF_AUTHORIZED = 'WRITE_OFF_AUTHORIZED',
  CANCEL_WRITE_OFF_REQUEST = 'CANCEL_WRITE_OFF_REQUEST',
  VOID = 'VOID'
}

export enum InvoiceStatus {
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  CREATED = 'CREATED',
  CREDITED = 'CREDITED',
  COMPLETED = 'COMPLETED', // NOTE: this === PAID value (api alters it from PAID to COMPLETED in postdump)
  DELETE_ACCEPTED = 'DELETE_ACCEPTED',
  DELETED = 'DELETED',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL_PAID',
  PENDING = 'PENDING',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  SETTLEMENT_SCHEDULED = 'SETTLEMENT_SCHED',
  UPDATE_REVENUE_ACCOUNT = 'GL_UPDATED',
  UPDATE_REVENUE_ACCOUNT_REFUND = 'GL_UPDATED_REFUND',
  // Not in pay-api, but shown in transaction table
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  PARTIALLY_CREDITED = 'PARTIALLY_CREDITED'
}

export enum CreateRoutingSlipStatus {
  VALID = 'VALID',
  EXISTS = 'EXISTS',
  INVALID_DIGITS = 'INVALID_DIGITS'
}

export enum PatchActions {
  UPDATE_STATUS = 'updateStatus'
}

export enum Account {
  PREMIUM = 'PREMIUM',
  BASIC = 'BASIC',
  STAFF = 'STAFF',
  SBC_STAFF = 'SBC_STAFF',
  MAXIMUS_STAFF = 'MAXIMUS_STAFF',
  CONTACT_CENTRE_STAFF = 'CC_STAFF'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
  PENDING_STAFF_REVIEW = 'PENDING_STAFF_REVIEW',
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  NSF_SUSPENDED = 'NSF_SUSPENDED',
  SUSPENDED = 'SUSPENDED',
  PENDING_INVITE_ACCEPT = 'PENDING_INVITE_ACCEPT'
}

export enum CfsAccountStatus {
  PENDING = 'PENDING',
  PENDING_PAD_ACTIVATION = 'PENDING_PAD_ACTIVATION',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FREEZE = 'FREEZE'
}

export enum ShortNameStatus {
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
  PENDING = 'PENDING'
}

export enum SuspensionReason {
  NSF = 'NSF',
  OVERDUE_EFT = 'Overdue EFT Payments',
  NSF_SUSPENDED = 'NSF SUSPENDED',
  SUSPENDED = 'SUSPENDED'
}

export enum EFTRefundStatusDescription {
  APPROVED = 'Approved',
  PENDING_APPROVAL = 'Requested',
  DECLINED = 'Declined',
  PENDING_REFUND = 'Pending Refund'
}

export enum ShortNameType {
  EFT = 'EFT',
  WIRE = 'WIRE',
  ALL = 'ALL'
}

export enum ShortNameTypeDescription {
  EFT = 'EFT',
  WIRE = 'Wire Transfer'
}

export enum ShortNameLinkStatus {
  PENDING = 'PENDING',
  LINKED = 'LINKED',
  INACTIVE = 'INACTIVE'
}

export enum ShortNameRefundStatus {
  APPROVED = 'APPROVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  ERRORED = 'ERRORED'
}

export enum ShortNameRefundLabel {
  PENDING_APPROVAL = 'REFUND REQUEST'
}

export enum ShortNamePaymentActions {
  APPLY_CREDITS = 'APPLY_CREDITS',
  CANCEL = 'CANCEL',
  REVERSE = 'REVERSE'
}

export enum ShortNameHistoryType {
  FUNDS_RECEIVED = 'FUNDS_RECEIVED',
  INVOICE_REFUND = 'INVOICE_REFUND',
  INVOICE_PARTIAL_REFUND = 'INVOICE_PARTIAL_REFUND',
  STATEMENT_PAID = 'STATEMENT_PAID',
  STATEMENT_REVERSE = 'STATEMENT_REVERSE',
  SN_REFUND_PENDING_APPROVAL = 'SN_REFUND_PENDING_APPROVAL',
  SN_REFUND_APPROVED = 'SN_REFUND_APPROVED',
  SN_REFUND_DECLINED = 'SN_REFUND_DECLINED',
  SN_TRANSFER_SENT = 'SN_TRANSFER_SENT',
  SN_TRANSFER_RECEIVED = 'SN_TRANSFER_RECEIVED'
}

export enum ShortNameHistoryTypeDescription {
  FUNDS_RECEIVED = 'Funds Received',
  INVOICE_REFUND = 'Full Invoice Refund',
  INVOICE_PARTIAL_REFUND = 'Partial Invoice Refund',
  STATEMENT_PAID = 'Statement Paid',
  STATEMENT_REVERSE = 'Payment Reversed',
  SN_REFUND_PENDING_APPROVAL = 'Short Name Refund Request',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  SN_REFUND_APPROVED = 'Short Name Refund Request',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  SN_REFUND_DECLINED = 'Short Name Refund Request',
  SN_TRANSFER_SENT = 'Transfer Sent',
  SN_TRANSFER_RECEIVED = 'Transfer Received'
}

export enum ShortNameReversePaymentErrors {
  INVALID_STATE = 'EFT_PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID',
  UNPAID_STATEMENT = 'EFT_PAYMENT_ACTION_UNPAID_STATEMENT',
  UNPAID_STATEMENT_INVOICE = 'EFT_PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS',
  EXCEEDS_SIXTY_DAYS = 'EFT_PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS'
}

export enum EFTRefundStatus {
  APPROVED = 'APPROVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  ERRORED = 'ERRORED'
}

export enum EFTRefundMethod {
  EFT = 'EFT',
  CHEQUE = 'CHEQUE'
}

export enum EFTRefundMethodDescription {
  EFT = 'Direct Deposit',
  CHEQUE = 'Cheque'
}

export enum ShortNameResponseStatus {
  EFT_SHORT_NAME_ALREADY_MAPPED = 'EFT_SHORT_NAME_ALREADY_MAPPED'
}

export enum ConfirmationType {
  REVERSE_PAYMENT = 'reversePayment',
  CANCEL_PAYMENT = 'cancelPayment',
  UNLINK_ACCOUNT = 'unlinkAccount'
}

export enum LookupStates {
  INITIAL = 'initial',
  TYPING = 'typing',
  SEARCHING = 'searching',
  SHOW_RESULTS = 'show results',
  NO_RESULTS = 'no results',
  SUMMARY = 'summary'
}

export function getSearchRoutingSlipTableHeaders(t: (key: string) => string) {
  return [
    {
      header: t('label.routingSlipNumber'),
      align: 'start' as const,
      accessorKey: 'routingSlipNumber',
      display: true,
      meta: {
        class: {
          th: 'header-routing-slip'
        }
      }
    },
    {
      header: t('label.receiptNumber'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'receiptNumber',
      display: true,
      meta: {
        class: {
          th: 'header-receipt-number'
        }
      }
    },
    {
      header: t('label.entityNumber'),
      align: 'start' as const,
      accessorKey: 'accountName',
      sortable: false,
      display: false,
      meta: {
        class: {
          th: 'header-account-name'
        }
      }
    },
    {
      header: t('label.createdBy'),
      align: 'start' as const,
      accessorKey: 'createdName',
      sortable: false,
      display: false,
      meta: {
        class: {
          th: 'header-created-name'
        }
      }
    },
    {
      header: t('label.date'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'date',
      display: true,
      meta: {
        class: {
          th: 'header-date'
        }
      }
    },
    {
      header: t('label.status'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'status',
      display: true,
      meta: {
        class: {
          th: 'header-status'
        }
      }
    },
    {
      header: t('label.refundStatus'),
      align: 'start' as const,
      sortable: false,
      accessorKey: 'refundStatus',
      display: true,
      meta: {
        class: {
          th: 'header-refund-status'
        }
      }
    },
    {
      header: t('label.referenceNumber'),
      align: 'start' as const,
      accessorKey: 'businessIdentifier',
      sortable: false,
      display: true,
      meta: {
        class: {
          th: 'header-business-identifier'
        }
      }
    },
    {
      header: t('label.chequeNumber'),
      align: 'start' as const,
      accessorKey: 'chequeReceiptNumber',
      sortable: false,
      display: false,
      meta: {
        class: {
          th: 'header-cheque-receipt-number'
        }
      }
    },
    {
      header: t('label.balance'),
      align: 'right' as const,
      accessorKey: 'remainingAmount',
      sortable: false,
      display: true,
      meta: {
        class: {
          th: 'header-remaining-amount',
          td: 'text-right font-bold'
        }
      }
    },
    {
      header: t('label.actions'),
      align: 'start' as const,
      accessorKey: 'actions',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: true,
      meta: {
        class: {
          th: 'header-action'
        }
      }
    }
  ]
}

export const ChequeRefundStatus = [
  {
    code: 'PROCESSING',
    text: 'Processing',
    display: false
  },
  {
    code: 'PROCESSED',
    text: 'Cheque Issued',
    display: true
  },
  {
    code: 'CHEQUE_UNDELIVERABLE',
    text: 'Cheque Undeliverable',
    display: true
  }
]

export enum Product {
  BCA = 'BCA',
  BUSINESS = 'BUSINESS',
  BUSINESS_SEARCH = 'BUSINESS_SEARCH',
  CSO = 'CSO',
  ESRA = 'ESRA',
  MHR = 'MHR',
  PPR = 'PPR',
  RPPR = 'RPPR',
  RPT = 'RPT',
  STRR = 'STRR',
  VS = 'VS',
  NRO = 'NRO'
}

export enum ChequeRefundCode {
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  CHEQUE_UNDELIVERABLE = 'CHEQUE_UNDELIVERABLE'
}

export enum RefundStatusText {
  PROCESSING = 'Processing',
  REFUND_REQUESTED = 'Refund Requested',
  REQUEST_APPROVED = 'Request Approved',
  REFUND_DECLINED = 'Refund Declined'
}

export const chequeRefundCodes = {
  PROCESSING: ChequeRefundCode.PROCESSING,
  PROCESSED: ChequeRefundCode.PROCESSED,
  CHEQUE_UNDELIVERABLE: ChequeRefundCode.CHEQUE_UNDELIVERABLE
} as const

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
  [FASErrorCode.FAS_INVALID_ROUTING_SLIP_NUMBER]: 'Invalid routing slip number format.',
  [FASErrorCode.FAS_INVALID_ROUTING_SLIP_DIGITS]: 'Routing slip number must have valid digits.',
  [FASErrorCode.FAS_INVALID_RS_STATUS_CHANGE]: 'Invalid routing slip status change.'
}

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY_MS: 300,
  SEARCH_DEBOUNCE_DELAY_MS: 500,
  TOOLTIP_DELAY_MS: 300,
  DEFAULT_PAGE_LIMIT: 50,
  INFINITE_SCROLL_DISTANCE: 200
} as const
