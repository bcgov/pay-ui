import { currentFiscalYear, fiscalYearLabel, fiscalYearRange, parseFiscalYear } from '../../../server/utils/fiscalYear'

describe('fiscal year utils', () => {
  it('starts the fiscal year on April 1', () => {
    expect(currentFiscalYear(new Date(2026, 2, 31))).toBe(2025)
    expect(currentFiscalYear(new Date(2026, 3, 1))).toBe(2026)
  })

  it('labels and ranges a fiscal year', () => {
    expect(fiscalYearLabel(2025)).toBe('2025/26')
    expect(fiscalYearLabel(2099)).toBe('2099/00')
    expect(fiscalYearRange(2025)).toEqual({ start: '2025-04-01 07:00:00', end: '2026-04-01 07:00:00' })
  })

  it('parses the fiscal year from user input', () => {
    const today = new Date(2026, 9, 15)
    expect(parseFiscalYear(undefined, today)).toBe(2026)
    expect(parseFiscalYear('2024', today)).toBe(2024)
    expect(() => parseFiscalYear('2027', today)).toThrow()
    expect(() => parseFiscalYear('2018', today)).toThrow()
    expect(() => parseFiscalYear('2024; DROP TABLE', today)).toThrow()
  })
})
