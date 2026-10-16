import { reports } from '../../../server/reports'
import type { ReportFilter } from '../../../server/reports/types'
import {
  columnTotals,
  normalizeRows,
  ReportInputError,
  resolveFilter,
  toCsv,
  toPositionalSql
} from '../../../server/utils/reports'

const today = new Date(2026, 9, 15)
const columns = [
  { key: 'product', label: 'Product' },
  { key: 'fees', label: 'Fees', format: 'currency' as const, total: true }
]

describe('toPositionalSql', () => {
  it('turns named parameters into positional ones and keeps casts', () => {
    const { text, params } = toPositionalSql(
      'WHERE a >= :start::timestamp AND (:method::text IS NULL OR m = :method::text)',
      { start: '2025-04-01 07:00:00', method: 'PAD' }
    )
    expect(text).toBe('WHERE a >= $1::timestamp AND ($2::text IS NULL OR m = $2::text)')
    expect(params).toEqual(['2025-04-01 07:00:00', 'PAD'])
  })

  it('fails when a parameter has no value', () => {
    expect(() => toPositionalSql('WHERE a = :missing', {})).toThrow()
  })
})

describe('resolveFilter', () => {
  const select: ReportFilter = { key: 'method', type: 'select', label: 'Method', optionsSql: '', allLabel: 'All' }
  const options = [{ value: 'PAD', label: 'Pre-authorized debit' }]

  it('provides fiscal year boundaries', () => {
    const fiscalYear: ReportFilter = { key: 'fiscalYear', type: 'fiscalYear', label: 'Fiscal year' }
    const { sqlValues } = resolveFilter(fiscalYear, '2024', [], today)
    expect(sqlValues).toEqual({
      fiscalYear: 2024,
      fiscalYearStart: '2024-04-01 07:00:00',
      fiscalYearEnd: '2025-04-01 07:00:00'
    })
    expect(() => resolveFilter(fiscalYear, '2030', [], today)).toThrow(ReportInputError)
  })

  it('only accepts listed select values', () => {
    expect(resolveFilter(select, 'PAD', options).sqlValues).toEqual({ method: 'PAD' })
    expect(resolveFilter(select, undefined, options).sqlValues).toEqual({ method: null })
    expect(() => resolveFilter(select, "PAD' OR 1=1", options)).toThrow(ReportInputError)
  })

  it('requires a select without an "all" option', () => {
    expect(() => resolveFilter({ ...select, allLabel: undefined }, undefined, options)).toThrow(ReportInputError)
  })
})

describe('rows, totals and CSV', () => {
  const rows = normalizeRows([
    { product: 'A, Inc', fees: '10.50', extra: 'x' },
    { product: '=CMD()', fees: '2' }
  ], columns)

  it('converts numeric columns and drops unknown ones', () => {
    expect(rows).toEqual([{ product: 'A, Inc', fees: 10.5 }, { product: '=CMD()', fees: 2 }])
    expect(columnTotals(rows, columns)).toEqual({ fees: 12.5 })
  })

  it('escapes CSV values and blocks formulas', () => {
    expect(toCsv(rows, columns)).toBe('Product,Fees\r\n"A, Inc",10.5\r\n\'=CMD(),2\r\n')
  })
})

describe('report definitions', () => {
  it('have unique ids and only use parameters their filters provide', () => {
    expect(new Set(reports.map(report => report.id)).size).toBe(reports.length)
    for (const report of reports) {
      const values: Record<string, unknown> = {}
      for (const filter of report.filters) {
        values[filter.key] = null
        if (filter.type === 'fiscalYear') {
          values[`${filter.key}Start`] = null
          values[`${filter.key}End`] = null
        }
      }
      expect(() => toPositionalSql(report.sql, values)).not.toThrow()
    }
  })
})
