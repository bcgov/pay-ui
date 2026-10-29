import type { H3Event } from 'h3'
import type { ReportDefinition } from '../reports/types'
import { findReport } from '../reports'

export function getReportOrThrow(event: H3Event): ReportDefinition {
  const report = findReport(getRouterParam(event, 'id') ?? '')
  if (!report) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }
  return report
}

/**
 * Validates the filters from the query string and runs the report (read-only, parameterized).
 * With `withTotals`, totals and the row count cover the whole result even when rows are cut off.
 */
export async function runReport(
  event: H3Event,
  report: ReportDefinition,
  rowLimit: number,
  { withTotals = false } = {}
) {
  const query = getQuery(event)
  const filters: ResolvedFilter[] = []
  let sqlValues: Record<string, unknown> = {}

  for (const filter of report.filters) {
    const options = filter.type === 'select'
      ? await warehouseQuery<FilterOption & Record<string, unknown>>(filter.optionsSql)
      : filter.type === 'period' ? periodOptions() : fiscalYearOptions()
    try {
      const result = resolveFilter(filter, query, options)
      filters.push(result.resolved)
      sqlValues = { ...sqlValues, ...result.sqlValues }
    } catch (error) {
      if (error instanceof ReportInputError) {
        throw createError({ statusCode: 400, statusMessage: error.message })
      }
      throw error
    }
  }

  // Fetch one extra row to know whether the result was cut off
  const { text, params } = toPositionalSql(`${report.sql}\nLIMIT ${rowLimit + 1}`, sqlValues)
  const allRows = normalizeRows(await warehouseQuery(text, params), report.columns)
  const truncated = allRows.length > rowLimit
  const rows = truncated ? allRows.slice(0, rowLimit) : allRows

  if (!withTotals) {
    return { filters, rows, truncated, totals: {} as Record<string, number>, totalRows: rows.length }
  }
  if (!truncated) {
    // Every row is here, so totals can be added up directly — no second query
    return { filters, rows, truncated, totals: columnTotals(rows, report.columns), totalRows: rows.length }
  }

  // Rows were cut off: total the whole result in SQL
  const totalsQuery = toPositionalSql(totalsSql(report.sql, report.columns), sqlValues)
  const [summary = {}] = await warehouseQuery<Record<string, unknown>>(totalsQuery.text, totalsQuery.params)
  const { __rowCount, ...sums } = summary
  return {
    filters,
    rows,
    truncated,
    totals: columnTotals([sums], report.columns),
    totalRows: Number(__rowCount ?? rows.length)
  }
}
