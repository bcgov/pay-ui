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
    }
  },
  label: {
    apply: 'Apply',
    cancel: 'Cancel',
    date: 'Date',
    selectedDateRange: '{boldStart}{name}:{boldEnd} {value}'
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
