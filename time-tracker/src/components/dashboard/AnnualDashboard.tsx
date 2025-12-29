import { useMemo } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateYTDData } from '../../utils/analytics'
import { useYearMemories } from '../../hooks/useYearMemories'
import AnnualCategoryBreakdown from './AnnualCategoryBreakdown'
import AnnualWeeklyBreakdown from './AnnualWeeklyBreakdown'
import WeeklyHeatmap from './WeeklyHeatmap'
import AnnualProductivityStreak from './AnnualProductivityStreak'
import { RefreshCw, Download, ChevronDown, CalendarRange } from 'lucide-react'
import { cn } from '../../utils/classNames'
import { generateAnnualReport, downloadAnnualMarkdownReport } from '../../utils/annualMarkdownGenerator'
import { startOfISOWeek, endOfISOWeek } from '../../utils/date'

interface AnnualDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  weekMetadataStore: Record<string, { startingHour: number; theme: string | null }>
  year: number
  weekKeys: string[]
  onRefresh: () => void
  onUpdateWeekTheme: (weekKey: string, theme: string) => Promise<void>
  onYearChange: (year: number) => void
}

export default function AnnualDashboard({
  weeksStore,
  weekMetadataStore,
  year,
  weekKeys,
  onRefresh,
  onUpdateWeekTheme,
  onYearChange
}: AnnualDashboardProps) {
  const { memories } = useYearMemories(year)

  // Generate year options (selected year and past 10 years)
  // This ensures the dropdown includes the current year being viewed, even if it's in the future
  // (e.g., when today is Dec 29, 2025 but we're viewing Week 1 of ISO year 2026)
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = 0; i < 10; i++) {
      years.push(year - i)
    }
    return years
  }, [year])

  // Extract themes from metadata store
  const weekThemes = useMemo(() => {
    const themes: Record<string, string> = {}
    weekKeys.forEach(key => {
      const metadata = weekMetadataStore[key]
      if (metadata?.theme) {
        themes[key] = metadata.theme
      }
    })
    return themes
  }, [weekMetadataStore, weekKeys])

  const ytdStats = useMemo(() => {
    // Create a temporary store with only the keys we want
    const filteredStore: Record<string, TimeBlock[][]> = {}
    weekKeys.forEach(key => {
      if (weeksStore[key]) {
        filteredStore[key] = weeksStore[key]
      }
    })

    return aggregateYTDData(filteredStore, year)
  }, [weeksStore, year, weekKeys])

  // Calculate date range based on actual week data
  const dateRangeLabel = useMemo(() => {
    if (weekKeys.length === 0) {
      // No data, show full year
      const start = new Date(Date.UTC(year, 0, 1))
      const end = new Date(Date.UTC(year, 11, 31))
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      return `${startStr} - ${endStr}`
    }

    // Week keys are sorted newest first, so reverse to get chronological order
    const sortedKeys = [...weekKeys].sort()
    const firstWeekKey = sortedKeys[0] // Earliest week
    const lastWeekKey = sortedKeys[sortedKeys.length - 1] // Latest week

    // Parse week key to get a representative date in that week
    const parseWeekKeyToDate = (weekKey: string): Date => {
      const [yearStr, weekStr] = weekKey.split('-W')
      const year = parseInt(yearStr)
      const week = parseInt(weekStr)

      // Start with Jan 1 of the year
      const jan1 = new Date(Date.UTC(year, 0, 1))
      const jan1Day = jan1.getUTCDay() // 0 = Sunday

      // Find the Sunday that starts Week 1
      // Week 1 always contains Jan 1, and weeks start on Sunday
      const week1Sunday = new Date(jan1)
      if (jan1Day !== 0) {
        // Go back to previous Sunday
        week1Sunday.setUTCDate(jan1.getUTCDate() - jan1Day)
      }

      // Add the appropriate number of weeks
      const targetDate = new Date(week1Sunday)
      targetDate.setUTCDate(week1Sunday.getUTCDate() + (week - 1) * 7)
      return targetDate
    }

    const firstWeekDate = parseWeekKeyToDate(firstWeekKey)
    const lastWeekDate = parseWeekKeyToDate(lastWeekKey)

    const start = startOfISOWeek(firstWeekDate)
    const end = endOfISOWeek(lastWeekDate)

    // Show year on start date if it's different from end date year
    const startYear = start.getUTCFullYear()
    const endYear = end.getUTCFullYear()
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: startYear !== endYear ? 'numeric' : undefined,
      timeZone: 'UTC'
    })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    return `${startStr} - ${endStr}`
  }, [weekKeys])

  const handleRefresh = () => {
    onRefresh()
  }

  const handleExport = () => {
    const content = generateAnnualReport({
      ytdStats,
      weekThemes,
      memories,
      weeksStore,
      year
    })
    downloadAnnualMarkdownReport(content, year)
  }

  return (
    <div className="space-y-6">
      {/* Analysis Period Banner with Year Selector and Buttons */}
      <div className={cn(
        'rounded-xl p-4 flex items-center justify-between',
        'bg-emerald-50 text-emerald-900'
      )}>
        <div className="flex items-center space-x-3">
          <CalendarRange className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-semibold text-sm">
              Analysis Period: {dateRangeLabel}
            </h3>
            <p className="text-xs mt-0.5 opacity-90">
              {weekKeys.length} {weekKeys.length === 1 ? 'week' : 'weeks'} of data • Year {year}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className={cn(
                'appearance-none pl-4 pr-10 py-2 rounded-xl font-semibold',
                'bg-white border-2 border-gray-200',
                'text-gray-900 text-base',
                'hover:border-emerald-300 focus:border-emerald-500 focus:outline-none',
                'transition-colors cursor-pointer'
              )}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button
            onClick={handleExport}
            className={cn(
              'flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium text-sm',
              'bg-emerald-500 hover:bg-emerald-600 text-white',
              'shadow-sm hover:shadow-md transition-all',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
            )}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleRefresh}
            className={cn(
              'flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium text-sm',
              'bg-emerald-500 hover:bg-emerald-600 text-white',
              'shadow-sm hover:shadow-md transition-all',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW SECTION */}
      <div>
        <h2 className={cn('text-lg font-bold mb-4', 'text-gray-700')}>
          📊 Overview
        </h2>

        <div className="space-y-6">
          {/* Category Breakdown and Productivity Streak - Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            <AnnualCategoryBreakdown ytdStats={ytdStats} />
            <AnnualProductivityStreak streakMetrics={ytdStats.streakMetrics} />
          </div>

          {/* Weekly Heatmap */}
          <WeeklyHeatmap ytdStats={ytdStats} />
        </div>
      </div>

      {/* TRENDS & DETAILED ANALYSIS SECTION */}
      <div>
        <h2 className={cn('text-lg font-bold mb-4', 'text-gray-700')}>
          📈 Trends & Detailed Analysis
        </h2>

        <div className="space-y-6">
          {/* Weekly Breakdown Chart */}
          <AnnualWeeklyBreakdown
            ytdStats={ytdStats}
            weekThemes={weekThemes}
            onUpdateTheme={onUpdateWeekTheme}
          />
        </div>
      </div>
    </div>
  )
}
