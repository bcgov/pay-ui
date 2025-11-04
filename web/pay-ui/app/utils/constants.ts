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
  LinkedShortNamesFilter = 'Linked_Short_Names_Filter',
  CurrentAccount = 'CURRENT_ACCOUNT'
}

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
  CANCELWRITEOFFREQUEST = 'CANCEL_WRITE_OFF_REQUEST',
  WRITEOFFAUTHORIZED = 'WRITE_OFF_AUTHORIZED',
  WRITEOFFREQUESTED = 'WRITE_OFF_REQUESTED',
  WRITEOFFCOMPLETED = 'WRITE_OFF_COMPLETED',
  VOID = 'VOID',
  CORRECTION = 'CORRECTION'
}

export enum SlipStatusLabel {
  ACTIVE = 'Place routing slip to active',
  NSF = 'Place routing slip to NSF',
  HOLD = 'Place routing slip on hold',
  LINKED = 'LINKED',
  REFUND_REQUESTED = 'Refund request',
  WRITE_OFF_REQUESTED = 'Write off request',
  CANCEL_REFUND_REQUEST = 'Cancel refund request',
  REFUND_AUTHORIZED = 'Review refund request',
  WRITE_OFF_AUTHORIZED = 'Authorize Write off request',
  CANCEL_WRITE_OFF_REQUEST = 'Cancel Write off request',
  VOID = 'Void Routing Slip'
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
  EftRefundApprover = 'eft_refund_approver',
  CreateCredits = 'create_credits',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  FasRefund = 'fas_refund',
  ViewAllTransactions = 'view_all_transactions'
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

export enum ApiErrors {
  FAS_INVALID_ROUTING_SLIP_DIGITS = 'FAS_INVALID_ROUTING_SLIP_DIGITS'
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
  SN_REFUND_DECLINED = 'SN_REFUND_DECLINED'
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
  SN_REFUND_DECLINED = 'Short Name Refund Request'
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

export enum PaymentTypes {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  CREDIT_CARD = 'CC',
  BCOL = 'DRAWDOWN',
  DIRECT_PAY = 'DIRECT_PAY',
  EFT = 'EFT',
  INTERNAL = 'INTERNAL',
  NO_FEE = 'NO_FEE',
  ONLINE_BANKING = 'ONLINE_BANKING',
  PAD = 'PAD',
  EJV = 'EJV',
  WIRE = 'WIRE',
  CREDIT = 'CREDIT'
}

export const AXIOS_ERROR_ALERT_TIME_OUT = 5000

export const SearchRoutingSlipTableHeaders
  = [
    {
      header: 'Routing Slip Number',
      align: 'start',
      accessorKey: 'routingSlipNumber',
      display: true,
      meta: {
        class: {
          th: 'header-routing-slip'
        }
      }
    },
    {
      header: 'Receipt Number',
      align: 'start',
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
      header: 'Entity Number',
      align: 'start',
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
      header: 'Created By',
      align: 'start',
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
      header: 'Date',
      align: 'start',
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
      header: 'Status',
      align: 'start',
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
      header: 'Refund Status',
      align: 'start',
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
      header: 'Reference Number',
      align: 'start',
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
      header: 'Cheque Number',
      align: 'start',
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
      header: 'Balance',
      align: 'right',
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
      header: 'Actions',
      align: 'start',
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

export const chequeRefundCodes = ChequeRefundStatus.reduce((acc, status) => {
  acc[status.code] = status.code
  return acc
}, {} as { [key: string]: string })
