export default {
  // Overrides the nuxt-base default breadcrumb ("Service BC Connect")
  connect: {
    breadcrumb: {
      default: 'PAY Insights'
    }
  },
  header: {
    logout: 'Log out'
  },
  page: {
    home: {
      title: 'PAY Insights - BC Registries',
      h1: 'PAY Insights',
      description: 'Read-only operational reports for PAY.',
      reports: 'Reports',
      view: 'View report',
      warehouse: {
        checking: 'Checking data warehouse…',
        connected: 'Data warehouse connected',
        unavailable: 'Data warehouse unavailable — reports may not load'
      }
    },
    report: {
      back: 'Back to reports',
      export: 'Export CSV',
      loading: 'Loading report…',
      from: 'From',
      to: 'To',
      total: 'Total {label}',
      empty: 'No results for these filters.',
      error: 'Unable to load the report. Please try again later.',
      truncated: 'Showing the first {count} of {total} rows. Totals include all rows. '
        + 'Narrow the filters or export to CSV for more.'
    }
  }
}
