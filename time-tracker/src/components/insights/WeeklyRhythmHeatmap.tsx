import { useMemo, useState } from 'react'
import { cn } from '../../utils/classNames'
import type { WeeklyRhythmData } from '../../types/insights'
import type { CategoryKey } from '../../types/time'
import { CATEGORY_LABELS } from '../../constants/colors'
import { Calendar } from 'lucide-react'

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
      // Reorder to Sunday-Saturday: [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
      const dayOrder = [6, 0, 1, 2, 3, 4, 5] // Map from Mon-Sun indices to Sun-Sat
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      for (let i = 0; i < 7; i++) {
        const originalDayIndex = dayOrder[i]
        const data = rhythmData.find(
          d => d.dayIndex === originalDayIndex && d.timeSlot === timeSlot
        )
        if (data) {
          row.push(data)
        } else {
          // Create empty cell if no data
          const slotStart = rhythmData.find(d => d.timeSlot === timeSlot)?.timeSlotStart || 6
          row.push({
            day: dayNames[i],
            dayIndex: originalDayIndex,
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

    if (blocks === 0) return 'bg-gray-50 border border-gray-200'
    if (blocks === 1) return 'bg-yellow-100 border border-yellow-200'
    if (blocks === 2) return 'bg-yellow-200 border border-yellow-300'
    if (blocks === 3) return 'bg-yellow-300 border border-yellow-400'
    return 'bg-yellow-400 border border-yellow-500'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn(
      'rounded-xl p-6',
      'bg-white shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-base font-semibold', 'text-gray-900')}>
          Weekly Rhythm Heatmap (4 Weeks)
        </h3>
        <Calendar className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full">
        {/* Header Row - Days */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
          <div /> {/* Empty corner */}
          {dayLabels.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-semibold py-1',
                'text-gray-700'
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
              'text-gray-600'
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
                    'hover:ring-2 hover:ring-emerald-400 hover:scale-110 hover:z-10'
                  )}
                  onMouseEnter={() => setHoveredCell({ day: colIndex, slot: rowIndex })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {/* Tooltip */}
                  {hoveredCell?.day === colIndex && hoveredCell?.slot === rowIndex && (
                    <div className={cn(
                      'absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2',
                      'w-48 p-3 rounded-xl shadow-lg',
                      'bg-white',
                      'border border-gray-200',
                      'text-xs pointer-events-none'
                    )}>
                      <div className="font-semibold text-gray-900 mb-1">
                        {cell.day}, {cell.timeSlot}
                      </div>
                      <div className="text-gray-600 mb-2">
                        {workBlocks} work blocks ({workHours.toFixed(1)}h avg)
                      </div>
                      <div className="text-gray-500 text-xs">
                        {totalBlocks} total blocks ({cell.averageHours.toFixed(1)}h avg)
                      </div>
                      {Object.keys(cell.categoryBreakdown).length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
                          {Object.entries(cell.categoryBreakdown)
                            .filter(([_, hours]) => (hours as number) > 0)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([cat, hours]) => (
                              <div key={cat} className="flex justify-between text-gray-700">
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

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-3">
        <span className={cn('text-xs', 'text-gray-600')}>
          0h
        </span>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded bg-gray-50 border border-gray-200" />
          <div className="w-5 h-5 rounded bg-yellow-200 border border-yellow-300" />
          <div className="w-5 h-5 rounded bg-yellow-400 border border-yellow-500" />
        </div>
        <span className={cn('text-xs', 'text-gray-600')}>
          1h/week
        </span>
        </div>
      </div>
      </div>
    </div>
  )
}
