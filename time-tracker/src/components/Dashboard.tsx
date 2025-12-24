import { useState, useMemo, useEffect } from 'react'
import type { TimeBlock } from '../types/time'
import { cn } from '../utils/classNames'
import { aggregateWeekData, aggregateAnnualData } from '../utils/analytics'
import { formatWeekKey, addWeeks, getISOWeekYear } from '../utils/date'
import DashboardTabs from './dashboard/DashboardTabs'
import CurrentWeekDashboard from './dashboard/CurrentWeekDashboard'
import AnnualDashboard from './dashboard/AnnualDashboard'
import KPICards from './dashboard/KPICards'
import WeeklyBreakdownChart from './dashboard/WeeklyBreakdownChart'
import CategoryDistributionChart from './dashboard/CategoryDistributionChart'
import WeeklyTrendChart from './dashboard/WeeklyTrendChart'
import AnnualView from './dashboard/AnnualView'

interface DashboardProps {
  weekData: TimeBlock[][]
  weeksStore: Record<string, TimeBlock[][]>
  currentWeekKey: string
  currentDate: Date
  loadWeeksForRange: (weekKeys: string[]) => Promise<void>
  loadYearWeeks: (year: number) => Promise<void>
}

export default function Dashboard({
  weekData,
  weeksStore,
  currentWeekKey,
  currentDate,
  loadWeeksForRange,
  loadYearWeeks
}: DashboardProps) {
  const [activeView, setActiveView] = useState<'current-week' | 'annual' | 'full'>('current-week')
  const [isLoadingData, setIsLoadingData] = useState(false)

  const stats = useMemo(() => aggregateWeekData(weekData), [weekData])
  const annual = useMemo(() => weeksStore ? aggregateAnnualData(weeksStore) : null, [weeksStore])

  // Load data when switching views
  useEffect(() => {
    const loadDataForView = async () => {
      setIsLoadingData(true)
      try {
        if (activeView === 'current-week') {
          // Load current week + last 3 weeks (total 4 weeks)
          const weekKeys = [
            currentWeekKey,
            formatWeekKey(addWeeks(currentDate, -1)),
            formatWeekKey(addWeeks(currentDate, -2)),
            formatWeekKey(addWeeks(currentDate, -3))
          ]
          await loadWeeksForRange(weekKeys)
        } else if (activeView === 'annual') {
          // Load all weeks for current year
          const { isoYear } = getISOWeekYear(new Date())
          await loadYearWeeks(isoYear)
        }
      } finally {
        setIsLoadingData(false)
      }
    }

    loadDataForView()
  }, [activeView, currentWeekKey, currentDate, loadWeeksForRange, loadYearWeeks])

  return (
    <div className={cn('rounded-xl border p-6', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
      <div className={cn('text-2xl font-bold mb-6', 'text-gray-900 dark:text-gray-100')}>Dashboard</div>

      <DashboardTabs activeView={activeView} onViewChange={setActiveView} />

      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
        </div>
      )}

      {!isLoadingData && activeView === 'current-week' && (
        <CurrentWeekDashboard
          currentWeekData={weekData}
          weeksStore={weeksStore}
          currentWeekKey={currentWeekKey}
          currentDate={currentDate}
        />
      )}

      {!isLoadingData && activeView === 'annual' && (
        <AnnualDashboard
          weeksStore={weeksStore}
          year={getISOWeekYear(new Date()).isoYear}
          onRefresh={async () => {
            const { isoYear } = getISOWeekYear(new Date())
            await loadYearWeeks(isoYear)
          }}
        />
      )}

      {!isLoadingData && activeView === 'full' && (
        <>
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
        </>
      )}
    </div>
  )
}
