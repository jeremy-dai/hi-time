import { useMemo } from 'react'
import { cn } from '../../utils/classNames'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { WeeklyRhythmData } from '../../types/insights'
import type { CategoryKey } from '../../types/time'
import { getCategoryLabel } from '../../utils/colorHelpers'
import { Calendar } from 'lucide-react'
import CardHeader from '../shared/CardHeader'

interface WeeklyRhythmHeatmapProps {
  rhythmData: WeeklyRhythmData[]
}

export default function WeeklyRhythmHeatmap({ rhythmData }: WeeklyRhythmHeatmapProps) {
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

    if (blocks === 0) return 'bg-zinc-50/50 border border-zinc-200/50'
    if (blocks === 1) return 'bg-emerald-100/70 border border-emerald-200/70'
    if (blocks === 2) return 'bg-emerald-200/80 border border-emerald-300/80'
    if (blocks === 3) return 'bg-emerald-400/90 border border-emerald-500/90'
    return 'bg-emerald-500 border border-emerald-600'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn(
      'rounded-xl p-5',
      'glass-card'
    )}>
      <CardHeader
        title="Weekly Activity Heatmap (4 Weeks)"
        icon={Calendar}
        className="mb-5"
        titleClassName="text-zinc-900"
      />

        {/* Header Row - Days */}
        <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-1 mb-2">
          <div /> {/* Empty corner */}
          {dayLabels.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-xs font-bold uppercase tracking-wider py-0.5',
                'text-zinc-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        {gridData.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-1 mb-1">
            {/* Time Slot Label */}
            <div className={cn(
              'flex items-center justify-end pr-3 text-xs font-semibold h-4',
              'text-zinc-600'
            )}>
              {row[0].timeSlot.split('-')[0]}
            </div>

            {/* Cells for each day */}
            {row.map((cell, colIndex) => {
              const workHours = (cell.categoryBreakdown['W'] || 0) / 4 // Average across 4 weeks

              return (
                <Tooltip key={`${rowIndex}-${colIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'h-4 rounded-sm transition-all duration-200 cursor-pointer',
                        getProductiveColor(cell.categoryBreakdown),
                        'hover:ring-2 hover:ring-emerald-500 hover:scale-105 hover:z-10 hover:shadow-md'
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent 
                    className="w-52 p-3 rounded-xl shadow-xl bg-white/95 backdrop-blur-sm border border-zinc-200 text-xs"
                    sideOffset={5}
                    showArrow={false}
                  >
                    <div className="font-bold text-zinc-900 mb-1.5">
                      {cell.day} • {cell.timeSlot}
                    </div>
                    <div className="text-emerald-700 font-semibold mb-1">
                      {workHours.toFixed(1)}h work
                    </div>
                    <div className="text-zinc-500 text-2xs mb-2">
                      {cell.averageHours.toFixed(1)}h total activity
                    </div>
                    {Object.keys(cell.categoryBreakdown).length > 0 && (
                      <div className="space-y-1 border-t border-zinc-200 pt-2">
                        {Object.entries(cell.categoryBreakdown)
                          .filter(([_, hours]) => (hours as number) > 0)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 3)
                          .map(([cat, hours]) => (
                            <div key={cat} className="flex justify-between text-zinc-700">
                              <span className="text-2xs">{getCategoryLabel(cat as any)}</span>
                              <span className="font-semibold text-2xs">{((hours as number) / 4).toFixed(1)}h</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className={cn('text-xs font-medium', 'text-zinc-500')}>
            Less
          </span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-zinc-50/50 border border-zinc-200/50" />
            <div className="w-4 h-4 rounded-sm bg-emerald-100/70 border border-emerald-200/70" />
            <div className="w-4 h-4 rounded-sm bg-emerald-200/80 border border-emerald-300/80" />
            <div className="w-4 h-4 rounded-sm bg-emerald-400/90 border border-emerald-500/90" />
            <div className="w-4 h-4 rounded-sm bg-emerald-500 border border-emerald-600" />
          </div>
          <span className={cn('text-xs font-medium', 'text-zinc-500')}>
            More
          </span>
        </div>
    </div>
  )
}
