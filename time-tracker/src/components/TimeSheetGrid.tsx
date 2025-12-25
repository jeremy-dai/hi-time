import { useEffect, useMemo, useState } from 'react'
import type { TimeBlock, CategoryKey } from '../types/time'
import { TimeBlock as TimeBlockComponent } from './TimeBlock'
import { cn } from '../utils/classNames'
import { TIME_SLOTS, DAYS_SHORT } from '../constants/timesheet'
import { CATEGORY_LABELS } from '../constants/colors'

interface TimeSheetGridProps {
  weekData: TimeBlock[][]
  onUpdateBlock: (day: number, timeIndex: number, block: TimeBlock) => void
  referenceData?: TimeBlock[][] | null
  weekStartDate?: Date
}

export function TimeSheetGrid({ weekData, onUpdateBlock, referenceData, weekStartDate }: TimeSheetGridProps) {
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())
  const [copiedBlocks, setCopiedBlocks] = useState<TimeBlock[]>([])
  const [editing, setEditing] = useState<{ day: number; timeIndex: number } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; day: number; timeIndex: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; timeIndex: number } | null>(null)

  const timeSlots = TIME_SLOTS
  const days = DAYS_SHORT
  const dayLabels = days.map((d, i) => {
    if (!weekStartDate) return d
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + i)
    return `${d} ${date.getDate()}`
  })


  const handleBlockDoubleClick = (day: number, timeIndex: number) => {
    setEditing({ day, timeIndex })
  }

  const handleBlockRightClick = (e: React.MouseEvent, day: number, timeIndex: number) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, day, timeIndex })
  }

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
      if (newTimeIndex < timeSlots.length) {
        const newBlock: TimeBlock = {
          ...copiedBlock,
          id: `${targetDay}-${newTimeIndex}`,
          day: targetDay,
          time: timeSlots[newTimeIndex]
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

    // Quick category switching functionality removed (selectedCategory state was removed)
  }

  const applyCategoryToSelected = (category: string) => {
    selectedBlocks.forEach(id => {
      const [day, timeIndex] = id.split('-').map(Number)
      const base = weekData[day]?.[timeIndex]
      const updated: TimeBlock = {
        id,
        time: timeSlots[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory: category ? CATEGORY_LABELS[category as CategoryKey] : '',
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
        time: timeSlots[timeIndex],
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
        time: timeSlots[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory: category ? CATEGORY_LABELS[category as CategoryKey] : '',
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
        time: timeSlots[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory,
        notes: weekData[day]?.[timeIndex]?.notes || ''
      }
      onUpdateBlock(day, timeIndex, updated)
    }
    setMenu(null)
  }

  const getSubcategoriesFor = (category: string) => {
    const set = new Set<string>()
    weekData.forEach(dayArr => {
      dayArr.forEach(b => {
        if (b.category === category && b.subcategory) {
            const s = b.subcategory
            const sStr = typeof s === 'string' ? s : s.name
            if (sStr) set.add(sStr)
        }
      })
    })
    if (referenceData) {
      referenceData.forEach(dayArr => {
        dayArr.forEach(b => {
            if (b && b.category === category && b.subcategory) {
                const s = b.subcategory
                const sStr = typeof s === 'string' ? s : s.name
                if (sStr) set.add(sStr)
            }
        })
      })
    }
    return Array.from(set).slice(0, 12)
  }

  const handleBlockMouseDown = (day: number, timeIndex: number) => {
    setIsDragging(true)
    setDragStart({ day, timeIndex })
    const id = `${day}-${timeIndex}`
    setSelectedBlocks(new Set([id]))
  }

  const handleBlockMouseEnter = (day: number, timeIndex: number) => {
    if (!isDragging || !dragStart) return
    const minDay = Math.min(dragStart.day, day)
    const maxDay = Math.max(dragStart.day, day)
    const minIdx = Math.min(dragStart.timeIndex, timeIndex)
    const maxIdx = Math.max(dragStart.timeIndex, timeIndex)
    const next = new Set<string>()
    for (let d = minDay; d <= maxDay; d++) {
      for (let i = minIdx; i <= maxIdx; i++) {
        next.add(`${d}-${i}`)
      }
    }
    setSelectedBlocks(next)
  }

  const handleBlockMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  useEffect(() => {
    const onUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
      }
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [isDragging])
  
  const groupKey = (b: TimeBlock) => `${b.category}||${b.subcategory}||${(b.notes || '').trim()}`
  const dayGroups = useMemo(() => {
    const result: Array<Array<{ start: number; span: number; block: TimeBlock }>> = []
    for (let day = 0; day < 7; day++) {
      const arr: { start: number; span: number; block: TimeBlock }[] = []
      const dayBlocks = weekData[day] || []
      let i = 0
      while (i < timeSlots.length) {
        const b = dayBlocks[i] || {
          id: `${day}-${i}`,
          time: timeSlots[i],
          day,
          category: '',
          subcategory: '',
          notes: ''
        }
        const key = groupKey(b)
        if (!b.category || !b.subcategory) {
          arr.push({ start: i, span: 1, block: b })
          i++
          continue
        }
        let j = i + 1
        while (j < timeSlots.length) {
          const nb = dayBlocks[j] || {
            id: `${day}-${j}`,
            time: timeSlots[j],
            day,
            category: '',
            subcategory: '',
            notes: ''
          }
          if (groupKey(nb) !== key) break
          j++
        }
        arr.push({ start: i, span: j - i, block: b })
        i = j
      }
      result.push(arr)
    }
    return result
  }, [weekData, timeSlots])
  const dayAllCategorized = useMemo(() => {
    const status: boolean[] = []
    for (let day = 0; day < 7; day++) {
      let all = true
      for (let i = 0; i < timeSlots.length; i++) {
        const b = weekData[day]?.[i]
        if (!b || !b.category) {
          all = false
          break
        }
      }
      status.push(all)
    }
    return status
  }, [weekData, timeSlots])
  return (
    <div className={cn('rounded-xl shadow-lg p-6 border', 'bg-white dark:bg-[hsl(var(--color-dark-surface))]', 'dark:border-[hsl(var(--color-dark-border))]')} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="mb-6">
        <h2 className={cn('text-2xl font-bold mb-4', 'text-gray-900 dark:text-gray-100')}>Weekly Timesheet</h2>
        <div className={cn('mt-4 flex gap-2 text-sm', 'text-gray-600 dark:text-gray-300')}>
          <span>Click to select • Right-click to change category • Double-click to edit • Cmd/Ctrl+C to copy • Cmd/Ctrl+V to paste</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-8 gap-1 mb-0 sticky top-0 z-10">
            <div className={cn('text-center font-medium p-2 backdrop-blur-sm', 'text-gray-700 dark:text-gray-200')}>Time</div>
            {dayLabels.map((label, i) => (
              <div key={label} className={cn('text-center font-medium p-2 backdrop-blur-sm', 'text-gray-700 dark:text-gray-200')}>
                <span>{label}</span>
                <span className={cn('ml-1 inline-block align-middle w-1.5 h-1.5 rounded-full', dayAllCategorized[i] ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600')} />
              </div>
            ))}
          </div>

          {/* Day columns with vertical merging */}
          <div className="grid grid-cols-8 gap-1">
            <div className="grid" style={{ gridTemplateRows: `repeat(${timeSlots.length}, 48px)` }}>
              {timeSlots.map((time) => (
                <div key={time} className={cn('text-center text-sm p-1 font-medium sticky left-0 z-10 backdrop-blur-sm', 'text-gray-600 dark:text-gray-300')}>
                  {time}
                </div>
              ))}
            </div>
            {days.map((_, day) => (
              <div key={day} className="grid" style={{ gridTemplateRows: `repeat(${timeSlots.length}, 48px)` }}>
                {dayGroups[day].map(({ start, span, block }) => {
                  const ghost = referenceData ? referenceData[day]?.[start] : null
                  const isAnySelected = (() => {
                    for (let i = start; i < start + span; i++) {
                      if (selectedBlocks.has(`${day}-${i}`)) return true
                    }
                    return false
                  })()
                  return (
                    <div key={`${day}-${start}-g`} style={{ gridRow: `${start + 1} / span ${span}` }}>
                      <TimeBlockComponent
                        block={block}
                        ghost={ghost || null}
                        isSelected={isAnySelected}
                        onClick={() => {
                          const next = new Set<string>()
                          for (let i = start; i < start + span; i++) next.add(`${day}-${i}`)
                          setSelectedBlocks(next)
                        }}
                        onContextMenu={(e) => handleBlockRightClick(e, day, start)}
                        onDoubleClick={() => handleBlockDoubleClick(day, start)}
                        isEditing={editing?.day === day && editing?.timeIndex === start}
                        onNotesChange={(notes) => {
                          for (let i = start; i < start + span; i++) {
                            const b = weekData[day]?.[i] || { ...block, id: `${day}-${i}`, time: timeSlots[i], day }
                            onUpdateBlock(day, i, { ...b, notes })
                          }
                        }}
                        onFinishEdit={() => setEditing(null)}
                        onMouseDown={() => handleBlockMouseDown(day, start)}
                        onMouseEnter={() => handleBlockMouseEnter(day, start)}
                        onMouseUp={() => handleBlockMouseUp()}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={cn('mt-6 p-4 rounded-lg', 'bg-gray-50 dark:bg-gray-900')}>
        <h3 className={cn('text-sm font-medium mb-2', 'text-gray-900 dark:text-gray-100')}>Category Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            { key: 'R' as CategoryKey, colorClass: 'bg-green-500 dark:bg-green-600' },
            { key: 'W' as CategoryKey, colorClass: 'bg-yellow-400 dark:bg-yellow-500' },
            { key: 'G' as CategoryKey, colorClass: 'bg-blue-500 dark:bg-blue-600' },
            { key: 'P' as CategoryKey, colorClass: 'bg-red-500 dark:bg-red-600' },
            { key: 'M' as CategoryKey, colorClass: 'bg-orange-700 dark:bg-orange-600' }
          ].map(({ key, colorClass }) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${colorClass} rounded`}></div>
              <span>{CATEGORY_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>

      

      {menu && (
        <div style={{ top: menu.y, left: menu.x }} className="fixed z-50 bg-white border rounded-lg shadow-md p-2 text-sm min-w-[180px] dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))]">
          <div className="px-2 py-1 font-medium">Change category</div>
          <div className="flex flex-col p-1">
            {['R','P','W','M','G',''].map(k => {
              const subs = k ? getSubcategoriesFor(k) : []
              return (
                <div key={k} className="relative group">
                  <button className="px-2 py-1 w-full text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleChooseCategoryFromMenu(k)}>
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

export default TimeSheetGrid
