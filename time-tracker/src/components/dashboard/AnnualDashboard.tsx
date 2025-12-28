import { useMemo, useState } from 'react'
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
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const { memories } = useYearMemories(year)

  // Generate year options (current year and past 10 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i)
    }
    return years
  }, [currentYear])

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

  // Calculate date range for the selected year
  const dateRangeLabel = useMemo(() => {
    const start = new Date(year, 0, 1) // January 1st
    const end = new Date(year, 11, 31) // December 31st

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [year])

  const handleRefresh = () => {
    onRefresh()
    setLastRefreshed(new Date())
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

  const formatLastRefreshed = () => {
    const now = new Date()
    const diffMs = now.getTime() - lastRefreshed.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  return (
    <div className="space-y-6">
      {/* Header with year selector, export and refresh buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className={cn('text-lg font-semibold', 'text-gray-900')}>
              Year-to-Date
            </h2>
            <p className="text-xs text-gray-500">
              Last updated: {formatLastRefreshed()}
            </p>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className={cn(
                'appearance-none pl-4 pr-10 py-2 rounded-lg font-semibold',
                'bg-white border-2 border-gray-200',
                'text-gray-900 text-base',
                'hover:border-blue-300 focus:border-blue-500 focus:outline-none',
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
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'transition-colors duration-200 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={handleRefresh}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'transition-colors duration-200 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
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
