export enum SessionStorageKeys {
  KeyCloakToken = 'KEYCLOAK_TOKEN',
  ApiConfigKey = 'AUTH_API_CONFIG',
  LaunchDarklyFlags = 'LD_FLAGS',
  ExtraProvincialUser = 'EXTRAPROVINCIAL_USER',
  SessionSynced = 'SESSION_SYNCED',
  AuthApiUrl = 'AUTH_API_URL',
  AuthWebUrl = 'AUTH_WEB_URL',
  PayApiUrl = 'PAY_API_URL',
  StatusApiUrl = 'STATUS_API_URL',
  FasWebUrl = 'FAS_WEB_URL',
  SiteminderLogoutUrl = 'SITEMINDER_LOGOUT_URL',
  ShortNamesTabIndex = 'Short_Names_Tab_Index',
  LinkedAccount = 'Linked_Account',
  LinkedShortNamesFilter = 'Linked_Short_Names_Filter'
}

export enum LDFlags {
  EnableEFTRefundByCheque = 'enable-eft-refund-by-cheque'
}

export enum DateFilterCodes {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LASTWEEK = 'LASTWEEK',
  LASTMONTH = 'LASTMONTH',
  CUSTOMRANGE = 'CUSTOMRANGE',
}

export enum PaymentMethods {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
}

export enum SlipStatus {
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  BOUNCED = 'BOUNCED',
  NSF = 'NSF',
  REFUND = 'REFUND',
  LAST = 'LAST',
  HOLD = 'HOLD',
  LINKED = 'LINKED',
  REFUNDREQUEST = 'REFUND_REQUESTED',
  REFUNDAUTHORIZED = 'REFUND_AUTHORIZED',
  REFUNDPROCESSED = 'REFUND_PROCESSED',
  REFUNDUPLOADED = 'REFUND_UPLOADED',
  REFUNDREJECTED = 'REFUND_REJECTED',
  CANCEL_REFUND_REQUEST = 'CANCEL_REFUND_REQUEST',
  CANCELWRITEOFFREQUEST='CANCEL_WRITE_OFF_REQUEST',
  WRITEOFFAUTHORIZED='WRITE_OFF_AUTHORIZED',
  WRITEOFFREQUESTED='WRITE_OFF_REQUESTED',
  WRITEOFFCOMPLETED='WRITE_OFF_COMPLETED',
  VOID='VOID',
  CORRECTION='CORRECTION'
}

export enum SlipStatusLabel {
  ACTIVE = 'Place routing slip to active',
  NSF = 'Place routing slip to NSF',
  HOLD = 'Place routing slip on hold',
  LINKED = 'LINKED',
  REFUND_REQUESTED = 'Refund request',
  WRITE_OFF_REQUESTED = 'Write off request',
  CANCEL_REFUND_REQUEST = 'Cancel refund request',
  REFUND_AUTHORIZED='Review refund request',
  WRITE_OFF_AUTHORIZED='Authorize Write off request',
  CANCEL_WRITE_OFF_REQUEST='Cancel Write off request',
  VOID='Void Routing Slip',
  // CORRECTION='Correct Routing Slip' - Future
}

export enum Role {
  FAS_USER = 'fas_user',
  FAS_EDIT = 'fas_edit',
  FAS_REPORTS = 'fas_reports',
  FAS_SEARCH = 'fas_search',
  FAS_VIEW = 'fas_view',
  FAS_CREATE = 'fas_create',
  FAS_LNK = 'fas_link',
  FAS_TRANSACTION = 'fas_transaction',
  FAS_REFUND_APPROVER = 'fas_refund_approver',
  FAS_REFUND = 'fas_refund',
  FAS_VOID = 'fas_void',
  FAS_CORRECTION = 'fas_correction',
  ManageEft = 'manage_eft',
  EftRefund = 'eft_refund',
  EftRefundApprover = 'eft_refund_approver'
}

export enum InvoiceStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  DELETE_ACCEPTED = 'DELETE_ACCEPTED',
  REFUNDREQUEST = 'REFUND_REQUESTED',
}

export enum ApiErrors {
  FAS_INVALID_ROUTING_SLIP_DIGITS = 'FAS_INVALID_ROUTING_SLIP_DIGITS'
}

export enum CreateRoutingSlipStatus {
  VALID = 'VALID',
  EXISTS = 'EXISTS',
  INVALID_DIGITS = 'INVALID_DIGITS',
}

export enum PatchActions {
  UPDATE_STATUS = 'updateStatus'
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

export enum EFTRefundTypeDescription {
  APPROVED = 'Approved',
  PENDING_APPROVAL = 'Requested',
  DECLINED = 'Declined',
  PENDING_REFUND = 'Pending Refund',
}

export enum ShortNameType {
  EFT = 'EFT',
  WIRE = 'WIRE'
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
  PENDING_APPROVAL = 'PENDING_APPROVAL'
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
  STATEMENT_PAID = 'STATEMENT_PAID',
  STATEMENT_REVERSE = 'STATEMENT_REVERSE',
  SN_REFUND_PENDING_APPROVAL = 'SN_REFUND_PENDING_APPROVAL',
  SN_REFUND_APPROVED = 'SN_REFUND_APPROVED',
  SN_REFUND_DECLINED = 'SN_REFUND_DECLINED'
}

export enum ShortNameHistoryTypeDescription {
  FUNDS_RECEIVED = 'Funds Received',
  INVOICE_REFUND = 'Invoice Refund',
  STATEMENT_PAID = 'Statement Paid',
  STATEMENT_REVERSE = 'Payment Reversed',
  SN_REFUND_PENDING_APPROVAL = 'Short Name Refund Request',
  SN_REFUND_APPROVED = 'Short Name Refund Request',
  SN_REFUND_DECLINED = 'Short Name Refund Request'
}

export enum ShortNameReversePaymentErrors {
  INVALID_STATE = 'EFT_PAYMENT_ACTION_CREDIT_LINK_STATUS_INVALID',
  UNPAID_STATEMENT = 'EFT_PAYMENT_ACTION_UNPAID_STATEMENT',
  UNPAID_STATEMENT_INVOICE = 'EFT_PAYMENT_INVOICE_REVERSE_UNEXPECTED_STATUS',
  EXCEEDS_SIXTY_DAYS = 'EFT_PAYMENT_ACTION_REVERSAL_EXCEEDS_SIXTY_DAYS'
}

export enum EFTRefundType {
  APPROVED = 'APPROVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  ERRORED = 'ERRORED'
}

export enum EFTRefundSelectionType {
  DIRECT_DEPOSIT = 'directdeposit',
  CHEQUE = 'cheque'
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

export const AXIOS_ERROR_ALERT_TIME_OUT = 5000

export const headerSearchTitle =
[
  {
    text: 'Routing Slip Number',
    align: 'start',
    value: 'routingSlipNumber',
    display: true,
    className: 'routing-slip'
  },
  {
    text: 'Receipt Number',
    align: 'start',
    sortable: false,
    value: 'receiptNumber',
    display: true,
    className: 'receiptNumber'
  },
  {
    text: 'Entity Number',
    align: 'start',
    value: 'accountName',
    sortable: false,
    display: false,
    className: 'accountName'
  },
  {
    text: 'Created By',
    align: 'start',
    value: 'createdName',
    sortable: false,
    display: false,
    className: 'createdName'
  },
  {
    text: 'Date',
    align: 'start',
    sortable: false,
    value: 'date',
    display: true,
    className: 'date'
  },
  {
    text: 'Status',
    align: 'start',
    sortable: false,
    value: 'status',
    display: true,
    className: 'status'
  },
  {
    text: 'Refund Status',
    align: 'start',
    sortable: false,
    value: 'refundStatus',
    display: true,
    className: 'refundStatus'
  },
  {
    text: 'Reference Number',
    align: 'start',
    value: 'businessIdentifier',
    sortable: false,
    display: true,
    className: 'businessIdentifier'
  },
  {
    text: 'Cheque Number',
    align: 'start',
    value: 'chequeReceiptNumber',
    sortable: false,
    display: false,
    className: 'cheque-receipt-number'
  },
  {
    text: 'Balance',
    align: 'right',
    value: 'remainingAmount',
    sortable: false,
    display: true,
    className: 'remainingAmount'
  },
  {
    text: 'Actions',
    align: 'start',
    value: '',
    sortable: false,
    display: true,
    hideInSearchColumnFilter: true,
    className: 'action'
  }
]

export const RoutingSlipRefundStatus = [
  {
    code: 'PROCESSING',
    text: 'Processing',
    display: false
  },
  {
    code: 'PROCESSED',
    text: 'Processed',
    display: true
  },
  {
    code: 'CHEQUE_UNDELIVERABLE',
    text: 'Cheque Undeliverable',
    display: true
  }
]

export const RoutingSlipRefundCodes = RoutingSlipRefundStatus.reduce((acc, status) => {
  acc[status.code] = status.code
  return acc
}, {} as { [key: string]: string })
