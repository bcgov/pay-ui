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
      ACTIVE: 'Place routing slip to active',
      NSF: 'Place routing slip to NSF',
      HOLD: 'Place routing slip on hold',
      LINKED: 'LINKED',
      REFUND_REQUESTED: 'Refund request',
      WRITE_OFF_REQUESTED: 'Write off request',
      CANCEL_REFUND_REQUEST: 'Cancel refund request',
      REFUND_AUTHORIZED: 'Review refund request',
      WRITE_OFF_AUTHORIZED: 'Authorize Write off request',
      CANCEL_WRITE_OFF_REQUEST: 'Cancel Write off request',
      VOID: 'Void Routing Slip'
      // CORRECTION='Correct Routing Slip' - Future
    }
  },
  error: {
    createRoutingSlip: {
      generic: '{status}Error creating routing slip, please try again later.'
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
    date: 'Date',
    editStatus: 'Edit Status',
    entityNumber: 'Entity Number',
    fundsReceivedInUSD: 'Funds received in USD',
    leave: 'Leave',
    link: 'Link',
    nameOfPersonOrOrgAndAddress: 'Name of Person or Organization & Address',
    nameOfPersonOrOrgOpt: 'Name of Person or Organization (Optional)',
    paymentInformation: 'Payment Information',
    receiptNumber: 'Receipt Number',
    refundStatus: 'Refund Status',
    reviewAndCreate: 'Review and Create',
    reviewNewRoutingSlip: 'Review New Routing Slip',
    routingSlip: 'Routing Slip',
    routingSlipUniqueID: 'Routing Slip - Unique ID',
    searchRoutingSlipUniqueID: 'Search by routing slip - Unique ID',
    selectDate: 'Select Date',
    selectedDateRange: '{boldStart}{name}:{boldEnd} {value}',
    status: 'Status',
    totalAmount: 'Total Amount',
    totalAmountReceived: 'Total Amount Received ($)'
  },
  modal: {
    leaveCreateRoutingSlip: {
      title: 'Leave Add Routing Slip?',
      description: 'If you leave this page, your routing slip information will not be created or saved.'
    }
  },
  page: {
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
      h1: 'View Routing Slip: {id}'
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
    pleaseSearchForRoutingSlip: 'Please search for and select a Routing Slip ID',
    routingSlipSearchDisplay: '{boldStart}{number}{boldEnd} - {date} - Current Balance: ${amount}'
  },
  validation: {
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
