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
  label: {
    apply: 'Apply',
    cancel: 'Cancel',
    date: 'Date',
    editStatus: 'Edit Status',
    refundStatus: 'Refund Status',
    selectDate: 'Select Date',
    selectedDateRange: '{boldStart}{name}:{boldEnd} {value}',
    status: 'Status'
  },
  page: {
    home: {
      title: 'Index Page - Pay UI',
      h1: 'Index Page'
    },
    protected: {
      title: 'Protected Page - Pay UI',
      h1: 'Protected Page'
    }
  }
}
