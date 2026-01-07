import { DateTime } from 'luxon'
import { CalendarDate } from '@internationalized/date'

describe('Date Utils', () => {
  const fakeCurrentDate = '2025-09-26T10:00:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(fakeCurrentDate))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('luxonToCalendarDate', () => {
    it('should correctly convert a DateTime to a CalendarDate', () => {
      const luxonDate = DateTime.fromISO('2025-12-25')
      const calendarDate = luxonToCalendarDate(luxonDate)

      expect(calendarDate).toBeInstanceOf(CalendarDate)
      expect(calendarDate.year).toBe(2025)
      expect(calendarDate.month).toBe(12)
      expect(calendarDate.day).toBe(25)
    })
  })

  describe('getToday', () => {
    it('should return the current date as a DateTime object', () => {
      const today = getToday()

      expect(today.year).toBe(2025)
      expect(today.month).toBe(9)
      expect(today.day).toBe(26)
      expect(today.zone.name).toBe('America/Vancouver')
    })

    it('should throw an error for an invalid timezone', () => {
      expect(() => getToday('Invalid/Timezone')).toThrow(/Invalid timezone/)
    })
  })

  describe('getTodayRange', () => {
    it('should return start/end as today', () => {
      const { start, end } = getTodayRange()

      expect(start).toBeInstanceOf(CalendarDate)
      expect(end).toBeInstanceOf(CalendarDate)
      expect(start.toString()).toBe('2025-09-26')
      expect(end.toString()).toBe('2025-09-26')
    })
  })

  describe('getYesterdayRange', () => {
    it('should return start/end as yesterday', () => {
      const { start, end } = getYesterdayRange()

      expect(start).toBeInstanceOf(CalendarDate)
      expect(end).toBeInstanceOf(CalendarDate)
      expect(start.toString()).toBe('2025-09-25')
      expect(end.toString()).toBe('2025-09-25')
    })
  })

  describe('getLastWeekRange', () => {
    it('should return start/end as previous week mon-sun', () => {
      const { start, end } = getLastWeekRange()

      expect(start).toBeInstanceOf(CalendarDate)
      expect(end).toBeInstanceOf(CalendarDate)
      expect(start.toString()).toBe('2025-09-15')
      expect(end.toString()).toBe('2025-09-21')
    })
  })

  describe('getLastMonthRange', () => {
    it('should return start/end as previous month 1st-last', () => {
      const { start, end } = getLastMonthRange()

      expect(start).toBeInstanceOf(CalendarDate)
      expect(end).toBeInstanceOf(CalendarDate)
      expect(start.toString()).toBe('2025-08-01')
      expect(end.toString()).toBe('2025-08-31')
    })
  })

  describe('luxonToCalendarDate - edge cases', () => {
    it('should handle leap year, year boundary, and year start dates', () => {
      const leapYearDate = DateTime.fromISO('2024-02-29')
      const leapCalendarDate = luxonToCalendarDate(leapYearDate)
      expect(leapCalendarDate.year).toBe(2024)
      expect(leapCalendarDate.month).toBe(2)
      expect(leapCalendarDate.day).toBe(29)

      const yearEndDate = DateTime.fromISO('2025-12-31')
      const yearEndCalendarDate = luxonToCalendarDate(yearEndDate)
      expect(yearEndCalendarDate.year).toBe(2025)
      expect(yearEndCalendarDate.month).toBe(12)
      expect(yearEndCalendarDate.day).toBe(31)

      const yearStartDate = DateTime.fromISO('2025-01-01')
      const yearStartCalendarDate = luxonToCalendarDate(yearStartDate)
      expect(yearStartCalendarDate.year).toBe(2025)
      expect(yearStartCalendarDate.month).toBe(1)
      expect(yearStartCalendarDate.day).toBe(1)
    })
  })

  describe('getToday - edge cases', () => {
    it('should handle different timezones and throw error for invalid timezone', () => {
      const utcToday = getToday('UTC')
      expect(utcToday.zone.name).toBe('UTC')

      const vancouverToday = getToday('America/Vancouver')
      expect(vancouverToday.zone.name).toBe('America/Vancouver')

      expect(() => getToday('Invalid/Zone')).toThrow(/Invalid timezone/)
    })
  })

  describe('getLastWeekRange and getLastMonthRange - edge cases', () => {
    it('should return valid date range for previous week', () => {
      const { start, end } = getLastWeekRange()
      expect(start).toBeInstanceOf(CalendarDate)
      expect(end).toBeInstanceOf(CalendarDate)
      expect(start.toString() < end.toString() || start.toString() === end.toString()).toBe(true)
    })

    it('should handle months with different day counts and January correctly', () => {
      vi.setSystemTime(new Date('2025-03-15T10:00:00.000Z'))
      const { start: febStart, end: febEnd } = getLastMonthRange()
      expect(febStart.toString()).toBe('2025-02-01')
      expect(febEnd.toString()).toBe('2025-02-28')

      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'))
      const { start: decStart, end: decEnd } = getLastMonthRange()
      expect(decStart.toString()).toBe('2024-12-01')
      expect(decEnd.toString()).toBe('2024-12-31')
    })
  })
})
