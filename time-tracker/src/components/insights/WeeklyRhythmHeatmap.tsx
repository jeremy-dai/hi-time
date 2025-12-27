import { useMemo, useState } from 'react'
import { cn } from '../../utils/classNames'
import type { WeeklyRhythmData } from '../../types/insights'
import type { CategoryKey } from '../../types/time'
import { CATEGORY_LABELS } from '../../constants/colors'

interface WeeklyRhythmHeatmapProps {
  rhythmData: WeeklyRhythmData[]
}

export default function WeeklyRhythmHeatmap({ rhythmData }: WeeklyRhythmHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; slot: number } | null>(null)

  // Organize data into a 2D grid structure (17 hourly slots from 6am-11pm)
  const gridData = useMemo(() => {
    const grid: WeeklyRhythmData[][] = []

    // Get unique time slots from the data (should be 17 slots)
    const uniqueSlots = Array.from(new Set(rhythmData.map(d => d.timeSlot)))
      .sort((a, b) => {
        const aStart = rhythmData.find(d => d.timeSlot === a)?.timeSlotStart || 0
        const bStart = rhythmData.find(d => d.timeSlot === b)?.timeSlotStart || 0
        return aStart - bStart
      })

    for (const timeSlot of uniqueSlots) {
      const row: WeeklyRhythmData[] = []
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const data = rhythmData.find(
          d => d.dayIndex === dayIndex && d.timeSlot === timeSlot
        )
        if (data) {
          row.push(data)
        } else {
          // Create empty cell if no data
          const slotStart = rhythmData.find(d => d.timeSlot === timeSlot)?.timeSlotStart || 6
          row.push({
            day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
            dayIndex,
            timeSlot,
            timeSlotStart: slotStart,
            averageHours: 0,
            categoryBreakdown: {} as Record<CategoryKey, number>,
            dominantCategory: null
          })
        }
      }
      grid.push(row)
    }
    return grid
  }, [rhythmData])

  // Get color intensity based on productive hours (Work category)
  const getProductiveColor = (categoryBreakdown: Record<string, number>): string => {
    const workHours = (categoryBreakdown['W'] || 0) / 4 // Average across 4 weeks
    const blocks = Math.round(workHours * 2)

    if (blocks === 0) return 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
    if (blocks === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
    if (blocks === 2) return 'bg-yellow-200 dark:bg-yellow-800/40 border border-yellow-300 dark:border-yellow-700'
    if (blocks === 3) return 'bg-yellow-300 dark:bg-yellow-700/50 border border-yellow-400 dark:border-yellow-600'
    return 'bg-yellow-400 dark:bg-yellow-600/60 border border-yellow-500 dark:border-yellow-500'
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className={cn(
      'rounded-3xl p-6',
      'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]'
    )}>
      <div className="mb-4">
        <h3 className={cn('text-lg font-semibold', 'text-gray-900 dark:text-gray-100')}>
          Weekly Rhythm Heatmap
        </h3>
        <p className={cn('text-sm mt-1', 'text-gray-600 dark:text-gray-400')}>
          Productive work blocks averaged over last 4 weeks (colored by Work hours)
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        {/* Header Row - Days */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
          <div /> {/* Empty corner */}
          {dayLabels.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-semibold py-1',
                'text-gray-700 dark:text-gray-300'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        {gridData.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-0.5">
            {/* Time Slot Label */}
            <div className={cn(
              'flex items-center justify-end pr-2 text-[10px] h-4',
              'text-gray-600 dark:text-gray-400'
            )}>
              {row[0].timeSlot.split('-')[0]}
            </div>

            {/* Cells for each day */}
            {row.map((cell, colIndex) => {
              const workHours = (cell.categoryBreakdown['W'] || 0) / 4 // Average across 4 weeks
              const workBlocks = Math.round(workHours * 2)
              const totalBlocks = Math.round((cell.averageHours) * 2)

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    'h-4 rounded transition-all duration-200 cursor-pointer relative',
                    getProductiveColor(cell.categoryBreakdown),
                    'hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:scale-110 hover:z-10'
                  )}
                  onMouseEnter={() => setHoveredCell({ day: colIndex, slot: rowIndex })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {/* Tooltip */}
                  {hoveredCell?.day === colIndex && hoveredCell?.slot === rowIndex && (
                    <div className={cn(
                      'absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2',
                      'w-48 p-3 rounded-lg shadow-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-200 dark:border-gray-700',
                      'text-xs pointer-events-none'
                    )}>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {cell.day}, {cell.timeSlot}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 mb-2">
                        {workBlocks} work blocks ({workHours.toFixed(1)}h avg)
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        {totalBlocks} total blocks ({cell.averageHours.toFixed(1)}h avg)
                      </div>
                      {Object.keys(cell.categoryBreakdown).length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
                          {Object.entries(cell.categoryBreakdown)
                            .filter(([_, hours]) => (hours as number) > 0)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([cat, hours]) => (
                              <div key={cat} className="flex justify-between text-gray-700 dark:text-gray-300">
                                <span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</span>
                                <span className="font-medium">{((hours as number) / 4).toFixed(1)}h</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>
          0
        </span>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800" />
          <div className="w-5 h-5 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800" />
          <div className="w-5 h-5 rounded bg-yellow-200 dark:bg-yellow-800/40 border border-yellow-300 dark:border-yellow-700" />
          <div className="w-5 h-5 rounded bg-yellow-300 dark:bg-yellow-700/50 border border-yellow-400 dark:border-yellow-600" />
          <div className="w-5 h-5 rounded bg-yellow-400 dark:bg-yellow-600/60 border border-yellow-500 dark:border-yellow-500" />
        </div>
        <span className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>
          2+ hours/week
        </span>
      </div>
    </div>
  )
}
