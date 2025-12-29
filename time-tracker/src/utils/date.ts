const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Get the start of the week (Sunday) in UTC
 * Note: Changed from ISO (Monday) to US (Sunday) week start for consistency
 */
export function startOfISOWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0 is Sunday in UTC
  const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  utcDate.setUTCDate(utcDate.getUTCDate() - day) // Go back to Sunday
  return utcDate
}

/**
 * Get the end of the week (Saturday 23:59:59) in UTC
 */
export function endOfISOWeek(date: Date): Date {
  const start = startOfISOWeek(date)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6) // Saturday
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/**
 * Add weeks to a date using UTC
 */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return d
}

/**
 * Get US week number and year for a date (UTC-based)
 * US week numbering: Week 1 contains January 1, weeks start on Sunday
 * This ensures week numbers are consistent regardless of system timezone
 */
export function getISOWeekYear(date: Date): { isoWeek: number; isoYear: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  let year = d.getUTCFullYear()

  // Check if date is in December and might be in next year's week 1
  if (d.getUTCMonth() === 11 && d.getUTCDate() >= 25) {
    const nextJan1 = new Date(Date.UTC(year + 1, 0, 1))
    const nextJan1Day = nextJan1.getUTCDay()

    // Find first Sunday on or before next year's Jan 1
    const nextYearFirstSunday = new Date(nextJan1)
    if (nextJan1Day !== 0) {
      nextYearFirstSunday.setUTCDate(nextJan1.getUTCDate() - nextJan1Day)
    }

    // If current date is on or after next year's week 1 start, use next year
    if (d >= nextYearFirstSunday) {
      return { isoWeek: 1, isoYear: year + 1 }
    }
  }

  // Normal calculation for current year
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const jan1Day = jan1.getUTCDay()

  // Find first Sunday on or before Jan 1 (Week 1 always contains Jan 1)
  const firstSunday = new Date(jan1)
  if (jan1Day !== 0) {
    firstSunday.setUTCDate(jan1.getUTCDate() - jan1Day)
  }

  const daysSinceFirstSunday = Math.floor((d.getTime() - firstSunday.getTime()) / 86400000)
  const weekNumber = Math.floor(daysSinceFirstSunday / 7) + 1

  return { isoWeek: weekNumber, isoYear: year }
}

/**
 * Format a date as a week key (e.g., "2025-W01") using UTC
 */
export function formatWeekKey(date: Date): string {
  const { isoWeek, isoYear } = getISOWeekYear(date)
  const w = String(isoWeek).padStart(2, '0')
  return `${isoYear}-W${w}`
}

/**
 * Format week range label (e.g., "Jan 1 - Jan 7, 2025") using UTC
 */
export function formatWeekRangeLabel(date: Date): string {
  const start = startOfISOWeek(date)
  const end = endOfISOWeek(date)
  const s = `${monthNames[start.getUTCMonth()]} ${start.getUTCDate()}`
  const e = `${monthNames[end.getUTCMonth()]} ${end.getUTCDate()}, ${end.getUTCFullYear()}`
  return `${s} - ${e}`
}

/**
 * Format month and week title using UTC
 */
export function formatMonthWeekTitle(date: Date): string {
  const { isoWeek } = getISOWeekYear(date)
  const month = monthNames[date.getUTCMonth()]
  return `${month}, Week ${isoWeek}`
}

/**
 * Calculate last year's same week key for ghost data
 * @param weekKey - Current week key in format "YYYY-Www" (e.g., "2025-W50")
 * @returns Last year's week key (e.g., "2024-W50")
 */
export function calculateLastYearWeek(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = parseInt(yearStr, 10)
  const week = weekStr
  return `${year - 1}-W${week}`
}

/**
 * Generate array of week keys for a given year range
 * @param year - Year
 * @param startWeek - Starting week number (1-based, inclusive)
 * @param endWeek - Ending week number (1-based, inclusive)
 * @returns Array of week keys (e.g., ["2025-W01", "2025-W02", ...])
 */
export function generateWeekKeysForYear(year: number, startWeek: number, endWeek: number): string[] {
  const keys: string[] = []
  for (let week = startWeek; week <= endWeek; week++) {
    const w = String(week).padStart(2, '0')
    keys.push(`${year}-W${w}`)
  }
  return keys
}

/**
 * Get all week keys from week 1 up to the current week of the current year (UTC)
 * @returns Array of week keys for the current year up to now
 */
export function getCurrentYearWeeks(): string[] {
  const now = new Date()
  const { isoWeek, isoYear } = getISOWeekYear(now)
  return generateWeekKeysForYear(isoYear, 1, isoWeek)
}

/**
 * Get all week keys between two dates (inclusive) using UTC
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of week keys in the range
 */
export function getWeeksInRange(startDate: Date, endDate: Date): string[] {
  const keys: string[] = []
  const current = new Date(startOfISOWeek(startDate))
  const end = startOfISOWeek(endDate)

  while (current <= end) {
    keys.push(formatWeekKey(current))
    current.setUTCDate(current.getUTCDate() + 7)
  }

  return keys
}
