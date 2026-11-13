import type { ReportColumn, ReportDefinition } from '../reports/types'
import { reports } from '../reports'

/** Every view in this warehouse schema that the app's database user can read becomes a report. */
export const VIEW_SCHEMA = 'views'
const VIEW_REPORT_PREFIX = 'view-'
const CACHE_MS = 5 * 60 * 1000

/**
 * Helper views that only feed other views (see views.sql in the warehouse scripts), so they
 * are not listed as reports. Add new intermediate views here.
 */
const HIDDEN_VIEWS = new Set([
  'cas_je_line_3505', // CAS journal lines parsed for the EJV and disbursement reconciliation views
  'ejv_pli_ordered' // EJV line items in sequence, for the EJV reconciliation view
])

export interface ViewColumnRow {
  view_name: string
  comment: string | null
  column_name: string
  data_type: string
}

// Views and materialized views (information_schema leaves materialized views out)
const CATALOG_SQL = `
  SELECT c.relname AS view_name,
         obj_description(c.oid, 'pg_class') AS comment,
         a.attname AS column_name,
         a.atttypid::regtype::text AS data_type
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
   WHERE n.nspname = $1
     AND c.relkind IN ('v', 'm')
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND has_table_privilege(c.oid, 'SELECT')
   ORDER BY c.relname, a.attnum`

const NUMERIC_TYPES = new Set(['smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision'])
const DATE = 'date'
const TIMESTAMP = 'timestamp without time zone'
const TIMESTAMPTZ = 'timestamp with time zone'
const PACIFIC = 'AT TIME ZONE \'America/Vancouver\''

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function humanize(name: string): string {
  const words = name.replace(/_(v|mv)$/, '').replace(/_/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function selectExpression(column: string, dataType: string): string {
  const ident = quoteIdent(column)
  if (NUMERIC_TYPES.has(dataType)) {
    return ident
  }
  if (dataType === TIMESTAMP) {
    return `to_char(${ident}, 'YYYY-MM-DD HH24:MI:SS')`
  }
  if (dataType === TIMESTAMPTZ) {
    return `to_char(${ident} ${PACIFIC}, 'YYYY-MM-DD HH24:MI:SS')`
  }
  return `${ident}::text`
}

/** Period condition on the view's first date/timestamp column. Timestamps without a zone are taken as UTC. */
function periodCondition(column: string, dataType: string): string {
  const ident = quoteIdent(column)
  const bound = (name: string) => {
    if (dataType === TIMESTAMP) {
      return `:${name}::timestamp`
    }
    if (dataType === TIMESTAMPTZ) {
      return `(:${name}::timestamp AT TIME ZONE 'UTC')`
    }
    return `((:${name}::timestamp AT TIME ZONE 'UTC') ${PACIFIC})::date`
  }
  return `${ident} >= ${bound('periodStart')} AND ${ident} < ${bound('periodEnd')}`
}

/**
 * Builds one report per view from the catalog rows.
 * Left out: `x` when `x_v` exists, `x_mv` when `x` exists, and the helper views in HIDDEN_VIEWS.
 */
export function buildViewReports(rows: ViewColumnRow[]): ReportDefinition[] {
  const views = new Map<string, ViewColumnRow[]>()
  for (const row of rows) {
    views.set(row.view_name, [...(views.get(row.view_name) ?? []), row])
  }

  const result: ReportDefinition[] = []
  for (const [name, columns] of views) {
    const duplicate = views.has(`${name}_v`) || (name.endsWith('_mv') && views.has(name.slice(0, -3)))
    // The name goes into the report id and URL, so keep to plain names
    if (duplicate || HIDDEN_VIEWS.has(name) || !/^[a-z_][a-z0-9_]*$/.test(name)) {
      continue
    }

    const reportColumns: ReportColumn[] = columns.map((column, index) => ({
      key: `c${index + 1}`,
      label: column.column_name,
      format: NUMERIC_TYPES.has(column.data_type) ? 'number' : 'text'
    }))
    const selects = columns.map((column, index) =>
      `${selectExpression(column.column_name, column.data_type)} AS c${index + 1}`)
    const dateColumn = columns.find(column => [DATE, TIMESTAMP, TIMESTAMPTZ].includes(column.data_type))
    const from = `${quoteIdent(VIEW_SCHEMA)}.${quoteIdent(name)}`

    result.push({
      id: `${VIEW_REPORT_PREFIX}${name}`,
      title: humanize(name),
      description: columns[0]?.comment || `Warehouse view ${VIEW_SCHEMA}.${name}.`,
      note: `Listed automatically from ${VIEW_SCHEMA}.${name}. `
        + (dateColumn
          ? `The period filters on "${dateColumn.column_name}"; rows without a value there are not shown.`
          : 'This view has no date column, so there is no period filter.'),
      filters: dateColumn ? [{ key: 'period', type: 'period', label: 'Period' }] : [],
      sql: dateColumn
        ? `SELECT ${selects.join(',\n       ')}\n  FROM ${from}\n WHERE `
        + `${periodCondition(dateColumn.column_name, dateColumn.data_type)}\n`
        + ` ORDER BY ${quoteIdent(dateColumn.column_name)} DESC`
        : `SELECT ${selects.join(',\n       ')}\n  FROM ${from}`,
      columns: reportColumns
    })
  }
  return result
}

let cache: { at: number, reports: ReportDefinition[] } | undefined

/** Reports for the warehouse views, read from the catalog and kept for a few minutes. */
export async function viewReports(): Promise<ReportDefinition[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.reports
  }
  const rows = await warehouseQuery<ViewColumnRow>(CATALOG_SQL, [VIEW_SCHEMA])
  cache = { at: Date.now(), reports: buildViewReports(rows) }
  return cache.reports
}

/** Hand-written reports first, then one per warehouse view. */
export async function allReports(): Promise<ReportDefinition[]> {
  try {
    return [...reports, ...await viewReports()]
  } catch (error) {
    // The home page should still list the hand-written reports when the warehouse is down
    console.error('[reports] could not list warehouse views', error)
    return reports
  }
}

export async function findAnyReport(id: string): Promise<ReportDefinition | undefined> {
  const report = reports.find(report => report.id === id)
  if (report || !id.startsWith(VIEW_REPORT_PREFIX)) {
    return report
  }
  return (await viewReports()).find(report => report.id === id)
}
