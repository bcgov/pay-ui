import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
})
