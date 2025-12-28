import { useMemo, useState } from 'react'
import type { TimeBlock } from '../../types/time'
import { aggregateYTDData } from '../../utils/analytics'
import YTDKPICards from './YTDKPICards'
import AnnualWeeklyBreakdown from './AnnualWeeklyBreakdown'
import WeeklyHeatmap from './WeeklyHeatmap'
import AnnualProductivityStreak from './AnnualProductivityStreak'
import { RefreshCw } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface AnnualDashboardProps {
  weeksStore: Record<string, TimeBlock[][]>
  year: number
  weekKeys: string[]
  onRefresh: () => void
}

export default function AnnualDashboard({
  weeksStore,
  year,
  weekKeys,
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
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-lg font-semibold', 'text-gray-900')}>
            {year} Year-to-Date
          </h2>
          <p className="text-xs text-gray-500">
            Last updated: {formatLastRefreshed()}
          </p>
        </div>
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

      {/* YTD Summary Cards */}
      <YTDKPICards ytdStats={ytdStats} />

      {/* Productivity Streak */}
      <AnnualProductivityStreak streakMetrics={ytdStats.streakMetrics} />

      {/* Weekly Breakdown Chart */}
      <AnnualWeeklyBreakdown ytdStats={ytdStats} />

      {/* Weekly Heatmap */}
      <WeeklyHeatmap ytdStats={ytdStats} weeksStore={weeksStore} weekKeys={weekKeys} />
    </div>
  )
}
