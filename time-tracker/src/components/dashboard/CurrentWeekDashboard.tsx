import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateWeekData, aggregateMultiWeekData } from '../../utils/analytics'
import KPICards from './KPICards'
import WeeklyBreakdownChart from './WeeklyBreakdownChart'
import WeekOverWeekComparison from './WeekOverWeekComparison'
import MultiWeekTrendChart from './MultiWeekTrendChart'
import { cn } from '../../utils/classNames'

import { CalendarRange } from 'lucide-react'

interface CurrentWeekDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  weekKeys: string[] // The 4 weeks to display [newest, ..., oldest]
  dateRangeLabel: string
}

export default function CurrentWeekDashboard({
  weeksStore,
  weekKeys,
  dateRangeLabel
}: CurrentWeekDashboardProps) {
  // Most recent completed week (the first one in the list)
  const displayWeekKey = weekKeys[0]
  const displayWeekData = weeksStore[displayWeekKey] || []

  // Current/display week stats
  const currentStats = useMemo(() => aggregateWeekData(displayWeekData), [displayWeekData])

  // Multi-week stats for trend chart
  const multiWeekStats = useMemo(() => {
    return aggregateMultiWeekData(weeksStore, weekKeys)
  }, [weeksStore, weekKeys])

  // Previous week data for comparison (the second one in the list)
  const previousWeekKey = weekKeys[1]
  const previousWeekData = weeksStore[previousWeekKey] || null

  return (
    <div className="space-y-6">
      {/* Week Status Banner */}
      <div className={cn(
        'rounded-lg p-4 flex items-start space-x-3',
        'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
      )}>
        <CalendarRange className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-semibold text-sm">
            Analysis Period: {dateRangeLabel}
          </h3>
          <p className="text-sm mt-1 opacity-90">
            Showing trends for the last 4 completed weeks. The current incomplete week is excluded.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <KPICards stats={currentStats} />
      </div>

      {/* Daily Breakdown and Week-over-Week Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
          <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>
            Daily Breakdown ({displayWeekKey})
          </div>
          <WeeklyBreakdownChart stats={currentStats} />
        </div>

        <WeekOverWeekComparison
          currentWeekData={displayWeekData}
          previousWeekData={previousWeekData}
          currentWeekLabel="Last Complete Week"
          previousWeekLabel="Week Before"
        />
      </div>

      {/* 4-Week Trend */}
      <MultiWeekTrendChart multiWeekStats={multiWeekStats} />
    </div>
  )
}
