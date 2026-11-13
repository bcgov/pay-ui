import { toPositionalSql } from '../../../server/utils/reports'
import { buildViewReports, parseViewList } from '../../../server/utils/viewReports'
import type { ViewColumnRow } from '../../../server/utils/viewReports'

function view(name: string, columns: [string, string][], comment: string | null = null): ViewColumnRow[] {
  return columns.map(([column_name, data_type]) => ({ view_name: name, comment, column_name, data_type }))
}

describe('buildViewReports', () => {
  it('builds a report with a period filter on the first date column', () => {
    const [report] = buildViewReports(view('cfs_test', [
      ['Line "No"', 'integer'],
      ['Created On', 'timestamp without time zone'],
      ['Note', 'text']
    ], 'Journal lines'))

    expect(report).toMatchObject({
      id: 'view-cfs_test',
      title: 'Cfs test',
      description: 'Journal lines'
    })
    expect(report?.filters).toEqual([{ key: 'period', type: 'period', label: 'Period' }])
    expect(report?.columns).toEqual([
      { key: 'c1', label: 'Line "No"', format: 'number' },
      { key: 'c2', label: 'Created On', format: 'text' },
      { key: 'c3', label: 'Note', format: 'text' }
    ])
    expect(report?.sql).toContain('"Line ""No""" AS c1')
    expect(report?.sql).toContain('FROM "views"."cfs_test"')

    const { text, params } = toPositionalSql(report?.sql ?? '', { periodStart: 'a', periodEnd: 'b' })
    expect(text).toContain('"Created On" >= $1::timestamp AND "Created On" < $2::timestamp')
    expect(params).toEqual(['a', 'b'])
  })

  it('compares date columns with Pacific dates and has no filter without a date column', () => {
    const [dated, plain] = buildViewReports([
      ...view('daily', [['day', 'date']]),
      ...view('plain', [['name', 'text']])
    ])
    expect(dated?.sql).toContain(
      '"day" >= ((:periodStart::timestamp AT TIME ZONE \'UTC\') AT TIME ZONE \'America/Vancouver\')::date'
    )
    expect(plain?.filters).toEqual([])
    expect(plain?.sql).not.toContain('WHERE')
  })

  it('leaves out duplicates and odd names', () => {
    const reports = buildViewReports([
      ...view('summary', [['a', 'text']]),
      ...view('summary_v', [['a', 'text']]),
      ...view('stats', [['a', 'text']]),
      ...view('stats_mv', [['a', 'text']]),
      ...view('Odd Name', [['a', 'text']])
    ])
    expect(reports.map(report => report.id)).toEqual(['view-summary_v', 'view-stats'])
  })
})

describe('parseViewList', () => {
  it('splits a comma-separated list and ignores blanks', () => {
    expect(parseViewList(' summary_v, details_ar_v ,,')).toEqual(['summary_v', 'details_ar_v'])
    expect(parseViewList('')).toEqual([])
    expect(parseViewList(undefined)).toEqual([])
  })
})
