import { useMemo } from 'react'
import type { TimeBlock } from '../types/time'
import { cn } from '../utils/classNames'
import { aggregateWeekData, aggregateAnnualData } from '../utils/analytics'
import KPICards from './dashboard/KPICards'
import WeeklyBreakdownChart from './dashboard/WeeklyBreakdownChart'
import CategoryDistributionChart from './dashboard/CategoryDistributionChart'
import WeeklyTrendChart from './dashboard/WeeklyTrendChart'
import AnnualView from './dashboard/AnnualView'

interface DashboardProps {
  weekData: TimeBlock[][]
  weeksStore?: Record<string, TimeBlock[][]>
}

export default function Dashboard({ weekData, weeksStore }: DashboardProps) {
  const stats = useMemo(() => aggregateWeekData(weekData), [weekData])
  const annual = useMemo(() => weeksStore ? aggregateAnnualData(weeksStore) : null, [weeksStore])

  return (
    <div className={cn('rounded-xl border p-6', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
      <div className={cn('text-2xl font-bold mb-6', 'text-gray-900 dark:text-gray-100')}>Dashboard</div>

      <div className="mb-8">
        <KPICards stats={stats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
          <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>Weekly Breakdown</div>
          <WeeklyBreakdownChart stats={stats} />
        </div>
        <div className={cn('rounded-xl border p-4', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
          <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>Category Distribution</div>
          <CategoryDistributionChart stats={stats} />
        </div>
      </div>

      <div className={cn('rounded-xl border p-4 mb-8', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
        <div className={cn('text-lg font-semibold mb-3', 'text-gray-900 dark:text-gray-100')}>Weekly Trend</div>
        <WeeklyTrendChart current={stats} />
      </div>

      {annual && <AnnualView annual={annual} />}
    </div>
  )
}
