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
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing
  useEffect(() => {
    if (editingDate && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditingDate(null)
      setEditingMemory('')
    }
  }

  return (
    <div className="w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 rounded-xl">
        <table className="w-full border-collapse text-xs min-w-[640px] rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-zinc-50 border-b border-r border-zinc-100 p-2 min-w-[30px]">
                <div className="flex flex-col items-center">
                  <span className="text-2xs text-zinc-400 font-medium uppercase tracking-wider">Day</span>
                </div>
              </th>
              {calendarData.map((monthData) => (
                <th
                  key={monthData.month}
                  className={cn(
                    "sticky top-0 z-10 border-b border-zinc-100 py-2 text-center min-w-[100px]",
                    "bg-zinc-50"
                  )}
                >
                  <span className="text-2xs font-bold uppercase tracking-wider text-zinc-500">{monthData.month}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-transparent">
            {Array.from({ length: 31 }, (_, dayIndex) => {
              const day = dayIndex + 1

              return (
                <tr
                  key={day}
                  className="transition-all duration-150 hover:bg-zinc-50/50"
                >
                  <td className={cn(
                    "border-b border-zinc-100/50 bg-zinc-50 px-1 sm:px-2 py-0.5 text-center text-2xs font-medium font-mono sticky left-0 z-10 h-6 sm:h-7 text-zinc-400",
                    "backdrop-blur-sm"
                  )}>
                    {day}
                  </td>
                  {calendarData.map((monthData) => {
                    const dayData = monthData.days.find(d => d.day === day)
                    if (!dayData) {
                      return (
                        <td
                          key={monthData.month}
                          className="border-b border-zinc-100/50 bg-zinc-50/20 h-6 sm:h-7"
                        />
                      )
                    }

                    const hasMemory = !!dayData.memory
                    const isEditing = editingDate === dayData.dateStr

                    return (
                      <td
                        key={monthData.month}
                        className={cn(
                          'border-b border-zinc-100/50 px-0 py-0 cursor-text transition-all duration-200 relative h-6 sm:h-7 max-h-6 sm:max-h-7',
                          isEditing && 'z-10 bg-white shadow-sm ring-1 ring-emerald-500',
                          // Memory styles
                          !isEditing && hasMemory && 'bg-emerald-50/30 border-l-[3px] border-emerald-500 pl-1',
                          !isEditing && !hasMemory && 'hover:bg-zinc-50'
                        )}
                        onClick={() => !isEditing && handleCellClick(dayData.dateStr)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            ref={inputRef}
                            autoFocus
                            value={editingMemory}
                            onChange={(e) => setEditingMemory(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="Type..."
                            className={cn(
                              'w-full h-full px-1.5 py-0 text-xs leading-none',
                              'focus:outline-none focus:bg-white',
                              'text-zinc-900 placeholder-zinc-400 bg-transparent font-medium'
                            )}
                          />
                        ) : (
                          <div className="h-6 sm:h-7 px-1.5 py-0.5 overflow-hidden flex items-center">
                            {hasMemory && (
                              <div className="text-xs leading-snug text-zinc-700 line-clamp-1 font-medium">
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
  )
}
