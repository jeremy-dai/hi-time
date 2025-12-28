import { useMemo, useState } from 'react'
import type { DailyMemory } from '../../types/time'
import { cn } from '../../utils/classNames'
import MemoryEditor from './MemoryEditor'

interface AnnualMemoryCalendarProps {
  year: number
  memories: Record<string, DailyMemory>
  onUpdateMemory: (date: string, memory: DailyMemory) => void
  onDeleteMemory: (date: string) => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MOOD_COLORS = {
  terrible: 'bg-red-200 border-red-400',
  bad: 'bg-orange-200 border-orange-400',
  neutral: 'bg-gray-200 border-gray-400',
  good: 'bg-blue-200 border-blue-400',
  great: 'bg-green-200 border-green-400'
}

const MOOD_EMOJIS = {
  terrible: '😫',
  bad: '😞',
  neutral: '😐',
  good: '🙂',
  great: '😄'
}

export default function AnnualMemoryCalendar({
  year,
  memories,
  onUpdateMemory,
  onDeleteMemory
}: AnnualMemoryCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const calendarData = useMemo(() => {
    const months = []
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const days = []
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        days.push({
          day,
          dateStr,
          memory: memories[dateStr]
        })
      }
      months.push({
        month,
        monthName: MONTH_NAMES[month],
        days
      })
    }
    return months
  }, [year, memories])

  const handleSave = (date: string, memory: DailyMemory) => {
    onUpdateMemory(date, memory)
    setSelectedDate(null)
  }

  const handleDelete = (date: string) => {
    onDeleteMemory(date)
    setSelectedDate(null)
  }

  const totalMemories = Object.keys(memories).length

  return (
    <div className={cn('rounded-3xl p-6', 'bg-white shadow-sm')}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className={cn('text-lg font-semibold', 'text-gray-900')}>
            {year} Memories
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} recorded
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-max">
          {calendarData.map((monthData) => (
            <div key={monthData.month} className="border border-gray-200 rounded-lg p-3">
              {/* Month Header */}
              <div className="text-center font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200">
                {monthData.monthName}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthData.days.map((dayData) => {
                  const hasMemory = !!dayData.memory
                  const moodColor = dayData.memory?.mood
                    ? MOOD_COLORS[dayData.memory.mood]
                    : 'bg-purple-100 border-purple-300'

                  return (
                    <button
                      key={dayData.dateStr}
                      onClick={() => setSelectedDate(dayData.dateStr)}
                      onMouseEnter={() => setHoveredDate(dayData.dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={cn(
                        'relative aspect-square rounded text-xs font-medium',
                        'transition-all duration-150 border',
                        'hover:scale-110 hover:shadow-md hover:z-10',
                        hasMemory
                          ? cn(moodColor, 'text-gray-900')
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      )}
                      title={hasMemory ? 'Click to edit memory' : 'Click to add memory'}
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        {dayData.day}
                      </span>
                      {hasMemory && dayData.memory.mood && (
                        <span className="absolute top-0 right-0 text-[8px]">
                          {MOOD_EMOJIS[dayData.memory.mood]}
                        </span>
                      )}

                      {/* Tooltip on hover */}
                      {hoveredDate === dayData.dateStr && hasMemory && dayData.memory && (
                        <div className={cn(
                          'absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2',
                          'w-48 p-2 rounded-lg shadow-lg',
                          'bg-white border border-gray-200',
                          'text-xs text-left pointer-events-none'
                        )}>
                          <div className="font-semibold text-gray-900 mb-1">
                            {MONTH_NAMES[monthData.month]} {dayData.day}
                          </div>
                          <div className="text-gray-700 line-clamp-3">
                            {dayData.memory.memory}
                          </div>
                          {dayData.memory.tags && dayData.memory.tags.length > 0 && (
                            <div className="mt-1 text-gray-500 text-[10px]">
                              {dayData.memory.tags.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-50 border border-gray-200" />
          <span className="text-gray-600">No memory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-100 border border-purple-300" />
          <span className="text-gray-600">Has memory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Mood:</span>
          {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
            <span key={mood} title={mood} className="text-lg">
              {emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Memory Editor Modal */}
      {selectedDate && (
        <MemoryEditor
          date={selectedDate}
          memory={memories[selectedDate]}
          onSave={(memory) => handleSave(selectedDate, memory)}
          onDelete={memories[selectedDate] ? () => handleDelete(selectedDate) : undefined}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
