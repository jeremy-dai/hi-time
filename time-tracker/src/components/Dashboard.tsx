import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock } from '../types/time'
import { cn } from '../utils/classNames'
import { formatWeekKey, addWeeks, getISOWeekYear, getCurrentYearWeeks, startOfISOWeek, endOfISOWeek } from '../utils/date'
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
  weeksStore,
  currentDate,
  loadWeeksForRange,
  viewMode
}: DashboardProps) {
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Calculate the last complete week (previous week)
  // We ALWAYS exclude the current week from analysis as requested
  const lastCompleteWeekDate = useMemo(() => addWeeks(currentDate, -1), [currentDate])
  const lastCompleteWeekKey = useMemo(() => formatWeekKey(lastCompleteWeekDate), [lastCompleteWeekDate])

  // Calculate the keys we need for Trends view (last 4 complete weeks)
  const trendsWeekKeys = useMemo(() => {
    return [
      lastCompleteWeekKey,
      formatWeekKey(addWeeks(lastCompleteWeekDate, -1)),
      formatWeekKey(addWeeks(lastCompleteWeekDate, -2)),
      formatWeekKey(addWeeks(lastCompleteWeekDate, -3))
    ]
  }, [lastCompleteWeekKey, lastCompleteWeekDate])

  // Calculate date range string for Trends
  const trendsDateRangeLabel = useMemo(() => {
    const start = startOfISOWeek(addWeeks(lastCompleteWeekDate, -3))
    const end = endOfISOWeek(lastCompleteWeekDate)
    
    // Format dates nicely (e.g., "Jan 1 - Jan 28, 2025")
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [lastCompleteWeekDate])

  // Calculate keys for Annual view (all weeks of current year up to last complete week)
  const annualWeekKeys = useMemo(() => {
    const { isoYear } = getISOWeekYear(currentDate)
    // Get all weeks of the current year
    const allYearWeeks = getCurrentYearWeeks()
    // Filter to only include weeks <= lastCompleteWeekKey and matching the current year
    return allYearWeeks.filter(key => key <= lastCompleteWeekKey && key.startsWith(`${isoYear}-`))
  }, [currentDate, lastCompleteWeekKey])

  // Calculate date range string for Annual
  const annualDateRangeLabel = useMemo(() => {
    if (annualWeekKeys.length === 0) return ''
    
    // Get year from first key
    const firstKey = annualWeekKeys[0]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_year, _week] = firstKey.split('-W').map(Number)
    
    // Approximate start date of first week (Jan 1ish)
    // Actually we can just use Jan 1 of that year for display purposes or calculate exact start of week 1
    const { isoYear } = getISOWeekYear(currentDate)
    
    // End date is end of last complete week
    const end = endOfISOWeek(lastCompleteWeekDate)
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `Jan 1, ${isoYear} - ${endStr}`
  }, [annualWeekKeys, currentDate, lastCompleteWeekDate])


  // Load data when switching views
  useEffect(() => {
    const loadDataForView = async () => {
      let keysToLoad: string[] = []

      if (viewMode === 'trends') {
        keysToLoad = trendsWeekKeys
      } else if (viewMode === 'annual') {
        keysToLoad = annualWeekKeys
      }

      // Optimization: Only load if we have missing keys in the store
      const missingKeys = keysToLoad.filter(key => !weeksStore[key])
      
      if (missingKeys.length > 0) {
        setIsLoadingData(true)
        try {
          console.log('Dashboard loading missing weeks:', missingKeys)
          await loadWeeksForRange(keysToLoad) // Load all needed (API handles filtering)
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    loadDataForView()
  }, [viewMode, trendsWeekKeys, annualWeekKeys, loadWeeksForRange, weeksStore])

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
          weeksStore={weeksStore}
          weekKeys={trendsWeekKeys}
          dateRangeLabel={trendsDateRangeLabel}
        />
      )}

      {!isLoadingData && viewMode === 'annual' && (
        <AnnualDashboard
          weeksStore={weeksStore}
          year={getISOWeekYear(currentDate).isoYear}
          weekKeys={annualWeekKeys}
          dateRangeLabel={annualDateRangeLabel}
          onRefresh={() => loadWeeksForRange(annualWeekKeys)}
        />
      )}
    </div>
  )
}
