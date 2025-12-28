import type { TimeBlock } from '../types/time'

export interface WeekStats {
  totalHours: number
  categoryHours: Record<string, number>
  dailyHours: number[]
  dailyByCategory: Record<number, Record<string, number>>
}

export function aggregateWeekData(weekData: TimeBlock[][]): WeekStats {
  const categoryHours: Record<string, number> = {}
  const dailyHours: number[] = Array(7).fill(0)
  const dailyByCategory: Record<number, Record<string, number>> = {}

  for (let d = 0; d < 7; d++) {
    dailyByCategory[d] = {}
    const dayBlocks = weekData[d] || []
    for (const b of dayBlocks) {
      if (!b) continue
      if (b.category) {
        categoryHours[b.category] = (categoryHours[b.category] || 0) + 0.5
        dailyHours[d] += 0.5
        dailyByCategory[d][b.category] = (dailyByCategory[d][b.category] || 0) + 0.5
      }
    }
  }

  const totalHours = Object.values(categoryHours).reduce((a, b) => a + b, 0)
  return { totalHours, categoryHours, dailyHours, dailyByCategory }
}

export interface AnnualStats {
  weeklyTotals: Array<{ weekKey: string; hours: number }>
  monthlyTotals: Array<{ monthKey: string; hours: number }>
}

export function aggregateAnnualData(weeksStore: Record<string, TimeBlock[][]>): AnnualStats {
  const weeklyTotals: Array<{ weekKey: string; hours: number }> = []
  const monthlyMap: Record<string, number> = {}
  Object.keys(weeksStore).forEach(weekKey => {
    const stats = aggregateWeekData(weeksStore[weekKey])
    weeklyTotals.push({ weekKey, hours: stats.totalHours })
    const [yearStr, weekStr] = weekKey.split('-W')
    const year = Number(yearStr)
    const week = Number(weekStr)
    const approxDate = isoWeekToDate(year, week)
    const monthKey = `${approxDate.getFullYear()}-${String(approxDate.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + stats.totalHours
  })
  const monthlyTotals = Object.keys(monthlyMap).sort().map(k => ({ monthKey: k, hours: monthlyMap[k] }))
  return { weeklyTotals, monthlyTotals }
}

function isoWeekToDate(isoYear: number, isoWeek: number): Date {
  const simple = new Date(isoYear, 0, 1 + (isoWeek - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = new Date(simple)
  const diff = (dow <= 4 ? 1 : 8) - dow
  ISOweekStart.setDate(simple.getDate() + diff)
  return ISOweekStart
}

// New interfaces for enhanced analytics

export interface MultiWeekStats {
  weeks: Array<{
    weekKey: string
    stats: WeekStats
  }>
  totalHours: number
  categoryTotals: Record<string, number>
  averagePerWeek: number
}

export interface YTDStats {
  year: number
  totalHours: number
  totalWeeks: number
  averagePerWeek: number
  highestWeek: { weekKey: string; hours: number } | null
  lowestWeek: { weekKey: string; hours: number } | null
  categoryTotals: Record<string, number>
  categoryAverages: Record<string, number>
  weeklyData: Array<{
    weekKey: string
    hours: number
    categoryHours: Record<string, number>
  }>
  streakMetrics: {
    currentStreak: number
    longestStreak: number
    productiveDays: number
    totalDays: number
  }
}

// New aggregation functions

/**
 * Aggregate data for multiple weeks (e.g., last 4 weeks for trend analysis)
 */
export function aggregateMultiWeekData(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): MultiWeekStats {
  const weeks = weekKeys
    .filter(key => weeksStore[key]) // Only include weeks that exist
    .map(weekKey => ({
      weekKey,
      stats: aggregateWeekData(weeksStore[weekKey])
    }))

  const categoryTotals: Record<string, number> = {}
  let totalHours = 0

  weeks.forEach(({ stats }) => {
    totalHours += stats.totalHours
    Object.entries(stats.categoryHours).forEach(([cat, hours]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + hours
    })
  })

  const averagePerWeek = weeks.length > 0 ? totalHours / weeks.length : 0

  return {
    weeks,
    totalHours,
    categoryTotals,
    averagePerWeek
  }
}

/**
 * Calculate annual productivity streak from weeks store
 * A productive day is defined as 8+ hours of work (W + M categories)
 * Streak allows up to 2 skipped days without breaking
 */
function calculateAnnualStreak(
  weeksStore: Record<string, TimeBlock[][]>,
  weekKeys: string[]
): YTDStats['streakMetrics'] {
  // Build array of all days with their work hours
  const daysData: Array<{ date: string; workHours: number; dayOfWeek: number }> = []

  for (const weekKey of weekKeys) {
    const weekData = weeksStore[weekKey] || []
    for (let d = 0; d < 7; d++) {
      const dayBlocks = weekData[d] || []
      let workHours = 0

      for (const block of dayBlocks) {
        if (block && (block.category === 'W' || block.category === 'M')) {
          workHours += 0.5
        }
      }

      daysData.push({
        date: `${weekKey}-${d}`,
        workHours,
        dayOfWeek: d // 0 = Sunday, 1 = Monday, etc.
      })
    }
  }

  // A productive day is 8+ hours of work
  const isProductiveDay = (day: typeof daysData[0]) => day.workHours >= 8

  // Calculate streaks with skip allowance (up to 2 skipped days)
  let currentStreak = 0
  let longestStreak = 0
  let skipsRemaining = 2
  let productiveDays = 0

  for (const day of daysData) {
    const isProductive = isProductiveDay(day)

    if (isProductive) {
      productiveDays++
      currentStreak++
      skipsRemaining = 2 // Reset skip allowance
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }
    } else {
      // Day is not productive
      if (skipsRemaining > 0) {
        // Skip this day without breaking streak
        skipsRemaining--
      } else {
        // Break the streak
        currentStreak = 0
        skipsRemaining = 2
      }
    }
  }

  const totalDays = daysData.length

  return {
    currentStreak,
    longestStreak,
    productiveDays,
    totalDays
  }
}

/**
 * Aggregate year-to-date statistics with detailed breakdowns
 */
export function aggregateYTDData(
  weeksStore: Record<string, TimeBlock[][]>,
  year: number
): YTDStats {
  // Filter weeks for the specified year
  const yearWeeks = Object.keys(weeksStore)
    .filter(key => key.startsWith(`${year}-W`))
    .sort()

  const weeklyData: YTDStats['weeklyData'] = []
  const categoryTotals: Record<string, number> = {}

  let totalHours = 0
  let highestWeek: { weekKey: string; hours: number } | null = null
  let lowestWeek: { weekKey: string; hours: number } | null = null

  yearWeeks.forEach(weekKey => {
    const stats = aggregateWeekData(weeksStore[weekKey])
    const hours = stats.totalHours

    weeklyData.push({
      weekKey,
      hours,
      categoryHours: stats.categoryHours
    })

    totalHours += hours

    Object.entries(stats.categoryHours).forEach(([cat, catHours]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + catHours
    })

    // Track highest/lowest weeks (only for weeks with data)
    if (hours > 0) {
      if (!highestWeek || hours > highestWeek.hours) {
        highestWeek = { weekKey, hours }
      }
      if (!lowestWeek || hours < lowestWeek.hours) {
        lowestWeek = { weekKey, hours }
      }
    }
  })

  const averagePerWeek = yearWeeks.length > 0 ? totalHours / yearWeeks.length : 0

  const categoryAverages: Record<string, number> = {}
  Object.keys(categoryTotals).forEach(cat => {
    categoryAverages[cat] = yearWeeks.length > 0 ? categoryTotals[cat] / yearWeeks.length : 0
  })

  // Calculate productivity streak metrics
  const streakMetrics = calculateAnnualStreak(weeksStore, yearWeeks)

  return {
    year,
    totalHours,
    totalWeeks: yearWeeks.length,
    averagePerWeek,
    highestWeek,
    lowestWeek,
    categoryTotals,
    categoryAverages,
    weeklyData,
    streakMetrics
  }
}


