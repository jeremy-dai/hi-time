import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock } from '../types/time'
import { cn } from '../utils/classNames'
import { formatWeekKey, addWeeks, getISOWeekYear, getCurrentYearWeeks, startOfISOWeek, endOfISOWeek } from '../utils/date'
import CurrentWeekDashboard from './dashboard/CurrentWeekDashboard'
import AnnualDashboard from './dashboard/AnnualDashboard'

interface DashboardProps {
  weekData: TimeBlock[][]
  weeksStore: Record<string, TimeBlock[][]>
  weekMetadataStore: Record<string, { startingHour: number; theme: string | null }>
  currentWeekKey: string
  currentDate: Date
  loadWeeksForRange: (weekKeys: string[]) => Promise<void>
  loadYearWeeks: (year: number) => Promise<void>
  onUpdateWeekTheme: (weekKey: string, theme: string) => Promise<void>
  viewMode: 'trends' | 'annual'
}

export default function Dashboard({
  weeksStore,
  weekMetadataStore,
  currentDate,
  loadWeeksForRange,
  onUpdateWeekTheme,
  viewMode
}: DashboardProps) {
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Calculate the last complete week (previous week)
  // We ALWAYS exclude the current week from analysis as requested
  const lastCompleteWeekDate = useMemo(() => addWeeks(currentDate, -1), [currentDate])
  const lastCompleteWeekKey = useMemo(() => formatWeekKey(lastCompleteWeekDate), [lastCompleteWeekDate])

  // State for selected year in Annual view (defaults to year of last complete week)
  // This handles edge cases where current week is in a new ISO year but has no complete weeks yet
  // (e.g., Dec 29, 2025 is in ISO week 2026-W01, but last complete week is 2025-W52)
  const [selectedYear, setSelectedYear] = useState(() => {
    const lastWeek = addWeeks(currentDate, -1)
    const { isoYear } = getISOWeekYear(lastWeek)
    return isoYear
  })

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

  // Calculate keys for Annual view (all weeks of selected year up to last complete week)
  const annualWeekKeys = useMemo(() => {
    const { isoYear: lastCompleteYear } = getISOWeekYear(lastCompleteWeekDate)

    // Determine max week for the selected year
    let maxWeek: number
    if (selectedYear === lastCompleteYear) {
      // For the year containing the last complete week, use that week's number
      const { isoWeek } = getISOWeekYear(lastCompleteWeekDate)
      maxWeek = isoWeek
    } else if (selectedYear < lastCompleteYear) {
      // For past years, most have 52 weeks, some have 53
      // Calculate the last week of the selected year
      const lastDayOfYear = new Date(Date.UTC(selectedYear, 11, 31))
      const { isoYear: lastDayYear, isoWeek: lastDayWeek } = getISOWeekYear(lastDayOfYear)
      // If Dec 31 belongs to next year's W01, the year has 52 weeks, otherwise use the week number
      maxWeek = lastDayYear === selectedYear ? lastDayWeek : 52
    } else {
      // Future years have no data yet
      return []
    }

    // Generate week keys from W01 to maxWeek for the selected year
    const keys: string[] = []
    for (let week = 1; week <= maxWeek; week++) {
      const w = String(week).padStart(2, '0')
      keys.push(`${selectedYear}-W${w}`)
    }
    return keys
  }, [selectedYear, lastCompleteWeekDate])

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
          await loadWeeksForRange(keysToLoad) // Load all needed (API handles filtering)
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    loadDataForView()
  }, [viewMode, trendsWeekKeys, annualWeekKeys, loadWeeksForRange, weeksStore])

  return (
    <div className={cn('rounded-xl p-6', 'bg-white shadow-sm')}>
      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
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
          weekMetadataStore={weekMetadataStore}
          year={selectedYear}
          weekKeys={annualWeekKeys}
          onRefresh={() => loadWeeksForRange(annualWeekKeys)}
          onUpdateWeekTheme={onUpdateWeekTheme}
          onYearChange={setSelectedYear}
        />
      )}
    </div>
  )
}
