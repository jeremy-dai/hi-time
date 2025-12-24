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
}

export default function CurrentWeekDashboard({
  currentWeekData,
  weeksStore,
  currentWeekKey,
  currentDate
}: CurrentWeekDashboardProps) {
  // Current week stats
  const currentStats = useMemo(() => aggregateWeekData(currentWeekData), [currentWeekData])

  // Get last 4 weeks keys (current + previous 3)
  const last4WeekKeys = useMemo(() => [
    currentWeekKey,
    formatWeekKey(addWeeks(currentDate, -1)),
    formatWeekKey(addWeeks(currentDate, -2)),
    formatWeekKey(addWeeks(currentDate, -3))
  ], [currentWeekKey, currentDate])

  // Multi-week stats for trend chart
  const multiWeekStats = useMemo(() => {
    return aggregateMultiWeekData(weeksStore, last4WeekKeys)
  }, [weeksStore, last4WeekKeys])

  // Previous week data for comparison
  const previousWeekKey = formatWeekKey(addWeeks(currentDate, -1))
  const previousWeekData = weeksStore[previousWeekKey] || null

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
          currentWeekData={currentWeekData}
          previousWeekData={previousWeekData}
          currentWeekLabel="This Week"
          previousWeekLabel="Last Week"
        />
      </div>

      {/* 4-Week Trend */}
      <MultiWeekTrendChart multiWeekStats={multiWeekStats} />
    </div>
  )
}
