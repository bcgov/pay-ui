import type { ReportColumn, ReportFilter } from '../reports/types'
import { addDays, pacificMidnightAsUtc, parseIsoDate } from './dates'
import {
  currentFiscalYear,
  FIRST_FISCAL_YEAR,
  fiscalYearDates,
  fiscalYearLabel,
  fiscalYearRange,
  parseFiscalYear
} from './fiscalYear'

export const PAGE_ROW_LIMIT = 5000
export const EXPORT_ROW_LIMIT = 100000

export interface FilterOption {
  value: string | number
  label: string
}

export interface ResolvedFilter {
  key: string
  type: ReportFilter['type']
  label: string
  value: string | number | null
  options: FilterOption[]
  allLabel?: string
  /** Period filters: the selected range as inclusive Pacific dates */
  from?: string
  to?: string
}

export class ReportInputError extends Error {}

/**
 * Turns `:name` parameters into `$1, $2, ...` and builds the matching values.
 * `::type` casts are left alone. Throws if the SQL uses a name that has no value.
 */
export function toPositionalSql(sql: string, values: Record<string, unknown>): { text: string, params: unknown[] } {
  const params: unknown[] = []
  const positions = new Map<string, number>()
  const text = sql.replace(/(?<!:):([a-zA-Z_]\w*)/g, (_match, name: string) => {
    if (!(name in values)) {
      throw new Error(`Report SQL uses :${name} but no value was provided`)
    }
    if (!positions.has(name)) {
      params.push(values[name])
      positions.set(name, params.length)
    }
    return `$${positions.get(name)}`
  })
  return { text, params }
}

export const CUSTOM_PERIOD = 'custom'
const FIRST_DATE = `${FIRST_FISCAL_YEAR}-04-01`

function first(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

/** Validates one filter's input against its allowed values and returns the SQL parameters it provides. */
export function resolveFilter(
  filter: ReportFilter,
  query: Record<string, unknown>,
  options: FilterOption[],
  today = new Date()
): { resolved: ResolvedFilter, sqlValues: Record<string, unknown> } {
  const raw = first(query[filter.key])

  if (filter.type === 'period') {
    let from: string | undefined
    let to: string | undefined
    let value: string

    if (raw === CUSTOM_PERIOD) {
      from = parseIsoDate(first(query[`${filter.key}From`]))
      to = parseIsoDate(first(query[`${filter.key}To`]))
      if (!from || !to || from > to || from < FIRST_DATE) {
        throw new ReportInputError(`Invalid ${filter.label}: choose a start and end date, with the start first`)
      }
      value = CUSTOM_PERIOD
    } else {
      const match = raw === undefined || raw === '' ? undefined : /^FY(\d{4})$/.exec(String(raw))
      if (raw !== undefined && raw !== '' && !match) {
        throw new ReportInputError(`Invalid ${filter.label}`)
      }
      let year: number
      try {
        year = parseFiscalYear(match?.[1], today)
      } catch {
        throw new ReportInputError(`Invalid ${filter.label}`)
      }
      ({ from, to } = fiscalYearDates(year))
      value = `FY${year}`
    }

    return {
      resolved: { key: filter.key, type: filter.type, label: filter.label, value, options, from, to },
      sqlValues: {
        [`${filter.key}Start`]: pacificMidnightAsUtc(from),
        [`${filter.key}End`]: pacificMidnightAsUtc(addDays(to, 1))
      }
    }
  }

  if (filter.type === 'fiscalYear') {
    let year: number
    try {
      year = parseFiscalYear(raw, today)
    } catch {
      throw new ReportInputError(`Invalid ${filter.label}`)
    }
    const { start, end } = fiscalYearRange(year)
    return {
      resolved: { key: filter.key, type: filter.type, label: filter.label, value: year, options },
      sqlValues: { [filter.key]: year, [`${filter.key}Start`]: start, [`${filter.key}End`]: end }
    }
  }

  const value = raw === undefined || raw === '' ? null : String(raw)
  if (value === null && !filter.allLabel) {
    throw new ReportInputError(`${filter.label} is required`)
  }
  if (value !== null && !options.some(option => String(option.value) === value)) {
    throw new ReportInputError(`Invalid ${filter.label}`)
  }
  return {
    resolved: { key: filter.key, type: filter.type, label: filter.label, value, options, allLabel: filter.allLabel },
    sqlValues: { [filter.key]: value }
  }
}

export function periodOptions(today = new Date()): FilterOption[] {
  return [
    ...fiscalYearOptions(today).map(option => ({ value: `FY${option.value}`, label: `FY ${option.label}` })),
    { value: CUSTOM_PERIOD, label: 'Custom range' }
  ]
}

export function fiscalYearOptions(today = new Date()): FilterOption[] {
  const options: FilterOption[] = []
  for (let year = currentFiscalYear(today); year >= FIRST_FISCAL_YEAR; year--) {
    options.push({ value: year, label: fiscalYearLabel(year) })
  }
  return options
}

/** pg returns numeric/bigint as strings; turn number and currency columns into numbers. */
export function normalizeRows(rows: Record<string, unknown>[], columns: ReportColumn[]): Record<string, unknown>[] {
  const numeric = columns.filter(column => column.format === 'number' || column.format === 'currency')
  return rows.map((row) => {
    const result: Record<string, unknown> = {}
    for (const column of columns) {
      const value = row[column.key]
      result[column.key] = numeric.includes(column) && value !== null && value !== undefined ? Number(value) : value
    }
    return result
  })
}

/**
 * SQL that totals the whole report result (no LIMIT), for when the rows returned are cut off.
 * Column keys come from report definitions (not user input) and are checked before quoting.
 */
export function totalsSql(sql: string, columns: ReportColumn[]): string {
  const sums = columns.filter(column => column.total).map((column) => {
    if (!/^[a-z_]\w*$/i.test(column.key)) {
      throw new Error(`Invalid report column key: ${column.key}`)
    }
    return `COALESCE(SUM("${column.key}"), 0) AS "${column.key}"`
  })
  return `SELECT ${['COUNT(*)::int AS "__rowCount"', ...sums].join(', ')}\nFROM (\n${sql}\n) AS report_rows`
}

export function columnTotals(rows: Record<string, unknown>[], columns: ReportColumn[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const column of columns.filter(column => column.total)) {
    totals[column.key] = rows.reduce((sum, row) => sum + (Number(row[column.key]) || 0), 0)
  }
  return totals
}

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  // Stop spreadsheet apps from running cell content as a formula
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) {
    text = `'${text}`
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Record<string, unknown>[], columns: ReportColumn[]): string {
  const lines = [columns.map(column => csvCell(column.label)).join(',')]
  for (const row of rows) {
    lines.push(columns.map(column => csvCell(row[column.key])).join(','))
  }
  return `${lines.join('\r\n')}\r\n`
}
