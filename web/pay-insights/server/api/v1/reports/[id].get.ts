/** Runs a report with the filters from the query string. */
export default defineEventHandler(async (event) => {
  const report = getReportOrThrow(event)
  const { filters, rows, truncated } = await runReport(event, report, PAGE_ROW_LIMIT)

  return {
    report: {
      id: report.id,
      title: report.title,
      description: report.description,
      note: report.note,
      columns: report.columns
    },
    filters,
    totals: columnTotals(rows, report.columns),
    rows,
    truncated
  }
})
