/** BC government fiscal year: April 1 to March 31. Identified by its starting year (2025 = 2025/26). */
export const FIRST_FISCAL_YEAR = 2019

export function currentFiscalYear(today = new Date()): number {
  // getMonth() is 0-based: 3 = April
  return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
}

export function fiscalYearLabel(year: number): string {
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`
}

/**
 * Start and end (exclusive) as UTC timestamps, matching how PAY stores dates.
 * The fiscal year starts at midnight Pacific on April 1, which is always daylight
 * time (UTC-7), so both boundaries are 07:00 UTC.
 */
export function fiscalYearRange(year: number): { start: string, end: string } {
  return { start: `${year}-04-01 07:00:00`, end: `${year + 1}-04-01 07:00:00` }
}

/** Fiscal year as inclusive Pacific dates, e.g. 2025-04-01 to 2026-03-31. */
export function fiscalYearDates(year: number): { from: string, to: string } {
  return { from: `${year}-04-01`, to: `${year + 1}-03-31` }
}

/** Returns a valid fiscal year from user input, or the current one if missing. Throws on invalid input. */
export function parseFiscalYear(value: unknown, today = new Date()): number {
  const current = currentFiscalYear(today)
  if (value === undefined || value === '') {
    return current
  }
  const year = Number(value)
  if (!Number.isInteger(year) || year < FIRST_FISCAL_YEAR || year > current) {
    throw new Error(`Invalid fiscal year: ${String(value)}`)
  }
  return year
}
