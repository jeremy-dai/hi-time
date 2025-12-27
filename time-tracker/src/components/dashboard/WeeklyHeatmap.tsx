import { useMemo, useState } from 'react'
import type { YTDStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface WeeklyHeatmapProps {
  ytdStats: YTDStats
  weeksStore: Record<string, any[][]>
  weekKeys: string[]
}

export default function WeeklyHeatmap({ ytdStats, weeksStore: _weeksStore, weekKeys: _weekKeys }: WeeklyHeatmapProps) {
  const [hoveredWeek, setHoveredWeek] = useState<{ weekKey: string; hours: number; workHours: number } | null>(null)

  const { maxWorkHours, weekData } = useMemo(() => {
    // Calculate work hours (W category) for each week
    const dataWithWorkHours = ytdStats.weeklyData.map(week => {
      const workHours = week.categoryHours['W'] || 0
      return {
        ...week,
        workHours
      }
    })
    const max = Math.max(...dataWithWorkHours.map(w => w.workHours), 1)
    return {
      maxWorkHours: max,
      weekData: dataWithWorkHours
    }
  }, [ytdStats])

  const getProductiveColor = (workHours: number) => {
    if (workHours === 0) return 'bg-gray-100 dark:bg-gray-800'
    const intensity = workHours / maxWorkHours
    if (intensity > 0.75) return 'bg-yellow-500 dark:bg-yellow-600/70'
    if (intensity > 0.5) return 'bg-yellow-400 dark:bg-yellow-500/60'
    if (intensity > 0.25) return 'bg-yellow-300 dark:bg-yellow-400/50'
    return 'bg-yellow-200 dark:bg-yellow-300/40'
  }

  // Group weeks by month for better visualization
  const weeksByMonth = useMemo(() => {
    const months: Record<string, typeof weekData> = {}
    weekData.forEach((week) => {
      const [yearStr, weekStr] = week.weekKey.split('-W')
      const weekNum = parseInt(weekStr, 10)

      // Approximate month from week number (rough estimate)
      const monthIndex = Math.floor((weekNum - 1) / 4.33)
      const monthKey = `${yearStr}-${String(monthIndex + 1).padStart(2, '0')}`

      if (!months[monthKey]) {
        months[monthKey] = []
      }
      months[monthKey].push(week)
    })
    return months
  }, [weekData])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900 dark:text-gray-100')}>
        Weekly Activity Heatmap
      </div>

      {weekData.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          No weekly data available
        </div>
      ) : (
        <div className="space-y-4">
          {/* Heatmap by month */}
          {Object.keys(weeksByMonth)
            .sort()
            .map((monthKey) => {
              const monthIndex = parseInt(monthKey.split('-')[1], 10) - 1
              const monthLabel = monthNames[monthIndex] || monthKey
              const weeks = weeksByMonth[monthKey]

              return (
                <div key={monthKey}>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {monthLabel}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {weeks.map((week) => {
                      const weekNum = week.weekKey.split('-W')[1]
                      return (
                        <div
                          key={week.weekKey}
                          className="relative group"
                          onMouseEnter={() => setHoveredWeek({ weekKey: week.weekKey, hours: week.hours, workHours: week.workHours })}
                          onMouseLeave={() => setHoveredWeek(null)}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded flex items-center justify-center cursor-pointer',
                              'transition-all duration-200 hover:scale-125 hover:shadow-lg hover:z-10',
                              'border border-gray-200 dark:border-gray-700',
                              getProductiveColor(week.workHours)
                            )}
                          >
                            <span
                              className={cn(
                                'text-[10px] font-medium',
                                week.workHours > 0
                                  ? 'text-gray-900 dark:text-gray-100'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {weekNum}
                            </span>
                          </div>

                          {/* Tooltip */}
                          {hoveredWeek?.weekKey === week.weekKey && (
                            <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-semibold">{week.weekKey}</div>
                              <div>Work: {week.workHours.toFixed(1)}h</div>
                              <div>Total: {week.hours.toFixed(1)}h</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">Less work</div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-300/40 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-400/50 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-yellow-400 dark:bg-yellow-500/60 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-yellow-500 dark:bg-yellow-600/70 border border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">More work</div>
          </div>
        </div>
      )}
    </div>
  )
}
