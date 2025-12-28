import { describe, it, expect } from 'vitest'
import { startOfISOWeek, endOfISOWeek, getISOWeekYear, formatWeekKey } from './date'

// Helper to format date as local YYYY-MM-DD
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('ISO Week Date Functions', () => {
  describe('startOfISOWeek', () => {
    it('should return Monday for a date in the middle of the week', () => {
      const date = new Date(2024, 11, 26) // Thursday, Dec 26, 2024 (month is 0-indexed)
      const result = startOfISOWeek(date)
      expect(result.getDay()).toBe(1) // Monday
      expect(formatLocalDate(result)).toBe('2024-12-23')
    })

    it('should return the same Monday when given a Monday', () => {
      const date = new Date(2024, 11, 23) // Monday, Dec 23, 2024
      const result = startOfISOWeek(date)
      expect(result.getDay()).toBe(1) // Monday
      expect(formatLocalDate(result)).toBe('2024-12-23')
    })

    it('should return the previous Monday for Sunday', () => {
      const date = new Date(2024, 11, 29) // Sunday, Dec 29, 2024
      const result = startOfISOWeek(date)
      expect(result.getDay()).toBe(1) // Monday
      expect(formatLocalDate(result)).toBe('2024-12-23')
    })

    it('should handle year boundary correctly (Dec 29, 2024)', () => {
      // Dec 29, 2024 is a Sunday in the week starting Dec 23, 2024 (Monday)
      const date = new Date(2024, 11, 29)
      const result = startOfISOWeek(date)
      expect(formatLocalDate(result)).toBe('2024-12-23')
    })

    it('should handle New Year correctly (Jan 1, 2025)', () => {
      // Jan 1, 2025 is a Wednesday in the week starting Dec 30, 2024 (Monday)
      const date = new Date(2025, 0, 1)
      const result = startOfISOWeek(date)
      expect(formatLocalDate(result)).toBe('2024-12-30')
    })

    it('should set time to midnight', () => {
      const date = new Date('2024-12-26T15:30:00')
      const result = startOfISOWeek(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })
  })

  describe('endOfISOWeek', () => {
    it('should return Sunday at end of day', () => {
      const date = new Date(2024, 11, 26) // Thursday, Dec 26, 2024
      const result = endOfISOWeek(date)
      expect(result.getDay()).toBe(0) // Sunday
      expect(formatLocalDate(result)).toBe('2024-12-29')
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
    })
  })

  describe('getISOWeekYear and formatWeekKey consistency', () => {
    it('should calculate 2024-W52 for Dec 29, 2024 (Sunday)', () => {
      const date = new Date(2024, 11, 29)
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2024)
      expect(isoWeek).toBe(52)
      expect(formatWeekKey(date)).toBe('2024-W52')
    })

    it('should calculate 2025-W01 for Dec 30, 2024 (Monday)', () => {
      const date = new Date(2024, 11, 30)
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(1)
      expect(formatWeekKey(date)).toBe('2025-W01')
    })

    it('should calculate 2025-W01 for Jan 1, 2025 (Wednesday)', () => {
      const date = new Date(2025, 0, 1)
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(1)
      expect(formatWeekKey(date)).toBe('2025-W01')
    })

    it('startOfISOWeek and getISOWeekYear should be consistent', () => {
      // For any date, startOfISOWeek should return a date in the same ISO week
      const testDates = [
        [2024, 11, 29], // Sunday in W52
        [2024, 11, 30], // Monday in W01-2025
        [2025, 0, 1],   // Wednesday in W01-2025
        [2025, 0, 6],   // Monday in W02-2025
      ]

      testDates.forEach(([year, month, day]) => {
        const date = new Date(year, month, day)
        const weekStart = startOfISOWeek(date)

        const originalWeek = formatWeekKey(date)
        const weekStartWeek = formatWeekKey(weekStart)

        expect(weekStartWeek).toBe(originalWeek)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle leap year (2024)', () => {
      const date = new Date(2024, 1, 29) // Feb 29, 2024
      const result = startOfISOWeek(date)
      expect(result.getDay()).toBe(1) // Should be Monday
    })

    it('should handle week 53 in years that have it', () => {
      // 2020 had 53 ISO weeks
      const date = new Date(2020, 11, 31) // Thursday, Dec 31, 2020
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2020)
      expect(isoWeek).toBe(53)
    })
  })
})
