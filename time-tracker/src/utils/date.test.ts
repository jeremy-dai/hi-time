import { describe, it, expect } from 'vitest'
import { startOfISOWeek, endOfISOWeek, getISOWeekYear, formatWeekKey } from './date'

// Helper to format date as UTC YYYY-MM-DD
function formatUTCDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('US Week Date Functions (UTC, Sunday-based)', () => {
  describe('startOfISOWeek', () => {
    it('should return Sunday for a date in the middle of the week', () => {
      const date = new Date(Date.UTC(2024, 11, 26, 12)) // Thursday, Dec 26, 2024
      const result = startOfISOWeek(date)
      expect(result.getUTCDay()).toBe(0) // Sunday
      expect(formatUTCDate(result)).toBe('2024-12-22')
    })

    it('should return the same Sunday when given a Sunday', () => {
      const date = new Date(Date.UTC(2024, 11, 22, 12)) // Sunday, Dec 22, 2024
      const result = startOfISOWeek(date)
      expect(result.getUTCDay()).toBe(0) // Sunday
      expect(formatUTCDate(result)).toBe('2024-12-22')
    })

    it('should return the same Sunday for Saturday', () => {
      const date = new Date(Date.UTC(2024, 11, 28, 12)) // Saturday, Dec 28, 2024
      const result = startOfISOWeek(date)
      expect(result.getUTCDay()).toBe(0) // Sunday
      expect(formatUTCDate(result)).toBe('2024-12-22')
    })

    it('should handle year boundary correctly (Dec 29, 2024)', () => {
      // Dec 29, 2024 is a Sunday - should start a new week
      const date = new Date(Date.UTC(2024, 11, 29, 12))
      const result = startOfISOWeek(date)
      expect(formatUTCDate(result)).toBe('2024-12-29')
    })

    it('should handle New Year correctly (Jan 1, 2025)', () => {
      // Jan 1, 2025 is a Wednesday - week started Dec 29, 2024 (Sunday)
      const date = new Date(Date.UTC(2025, 0, 1, 12))
      const result = startOfISOWeek(date)
      expect(formatUTCDate(result)).toBe('2024-12-29')
    })
  })

  describe('endOfISOWeek', () => {
    it('should return Saturday at end of day', () => {
      const date = new Date(Date.UTC(2024, 11, 26, 12)) // Thursday, Dec 26, 2024
      const result = endOfISOWeek(date)
      expect(result.getUTCDay()).toBe(6) // Saturday
      expect(formatUTCDate(result)).toBe('2024-12-28')
      expect(result.getUTCHours()).toBe(23)
      expect(result.getUTCMinutes()).toBe(59)
      expect(result.getUTCSeconds()).toBe(59)
      expect(result.getUTCMilliseconds()).toBe(999)
    })
  })

  describe('getISOWeekYear and formatWeekKey consistency', () => {
    it('should calculate 2025-W01 for Dec 29, 2024 (Sunday)', () => {
      // Dec 29, 2024 is the first Sunday before Jan 1, 2025
      // So it's in week 1 of 2025 (week 1 contains Jan 1)
      const date = new Date(Date.UTC(2024, 11, 29, 12))
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(1)
      expect(formatWeekKey(date)).toBe('2025-W01')
    })

    it('should calculate 2025-W01 for Dec 30, 2024 (Monday)', () => {
      // Dec 30 is in the same week as Dec 29 and Jan 1
      const date = new Date(Date.UTC(2024, 11, 30, 12))
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(1)
      expect(formatWeekKey(date)).toBe('2025-W01')
    })

    it('should calculate 2025-W02 for Jan 5, 2025 (Sunday)', () => {
      // Jan 1 is Wed, so week 1 is Dec 29 - Jan 4
      // Jan 5 (Sunday) starts week 2
      const date = new Date(Date.UTC(2025, 0, 5, 12))
      const { isoWeek, isoYear } = getISOWeekYear(date)
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(2)
      expect(formatWeekKey(date)).toBe('2025-W02')
    })

    it('startOfISOWeek and getISOWeekYear should be consistent', () => {
      // For any date, startOfISOWeek should return a date in the same week
      const testDates = [
        [2024, 11, 29], // Sunday in W01-2025 (week 1 contains Jan 1)
        [2024, 11, 30], // Monday in W01-2025
        [2025, 0, 1],   // Wednesday in W01-2025
        [2025, 0, 5],   // Sunday in W02-2025
      ]

      testDates.forEach(([year, month, day]) => {
        const date = new Date(Date.UTC(year, month, day, 12))
        const weekStart = startOfISOWeek(date)

        const originalWeek = formatWeekKey(date)
        const weekStartWeek = formatWeekKey(weekStart)

        expect(weekStartWeek).toBe(originalWeek)
      })
    })
  })

  describe('US Week Numbering Rules', () => {
    it('should have week 1 contain January 1', () => {
      // Jan 1, 2025 is a Wednesday
      const jan1 = new Date(Date.UTC(2025, 0, 1, 12))
      const { isoWeek, isoYear } = getISOWeekYear(jan1)

      // Week containing Jan 1 should be week 1
      expect(isoYear).toBe(2025)
      expect(isoWeek).toBe(1) // Not week 53 of 2024!
    })

    it('should handle year with 53 weeks (2023)', () => {
      // 2023: Jan 1 is Sunday, year has 53 weeks
      // Dec 30, 2023 (Saturday) is last day of week 52
      const dec30 = new Date(Date.UTC(2023, 11, 30, 12))
      const { isoWeek, isoYear } = getISOWeekYear(dec30)
      expect(isoYear).toBe(2023)
      expect(isoWeek).toBe(52)

      // Dec 31, 2023 (Sunday) starts week 1 of 2024
      const dec31 = new Date(Date.UTC(2023, 11, 31, 12))
      const week2 = getISOWeekYear(dec31)
      expect(week2.isoYear).toBe(2024)
      expect(week2.isoWeek).toBe(1)
    })
  })

  describe('Timezone Independence', () => {
    it('should return same week number regardless of system timezone', () => {
      // This test ensures UTC consistency
      const date1 = new Date(Date.UTC(2025, 11, 29, 0)) // Midnight UTC
      const date2 = new Date(Date.UTC(2025, 11, 29, 12)) // Noon UTC
      const date3 = new Date(Date.UTC(2025, 11, 29, 23)) // End of day UTC

      const week1 = getISOWeekYear(date1)
      const week2 = getISOWeekYear(date2)
      const week3 = getISOWeekYear(date3)

      expect(week1.isoWeek).toBe(week2.isoWeek)
      expect(week2.isoWeek).toBe(week3.isoWeek)
      expect(week1.isoYear).toBe(week2.isoYear)
      expect(week2.isoYear).toBe(week3.isoYear)
    })
  })

  describe('Edge cases', () => {
    it('should handle leap year (2024)', () => {
      const date = new Date(Date.UTC(2024, 1, 29, 12)) // Feb 29, 2024
      const result = startOfISOWeek(date)
      expect(result.getUTCDay()).toBe(0) // Should be Sunday
    })

    it('should handle year boundary dates', () => {
      // Dec 28, 2024 is Saturday (last day of 2024 before new week)
      const dec28 = new Date(Date.UTC(2024, 11, 28, 12))
      const { isoWeek: week1, isoYear: year1 } = getISOWeekYear(dec28)
      expect(year1).toBe(2024)
      expect(week1).toBe(52) // Last week of 2024

      // Dec 29, 2024 is Sunday (first day of week 1 of 2025)
      const dec29 = new Date(Date.UTC(2024, 11, 29, 12))
      const { isoWeek: week2, isoYear: year2 } = getISOWeekYear(dec29)
      expect(year2).toBe(2025)
      expect(week2).toBe(1) // First week of 2025
    })
  })
})
