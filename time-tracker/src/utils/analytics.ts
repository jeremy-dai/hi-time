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

export interface WeekComparison {
  current: WeekStats
  previous: WeekStats
  deltaByCategory: Record<string, number>
  deltaDailyHours: number[]
}

export function compareWeeks(current: TimeBlock[][], previous: TimeBlock[][]): WeekComparison {
  const cur = aggregateWeekData(current)
  const prev = aggregateWeekData(previous)
  const deltaByCategory: Record<string, number> = {}
  const keys = new Set([...Object.keys(cur.categoryHours), ...Object.keys(prev.categoryHours)])
  keys.forEach(k => {
    deltaByCategory[k] = (cur.categoryHours[k] || 0) - (prev.categoryHours[k] || 0)
  })
  const deltaDailyHours = cur.dailyHours.map((h, i) => h - (prev.dailyHours[i] || 0))
  return { current: cur, previous: prev, deltaByCategory, deltaDailyHours }
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
  monthlyBreakdown: Array<{
    month: string
    hours: number
    categoryHours: Record<string, number>
  }>
  weeklyData: Array<{
    weekKey: string
    hours: number
    categoryHours: Record<string, number>
  }>
}

export interface WeekDelta {
  totalDelta: number
  totalPercentChange: number
  categoryDeltas: Record<string, {
    delta: number
    percentChange: number
  }>
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
 * Calculate deltas between two weeks with percentage changes
 */
export function calculateWeekDelta(
  currentWeekData: TimeBlock[][],
  previousWeekData: TimeBlock[][]
): WeekDelta {
  const current = aggregateWeekData(currentWeekData)
  const previous = aggregateWeekData(previousWeekData)

  const totalDelta = current.totalHours - previous.totalHours
  const totalPercentChange = previous.totalHours > 0
    ? (totalDelta / previous.totalHours) * 100
    : 0

  const categoryDeltas: Record<string, { delta: number; percentChange: number }> = {}
  const allCategories = new Set([
    ...Object.keys(current.categoryHours),
    ...Object.keys(previous.categoryHours)
  ])

  allCategories.forEach(cat => {
    const currentHours = current.categoryHours[cat] || 0
    const previousHours = previous.categoryHours[cat] || 0
    const delta = currentHours - previousHours
    const percentChange = previousHours > 0 ? (delta / previousHours) * 100 : 0

    categoryDeltas[cat] = { delta, percentChange }
  })

  return {
    totalDelta,
    totalPercentChange,
    categoryDeltas
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
  const monthlyMap: Record<string, { hours: number; categoryHours: Record<string, number> }> = {}
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

    // Aggregate by month
    const [yearStr, weekStr] = weekKey.split('-W')
    const weekNum = Number(weekStr)
    const approxDate = isoWeekToDate(Number(yearStr), weekNum)
    const monthKey = `${approxDate.getFullYear()}-${String(approxDate.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { hours: 0, categoryHours: {} }
    }

    monthlyMap[monthKey].hours += hours
    Object.entries(stats.categoryHours).forEach(([cat, catHours]) => {
      monthlyMap[monthKey].categoryHours[cat] =
        (monthlyMap[monthKey].categoryHours[cat] || 0) + catHours
    })
  })

  const monthlyBreakdown = Object.keys(monthlyMap)
    .sort()
    .map(month => ({
      month,
      hours: monthlyMap[month].hours,
      categoryHours: monthlyMap[month].categoryHours
    }))

  const averagePerWeek = yearWeeks.length > 0 ? totalHours / yearWeeks.length : 0

  const categoryAverages: Record<string, number> = {}
  Object.keys(categoryTotals).forEach(cat => {
    categoryAverages[cat] = yearWeeks.length > 0 ? categoryTotals[cat] / yearWeeks.length : 0
  })

  return {
    year,
    totalHours,
    totalWeeks: yearWeeks.length,
    averagePerWeek,
    highestWeek,
    lowestWeek,
    categoryTotals,
    categoryAverages,
    monthlyBreakdown,
    weeklyData
  }
}

/**
 * Get monthly aggregates with category breakdown
 */
export function getMonthlyAggregates(
  weeksStore: Record<string, TimeBlock[][]>,
  year: number
): YTDStats['monthlyBreakdown'] {
  const ytdStats = aggregateYTDData(weeksStore, year)
  return ytdStats.monthlyBreakdown
}

