export default {
  /* Ordering should be alphabetical unless otherwise specified */
  connect: {
    breadcrumb: {
      default: 'BC Registries and Online Services' // default breadcrumb item text - will be shown before breadcrumbs have been set
    },
    header: {
      title: 'BC Registries and Online Services' // header component title text
    }
  },
  enum: {
    DATEFILTER_CODES: {
      TODAY: 'Today',
      YESTERDAY: 'Yesterday',
      LASTWEEK: 'Last Week',
      LASTMONTH: 'Last Month',
      CUSTOMRANGE: 'Custom Range'
    },
    PaymentTypes: {
      BCOL: 'BC OnLine',
      CASH: 'Cash',
      CHEQUE: 'Cheque',
      CREDIT_CARD: 'Credit Card',
      DIRECT_PAY: 'Direct Pay',
      EFT: 'Electronic Funds Transfer',
      EJV: 'Electronic Journal Voucher',
      INTERNAL: 'Routing Slip',
      NO_FEE: 'No Fee',
      ONLINE_BANKING: 'Online Banking',
      PAD: 'Pre-Authorized Debit',
      CREDIT: 'Account Credit'
    },
    SlipStatus: {
      ACTIVE: 'Active',
      COMPLETE: 'Complete',
      BOUNCED: 'Bounced',
      NSF: 'Non Sufficient Fund',
      REFUND: 'Refund',
      HOLD: 'On Hold',
      LINKED: 'Linked',
      REFUND_REQUESTED: 'Refund Requested',
      REFUND_AUTHORIZED: 'Refund Authorized',
      REFUND_PROCESSED: 'Refund Processed',
      REFUND_UPLOADED: 'Refund Uploaded',
      REFUND_REJECTED: 'Refund Rejected',
      CANCEL_REFUND_REQUEST: 'Cancel Refund Request',
      CANCEL_WRITE_OFF_REQUEST: 'Cancel Write Off Request',
      WRITE_OFF_AUTHORIZED: 'Write Off Authorized',
      WRITE_OFF_REQUESTED: 'Write Off Requested',
      WRITE_OFF_COMPLETED: 'Write Off Completed',
      VOID: 'Void',
      CORRECTION: 'Correction'
    },
    SlipStatusDropdown: {
      ACTIVE: 'Place routing slip to active',
      NSF: 'Place routing slip to NSF',
      HOLD: 'Place routing slip on hold',
      REFUND_REQUESTED: 'Refund request',
      WRITE_OFF_REQUESTED: 'Write off request',
      CANCEL_REFUND_REQUEST: 'Cancel refund request',
      REFUND_AUTHORIZED: 'Review refund request',
      WRITE_OFF_AUTHORIZED: 'Authorize Write off request',
      CANCEL_WRITE_OFF_REQUEST: 'Cancel Write off request',
      VOID: 'Void Routing Slip'
    }
  },
  error: {
    api: {
      generic: 'An error occurred: {message}'
    },
    createRoutingSlip: {
      generic: '{status}Error creating routing slip, please try again later.'
    },
    saveComment: {
      title: 'Error Saving Comment',
      description: 'Could not save your comment. Please try again or cancel.'
    },
    voidRoutingSlip: {
      title: 'Unable to Void Routing Slip',
      description: 'A routing slip with transactions cannot change status to void.'
    }
  },
  label: {
    additionalCheque: 'Additional Cheque',
    addNewRoutingSlip: 'Add New Routing Slip',
    amountCAD: 'Amount (CAD$)',
    amountUSD: 'Amount (USD$)',
    apply: 'Apply',
    backToDashboard: 'Back to Dashboard',
    backToEdit: 'Back to Edit',
    cancel: 'Cancel',
    chequeDate: 'Cheque Date',
    chequeNumber: 'Cheque Number',
    columnsToShow: 'Columns to Show',
    contactSupport: 'Contact Support',
    create: 'Create',
    createdBy: 'Created By',
    date: 'Date',
    editStatus: 'Edit Status',
    entityNumber: 'Entity Number',
    fasDashboard: 'FAS Dashboard',
    fundsReceivedInUSD: 'Funds received in USD',
    leave: 'Leave',
    link: 'Link',
    nameOfPersonOrOrgAndAddress: 'Name of Person or Organization & Address',
    nameOfPersonOrOrgOpt: 'Name of Person or Organization (Optional)',
    ok: 'OK',
    paymentInformation: 'Payment Information',
    receiptNumber: 'Receipt Number',
    referenceNumber: 'Reference Number',
    refundAmount: 'Refund Amount',
    refundStatus: 'Refund Status',
    reviewAndCreate: 'Review and Create',
    clientName: 'Client Name',
    clientNamePlaceholder: 'Name of Person or Organization',
    chequeAdvice: 'Cheque Advice',
    chequeAdvicePlaceholder: 'Additional Information',
    done: 'Done',
    reviewNewRoutingSlip: 'Review New Routing Slip',
    routingSlip: 'Routing Slip',
    routingSlipNumber: 'Routing Slip Number',
    routingSlipUniqueID: 'Routing Slip - Unique ID',
    searchRoutingSlipUniqueID: 'Search by routing slip - Unique ID',
    selectDate: 'Select Date',
    selectedDateRange: '{boldStart}{name}:{boldEnd} {value}',
    status: 'Status',
    totalAmount: 'Total Amount',
    totalAmountReceived: 'Total Amount Received ($)',
    updateStatus: 'Update Status',
    balance: 'Balance',
    actions: 'Actions'
  },
  modal: {
    leaveCreateRoutingSlip: {
      title: 'Leave Add Routing Slip?',
      description: 'If you leave this page, your routing slip information will not be created or saved.'
    },
    placeRoutingSlipToNSF: {
      title: 'Place Routing Slip to NSF?',
      description:
        `By placing status to NSF, this routing slip will not be usable 
        and current transactions will change to pending until it has been repaid by having another slip linked to it.`,
      confirmButton: 'Place status to NSF'
    },
    voidRoutingSlip: {
      title: 'Void Routing Slip?',
      description: 'By placing status to void, this routing slip will not be usable, and this action cannot be undone.',
      confirmButton: 'Void Routing Slip'
    }
  },
  page: {
    dashboard: {
      title: 'Staff Dashboard - BC Business Registry FAS',
      h1: 'FAS Staff Dashboard',
      h1Info: 'Search, add and manage routing slips'
    },
    createRoutingSlip: {
      title: 'Add Routing Slip - BC Business Registry FAS',
      h1: 'Add Routing Slip'
    },
    error: {
      403: {
        h1: 'Not Authorized',
        text: 'You are not authorized to access this page.'
      },
      404: {
        h1: '404 Page Not Found',
        text: 'This page could not be found or does not exist.'
      },
      undefined: {
        h1: 'Unknown Error',
        text: 'An unknown error occured, please refresh the page or try again later.'
      }
    },
    viewRoutingSlip: {
      title: 'View Routing Slip - BC Business Registry FAS',
      h1: 'View Routing Slip: {id}',
      subtitle: 'Manage, and review details for this routing slip',
      routingSlipInformation: {
        title: 'Routing Slip Information'
      },
      paymentInformation: {
        title: 'Payment Information',
        description: 'View balances, and detail information of the payment method.',
        totalAmountReceived: 'Total Amount Received',
        currentBalance: 'Current Balance',
        viewPaymentInformation: 'View payment information',
        editRoutingSlip: 'Edit Routing Slip',
        fundsConvertedUsdToCad: '(Funds converted USD to CAD)',
        receiptNumber: 'Receipt Number',
        amountCad: 'Amount(CAD$)',
        linkedWith: 'Linked with:',
        save: 'Save',
        cancel: 'Cancel'
      },
      linkingRoutingSlip: {
        title: 'Linking Routing Slip',
        description: 'Link this routing slip to another routing slip to transfer funds, and merge payment informations.'
      },
      routingSlipTransaction: {
        title: 'Routing Slip Transaction',
        description: 'Manage, track and view the routing slip\'s transactions'
      }
    },
    home: {
      title: 'Index Page - Pay UI',
      h1: 'Index Page'
    },
    protected: {
      title: 'Protected Page - Pay UI',
      h1: 'Protected Page'
    }
  },
  text: {
    entityNumberHelp: 'Example: BC1234567, CP1234567, FM1234567 or 123456',
    chequeAdviceHelp:
      'There is a 40 character limit. Include the entity name, entity number and what the refund is for.',
    pleaseSearchForRoutingSlip: 'Please search for and select a Routing Slip ID',
    routingSlipSearchDisplay: '{boldStart}{number}{boldEnd} - {date} - Current Balance: ${amount}',
    searchStartMessage: 'Search routing slips by entering one of the value above. '
      + 'Click on "columns to show" to add or get rid of additional values.',
    searchNoResult: '{h4Start}No Results{h4End}{pStart}None of the routing slips matched this search. '
      + 'Try another search.{pEnd}',
    linkRoutingSlipSearchTitleParent: 'This routing slip is linked with:',
    linkRoutingSlipSearchTitleChild: 'This routing slip has been linked to:',
    linkedRSChildInfoP1: 'This routing slip\'s total balance and payment information '
      + 'has been transfered to the linked routing slip above.',
    linkedRSChildInfoP2: 'Click on the routing slip number above to access to the linked routing slip.',
    linkRSSearchInfo: 'When you link to another routing slip, this routing slip’s total balance will '
      + 'transfer to the linked routing slip. After linking to another routing slip this routing slip '
      + 'will be inactive.',
    cantLinkBecauseVoided: 'This routing slip cannot link to another routing slip since it is voided.',
    routingSlipNoLinkedRoutingSlips: 'This routing slip has no linked routing slips.',
    cantLinkSinceInvoicesExistP1: 'This routing slip cannot link to another routing slip since transactions were made.',
    cantLinkSinceInvoicesExistP2: 'Other routing slips can link to this routing slip.',
    linkedRoutingSlip: 'Linked routing slip',
    addManualTransactionQuantityInfoText: 'The priority or future effective fee will only be applied once. '
      + 'Input transactions separately to add additional fee',
    cantAddTransactions: 'Transaction can\'t be added, since the filling type total amount exceeds the routing slip\'s '
      + 'current balance',
    amountExceedsBalance: 'Amount exceeds the routing slip\'s current balance'
  },
  validation: {
    fieldRequired: 'This field is required',
    payment: {
      chequeDate: {
        required: 'Cheque date is required'
      },
      paidAmount: {
        required: 'Paid Amount is required',
        decimal: 'Paid Amount can only be up to 2 decimal places'
      },
      receiptNumber: {
        required: 'A Receipt number is required'
      }
    },
    routingSlip: {
      date: {
        required: 'A Routing Slip Date is required'
      },
      entityNumber: {
        required: 'An Entity Number is required'
      },
      number: {
        exists: 'Routing Slip number already present. Enter a new number or edit details of this routing slip.',
        invalidApi: 'Routing Slip number is invalid. Enter a new number or edit details of this routing slip.',
        required: 'A Routing Slip Number is required',
        length: 'A Routing Slip Number must be 9 characters long',
        numeric: 'Routing Slip Number must only contain numbers (0-9).'
      }
    },
    unknownError: 'Unknown error'
  }
}
