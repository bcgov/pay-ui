const PACIFIC_HOUR = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Vancouver',
  hour: '2-digit',
  hourCycle: 'h23'
})

/** Parses a `YYYY-MM-DD` date, or returns undefined if it isn't a real date. */
export function parseIsoDate(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value : ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) {
    return undefined
  }
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return valid ? text : undefined
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/**
 * Midnight Pacific on the given date, as a UTC timestamp (how PAY stores dates).
 * Pacific midnight is 08:00 UTC in standard time and 07:00 UTC in daylight time.
 */
export function pacificMidnightAsUtc(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const standardTimeGuess = new Date(Date.UTC(year, month - 1, day, 8))
  const isDaylightTime = PACIFIC_HOUR.format(standardTimeGuess) === '01'
  return `${date} ${isDaylightTime ? '07' : '08'}:00:00`
}
