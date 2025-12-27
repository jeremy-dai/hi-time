import { useMemo, useState } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateYTDData } from '../../utils/analytics'
import YTDKPICards from './YTDKPICards'
import MonthlyBreakdownChart from './MonthlyBreakdownChart'
import WeeklyHeatmap from './WeeklyHeatmap'
import AnnualProductivityStreak from './AnnualProductivityStreak'
import { RefreshCw, CalendarRange } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface AnnualDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  year: number
  weekKeys: string[]
  dateRangeLabel: string
  onRefresh: () => void
}

export default function AnnualDashboard({ 
  weeksStore, 
  year, 
  weekKeys,
  dateRangeLabel,
  onRefresh 
}: AnnualDashboardProps) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

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

  const handleRefresh = () => {
    onRefresh()
    setLastRefreshed(new Date())
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
      {/* Date Range Banner */}
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
            Showing Year-to-Date data excluding the current incomplete week.
          </p>
        </div>
      </div>

      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-semibold', 'text-gray-900 dark:text-gray-100')}>
            {year} Year-to-Date
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {formatLastRefreshed()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-lg',
            'bg-blue-600 hover:bg-blue-700 text-white',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* YTD Summary Cards */}
      <YTDKPICards ytdStats={ytdStats} />

      {/* Productivity Streak */}
      <AnnualProductivityStreak streakMetrics={ytdStats.streakMetrics} />

      {/* Monthly Breakdown Chart */}
      <MonthlyBreakdownChart ytdStats={ytdStats} />

      {/* Weekly Heatmap */}
      <WeeklyHeatmap ytdStats={ytdStats} weeksStore={weeksStore} weekKeys={weekKeys} />
    </div>
  )
}
