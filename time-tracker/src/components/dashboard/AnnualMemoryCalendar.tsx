import { useMemo, useState, useRef, useEffect } from 'react'
import type { DailyMemory } from '../../types/time'
import { cn } from '../../utils/classNames'

interface AnnualMemoryCalendarProps {
  year: number
  memories: Record<string, DailyMemory>
  onUpdateMemory: (date: string, memory: DailyMemory) => void
  onDeleteMemory: (date: string) => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnnualMemoryCalendar({
  year,
  memories,
  onUpdateMemory,
  onDeleteMemory
}: AnnualMemoryCalendarProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editingMemory, setEditingMemory] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when editing
  useEffect(() => {
    if (editingDate && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editingDate])

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

  const handleCellClick = (dateStr: string) => {
    const existingMemory = memories[dateStr]
    setEditingDate(dateStr)
    setEditingMemory(existingMemory?.memory || '')
  }

  const handleBlur = () => {
    if (!editingDate) return

    // Save the memory if there's text
    if (editingMemory.trim()) {
      const existingMemory = memories[editingDate]
      const newMemory: DailyMemory = {
        date: editingDate,
        memory: editingMemory.trim(),
        mood: existingMemory?.mood,
        tags: existingMemory?.tags,
        createdAt: existingMemory?.createdAt || Date.now(),
        updatedAt: Date.now()
      }
      onUpdateMemory(editingDate, newMemory)
    } else if (memories[editingDate]) {
      // If empty and memory exists, delete it
      onDeleteMemory(editingDate)
    }

    setEditingDate(null)
    setEditingMemory('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditingDate(null)
      setEditingMemory('')
    }
  }

  const totalMemories = Object.keys(memories).length

  return (
    <div className={cn('rounded-xl p-3 sm:p-5', 'bg-gradient-to-br from-white to-gray-50/30 shadow-md border border-gray-100')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1.5 sm:gap-0">
        <div>
          <div className={cn('text-lg sm:text-xl font-bold', 'text-gray-900 tracking-tight')}>
            {year} Memories
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">
            {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} recorded
            <span className="hidden sm:inline text-gray-400"> • Click to edit, Enter to save, Esc to cancel</span>
          </div>
        </div>
      </div>

      {/* Year Calendar - Compact Table View with Inline Editing */}
      <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 rounded-lg">
        <table className="w-full border-collapse text-xs min-w-[640px] shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
              <th className="border-r border-b border-gray-300 bg-gradient-to-br from-gray-100 to-gray-50 px-1 sm:px-2 py-1.5 text-center text-[9px] sm:text-[10px] font-bold text-gray-700 w-8 sm:w-12 sticky left-0 z-20 shadow-sm">
                Day
              </th>
              {MONTH_NAMES.map((monthName, idx) => (
                <th
                  key={monthName}
                  className={cn(
                    "border-b border-gray-300 px-0.5 sm:px-1.5 py-1.5 text-center text-[9px] sm:text-[10px] font-bold text-gray-700 min-w-[70px] sm:min-w-[90px] uppercase tracking-wide",
                    idx < MONTH_NAMES.length - 1 && "border-r border-gray-200"
                  )}
                >
                  {monthName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {Array.from({ length: 31 }, (_, dayIndex) => {
              const day = dayIndex + 1

              return (
                <tr
                  key={day}
                  className={cn(
                    "transition-all duration-150",
                    "hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-transparent hover:to-emerald-50/40",
                    day % 5 === 0 && "bg-gray-50/30"
                  )}
                >
                  <td className={cn(
                    "border-r border-b border-gray-300 bg-gradient-to-r from-gray-50 to-white px-1 sm:px-2 py-0.5 text-center text-[9px] sm:text-[10px] font-bold sticky left-0 z-10 h-6 sm:h-7",
                    day % 5 === 0 ? "text-emerald-600" : "text-gray-600",
                    "shadow-sm"
                  )}>
                    {day}
                  </td>
                  {calendarData.map((monthData, idx) => {
                    const dayData = monthData.days.find(d => d.day === day)
                    if (!dayData) {
                      return (
                        <td
                          key={monthData.month}
                          className={cn(
                            "border-b border-gray-200 bg-gradient-to-br from-gray-100/40 to-gray-50/40 h-6 sm:h-7",
                            idx < calendarData.length - 1 && "border-r border-gray-200"
                          )}
                        />
                      )
                    }

                    const hasMemory = !!dayData.memory
                    const isEditing = editingDate === dayData.dateStr

                    return (
                      <td
                        key={monthData.month}
                        className={cn(
                          'border-b border-gray-200 px-0 py-0 cursor-text transition-all duration-200 relative h-6 sm:h-7 max-h-6 sm:max-h-7',
                          idx < calendarData.length - 1 && "border-r border-gray-200",
                          isEditing && 'ring-2 ring-blue-400 ring-inset bg-blue-50 shadow-inner z-10',
                          !isEditing && hasMemory && 'bg-[#b5d3e8] hover:bg-[#9ec3e0] hover:shadow-sm',
                          !isEditing && !hasMemory && 'bg-white/50 hover:bg-blue-50/40'
                        )}
                        onClick={() => !isEditing && handleCellClick(dayData.dateStr)}
                      >
                        {isEditing ? (
                          <textarea
                            ref={textareaRef}
                            value={editingMemory}
                            onChange={(e) => setEditingMemory(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a memory..."
                            className={cn(
                              'w-full h-full min-h-[24px] sm:min-h-[28px] px-0.5 sm:px-1 py-0.5 text-[8.5px] sm:text-[9.5px] leading-snug',
                              'focus:outline-none resize-none',
                              'text-[#0d2535] placeholder-gray-400 bg-transparent font-medium'
                            )}
                          />
                        ) : (
                          <div className="h-6 sm:h-7 px-0.5 sm:px-1 py-0.5 overflow-hidden flex items-center">
                            {hasMemory && (
                              <div className="text-[8.5px] sm:text-[9.5px] leading-snug text-[#0d2535] line-clamp-1 font-medium">
                                {dayData.memory.memory}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
