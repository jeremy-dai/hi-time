import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock, CategoryKey } from '../../types/time'
import type { CalendarEvent } from '../../utils/eventTransform'
import type { UserSettings } from '../../api'
import { blocksToEvents } from '../../utils/eventTransform'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { cn } from '../../utils/classNames'
import { TIME_SLOTS } from '../../constants/timesheet'
import { CATEGORY_SHORT_NAMES } from '../../constants/colors'

interface CalendarViewProps {
  weekData: TimeBlock[][]
  onUpdateBlock: (day: number, timeIndex: number, block: TimeBlock) => void
  referenceData?: TimeBlock[][] | null
  weekStartDate?: Date
  userSettings?: UserSettings
}

export function CalendarView({ weekData, onUpdateBlock, referenceData, weekStartDate, userSettings }: CalendarViewProps) {
  // State management
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())
  const [copiedBlocks, setCopiedBlocks] = useState<TimeBlock[]>([])
  const [editing, setEditing] = useState<{ day: number; timeIndex: number } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; day: number; timeIndex: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; timeIndex: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: number; timeIndex: number } | null>(null)

  // Transform blocks to events for rendering
  const events = useMemo(
    () => blocksToEvents(weekData, referenceData),
    [weekData, referenceData]
  )

  // Calculate day completion status
  const dayAllCategorized = useMemo(() => {
    const status: boolean[] = []
    for (let day = 0; day < 7; day++) {
      let all = true
      for (let i = 0; i < TIME_SLOTS.length; i++) {
        const b = weekData[day]?.[i]
        if (!b || !b.category) {
          all = false
          break
        }
      }
      status.push(all)
    }
    return status
  }, [weekData])

  // Get subcategories for a category (for context menu)
  const getSubcategoriesFor = (category: string) => {
    // Start with user defined settings
    const defined = userSettings?.subcategories?.[category] || []
    const set = new Set<string>(defined)
    
    // Also include existing data to avoid hiding used subcategories
    weekData.forEach(dayArr => {
      dayArr.forEach(b => {
        if (b.category === category && b.subcategory) set.add(b.subcategory)
      })
    })
    if (referenceData) {
      referenceData.forEach(dayArr => {
        dayArr.forEach(b => {
          if (b && b.category === category && b.subcategory) set.add(b.subcategory)
        })
      })
    }
    return Array.from(set).sort().slice(0, 20)
  }

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    // Select all time slots covered by this event
    const next = new Set<string>()
    for (let i = 0; i < event.duration; i++) {
      next.add(`${event.day}-${event.startTimeIndex + i}`)
    }
    setSelectedBlocks(next)
  }

  const handleEventContextMenu = (e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, day: event.day, timeIndex: event.startTimeIndex })
  }

  const handleEventDoubleClick = (event: CalendarEvent) => {
    if (event.isGhost) {
      // Activate ghost event
      activateGhostEvent(event)
    } else {
      // Edit notes
      setEditing({ day: event.day, timeIndex: event.startTimeIndex })
    }
  }

  const activateGhostEvent = (event: CalendarEvent) => {
    // Convert all time slots covered by the ghost event to real events
    for (let i = 0; i < event.duration; i++) {
      const timeIndex = event.startTimeIndex + i
      const block: TimeBlock = {
        id: `${event.day}-${timeIndex}`,
        time: TIME_SLOTS[timeIndex],
        day: event.day,
        category: event.category,
        subcategory: event.subcategory,
        notes: event.notes
      }
      onUpdateBlock(event.day, timeIndex, block)
    }
    // Ghost will disappear on next render
  }

  const handleNotesChange = (event: CalendarEvent, notes: string) => {
    // Update notes for all time slots covered by the event
    for (let i = 0; i < event.duration; i++) {
      const timeIndex = event.startTimeIndex + i
      const block = weekData[event.day]?.[timeIndex] || {
        id: `${event.day}-${timeIndex}`,
        time: TIME_SLOTS[timeIndex],
        day: event.day,
        category: event.category,
        subcategory: event.subcategory,
        notes: ''
      }
      onUpdateBlock(event.day, timeIndex, { ...block, notes })
    }
  }

  // Drag selection handlers
  const handleDayMouseDown = (day: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const timeIndex = Math.floor(y / 48) // 48px per slot
    const clampedIndex = Math.max(0, Math.min(31, timeIndex))

    setIsDragging(true)
    setDragStart({ day, timeIndex: clampedIndex })
    setDragCurrent({ day, timeIndex: clampedIndex })

    const id = `${day}-${clampedIndex}`
    setSelectedBlocks(new Set([id]))
  }

  const handleDayMouseMove = (day: number, e: React.MouseEvent) => {
    if (!isDragging || !dragStart || dragStart.day !== day) return

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const timeIndex = Math.floor(y / 48)
    const clampedIndex = Math.max(0, Math.min(31, timeIndex))

    setDragCurrent({ day, timeIndex: clampedIndex })

    // Update selection
    const minIdx = Math.min(dragStart.timeIndex, clampedIndex)
    const maxIdx = Math.max(dragStart.timeIndex, clampedIndex)
    const next = new Set<string>()
    for (let i = minIdx; i <= maxIdx; i++) {
      next.add(`${day}-${i}`)
    }
    setSelectedBlocks(next)
  }

  const handleDayMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
  }

  useEffect(() => {
    const onUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
        setDragCurrent(null)
      }
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [isDragging])

  // Copy/paste handlers
  const handleCopy = () => {
    const blocksToCopy: TimeBlock[] = []
    selectedBlocks.forEach(blockId => {
      const [day, timeIndex] = blockId.split('-').map(Number)
      let block = weekData[day]?.[timeIndex]
      if (block && !block.category && referenceData) {
        const ghost = referenceData[day]?.[timeIndex]
        if (ghost && ghost.category) {
          block = { ...ghost, id: `${day}-${timeIndex}`, day, time: ghost.time }
        }
      }
      if (block) {
        blocksToCopy.push(block)
      }
    })
    setCopiedBlocks(blocksToCopy)
    setSelectedBlocks(new Set())
  }

  const handlePaste = (targetDay: number, targetTimeIndex: number) => {
    if (copiedBlocks.length === 0) return

    copiedBlocks.forEach((copiedBlock, index) => {
      const newTimeIndex = targetTimeIndex + index
      if (newTimeIndex < TIME_SLOTS.length) {
        const newBlock: TimeBlock = {
          ...copiedBlock,
          id: `${targetDay}-${newTimeIndex}`,
          day: targetDay,
          time: TIME_SLOTS[newTimeIndex]
        }
        onUpdateBlock(targetDay, newTimeIndex, newBlock)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c' && selectedBlocks.size > 0) {
        e.preventDefault()
        handleCopy()
      } else if (e.key === 'v' && copiedBlocks.length > 0) {
        e.preventDefault()
        const selectedArray = Array.from(selectedBlocks)
        const target = selectedArray.length === 1 ? selectedArray[0] : selectedArray[selectedArray.length - 1]
        if (target) {
          const [day, timeIndex] = target.split('-').map(Number)
          handlePaste(day, timeIndex)
        }
      }
    }
  }

  // Context menu handlers
  const applyCategoryToSelected = (category: string) => {
    selectedBlocks.forEach(id => {
      const [day, timeIndex] = id.split('-').map(Number)
      const base = weekData[day]?.[timeIndex]
      const updated: TimeBlock = {
        id,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory: category ? CATEGORY_SHORT_NAMES[category as CategoryKey] : '',
        notes: base?.notes || ''
      }
      onUpdateBlock(day, timeIndex, updated)
    })
    setSelectedBlocks(new Set())
  }

  const applyCategorySubToSelected = (category: string, subcategory: string) => {
    selectedBlocks.forEach(id => {
      const [day, timeIndex] = id.split('-').map(Number)
      const base = weekData[day]?.[timeIndex]
      const updated: TimeBlock = {
        id,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory,
        notes: base?.notes || ''
      }
      onUpdateBlock(day, timeIndex, updated)
    })
    setSelectedBlocks(new Set())
  }

  const handleChooseCategoryFromMenu = (category: string) => {
    if (!menu) return
    if (selectedBlocks.size > 0) {
      applyCategoryToSelected(category)
    } else {
      const { day, timeIndex } = menu
      const id = `${day}-${timeIndex}`
      const updated: TimeBlock = {
        id,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory: category ? CATEGORY_SHORT_NAMES[category as CategoryKey] : '',
        notes: weekData[day]?.[timeIndex]?.notes || ''
      }
      onUpdateBlock(day, timeIndex, updated)
    }
    setMenu(null)
  }

  const handleChooseSubcategoryFromMenu = (category: string, subcategory: string) => {
    if (!menu) return
    if (selectedBlocks.size > 0) {
      applyCategorySubToSelected(category, subcategory)
    } else {
      const { day, timeIndex } = menu
      const id = `${day}-${timeIndex}`
      const updated: TimeBlock = {
        id,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory,
        notes: weekData[day]?.[timeIndex]?.notes || ''
      }
      onUpdateBlock(day, timeIndex, updated)
    }
    setMenu(null)
  }

  // Selection rect for visualization
  const selectionRect = isDragging && dragStart && dragCurrent && dragStart.day === dragCurrent.day
    ? { day: dragStart.day, startIndex: dragStart.timeIndex, currentIndex: dragCurrent.timeIndex }
    : null

  return (
    <div
      className={cn(
        'rounded-xl shadow-lg p-6 border',
        'bg-white dark:bg-[hsl(var(--color-dark-surface))]',
        'dark:border-[hsl(var(--color-dark-border))]'
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="mb-6">
        <h2 className={cn('text-2xl font-bold mb-4', 'text-gray-900 dark:text-gray-100')}>Weekly Calendar</h2>
        <div className={cn('mt-4 flex gap-2 text-sm', 'text-gray-600 dark:text-gray-300')}>
          <span>Click event to select • Right-click to change category • Double-click to edit or activate ghost • Cmd/Ctrl+C to copy • Cmd/Ctrl+V to paste</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <CalendarHeader weekStartDate={weekStartDate} dayAllCategorized={dayAllCategorized} />

          {/* Calendar Grid */}
          <CalendarGrid
            events={events}
            selectedBlocks={selectedBlocks}
            editingBlock={editing}
            onEventClick={handleEventClick}
            onEventContextMenu={handleEventContextMenu}
            onEventDoubleClick={handleEventDoubleClick}
            onNotesChange={handleNotesChange}
            onFinishEdit={() => setEditing(null)}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseMove={handleDayMouseMove}
            onDayMouseUp={handleDayMouseUp}
            selectionRect={selectionRect}
          />
        </div>
      </div>

      {/* Legend */}
      <div className={cn('mt-6 p-4 rounded-lg border', 'bg-gray-50 dark:bg-gray-900', 'dark:border-[hsl(var(--color-dark-border))]')}>
        <h3 className={cn('text-sm font-medium mb-2', 'text-gray-900 dark:text-gray-100')}>Category Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded"></div>
            <span>Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-500 rounded"></div>
            <span>Productive Work</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
            <span>Guilty Free Play</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></div>
            <span>Procrastination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-700 dark:bg-orange-600 rounded"></div>
            <span>Mandatory Work</span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-50 bg-white border rounded-lg shadow-md p-2 text-sm min-w-[180px] dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))]"
        >
          <div className="px-2 py-1 font-medium">Change category</div>
          <div className="flex flex-col p-1">
            {['R', 'P', 'W', 'M', 'G', ''].map(k => {
              const subs = k ? getSubcategoriesFor(k) : []
              return (
                <div key={k} className="relative group">
                  <button
                    className="px-2 py-1 w-full text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleChooseCategoryFromMenu(k)}
                  >
                    {k || 'Empty'}
                  </button>
                  {subs.length > 0 && (
                    <div className="absolute left-full top-0 ml-2 hidden group-hover:block bg-white border rounded-lg shadow-md p-2 min-w-[200px] dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))]">
                      <div className="px-2 py-1 font-medium">Subcategory</div>
                      <div className="flex flex-col gap-1">
                        {subs.map(s => (
                          <button
                            key={s}
                            className="px-2 py-1 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleChooseSubcategoryFromMenu(k, s)}
                          >
                            {s}
                          </button>
                        ))}
                        <input
                          placeholder="Type new..."
                          className="mt-1 px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = (e.target as HTMLInputElement).value.trim()
                              if (v) handleChooseSubcategoryFromMenu(k, v)
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarView
