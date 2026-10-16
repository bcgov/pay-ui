/** Downloads a report as CSV, with the same filters and access check as the page. */
export default defineEventHandler(async (event) => {
  const report = getReportOrThrow(event)
  const { filters, rows, truncated } = await runReport(event, report, EXPORT_ROW_LIMIT)
  if (truncated) {
    throw createError({ statusCode: 413, statusMessage: 'Too many rows to export; narrow the filters' })
  }

  const suffix = filters
    .map(filter => filter.value)
    .filter(value => value !== null)
    .join('-')
  const filename = `${report.id}${suffix ? `-${suffix}` : ''}.csv`.replace(/[^\w.-]/g, '_')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Cache-Control', 'no-store')
  return toCsv(rows, report.columns)
})
