import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateWeekData, aggregateMultiWeekData } from '../../utils/analytics'
import { formatWeekKey, addWeeks } from '../../utils/date'
import KPICards from './KPICards'
import WeeklyBreakdownChart from './WeeklyBreakdownChart'
import WeekOverWeekComparison from './WeekOverWeekComparison'
import MultiWeekTrendChart from './MultiWeekTrendChart'
import { cn } from '../../utils/classNames'

interface CurrentWeekDashboardProps {
  currentWeekData: TimeBlock[][]
  weeksStore: Record<string, TimeBlock[][]>
  currentWeekKey: string
  currentDate: Date
  isCurrentWeekComplete: boolean
}

export default function CurrentWeekDashboard({
  currentWeekData,
  weeksStore,
  currentWeekKey,
  currentDate,
  isCurrentWeekComplete
}: CurrentWeekDashboardProps) {
  // If current week is complete, show current week stats
  // Otherwise, show the most recent complete week (last week)
  const displayWeekKey = isCurrentWeekComplete ? currentWeekKey : formatWeekKey(addWeeks(currentDate, -1))
  const displayWeekData = isCurrentWeekComplete ? currentWeekData : (weeksStore[formatWeekKey(addWeeks(currentDate, -1))] || currentWeekData)

  // Current/display week stats
  const currentStats = useMemo(() => aggregateWeekData(displayWeekData), [displayWeekData])

  // Get last 4 weeks keys
  // If current week is complete: current + previous 3
  // If current week is incomplete: previous 4 complete weeks
  const last4WeekKeys = useMemo(() => {
    if (isCurrentWeekComplete) {
      return [
        currentWeekKey,
        formatWeekKey(addWeeks(currentDate, -1)),
        formatWeekKey(addWeeks(currentDate, -2)),
        formatWeekKey(addWeeks(currentDate, -3))
      ]
    } else {
      return [
        formatWeekKey(addWeeks(currentDate, -1)),
        formatWeekKey(addWeeks(currentDate, -2)),
        formatWeekKey(addWeeks(currentDate, -3)),
        formatWeekKey(addWeeks(currentDate, -4))
      ]
    }
  }, [currentWeekKey, currentDate, isCurrentWeekComplete])

  // Multi-week stats for trend chart
  const multiWeekStats = useMemo(() => {
    return aggregateMultiWeekData(weeksStore, last4WeekKeys)
  }, [weeksStore, last4WeekKeys])

  // Previous week data for comparison
  const previousWeekKey = isCurrentWeekComplete
    ? formatWeekKey(addWeeks(currentDate, -1))
    : formatWeekKey(addWeeks(currentDate, -2))
  const previousWeekData = weeksStore[previousWeekKey] || null

  console.log('CurrentWeekDashboard - last4WeekKeys:', last4WeekKeys)
  console.log('CurrentWeekDashboard - weeksStore keys:', Object.keys(weeksStore))
  console.log('CurrentWeekDashboard - previousWeekKey:', previousWeekKey, 'has data:', previousWeekData !== null)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <KPICards stats={currentStats} />
      </div>

      {/* Daily Breakdown and Week-over-Week Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
          <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>
            Daily Breakdown
          </div>
          <WeeklyBreakdownChart stats={currentStats} />
        </div>

        <WeekOverWeekComparison
          currentWeekData={displayWeekData}
          previousWeekData={previousWeekData}
          currentWeekLabel={isCurrentWeekComplete ? "This Week" : "Last Week"}
          previousWeekLabel={isCurrentWeekComplete ? "Previous Week" : "2 Weeks Ago"}
        />
      </div>

      {/* 4-Week Trend */}
      <MultiWeekTrendChart multiWeekStats={multiWeekStats} />
    </div>
  )
}
