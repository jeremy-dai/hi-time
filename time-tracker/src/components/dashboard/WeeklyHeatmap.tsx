import { useMemo, useState } from 'react'
import type { YTDStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface WeeklyHeatmapProps {
  ytdStats: YTDStats
}

export default function WeeklyHeatmap({ ytdStats }: WeeklyHeatmapProps) {
  const [hoveredWeek, setHoveredWeek] = useState<{ weekKey: string; hours: number } | null>(null)

  const { maxHours, weekData } = useMemo(() => {
    const max = Math.max(...ytdStats.weeklyData.map(w => w.hours), 1)
    return {
      maxHours: max,
      weekData: ytdStats.weeklyData
    }
  }, [ytdStats])

  const getColorIntensity = (hours: number) => {
    if (hours === 0) return 'bg-gray-100 dark:bg-gray-800'
    const intensity = hours / maxHours
    if (intensity > 0.75) return 'bg-blue-600 dark:bg-blue-500'
    if (intensity > 0.5) return 'bg-blue-500 dark:bg-blue-400'
    if (intensity > 0.25) return 'bg-blue-400 dark:bg-blue-300'
    return 'bg-blue-300 dark:bg-blue-200'
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
        <div className="space-y-6">
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
                  <div className="flex flex-wrap gap-2">
                    {weeks.map((week) => {
                      const weekNum = week.weekKey.split('-W')[1]
                      return (
                        <div
                          key={week.weekKey}
                          className="relative group"
                          onMouseEnter={() => setHoveredWeek(week)}
                          onMouseLeave={() => setHoveredWeek(null)}
                        >
                          <div
                            className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer',
                              'transition-all duration-200 hover:scale-110 hover:shadow-lg',
                              'border border-gray-200 dark:border-gray-700',
                              getColorIntensity(week.hours)
                            )}
                          >
                            <span
                              className={cn(
                                'text-xs font-medium',
                                week.hours > 0
                                  ? 'text-white dark:text-gray-900'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}
                            >
                              W{weekNum}
                            </span>
                          </div>

                          {/* Tooltip */}
                          {hoveredWeek?.weekKey === week.weekKey && (
                            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-semibold">{week.weekKey}</div>
                              <div>{week.hours.toFixed(1)} hours</div>
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
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Less</div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-200 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-300 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-400 border border-gray-200 dark:border-gray-700"></div>
              <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500 border border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">More</div>
          </div>
        </div>
      )}
    </div>
  )
}
