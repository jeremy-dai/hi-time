import { useMemo, useState } from 'react'
import type { YTDStats } from '../../utils/analytics'
import { cn } from '../../utils/classNames'

interface WeeklyHeatmapProps {
  ytdStats: YTDStats
}

interface DayData {
  date: Date
  dateStr: string
  workHours: number
  totalHours: number
  weekKey: string
}

export default function WeeklyHeatmap({ ytdStats }: WeeklyHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)

  // Transform weekly data to daily data using actual daily hours
  const { maxWorkHours, dailyData } = useMemo(() => {
    const days: DayData[] = []

    ytdStats.weeklyData.forEach(week => {
      // Parse week key (e.g., "2025-W01")
      const [yearStr, weekStr] = week.weekKey.split('-W')
      const year = parseInt(yearStr, 10)
      const weekNum = parseInt(weekStr, 10)

      // Calculate the start date of this week (Monday using ISO week calculation)
      const jan4 = new Date(year, 0, 4)
      const jan4Day = jan4.getDay() || 7 // Convert Sunday=0 to 7
      const weekStart = new Date(jan4)
      weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNum - 1) * 7)

      // Generate 7 days for this week with actual daily data
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)

        // Get actual hours for this day from dailyHours and dailyByCategory
        const dayTotalHours = week.dailyHours[i] || 0
        const dayCategories = week.dailyByCategory[i] || {}
        const dayWorkHours = dayCategories['W'] || 0

        days.push({
          date,
          dateStr: date.toISOString().split('T')[0],
          workHours: dayWorkHours,
          totalHours: dayTotalHours,
          weekKey: week.weekKey
        })
      }
    })

    const max = Math.max(...days.map(d => d.workHours), 1)
    return { maxWorkHours: max, dailyData: days }
  }, [ytdStats])

  const getContributionColor = (workHours: number) => {
    if (workHours === 0) return 'bg-gray-100'
    const intensity = workHours / maxWorkHours
    if (intensity > 0.75) return 'bg-yellow-500'
    if (intensity > 0.5) return 'bg-yellow-400'
    if (intensity > 0.25) return 'bg-yellow-300'
    return 'bg-yellow-200'
  }

  // Organize days into a grid (weeks as columns, weekdays as rows)
  const gridData = useMemo(() => {
    if (dailyData.length === 0) return { weeks: [], monthLabels: [] }

    // Sort by date
    const sortedDays = [...dailyData].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Find the first Sunday on or before the first date
    const firstDate = new Date(sortedDays[0].date)
    const firstDayOfWeek = firstDate.getDay()
    const startDate = new Date(firstDate)
    startDate.setDate(firstDate.getDate() - firstDayOfWeek)

    // Find the last Saturday on or after the last date
    const lastDate = new Date(sortedDays[sortedDays.length - 1].date)
    const lastDayOfWeek = lastDate.getDay()
    const endDate = new Date(lastDate)
    endDate.setDate(lastDate.getDate() + (6 - lastDayOfWeek))

    // Create a map for quick lookup
    const dayMap = new Map<string, DayData>()
    sortedDays.forEach(day => {
      dayMap.set(day.dateStr, day)
    })

    // Build week columns
    const weeks: (DayData | null)[][] = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const week: (DayData | null)[] = []

      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayData = dayMap.get(dateStr) || null
        week.push(dayData)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(week)
    }

    // Calculate month labels (only show when month changes)
    const monthLabels: { weekIndex: number; label: string }[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let lastMonth = -1

    weeks.forEach((week, index) => {
      // Check the middle day of the week for more stable month detection
      const midDay = week[3] || week.find(d => d !== null)
      if (midDay) {
        const month = midDay.date.getMonth()
        if (month !== lastMonth) {
          monthLabels.push({
            weekIndex: index,
            label: monthNames[month]
          })
          lastMonth = month
        }
      }
    })

    return { weeks, monthLabels }
  }, [dailyData])

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm')}>
      <div className={cn('text-lg font-semibold mb-4', 'text-gray-900')}>
        Weekly Activity Heatmap
      </div>

      {dailyData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No activity data available
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          {/* Month labels */}
          <div className="relative mb-2" style={{ paddingLeft: '48px', height: '20px' }}>
            {gridData.monthLabels.map(({ weekIndex, label }) => (
              <span
                key={`${weekIndex}-${label}`}
                className="absolute text-xs font-medium text-gray-700"
                style={{ left: `${48 + weekIndex * 16}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* GitHub-style grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {dayLabels.map((label, index) => (
                <div
                  key={label}
                  className="text-xs text-gray-600 h-3 flex items-center justify-end"
                  style={{
                    visibility: index % 2 === 1 ? 'visible' : 'hidden' // Only show Mon, Wed, Fri
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Contribution squares */}
            <div className="flex gap-1">
              {gridData.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="relative"
                      onMouseEnter={() => day && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm cursor-pointer',
                          'transition-all duration-150',
                          'hover:ring-2 hover:ring-gray-400 hover:ring-offset-1',
                          day ? getContributionColor(day.workHours) : 'bg-gray-50',
                          !day && 'cursor-default'
                        )}
                        title={day ? `${day.dateStr}: ${day.workHours.toFixed(1)}h work` : ''}
                      />

                      {/* Tooltip */}
                      {hoveredDay && day && hoveredDay.dateStr === day.dateStr && (
                        <div className={cn(
                          'absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2',
                          'w-40 p-2 rounded-lg shadow-xl',
                          'bg-gray-900 text-white',
                          'text-xs pointer-events-none whitespace-nowrap'
                        )}>
                          <div className="font-semibold mb-1">
                            {day.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div>
                            Work: {day.workHours.toFixed(1)}h
                          </div>
                          <div className="text-gray-300 text-[10px]">
                            Total: {day.totalHours.toFixed(1)}h
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
              <div className="w-3 h-3 rounded-sm bg-yellow-200" />
              <div className="w-3 h-3 rounded-sm bg-yellow-300" />
              <div className="w-3 h-3 rounded-sm bg-yellow-400" />
              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  )
}
