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

/** Validates the filters from the query string and runs the report (read-only, parameterized). */
export async function runReport(event: H3Event, report: ReportDefinition, rowLimit: number) {
  const query = getQuery(event)
  const filters: ResolvedFilter[] = []
  let sqlValues: Record<string, unknown> = {}

  for (const filter of report.filters) {
    const options = filter.type === 'fiscalYear'
      ? fiscalYearOptions()
      : await warehouseQuery<FilterOption & Record<string, unknown>>(filter.optionsSql)
    try {
      const result = resolveFilter(filter, query[filter.key], options)
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
  const rows = normalizeRows(await warehouseQuery(text, params), report.columns)
  const truncated = rows.length > rowLimit

  return { filters, rows: truncated ? rows.slice(0, rowLimit) : rows, truncated }
}
