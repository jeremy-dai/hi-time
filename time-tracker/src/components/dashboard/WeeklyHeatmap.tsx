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
    if (workHours === 0) return 'bg-gray-100'
    const intensity = workHours / maxWorkHours
    if (intensity > 0.75) return 'bg-yellow-500'
    if (intensity > 0.5) return 'bg-yellow-400'
    if (intensity > 0.25) return 'bg-yellow-300'
    return 'bg-yellow-200'
  }

  // Organize data into a 2D grid structure with months as rows and weeks as columns
  const gridData = useMemo(() => {
    // Group weeks by month and year
    const monthsMap: Record<string, typeof weekData> = {}
    weekData.forEach((week) => {
      const [yearStr, weekStr] = week.weekKey.split('-W')
      const weekNum = parseInt(weekStr, 10)

      // Approximate month from week number (rough estimate)
      const monthIndex = Math.floor((weekNum - 1) / 4.33)
      const monthKey = `${yearStr}-${String(monthIndex + 1).padStart(2, '0')}`

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = []
      }
      monthsMap[monthKey].push(week)
    })

    // Convert to sorted array of months with week arrays
    const sortedMonths = Object.keys(monthsMap).sort()

    // Find the maximum number of weeks in any month
    const maxWeeks = Math.max(...Object.values(monthsMap).map(weeks => weeks.length), 0)

    // Build grid structure: each row is a month, each column is a week position
    const grid = sortedMonths.map(monthKey => {
      const weeks = monthsMap[monthKey].sort((a, b) => {
        const weekA = parseInt(a.weekKey.split('-W')[1], 10)
        const weekB = parseInt(b.weekKey.split('-W')[1], 10)
        return weekA - weekB
      })

      // Pad with nulls to ensure consistent column count
      const paddedWeeks = [...weeks]
      while (paddedWeeks.length < maxWeeks) {
        paddedWeeks.push(null as any)
      }

      return {
        monthKey,
        weeks: paddedWeeks
      }
    })

    return { grid, maxWeeks }
  }, [weekData])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900')}>
        Weekly Activity Heatmap
      </div>

      {weekData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No weekly data available
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          {/* Header Row - Week Labels */}
          <div className={`grid gap-1 mb-2`} style={{ gridTemplateColumns: `60px repeat(${gridData.maxWeeks}, 1fr)` }}>
            <div /> {/* Empty corner */}
            {Array.from({ length: gridData.maxWeeks }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'text-center text-sm font-semibold py-1',
                  'text-gray-700'
                )}
              >
                W{i + 1}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {gridData.grid.map((row, rowIndex) => {
            const monthIndex = parseInt(row.monthKey.split('-')[1], 10) - 1
            const monthLabel = monthNames[monthIndex] || row.monthKey

            return (
              <div key={row.monthKey} className={`grid gap-1 mb-0.5`} style={{ gridTemplateColumns: `60px repeat(${gridData.maxWeeks}, 1fr)` }}>
                {/* Month Label */}
                <div className={cn(
                  'flex items-center justify-end pr-2 text-sm font-medium',
                  'text-gray-700'
                )}>
                  {monthLabel}
                </div>

                {/* Cells for each week */}
                {row.weeks.map((week, colIndex) => {
                  if (!week) {
                    // Empty cell
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="h-8"
                      />
                    )
                  }

                  const weekNum = week.weekKey.split('-W')[1]
                  return (
                    <div
                      key={week.weekKey}
                      className="relative"
                      onMouseEnter={() => setHoveredWeek({ weekKey: week.weekKey, hours: week.hours, workHours: week.workHours })}
                      onMouseLeave={() => setHoveredWeek(null)}
                    >
                      <div
                        className={cn(
                          'h-8 rounded flex items-center justify-center cursor-pointer',
                          'transition-all duration-200 hover:scale-110 hover:shadow-lg hover:z-10',
                          'border border-gray-200',
                          getProductiveColor(week.workHours)
                        )}
                      >
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            week.workHours > 0
                              ? 'text-gray-900'
                              : 'text-gray-600'
                          )}
                        >
                          {weekNum}
                        </span>
                      </div>

                      {/* Tooltip */}
                      {hoveredWeek?.weekKey === week.weekKey && (
                        <div className={cn(
                          'absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2',
                          'w-48 p-3 rounded-lg shadow-lg',
                          'bg-white border border-gray-200',
                          'text-xs pointer-events-none'
                        )}>
                          <div className="font-semibold text-gray-900 mb-1">
                            {week.weekKey}
                          </div>
                          <div className="text-gray-600">
                            Work: {week.workHours.toFixed(1)}h
                          </div>
                          <div className="text-gray-500">
                            Total: {week.hours.toFixed(1)}h
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className={cn('text-xs', 'text-gray-600')}>
              Less work
            </span>
            <div className="flex gap-1">
              <div className="w-5 h-5 rounded bg-gray-100 border border-gray-200" />
              <div className="w-5 h-5 rounded bg-yellow-200 border border-gray-200" />
              <div className="w-5 h-5 rounded bg-yellow-300 border border-gray-200" />
              <div className="w-5 h-5 rounded bg-yellow-400 border border-gray-200" />
              <div className="w-5 h-5 rounded bg-yellow-500 border border-gray-200" />
            </div>
            <span className={cn('text-xs', 'text-gray-600')}>
              More work
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
