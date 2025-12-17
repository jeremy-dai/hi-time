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

