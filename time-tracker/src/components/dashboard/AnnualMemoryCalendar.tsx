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
    <div className={cn('rounded-xl p-4', 'bg-white shadow-sm')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={cn('text-lg font-semibold', 'text-gray-900')}>
            {year} Memories
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} recorded • Click to edit, Enter to save, Esc to cancel
          </div>
        </div>
      </div>

      {/* Year Calendar - Compact Table View with Inline Editing */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 px-1 py-1 text-center font-semibold text-gray-700 w-16 sticky left-0 z-10">
                Day
              </th>
              {MONTH_NAMES.map((monthName) => (
                <th key={monthName} className="border border-gray-300 bg-gray-100 px-1 py-1 text-center font-semibold text-gray-700 min-w-[120px]">
                  {monthName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 31 }, (_, dayIndex) => {
              const day = dayIndex + 1
              return (
                <tr key={day}>
                  <td className="border border-gray-300 bg-gray-50 px-1 py-0.5 text-center font-medium text-gray-600 sticky left-0 z-10">
                    {day}
                  </td>
                  {calendarData.map((monthData) => {
                    const dayData = monthData.days.find(d => d.day === day)
                    if (!dayData) {
                      return (
                        <td key={monthData.month} className="border border-gray-300 bg-gray-100" />
                      )
                    }

                    const hasMemory = !!dayData.memory
                    const isEditing = editingDate === dayData.dateStr

                    return (
                      <td
                        key={monthData.month}
                        className={cn(
                          'border border-gray-300 px-0 py-0 cursor-text transition-colors relative',
                          isEditing && 'ring-2 ring-emerald-500 ring-inset bg-emerald-50',
                          !isEditing && 'hover:bg-emerald-50',
                          !hasMemory && !isEditing && 'bg-white'
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
                            placeholder="Type memory..."
                            className={cn(
                              'w-full h-full min-h-[40px] px-1 py-0.5 text-[10px] leading-tight',
                              'focus:outline-none resize-none',
                              'text-gray-900 placeholder-gray-400 bg-transparent'
                            )}
                          />
                        ) : (
                          <div className="min-h-[40px] px-1 py-0.5">
                            {hasMemory && (
                              <div className="text-[10px] leading-tight text-gray-800">
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
