/**
 * A report is defined once here; the generic API, page and CSV export do the rest.
 *
 * SQL uses named parameters (`:fiscalYearStart`, `:paymentMethod`), which are turned
 * into positional parameters ($1, $2) before running — never string-concatenated.
 * Do not add LIMIT; the runner adds it.
 */
export interface FiscalYearFilter {
  key: string
  type: 'fiscalYear'
  label: string
}

/**
 * A fiscal year (quick pick) or a custom date range. Query string: `<key>=FY2025`, or
 * `<key>=custom&<key>From=2025-05-01&<key>To=2025-06-30` (dates in Pacific time, inclusive).
 * Provides `:<key>Start` and `:<key>End` to the SQL — UTC timestamps, end exclusive.
 */
export interface PeriodFilter {
  key: string
  type: 'period'
  label: string
}

export interface SelectFilter {
  key: string
  type: 'select'
  label: string
  /** Must return `value` and `label` columns. Only these values are accepted. */
  optionsSql: string
  /** Label for "no filter" (the parameter is NULL). Omit to make the filter required. */
  allLabel?: string
}

export type ReportFilter = FiscalYearFilter | PeriodFilter | SelectFilter

export interface ReportColumn {
  /** Column name returned by the SQL */
  key: string
  label: string
  format?: 'text' | 'number' | 'currency'
  /** Show a total for this column in the summary cards */
  total?: boolean
}

export interface ReportDefinition {
  id: string
  title: string
  description: string
  /** Shown under the table, e.g. what is included or excluded */
  note?: string
  filters: ReportFilter[]
  sql: string
  columns: ReportColumn[]
}

export function defineReport(report: ReportDefinition): ReportDefinition {
  return report
}
