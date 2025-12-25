import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock } from '../types/time'
import { cn } from '../utils/classNames'
import { formatWeekKey, addWeeks, getISOWeekYear } from '../utils/date'
import { aggregateWeekData } from '../utils/analytics'
import CurrentWeekDashboard from './dashboard/CurrentWeekDashboard'
import AnnualDashboard from './dashboard/AnnualDashboard'

interface DashboardProps {
  weekData: TimeBlock[][]
  weeksStore: Record<string, TimeBlock[][]>
  currentWeekKey: string
  currentDate: Date
  loadWeeksForRange: (weekKeys: string[]) => Promise<void>
  loadYearWeeks: (year: number) => Promise<void>
  viewMode: 'trends' | 'annual'
}

export default function Dashboard({
  weekData,
  weeksStore,
  currentWeekKey,
  currentDate,
  loadWeeksForRange,
  loadYearWeeks,
  viewMode
}: DashboardProps) {
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Check if current week is complete (has ~168 hours total)
  const isCurrentWeekComplete = useMemo(() => {
    const stats = aggregateWeekData(weekData)
    // Allow for small rounding errors - consider complete if >= 167 hours
    return stats.totalHours >= 167
  }, [weekData])

  // Load data when switching views
  useEffect(() => {
    const loadDataForView = async () => {
      setIsLoadingData(true)
      try {
        if (viewMode === 'trends') {
          // If current week is complete, load current week + last 3 weeks
          // Otherwise, load last 4 complete weeks (excluding current)
          const weekKeys = isCurrentWeekComplete
            ? [
                currentWeekKey,
                formatWeekKey(addWeeks(currentDate, -1)),
                formatWeekKey(addWeeks(currentDate, -2)),
                formatWeekKey(addWeeks(currentDate, -3))
              ]
            : [
                formatWeekKey(addWeeks(currentDate, -1)),
                formatWeekKey(addWeeks(currentDate, -2)),
                formatWeekKey(addWeeks(currentDate, -3)),
                formatWeekKey(addWeeks(currentDate, -4))
              ]
          console.log('Dashboard loading weeks:', weekKeys, 'isComplete:', isCurrentWeekComplete)
          await loadWeeksForRange(weekKeys)
          console.log('Dashboard weeksStore after load:', Object.keys(weeksStore))
        } else if (viewMode === 'annual') {
          // Load all weeks for current year
          const { isoYear } = getISOWeekYear(new Date())
          await loadYearWeeks(isoYear)
        }
      } finally {
        setIsLoadingData(false)
      }
    }

    loadDataForView()
  }, [viewMode, currentWeekKey, currentDate, loadWeeksForRange, loadYearWeeks, isCurrentWeekComplete])

  return (
    <div className={cn('rounded-xl border p-6', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')}>
      <div className={cn('text-2xl font-bold mb-6', 'text-gray-900 dark:text-gray-100')}>
        {viewMode === 'trends' ? 'Trends' : 'Annual'}
      </div>

      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
        </div>
      )}

      {!isLoadingData && viewMode === 'trends' && (
        <CurrentWeekDashboard
          currentWeekData={weekData}
          weeksStore={weeksStore}
          currentWeekKey={currentWeekKey}
          currentDate={currentDate}
          isCurrentWeekComplete={isCurrentWeekComplete}
        />
      )}

      {!isLoadingData && viewMode === 'annual' && (
        <AnnualDashboard
          weeksStore={weeksStore}
          year={getISOWeekYear(new Date()).isoYear}
          onRefresh={async () => {
            const { isoYear } = getISOWeekYear(new Date())
            await loadYearWeeks(isoYear)
          }}
        />
      )}
    </div>
  )
}
