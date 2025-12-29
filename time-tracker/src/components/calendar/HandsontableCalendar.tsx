/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useMemo, useState, useEffect, Fragment } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import Handsontable from 'handsontable'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import type { TimeBlock, CategoryKey, SubcategoryRef } from '../../types/time'
import { CATEGORY_KEYS } from '../../types/time'
import type { UserSettings } from '../../api'
import { TIME_SLOTS, DAYS_SHORT } from '../../constants/timesheet'
import { CATEGORY_LABELS, CATEGORY_COLORS_HEX, GHOST_CATEGORY_COLORS_HEX, SUBCATEGORY_SHADES_HEX } from '../../constants/colors'
import { getSubcategoryName, getSubcategoryIndex, normalizeSubcategories } from '../../utils/subcategoryHelpers'

// Register Handsontable modules
registerAllModules()

// Custom editor for notes
class NotesEditor extends Handsontable.editors.TextEditor {
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement, originalValue: any, cellProperties: any) {
    // Extract notes from the cell value object
    const notes = originalValue?.notes || ''
    super.prepare(row, col, prop, td, notes, cellProperties)
  }

  saveValue(value: any) {
    const hot = this.hot
    const row = this.row
    const col = this.col

    // Get the current cell value
    const currentValue = hot.getDataAtCell(row, col)

    // Update only the notes field
    const newValue = {
      ...currentValue,
      notes: value[0][0] // The edited value
    }

    hot.setDataAtCell(row, col, newValue, 'edit')
  }
}

// Register the custom editor
Handsontable.editors.registerEditor('notes', NotesEditor)

interface HandsontableCalendarProps {
  weekData: TimeBlock[][]
  currentDate: Date
  onUpdateBlock: (day: number, timeIndex: number, block: TimeBlock) => void
  onUpdateBlocks?: (updates: { day: number, timeIndex: number, block: TimeBlock }[]) => void
  referenceData?: TimeBlock[][] | null
  userSettings?: UserSettings
  timezone?: string
}

export function HandsontableCalendar({
  weekData,
  currentDate,
  onUpdateBlock,
  onUpdateBlocks,
  referenceData,
  userSettings,
  timezone = 'Asia/Shanghai'
}: HandsontableCalendarProps) {
  const hotRef = useRef<any>(null)
  const ROW_HEIGHT = 28
  const HEADER_HEIGHT = 36
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    row: number
    col: number
  } | null>(null)
  const savedSelectionRef = useRef<number[][] | null>(null)
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null)
  const [currentTimeString, setCurrentTimeString] = useState<string>('')
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean
    content: string
    x: number
    y: number
  } | null>(null)
  const previousTimeCellRef = useRef<HTMLElement | null>(null)

  // Calculate current time indicator position
  useEffect(() => {
    const calculatePosition = () => {
      // Check if currentDate is in the current week
      const now = new Date()
      const tz = timezone || 'Asia/Shanghai'

      // Get the start of the current week (Sunday) in UTC
      const currentWeekStart = new Date(now)
      const currentDayOfWeek = currentWeekStart.getUTCDay() // 0 is Sunday in UTC
      const utcCurrentWeekStart = new Date(Date.UTC(
        currentWeekStart.getUTCFullYear(),
        currentWeekStart.getUTCMonth(),
        currentWeekStart.getUTCDate()
      ))
      utcCurrentWeekStart.setUTCDate(utcCurrentWeekStart.getUTCDate() - currentDayOfWeek)

      // Get the start of the displayed week (Sunday) in UTC
      const displayedWeekStart = new Date(currentDate)
      const displayedDayOfWeek = displayedWeekStart.getUTCDay()
      const utcDisplayedWeekStart = new Date(Date.UTC(
        displayedWeekStart.getUTCFullYear(),
        displayedWeekStart.getUTCMonth(),
        displayedWeekStart.getUTCDate()
      ))
      utcDisplayedWeekStart.setUTCDate(utcDisplayedWeekStart.getUTCDate() - displayedDayOfWeek)

      // Compare if both weeks start on the same date (using UTC)
      const isCurrentWeek = utcCurrentWeekStart.getTime() === utcDisplayedWeekStart.getTime()

      // If not current week, hide indicator
      if (!isCurrentWeek) {
        setCurrentTimePosition(null)
        return
      }

      // Get current time in the specified timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const parts = formatter.formatToParts(now)
      const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
      const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
      const seconds = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10)

      const currentTimeInMinutes = hours * 60 + minutes + seconds / 60

      // Store the formatted time string for display
      setCurrentTimeString(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)

      // Use actual time data from weekData (any day will have the same time slots)
      const timeSlots = weekData[0] || []

      // Find the position within the time slots
      for (let i = 0; i < timeSlots.length; i++) {
        const slotTime = timeSlots[i]?.time
        if (!slotTime) continue

        const [slotHours, slotMinutes] = slotTime.split(':').map(Number)
        const slotStartMinutes = slotHours * 60 + slotMinutes

        // Get next slot time for range checking
        const nextSlotTime = i < timeSlots.length - 1 ? timeSlots[i + 1]?.time : null
        if (!nextSlotTime) continue

        const [nextHours, nextMins] = nextSlotTime.split(':').map(Number)
        let nextSlotMinutes = nextHours * 60 + nextMins

        // Normalize slot times - handle midnight crossing
        let slotStart = slotStartMinutes
        let slotEnd = nextSlotMinutes
        
        // If next slot is earlier, we crossed midnight (e.g., 23:30 -> 00:00)
        if (nextSlotMinutes < slotStartMinutes) {
          slotEnd = nextSlotMinutes + 24 * 60
        }

        // Normalize current time for comparison
        let currentTime = currentTimeInMinutes
        
        // If slot crosses midnight, check if current time is in the morning part
        if (nextSlotMinutes < slotStartMinutes) {
          // Slot crosses midnight: it goes from evening (e.g., 23:30) to next day (e.g., 00:00)
          // If current time is before the slot start, it might be in the morning part
          if (currentTime < slotStartMinutes) {
            // Current time could be in the morning part (00:00 - nextSlotMinutes)
            // or it's earlier in the day (not in this slot)
            if (currentTime < nextSlotMinutes) {
              // Current time is in the morning part of this slot
              currentTime += 24 * 60
            } else {
              // Current time is not in this slot
              continue
            }
          }
          // If currentTime >= slotStartMinutes, it's in the evening part, compare normally
        }

        // Check if current time falls within this slot
        if (currentTime >= slotStart && currentTime < slotEnd) {
          // Debug: log to verify row index
          console.log(`Current time ${hours}:${minutes} is in slot ${slotTime} to ${nextSlotTime}, row index: ${i}`)

          // Get the row directly from the DOM by index
          const tbody = document.querySelector('.ht_master .htCore tbody')
          const rows = tbody?.querySelectorAll('tr')

          if (rows && rows[i]) {
            // Calculate position by summing heights of all previous rows
            let totalHeight = 0
            for (let r = 0; r < i; r++) {
              totalHeight += (rows[r] as HTMLElement).offsetHeight
            }

            // Position in the middle of the current row for better visual clarity
            const currentRowHeight = (rows[i] as HTMLElement).offsetHeight
            totalHeight += currentRowHeight / 2

            setCurrentTimePosition(totalHeight)
            return
          }

          // Fallback: use simple calculation
          setCurrentTimePosition(i * ROW_HEIGHT)
          return
        }
      }

      // If current time is outside the range, hide indicator
      setCurrentTimePosition(null)
    }

    calculatePosition()
    // Update every 5 minutes
    const interval = setInterval(calculatePosition, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [weekData, timezone, currentDate])

  // Transform weekData (7 days × 32 slots) to Handsontable format (32 rows × 8 cols)
  const tableData = useMemo(() => {
    return TIME_SLOTS.map((time, timeIndex) => {
      const row: any = { time }
      for (let day = 0; day < 7; day++) {
        const block = weekData[day]?.[timeIndex]
        const ghost = referenceData?.[day]?.[timeIndex]
        // A cell is ghost only if it has NO real data (no category AND no notes) but has ghost data
        const hasRealData = block?.category || block?.notes
        row[`day${day}`] = {
          category: block?.category || '',
          subcategory: block?.subcategory || '',
          notes: block?.notes || '',
          isGhost: !hasRealData && ghost?.category ? true : false,
          ghostCategory: ghost?.category || '',
          ghostSubcategory: ghost?.subcategory || '',
          ghostNotes: ghost?.notes || ''
        }
      }
      return row
    })
  }, [weekData, referenceData])

  // Day headers with completion status
  const dayHeaders = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Get the start of the week (Sunday)
    const weekStart = new Date(currentDate)
    const dayOfWeek = weekStart.getDay() // 0 is Sunday
    weekStart.setDate(weekStart.getDate() - dayOfWeek)

    return days.map((day, idx) => {
      const dayDate = new Date(weekStart)
      dayDate.setDate(weekStart.getDate() + idx)
      const dateNum = dayDate.getDate()

      const allCategorized = weekData[idx]?.every(block => block.category)
      return `${day} ${dateNum}${allCategorized ? ' ✓' : ''}`
    })
  }, [weekData, currentDate])

  // Custom cell renderer
  const customRenderer = (
    _instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    _prop: string | number,
    value: any
  ) => {
    // Clear existing content
    td.innerHTML = ''
    td.className = 'htCustomCell'
    td.style.padding = '1px' // Reduced padding to allow inner container to fill more
    td.style.position = 'relative'
    td.style.verticalAlign = 'middle'
    td.style.height = '28px' // Slightly taller for block look
    td.style.minHeight = '28px'
    td.style.maxHeight = '28px'
    td.style.overflow = 'hidden'
    td.style.border = 'none' // Remove cell borders for cleaner look

    // Check if this row should have a time divider above it
    const actualRowTime = weekData[0]?.[row]?.time
    const timeDividers = userSettings?.timeDividers || []
    const hasDivider = actualRowTime && timeDividers.includes(actualRowTime)

    // Apply time divider styling - thicker gray dashed line
    if (hasDivider) {
      td.style.borderTop = '2px dashed rgba(100, 116, 139, 0.5)'
      // No paddingTop to avoid affecting cell size
    }

    if (col === 0) {
      // Time column - selection indicator will be added via DOM manipulation
      // Create container for time and indicator
      const container = document.createElement('div')
      container.className = 'time-cell-container'
      container.style.display = 'flex'
      container.style.alignItems = 'center'
      container.style.justifyContent = 'flex-end'
      container.style.gap = '4px'
      container.style.paddingRight = '8px'

      // Time text
      const timeText = document.createElement('span')
      timeText.className = 'time-text'
      timeText.textContent = value
      timeText.style.fontWeight = '500'
      timeText.style.color = '#9ca3af'
      timeText.style.fontSize = '10px'

      container.appendChild(timeText)
      td.appendChild(container)

      td.style.backgroundColor = 'transparent'
      return td
    }

    // Data cell
    const cellData = value || { category: '', subcategory: '', notes: '', isGhost: false }
    const category = cellData.isGhost ? cellData.ghostCategory : cellData.category
    const subcategoryRaw = cellData.isGhost ? cellData.ghostSubcategory : cellData.subcategory
    const notes = cellData.isGhost ? cellData.ghostNotes : cellData.notes
    const isGhost = cellData.isGhost

    // Get subcategory name and index using helper functions
    const subcategory = getSubcategoryName(subcategoryRaw)
    const subcategoryIndex = getSubcategoryIndex(subcategoryRaw)

    // Colors
    const colorMap = isGhost ? GHOST_CATEGORY_COLORS_HEX : CATEGORY_COLORS_HEX
    const colors = colorMap[category as keyof typeof CATEGORY_COLORS_HEX] || colorMap['']
    
    // Create inner block container
    const block = document.createElement('div')
    block.style.width = '100%'
    block.style.height = '100%'
    block.style.borderRadius = '6px' // Rounded corners for block look
    block.style.display = 'flex'
    block.style.alignItems = 'center'
    block.style.overflow = 'hidden'
    block.style.position = 'relative'
    
    // Apply background only if there is a category
    if (category) {
      block.style.backgroundColor = colors.bg
      block.style.color = colors.text
      // Add subtle shadow for "card" effect
      block.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
    } else {
      block.style.backgroundColor = 'transparent'
    }

    // Ghost styling
    if (isGhost) {
      block.style.border = `1px dashed ${colors.text}`
      block.style.opacity = '0.7'
    }

    // Subcategory Indicator (Thick bar on left)
    if (category && subcategory) {
      const shades = SUBCATEGORY_SHADES_HEX[category as keyof typeof SUBCATEGORY_SHADES_HEX] || SUBCATEGORY_SHADES_HEX['']
      const indicatorColor = shades[subcategoryIndex % shades.length]
      
      const indicator = document.createElement('div')
      indicator.style.position = 'absolute'
      indicator.style.left = '0'
      indicator.style.top = '0'
      indicator.style.bottom = '0'
      indicator.style.width = '33%'
      indicator.style.backgroundColor = indicatorColor
      indicator.style.zIndex = '1' // Indicator ON TOP of background but BELOW text
      indicator.style.opacity = '0.45'
      block.appendChild(indicator)
    }

    // Content container
    const content = document.createElement('div')
    content.style.flex = '1'
    content.style.minWidth = '0' // Allow truncation
    content.style.fontSize = '12px'
    content.style.whiteSpace = 'nowrap'
    content.style.overflow = 'hidden'
    content.style.textOverflow = 'ellipsis'
    content.style.position = 'relative'
    content.style.zIndex = '2' // Text sits ON TOP of everything
    content.style.paddingLeft = (category && subcategory) ? '10px' : (category ? '8px' : '0')
    
    if (subcategory && notes) {
      // Bold subcategory, normal notes
      const b = document.createElement('strong')
      b.textContent = subcategory
      content.appendChild(b)
      content.appendChild(document.createTextNode(` - ${notes}`))
    } else if (subcategory) {
      const b = document.createElement('strong')
      b.textContent = subcategory
      content.appendChild(b)
    } else if (notes) {
      content.textContent = notes
    }

    if (category) {
       block.appendChild(content)
       td.appendChild(block)
    }
    
    return td
  }

  const afterGetColHeader = (col: number, th: HTMLTableCellElement) => {
    if (!th) return
    th.classList.add('hiTimeColHeader')
    if (col === 0) {
      th.classList.add('hiTimeColHeaderTime')
    } else {
      th.classList.add('hiTimeColHeaderDay')
    }
    if (th.textContent?.includes('✓')) {
      th.classList.add('hiTimeColHeaderComplete')
    } else {
      th.classList.remove('hiTimeColHeaderComplete')
    }
  }

  // Column configuration
  const columns = useMemo(() => {
    const cols: any[] = [
      {
        data: 'time',
        title: ' ', // Empty space to prevent default 'A'
        readOnly: true,
        width: 45,
        renderer: customRenderer
      }
    ]

    for (let day = 0; day < 7; day++) {
      cols.push({
        data: `day${day}`,
        title: dayHeaders[day],
        width: 110,
        renderer: customRenderer
      })
    }

    return cols
  }, [dayHeaders])

  // Handle cell changes (from paste or fill)
  const handleAfterChange = (changes: any, source: string) => {
    if (!changes || source === 'loadData') return

    const updates: { day: number; timeIndex: number; block: TimeBlock }[] = []

    changes.forEach(([row, prop, , newValue]: any) => {
      if (prop === 'time' || !prop.startsWith('day')) return

      const day = parseInt(prop.replace('day', ''))
      const timeIndex = row

      // If newValue is a string (from paste), parse it as category
      let category = ''
      let subcategory: SubcategoryRef | null = null
      let notes = ''

      if (typeof newValue === 'string') {
        // Simple paste: treat as category
        category = newValue
      } else if (newValue && typeof newValue === 'object') {
        // Extract only the actual data, not ghost/rendering metadata
        // If isGhost is true, we're copying from a ghost cell - use the ghost data
        // Otherwise use the regular data
        if (newValue.isGhost) {
          category = newValue.ghostCategory || ''
          subcategory = newValue.ghostSubcategory || null
          notes = newValue.ghostNotes || ''
        } else {
          category = newValue.category || ''
          subcategory = newValue.subcategory || null
          notes = newValue.notes || ''
        }
      }

      const block: TimeBlock = {
        id: `${day}-${timeIndex}`,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory,
        notes
      }

      updates.push({ day, timeIndex, block })
    })

    if (updates.length > 0) {
      if (onUpdateBlocks) {
        onUpdateBlocks(updates)
      } else {
        updates.forEach(u => onUpdateBlock(u.day, u.timeIndex, u.block))
      }
    }
  }

  // Context menu on right-click
  const handleContextMenu = (event: any, coords: any) => {
    if (coords.row < 0 || coords.col <= 0) return

    event.preventDefault()

    const hot = hotRef.current?.hotInstance
    if (!hot) return

    // Get the current selection before anything else
    const selected = hot.getSelected()
    let isInSelection = false

    if (selected && selected.length > 0) {
      // Check if the right-clicked cell is part of the current selection
      selected.forEach(([startRow, startCol, endRow, endCol]: number[]) => {
        const minRow = Math.min(startRow, endRow)
        const maxRow = Math.max(startRow, endRow)
        const minCol = Math.min(startCol, endCol)
        const maxCol = Math.max(startCol, endCol)

        if (coords.row >= minRow && coords.row <= maxRow &&
            coords.col >= minCol && coords.col <= maxCol) {
          isInSelection = true
        }
      })
    }

    // Save the selection or create a new one
    if (!isInSelection) {
      // Right-clicked outside selection - select just this cell
      hot.selectCell(coords.row, coords.col)
      savedSelectionRef.current = [[coords.row, coords.col, coords.row, coords.col]]
    } else {
      // Right-clicked within selection - save the current selection
      savedSelectionRef.current = selected
    }

    // Get viewport dimensions to prevent overflow
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = 220 // Approximate menu width
    const menuHeight = 300 // Approximate menu height

    let x = event.clientX
    let y = event.clientY

    // Adjust x if menu would overflow right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10
    }

    // Adjust y if menu would overflow bottom edge
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10
    }

    setContextMenu({
      x,
      y,
      row: coords.row,
      col: coords.col - 1 // Adjust for time column
    })
  }

  // Handle category selection from context menu
  const handleCategorySelect = (category: string, subcategoryName?: string, subcategoryIndex?: number) => {
    if (!contextMenu) return

    const hot = hotRef.current?.hotInstance
    if (!hot) return

    const { row, col } = contextMenu
    const day = col
    const timeIndex = row

    // Build subcategory ref if provided
    const subcategoryRef: SubcategoryRef | null = subcategoryName && subcategoryIndex !== undefined
      ? { index: subcategoryIndex, name: subcategoryName }
      : null

    // Use the saved selection instead of getting current selection
    const selected = savedSelectionRef.current

    if (selected && selected.length > 0) {
      const updates: { day: number; timeIndex: number; block: TimeBlock }[] = []

      // Handle selection range
      selected.forEach(([startRow, startCol, endRow, endCol]: number[]) => {
        const minRow = Math.min(startRow, endRow)
        const maxRow = Math.max(startRow, endRow)
        const minCol = Math.max(1, Math.min(startCol, endCol)) // Skip time column
        const maxCol = Math.max(startCol, endCol)

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const d = c - 1 // Adjust for time column
            const currentBlock = weekData[d]?.[r]

            const block: TimeBlock = {
              id: `${d}-${r}`,
              time: TIME_SLOTS[r],
              day: d,
              category: category as CategoryKey,
              subcategory: subcategoryRef,
              notes: currentBlock?.notes || ''
            }

            updates.push({ day: d, timeIndex: r, block })
          }
        }
      })

      if (updates.length > 0) {
        if (onUpdateBlocks) {
          onUpdateBlocks(updates)
        } else {
          updates.forEach(u => onUpdateBlock(u.day, u.timeIndex, u.block))
        }
      }
    } else {
      // Single cell update
      const currentBlock = weekData[day]?.[timeIndex]
      const block: TimeBlock = {
        id: `${day}-${timeIndex}`,
        time: TIME_SLOTS[timeIndex],
        day,
        category: category as CategoryKey,
        subcategory: subcategoryRef,
        notes: currentBlock?.notes || ''
      }

      onUpdateBlock(day, timeIndex, block)
    }

    // Clear saved selection and close menu
    savedSelectionRef.current = null
    setContextMenu(null)
  }

  // Track selected row for time indicator
  const handleAfterSelection = (row: number) => {
    const hot = hotRef.current?.hotInstance
    if (!hot) return

    // Clear previous indicator
    if (previousTimeCellRef.current) {
      const prevContainer = previousTimeCellRef.current.querySelector('.time-cell-container')
      const prevDot = prevContainer?.querySelector('.selection-dot')
      const prevText = prevContainer?.querySelector('.time-text') as HTMLElement

      if (prevDot) prevDot.remove()
      if (prevText) {
        prevText.style.fontWeight = '500'
        prevText.style.color = '#9ca3af'
      }
    }

    // Get the time cell for the selected row
    const timeCell = hot.getCell(row, 0)
    if (!timeCell) return

    // Add indicator to new selection
    const container = timeCell.querySelector('.time-cell-container')
    const timeText = container?.querySelector('.time-text') as HTMLElement

    if (container && timeText) {
      // Create blue dot
      const dot = document.createElement('div')
      dot.className = 'selection-dot'
      dot.style.width = '4px'
      dot.style.height = '4px'
      dot.style.borderRadius = '50%'
      dot.style.backgroundColor = '#3b82f6'

      // Insert dot before time text
      container.insertBefore(dot, timeText)

      // Update text styling
      timeText.style.fontWeight = '600'
      timeText.style.color = '#3b82f6'
    }

    // Store reference for next time
    previousTimeCellRef.current = timeCell
  }

  const handleAfterDeselect = () => {
    // Clear indicator from previous cell
    if (previousTimeCellRef.current) {
      const prevContainer = previousTimeCellRef.current.querySelector('.time-cell-container')
      const prevDot = prevContainer?.querySelector('.selection-dot')
      const prevText = prevContainer?.querySelector('.time-text') as HTMLElement

      if (prevDot) prevDot.remove()
      if (prevText) {
        prevText.style.fontWeight = '500'
        prevText.style.color = '#9ca3af'
      }

      previousTimeCellRef.current = null
    }
  }

  // Get subcategories for a category
  const getSubcategories = (category: string) => {
    return userSettings?.subcategories?.[category] || []
  }

  // Calculate summary totals for the week in pomodoros (one block = 1 pomodoro = 30 minutes)
  const summaryTotals = useMemo(() => {
    const totals: Record<
      string,
      {
        total: number
        perDay: number[]
        subcategories: Record<string, { total: number; perDay: number[]; index: number }>
      }
    > = {}
    const perDayTotals = Array(7).fill(0)

    const visibleSlots = TIME_SLOTS.length
    const limitedWeekData = weekData.slice(0, 7)

    limitedWeekData.forEach((dayData, dayIdx) => {
      dayData.slice(0, visibleSlots).forEach((block) => {
        if (block.category) {
          const category = block.category

          if (!totals[category]) {
            totals[category] = {
              total: 0,
              perDay: Array(7).fill(0),
              subcategories: {}
            }
          }

          totals[category].total += 1
          totals[category].perDay[dayIdx] += 1
          perDayTotals[dayIdx] += 1

          if (block.subcategory) {
            const subcategoryName = getSubcategoryName(block.subcategory)
            const subcategoryIndex = getSubcategoryIndex(block.subcategory)
            if (subcategoryName) {
              if (!totals[category].subcategories[subcategoryName]) {
                totals[category].subcategories[subcategoryName] = {
                  total: 0,
                  perDay: Array(7).fill(0),
                  index: subcategoryIndex
                }
              }
              totals[category].subcategories[subcategoryName].total += 1
              totals[category].subcategories[subcategoryName].perDay[dayIdx] += 1
            }
          }
        }
      })
    })

    const weekTotal = perDayTotals.reduce((sum, count) => sum + count, 0)

    return { totals, weekTotal, perDayTotals, visibleSlots }
  }, [weekData])

  // Cell configuration - enable notes editing
  const cellsConfig = (_row: number, col: number) => {
    if (col === 0) {
      return { readOnly: true } // Time column always readonly
    }
    return {
      editor: 'notes' // Use custom notes editor for double-click editing
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Handsontable */}
      <div className="flex-1 relative">
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div
            style={{
              position: 'absolute',
              top: `${currentTimePosition + HEADER_HEIGHT}px`,
              left: '0',
              right: '0',
              height: '0',
              borderTop: '2px solid rgba(249, 115, 22, 0.6)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            {/* Time label */}
            <div
              style={{
                position: 'absolute',
                left: '2px',
                top: '-9px',
                fontSize: '9px',
                fontWeight: '600',
                color: '#ea580c',
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {currentTimeString || (() => {
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: timezone,
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                })
                const parts = formatter.formatToParts(new Date())
                const hours = parts.find(p => p.type === 'hour')?.value || '00'
                const minutes = parts.find(p => p.type === 'minute')?.value || '00'
                return `${hours}:${minutes}`
              })()}
            </div>
          </div>
        )}
        <HotTable
          ref={hotRef}
          themeName="ht-theme-main"
          data={tableData}
          columns={columns}
          cells={cellsConfig}
          colHeaders={true}
          rowHeaders={false}
          height="auto"
          licenseKey="non-commercial-and-evaluation"
          fillHandle={true} // Enable drag-to-fill
          autoWrapRow={true}
          autoWrapCol={true}
          contextMenu={false} // We'll use custom context menu
          afterChange={handleAfterChange}
          afterOnCellContextMenu={handleContextMenu}
          afterGetColHeader={afterGetColHeader}
          afterSelection={handleAfterSelection}
          afterDeselect={handleAfterDeselect}
          afterOnCellMouseOver={(event, coords, td) => {
            // Skip tooltip updates during drag operations (drag and fill)
            // Check if any mouse button is pressed, which indicates dragging
            if (event.buttons !== 0) {
              return
            }

            // Skip headers and time column
            if (coords.row < 0 || coords.col <= 0) {
              setTooltipState(null)
              return
            }

            const day = coords.col - 1
            const timeIndex = coords.row
            const block = weekData[day]?.[timeIndex]
            const ghost = referenceData?.[day]?.[timeIndex]

            const hasRealData = block?.category || block?.notes
            const isGhost = !hasRealData && ghost?.category

            const subcategoryRaw = isGhost ? ghost.subcategory : block?.subcategory
            const notes = isGhost ? ghost.notes : block?.notes

            const tooltipParts = []
            const rowTime = weekData[0]?.[timeIndex]?.time
            if (rowTime) {
              const nextSlot = weekData[0]?.[timeIndex + 1]?.time
              const timeRange = nextSlot ? `${rowTime}-${nextSlot}` : rowTime
              tooltipParts.push(timeRange)
            }

            if (subcategoryRaw) {
              const subcategoryName = getSubcategoryName(subcategoryRaw)
              if (subcategoryName) tooltipParts.push(subcategoryName)
            }

            if (notes) tooltipParts.push(notes)

            const tooltipText = tooltipParts.join(' - ')
            if (tooltipText) {
              const rect = td.getBoundingClientRect()
              setTooltipState({
                visible: true,
                content: tooltipText,
                x: rect.left + rect.width / 2,
                y: rect.top - 8
              })
            } else {
              setTooltipState(null)
            }
          }}
          afterOnCellMouseOut={() => setTooltipState(null)}
          className="htCenter hiTimeHandsontable"
          stretchH="all"
          rowHeights={ROW_HEIGHT}
        />
      </div>

      {/* Custom Tooltip */}
      {tooltipState && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
          className="px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg"
        >
          {tooltipState.content}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border">
        <span className="font-semibold text-gray-900 mr-2">How to use:</span>
        <span className="inline-block mr-3">↔️ Drag to select</span>
        <span className="inline-block mr-3">📋 Cmd+C/V to copy/paste</span>
        <span className="inline-block mr-3">⬇️ Drag corner to fill</span>
        <span className="inline-block mr-3">🖱️ Right-click to set category</span>
        <span className="inline-block mr-3">✏️ Double-click to edit notes</span>
        <span className="inline-block">🔍 Hover for full text</span>
      </div>

      {/* Summary Table */}
      <div className="mt-6 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Weekly Summary</h3>
          <span className="text-xs text-gray-500 font-medium">Values shown in pomodoros (30 min blocks)</span>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              {DAYS_SHORT.map((_, idx) => (
                <col key={idx} style={{ width: `${80 / DAYS_SHORT.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-3 font-bold text-gray-800 text-xs uppercase tracking-wide">Category</th>
                {DAYS_SHORT.map((day) => (
                  <th key={day} className="text-right py-3 px-3 font-bold text-gray-800 text-xs uppercase tracking-wide">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORY_KEYS.filter(k => k !== '' && summaryTotals.totals[k])
                .map((key) => {
                  const label = CATEGORY_LABELS[key]
                  const categoryTotal = summaryTotals.totals[key]
                  const colors = CATEGORY_COLORS_HEX[key as keyof typeof CATEGORY_COLORS_HEX]
                  const hasSubcategories = Object.keys(categoryTotal.subcategories).length > 0

                  // Convert hex to rgba with opacity
                  const hexToRgba = (hex: string, alpha: number) => {
                    const r = parseInt(hex.slice(1, 3), 16)
                    const g = parseInt(hex.slice(3, 5), 16)
                    const b = parseInt(hex.slice(5, 7), 16)
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`
                  }

                  return (
                    <Fragment key={key}>
                      <tr 
                        className="border-b border-gray-200/60 hover:bg-opacity-40 transition-colors"
                        style={{ 
                          backgroundColor: hexToRgba(colors.bg, 0.3)
                        }}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-3.5 h-3.5 rounded shrink-0 shadow-sm ring-1 ring-black/5"
                                style={{ backgroundColor: colors.bg }}
                              />
                              <span className="font-semibold text-sm" style={{ color: colors.text }}>{label}</span>
                            </div>
                            <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-blue-700 border border-emerald-100">
                              {categoryTotal.total}
                            </span>
                          </div>
                        </td>
                        {categoryTotal.perDay.map((count, idx) => {
                          const showBravo = key === 'W' && count >= 16
                          return (
                            <td key={`${key}-day-${idx}`} className="text-right py-2.5 px-3 font-medium text-sm" style={{ color: colors.text }}>
                              <div className="flex items-center justify-end gap-1">
                                {showBravo && (
                                  <span title="Bravo! Work hours >= 16 pomodoros">👏</span>
                                )}
                                <span>{count || '-'}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                      {hasSubcategories && Object.entries(categoryTotal.subcategories)
                        .sort(([, a], [, b]) => b.total - a.total) // Sort by pomodoros descending
                        .map(([subName, subData]) => {
                          const shades = SUBCATEGORY_SHADES_HEX[key as keyof typeof SUBCATEGORY_SHADES_HEX] || SUBCATEGORY_SHADES_HEX['']
                          const shadeColor = shades[subData.index % shades.length]

                          return (
                            <tr 
                              key={subName} 
                              className="border-b border-gray-200/40"
                              style={{ 
                                backgroundColor: hexToRgba(shadeColor, 0.22)
                              }}
                            >
                              <td className="py-2 px-3 pl-8">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-3 h-3 rounded shrink-0 shadow-sm ring-1 ring-black/5"
                                    style={{ backgroundColor: shadeColor }}
                                  />
                                  <span className="text-sm" style={{ color: colors.text }}>{subName}</span>
                                </div>
                              </td>
                              {subData.perDay.map((count, idx) => (
                                <td key={`${subName}-day-${idx}`} className="text-right py-2 px-3 text-sm" style={{ color: colors.text }}>
                                  {count || '-'}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                    </Fragment>
                  )
                })}
              <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                <td className="py-3 px-3 text-gray-900 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 border border-emerald-200">
                      {summaryTotals.weekTotal}
                    </span>
                  </div>
                </td>
                {summaryTotals.perDayTotals.map((count, idx) => {
                  const expectedDailyTotal = summaryTotals.visibleSlots // 34 slots per day
                  const isValid = count === expectedDailyTotal
                  return (
                    <td
                      key={`week-day-${idx}`}
                      className={`text-right py-3 px-3 text-sm ${isValid ? 'text-green-700' : 'text-gray-900'}`}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {isValid && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold shadow-sm"
                            title="All slots filled"
                          >
                            ✓
                          </span>
                        )}
                        <span className="font-bold">{count}</span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 50
            }}
            className="bg-white border rounded-xl shadow-lg p-2 text-sm min-w-[180px]"
          >
            <div className="px-2 py-1 font-medium text-gray-900">
              Change category
            </div>
            <div className="flex flex-col p-1">
              {['R', 'P', 'W', 'M', 'G', ''].map(category => {
                const subs = category ? getSubcategories(category) : []
                const normalizedSubs = normalizeSubcategories(subs)
                const colors = CATEGORY_COLORS_HEX[category as keyof typeof CATEGORY_COLORS_HEX]
                const label = category ? CATEGORY_LABELS[category as CategoryKey] : 'Empty'

                return (
                  <div key={category} className="relative group">
                    <button
                      className="px-2 py-1 w-full text-left rounded hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <span
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: colors.bg }}
                      />
                      <span className="flex-1">{label}</span>
                      {normalizedSubs.length > 0 && <span className="text-gray-400">›</span>}
                    </button>

                    {/* Subcategory submenu */}
                    {normalizedSubs.length > 0 && (
                      <div className="absolute left-full top-0 bg-white border rounded-xl shadow-lg p-2 min-w-[200px] max-w-[250px] hidden group-hover:block z-50 -ml-px">
                        <div className="px-2 py-1 font-medium text-gray-900 text-xs">
                          Subcategory
                        </div>
                        <div className="flex flex-col gap-1">
                          {normalizedSubs.map((sub) => {
                            const shades = SUBCATEGORY_SHADES_HEX[category as keyof typeof SUBCATEGORY_SHADES_HEX]
                            const shadeColor = shades[sub.index % shades.length]
                            return (
                              <button
                                key={sub.index}
                                className="px-2 py-1 rounded text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                                onClick={() => handleCategorySelect(category, sub.name, sub.index)}
                              >
                                <span
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  style={{ backgroundColor: shadeColor }}
                                />
                                <span className="truncate">{sub.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HandsontableCalendar
