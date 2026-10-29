import { addDays, pacificMidnightAsUtc, parseIsoDate } from '../../../server/utils/dates'

describe('date utils', () => {
  it('parses only real YYYY-MM-DD dates', () => {
    expect(parseIsoDate('2025-02-28')).toBe('2025-02-28')
    expect(parseIsoDate('2024-02-29')).toBe('2024-02-29')
    expect(parseIsoDate('2025-02-29')).toBeUndefined()
    expect(parseIsoDate('2025-2-1')).toBeUndefined()
    expect(parseIsoDate(undefined)).toBeUndefined()
  })

  it('adds days across months and years', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28')
  })

  it('converts Pacific midnight to UTC, including daylight time changes', () => {
    expect(pacificMidnightAsUtc('2025-01-15')).toBe('2025-01-15 08:00:00')
    expect(pacificMidnightAsUtc('2025-07-01')).toBe('2025-07-01 07:00:00')
    // Daylight time starts at 2am on March 9, 2025, so midnight is still standard time
    expect(pacificMidnightAsUtc('2025-03-09')).toBe('2025-03-09 08:00:00')
    expect(pacificMidnightAsUtc('2025-03-10')).toBe('2025-03-10 07:00:00')
    // Standard time returns at 2am on November 2, 2025
    expect(pacificMidnightAsUtc('2025-11-02')).toBe('2025-11-02 07:00:00')
    expect(pacificMidnightAsUtc('2025-11-03')).toBe('2025-11-03 08:00:00')
  })
})
