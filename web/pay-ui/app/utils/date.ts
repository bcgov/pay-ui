import { CalendarDate } from '@internationalized/date'
import { DateTime } from 'luxon'

export function luxonToCalendarDate(date: DateTime): CalendarDate {
  return new CalendarDate(date.year, date.month, date.day)
}

export function getToday(timezone = 'America/Vancouver'): DateTime {
  const dt = DateTime.now().setZone(timezone)

  // dt will return null if an invalid timezone was provided
  if (!dt.isValid) {
    throw new Error(`Invalid timezone: "${timezone}". Reason: ${dt.invalidReason}`)
  }

  return dt
}

export function getTodayRange(): { start: CalendarDate, end: CalendarDate } {
  const now = getToday()
  return {
    start: luxonToCalendarDate(now),
    end: luxonToCalendarDate(now)
  }
}

export function getYesterdayRange(): { start: CalendarDate, end: CalendarDate } {
  const yesterday = getToday().minus({ days: 1 })
  return {
    start: luxonToCalendarDate(yesterday),
    end: luxonToCalendarDate(yesterday)
  }
}

export function getLastWeekRange(): { start: CalendarDate, end: CalendarDate } {
  const now = getToday()
  const weekStart = now.minus({ weeks: 1 }).startOf('week')
  const weekEnd = now.minus({ weeks: 1 }).endOf('week')

  return {
    start: luxonToCalendarDate(weekStart),
    end: luxonToCalendarDate(weekEnd)
  }
}

export function getLastMonthRange(): { start: CalendarDate, end: CalendarDate } {
  const now = getToday()
  const monthStart = now.minus({ months: 1 }).startOf('month')
  const monthEnd = now.minus({ months: 1 }).endOf('month')

  return {
    start: luxonToCalendarDate(monthStart),
    end: luxonToCalendarDate(monthEnd)
  }
}
