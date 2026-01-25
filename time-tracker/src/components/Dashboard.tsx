import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock } from '../types/time'
import { formatWeekKey, addWeeks, getISOWeekYear, startOfISOWeek, endOfISOWeek } from '../utils/date'
import CurrentWeekDashboard from './dashboard/CurrentWeekDashboard'
import AnnualDashboard from './dashboard/AnnualDashboard'
import { PageContainer } from './layout/PageContainer'

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

  // State for selected week in Trends view (defaults to last complete week)
  const [selectedWeekKey, setSelectedWeekKey] = useState(lastCompleteWeekKey)

  // Update selectedWeekKey when lastCompleteWeekKey changes (e.g., new week starts)
  useEffect(() => {
    setSelectedWeekKey(lastCompleteWeekKey)
  }, [lastCompleteWeekKey])

  // Calculate the keys we need for Trends view (4 weeks ending with selected week)
  const trendsWeekKeys = useMemo(() => {
    // Parse selected week to get date
    const [yearStr, weekStr] = selectedWeekKey.split('-W')
    const year = parseInt(yearStr)
    const week = parseInt(weekStr)
    const jan1 = new Date(Date.UTC(year, 0, 1))
    const jan1Day = jan1.getUTCDay()
    const week1Sunday = new Date(jan1)
    if (jan1Day !== 0) {
      week1Sunday.setUTCDate(jan1.getUTCDate() - jan1Day)
    }
    const selectedWeekDate = new Date(week1Sunday)
    selectedWeekDate.setUTCDate(week1Sunday.getUTCDate() + (week - 1) * 7)

    return [
      selectedWeekKey,
      formatWeekKey(addWeeks(selectedWeekDate, -1)),
      formatWeekKey(addWeeks(selectedWeekDate, -2)),
      formatWeekKey(addWeeks(selectedWeekDate, -3))
    ]
  }, [selectedWeekKey])

  // Calculate date range string for Trends
  const trendsDateRangeLabel = useMemo(() => {
    // Parse selected week to get date
    const [yearStr, weekStr] = selectedWeekKey.split('-W')
    const year = parseInt(yearStr)
    const week = parseInt(weekStr)
    const jan1 = new Date(Date.UTC(year, 0, 1))
    const jan1Day = jan1.getUTCDay()
    const week1Sunday = new Date(jan1)
    if (jan1Day !== 0) {
      week1Sunday.setUTCDate(jan1.getUTCDate() - jan1Day)
    }
    const selectedWeekDate = new Date(week1Sunday)
    selectedWeekDate.setUTCDate(week1Sunday.getUTCDate() + (week - 1) * 7)

    const start = startOfISOWeek(addWeeks(selectedWeekDate, -3))
    const end = endOfISOWeek(selectedWeekDate)

    // Format dates nicely (e.g., "Jan 1 - Jan 28, 2025")
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [selectedWeekKey])

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
    <PageContainer>
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
          selectedWeekKey={selectedWeekKey}
          onWeekChange={setSelectedWeekKey}
          maxWeekKey={lastCompleteWeekKey}
        />
      )}

      {!isLoadingData && viewMode === 'annual' && (
        <AnnualDashboard
          weeksStore={weeksStore}
          weekMetadataStore={weekMetadataStore}
          year={selectedYear}
          weekKeys={annualWeekKeys}
          onUpdateWeekTheme={onUpdateWeekTheme}
          onYearChange={setSelectedYear}
        />
      )}
    </PageContainer>
  )
}
