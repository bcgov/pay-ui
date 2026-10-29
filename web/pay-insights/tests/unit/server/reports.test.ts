import { reports } from '../../../server/reports'
import type { ReportFilter } from '../../../server/reports/types'
import {
  columnTotals,
  normalizeRows,
  ReportInputError,
  resolveFilter,
  toCsv,
  toPositionalSql,
  totalsSql
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
    const { sqlValues } = resolveFilter(fiscalYear, { fiscalYear: '2024' }, [], today)
    expect(sqlValues).toEqual({
      fiscalYear: 2024,
      fiscalYearStart: '2024-04-01 07:00:00',
      fiscalYearEnd: '2025-04-01 07:00:00'
    })
    expect(() => resolveFilter(fiscalYear, { fiscalYear: '2030' }, [], today)).toThrow(ReportInputError)
  })

  it('only accepts listed select values', () => {
    expect(resolveFilter(select, { method: 'PAD' }, options).sqlValues).toEqual({ method: 'PAD' })
    expect(resolveFilter(select, {}, options).sqlValues).toEqual({ method: null })
    expect(() => resolveFilter(select, { method: "PAD' OR 1=1" }, options)).toThrow(ReportInputError)
  })

  it('requires a select without an "all" option', () => {
    expect(() => resolveFilter({ ...select, allLabel: undefined }, {}, options)).toThrow(ReportInputError)
  })

  describe('period', () => {
    const period: ReportFilter = { key: 'period', type: 'period', label: 'Period' }

    it('defaults to the current fiscal year', () => {
      const { resolved, sqlValues } = resolveFilter(period, {}, [], today)
      expect(resolved).toMatchObject({ value: 'FY2026', from: '2026-04-01', to: '2027-03-31' })
      expect(sqlValues).toEqual({ periodStart: '2026-04-01 07:00:00', periodEnd: '2027-04-01 07:00:00' })
    })

    it('accepts a fiscal year', () => {
      expect(resolveFilter(period, { period: 'FY2024' }, [], today).sqlValues)
        .toEqual({ periodStart: '2024-04-01 07:00:00', periodEnd: '2025-04-01 07:00:00' })
    })

    it('accepts a custom range in Pacific time, end date included', () => {
      const { sqlValues } = resolveFilter(
        period, { period: 'custom', periodFrom: '2025-01-15', periodTo: '2025-06-30' }, [], today
      )
      // January is standard time (UTC-8), July is daylight time (UTC-7)
      expect(sqlValues).toEqual({ periodStart: '2025-01-15 08:00:00', periodEnd: '2025-07-01 07:00:00' })
    })

    it('rejects invalid periods', () => {
      const invalid = [
        { period: 'FY2030' },
        { period: '2024' },
        { period: 'custom' },
        { period: 'custom', periodFrom: '2025-06-30', periodTo: '2025-01-01' },
        { period: 'custom', periodFrom: '2025-02-30', periodTo: '2025-03-01' },
        { period: 'custom', periodFrom: '2010-01-01', periodTo: '2010-02-01' }
      ]
      for (const query of invalid) {
        expect(() => resolveFilter(period, query, [], today)).toThrow(ReportInputError)
      }
    })
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

describe('totalsSql', () => {
  it('totals the whole result of the report SQL', () => {
    expect(totalsSql('SELECT product, fees FROM t WHERE a = :a', columns)).toBe(
      'SELECT COUNT(*)::int AS "__rowCount", COALESCE(SUM("fees"), 0) AS "fees"\n'
      + 'FROM (\nSELECT product, fees FROM t WHERE a = :a\n) AS report_rows'
    )
  })

  it('rejects unsafe column keys', () => {
    expect(() => totalsSql('SELECT 1', [{ key: 'x"; DROP', label: 'X', total: true }])).toThrow()
  })
})

describe('report definitions', () => {
  it('have unique ids and only use parameters their filters provide', () => {
    expect(new Set(reports.map(report => report.id)).size).toBe(reports.length)
    for (const report of reports) {
      const values: Record<string, unknown> = {}
      for (const filter of report.filters) {
        values[filter.key] = null
        if (filter.type === 'fiscalYear' || filter.type === 'period') {
          values[`${filter.key}Start`] = null
          values[`${filter.key}End`] = null
        }
      }
      expect(() => toPositionalSql(report.sql, values)).not.toThrow()
      expect(() => toPositionalSql(totalsSql(report.sql, report.columns), values)).not.toThrow()
    }
  })
})
