/** Runs a report with the filters from the query string. */
export default defineEventHandler(async (event) => {
  const report = getReportOrThrow(event)
  const { filters, rows, truncated, totals, totalRows } = await runReport(
    event, report, PAGE_ROW_LIMIT, { withTotals: true }
  )

  return {
    report: {
      id: report.id,
      title: report.title,
      description: report.description,
      note: report.note,
      columns: report.columns
    },
    filters,
    totals,
    totalRows,
    rows,
    truncated
  }
})
