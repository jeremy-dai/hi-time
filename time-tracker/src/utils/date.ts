const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function startOfISOWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 is Sunday
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfISOWeek(date: Date): Date {
  const start = startOfISOWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function getISOWeekYear(date: Date): { isoWeek: number; isoYear: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const isoYear = d.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  return { isoWeek: week, isoYear }
}

export function formatWeekKey(date: Date): string {
  const { isoWeek, isoYear } = getISOWeekYear(date)
  const w = String(isoWeek).padStart(2, '0')
  return `${isoYear}-W${w}`
}

export function formatWeekRangeLabel(date: Date): string {
  const start = startOfISOWeek(date)
  const end = endOfISOWeek(date)
  const s = `${monthNames[start.getMonth()]} ${start.getDate()}`
  const e = `${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
  return `${s} - ${e}`
}

export function formatMonthWeekTitle(date: Date): string {
  const { isoWeek } = getISOWeekYear(date)
  const month = monthNames[date.getMonth()]
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
 * @param year - ISO year
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
 * Get all week keys from week 1 up to the current week of the current year
 * @returns Array of week keys for the current year up to now
 */
export function getCurrentYearWeeks(): string[] {
  const now = new Date()
  const { isoWeek, isoYear } = getISOWeekYear(now)
  return generateWeekKeysForYear(isoYear, 1, isoWeek)
}

/**
 * Get all week keys between two dates (inclusive)
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
    current.setDate(current.getDate() + 7)
  }

  return keys
}
