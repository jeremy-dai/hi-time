import { useRef, useMemo, useState } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/dist/handsontable.full.css'
import type { CellProperties } from 'handsontable/settings'
import type { TimeBlock, CategoryKey } from '../../types/time'
import type { UserSettings } from '../../api'
import { TIME_SLOTS } from '../../constants/timesheet'
import { CATEGORY_LABELS } from '../../constants/colors'

// Register Handsontable modules
registerAllModules()

interface HandsontableCalendarProps {
  weekData: TimeBlock[][]
  onUpdateBlock: (day: number, timeIndex: number, block: TimeBlock) => void
  onUpdateBlocks?: (updates: { day: number, timeIndex: number, block: TimeBlock }[]) => void
  referenceData?: TimeBlock[][] | null
  userSettings?: UserSettings
}

// Category color mapping
const CATEGORY_COLORS = {
  'R': { bg: '#22c55e', text: '#000' },      // green-500
  'W': { bg: '#facc15', text: '#000' },      // yellow-400
  'G': { bg: '#3b82f6', text: '#fff' },      // blue-500
  'P': { bg: '#ef4444', text: '#fff' },      // red-500
  'M': { bg: '#c2410c', text: '#fff' },      // orange-700
  '': { bg: '#f3f4f6', text: '#000' }        // gray-100
}

// Subcategory shade variations (for border-left)
const SUBCATEGORY_SHADES = {
  'R': ['#86efac', '#4ade80', '#22c55e', '#16a34a'],  // green shades
  'W': ['#fef08a', '#fde047', '#facc15', '#eab308'],  // yellow shades
  'G': ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'],  // blue shades
  'P': ['#fca5a5', '#f87171', '#ef4444', '#dc2626'],  // red shades
  'M': ['#fb923c', '#f97316', '#ea580c', '#c2410c'],  // orange shades
  '': ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280']    // gray shades
}

export function HandsontableCalendar({
  weekData,
  onUpdateBlock,
  onUpdateBlocks,
  referenceData,
  userSettings
}: HandsontableCalendarProps) {
  const hotRef = useRef<any>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    row: number
    col: number
  } | null>(null)

  // Transform weekData (7 days × 32 slots) to Handsontable format (32 rows × 8 cols)
  const tableData = useMemo(() => {
    return TIME_SLOTS.map((time, timeIndex) => {
      const row: any = { time }
      for (let day = 0; day < 7; day++) {
        const block = weekData[day]?.[timeIndex]
        const ghost = referenceData?.[day]?.[timeIndex]
        row[`day${day}`] = {
          category: block?.category || '',
          subcategory: block?.subcategory || '',
          notes: block?.notes || '',
          isGhost: !block?.category && ghost?.category ? true : false,
          ghostCategory: ghost?.category || '',
          ghostSubcategory: ghost?.subcategory || ''
        }
      }
      return row
    })
  }, [weekData, referenceData])

  // Day headers with completion status
  const dayHeaders = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, idx) => {
      const allCategorized = weekData[idx]?.every(block => block.category)
      return `${day}${allCategorized ? ' ✓' : ''}`
    })
  }, [weekData])

  // Custom cell renderer
  const customRenderer = (
    _instance: any,
    td: HTMLTableCellElement,
    _row: number,
    col: number,
    _prop: string | number,
    value: any,
    _cellProperties: CellProperties
  ) => {
    // Clear existing content
    td.innerHTML = ''
    td.className = 'htCustomCell'
    td.style.padding = '2px'
    td.style.position = 'relative'
    td.style.verticalAlign = 'top'
    td.style.height = '24px'

    if (col === 0) {
      // Time column
      td.textContent = value
      td.style.fontWeight = '500'
      td.style.color = '#6b7280'
      td.style.backgroundColor = '#f9fafb'
      td.style.fontSize = '10px'
      return td
    }

    // Data cell
    const cellData = value || { category: '', subcategory: '', notes: '', isGhost: false }
    const category = cellData.isGhost ? cellData.ghostCategory : cellData.category
    const subcategory = cellData.isGhost ? cellData.ghostSubcategory : cellData.subcategory
    const notes = cellData.notes
    const isGhost = cellData.isGhost

    // Apply background color
    const colors = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['']
    td.style.backgroundColor = colors.bg
    td.style.color = colors.text

    if (isGhost) {
      td.style.opacity = '0.4'
      td.style.borderStyle = 'dashed'
    }

    // Add left border for subcategory
    if (category && subcategory) {
      const hash = subcategory.split('').reduce((acc: number, char: string) =>
        char.charCodeAt(0) + ((acc << 5) - acc), 0)
      const shadeIdx = Math.abs(hash) % 4
      const shades = SUBCATEGORY_SHADES[category as keyof typeof SUBCATEGORY_SHADES] || SUBCATEGORY_SHADES['']
      td.style.borderLeft = `4px solid ${shades[shadeIdx]}`
    }

    // Content container
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.height = '100%'
    container.style.fontSize = '9px'

    if (subcategory) {
      const subDiv = document.createElement('div')
      subDiv.textContent = subcategory
      subDiv.style.fontWeight = '600'
      subDiv.style.overflow = 'hidden'
      subDiv.style.textOverflow = 'ellipsis'
      subDiv.style.whiteSpace = 'nowrap'
      container.appendChild(subDiv)
    }

    if (notes) {
      const notesDiv = document.createElement('div')
      notesDiv.textContent = notes
      notesDiv.style.fontSize = '8px'
      notesDiv.style.opacity = '0.8'
      notesDiv.style.overflow = 'hidden'
      notesDiv.style.textOverflow = 'ellipsis'
      notesDiv.style.whiteSpace = 'nowrap'
      notesDiv.style.marginTop = '1px'
      container.appendChild(notesDiv)
    }

    if (isGhost && !subcategory && !notes) {
      const ghostDiv = document.createElement('div')
      ghostDiv.textContent = 'Ghost'
      ghostDiv.style.fontSize = '8px'
      ghostDiv.style.fontStyle = 'italic'
      ghostDiv.style.opacity = '0.6'
      container.appendChild(ghostDiv)
    }

    td.appendChild(container)
    return td
  }

  // Column configuration
  const columns = useMemo(() => {
    const cols: any[] = [
      {
        data: 'time',
        title: 'Time',
        readOnly: true,
        width: 70,
        renderer: customRenderer
      }
    ]

    for (let day = 0; day < 7; day++) {
      cols.push({
        data: `day${day}`,
        title: dayHeaders[day],
        width: 140,
        renderer: customRenderer
      })
    }

    return cols
  }, [dayHeaders])

  // Handle cell changes (from paste or fill)
  const handleAfterChange = (changes: any, source: string) => {
    if (!changes || source === 'loadData') return

    const updates: { day: number; timeIndex: number; block: TimeBlock }[] = []

    changes.forEach(([row, prop, _oldValue, newValue]: any) => {
      if (prop === 'time' || !prop.startsWith('day')) return

      const day = parseInt(prop.replace('day', ''))
      const timeIndex = row

      // If newValue is a string (from paste), parse it as category
      let category = ''
      let subcategory = ''
      let notes = ''

      if (typeof newValue === 'string') {
        // Simple paste: treat as category
        category = newValue
      } else if (newValue && typeof newValue === 'object') {
        category = newValue.category || ''
        subcategory = newValue.subcategory || ''
        notes = newValue.notes || ''
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
    setContextMenu({
      x: event.pageX,
      y: event.pageY,
      row: coords.row,
      col: coords.col - 1 // Adjust for time column
    })
  }

  // Handle category selection from context menu
  const handleCategorySelect = (category: string, subcategory?: string) => {
    if (!contextMenu) return

    const hot = hotRef.current?.hotInstance
    if (!hot) return

    const { row, col } = contextMenu
    const day = col
    const timeIndex = row

    // Get selected cells
    const selected = hot.getSelected()

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
              subcategory: subcategory || '',
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
        subcategory: subcategory || '',
        notes: currentBlock?.notes || ''
      }

      onUpdateBlock(day, timeIndex, block)
    }

    setContextMenu(null)
  }

  // Get subcategories for a category
  const getSubcategories = (category: string) => {
    return userSettings?.subcategories?.[category] || []
  }

  // Cell configuration - prevent inline editing but allow paste/fill
  const cellsConfig = (_row: number, col: number) => {
    if (col === 0) {
      return { readOnly: true } // Time column always readonly
    }
    return {
      editor: false // Prevent double-click editing, but allow paste/fill via afterChange
    }
  }

  return (
    <div className="rounded-xl shadow-lg p-6 border bg-white dark:bg-[hsl(var(--color-dark-surface))] dark:border-[hsl(var(--color-dark-border))]">
      {/* Handsontable */}
      <div className="overflow-auto">
        <HotTable
          ref={hotRef}
          data={tableData}
          columns={columns}
          cells={cellsConfig}
          colHeaders={true}
          rowHeaders={false}
          height={850}
          licenseKey="non-commercial-and-evaluation"
          fillHandle={true} // Enable drag-to-fill
          autoWrapRow={true}
          autoWrapCol={true}
          contextMenu={false} // We'll use custom context menu
          afterChange={handleAfterChange}
          afterOnCellContextMenu={handleContextMenu}
          className="htCenter"
          stretchH="all"
        />
      </div>

      {/* Instructions */}
      <div className="mt-6 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border dark:border-gray-700">
        <span className="font-semibold text-gray-900 dark:text-gray-200 mr-2">How to use:</span>
        <span className="inline-block mr-3">↔️ Drag to select</span>
        <span className="inline-block mr-3">📋 Cmd+C/V to copy/paste</span>
        <span className="inline-block mr-3">⬇️ Drag corner to fill</span>
        <span className="inline-block mr-3">🖱️ Right-click to set category</span>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-[hsl(var(--color-dark-border))]">
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Category Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const colors = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="dark:text-gray-200">{label}</span>
              </div>
            )
          })}
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
            className="bg-white border rounded-lg shadow-lg p-2 text-sm min-w-[180px] dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))]"
          >
            <div className="px-2 py-1 font-medium text-gray-900 dark:text-gray-100">
              Change category
            </div>
            <div className="flex flex-col p-1">
              {['R', 'P', 'W', 'M', 'G', ''].map(category => {
                const subs = category ? getSubcategories(category) : []
                const colors = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                const label = category ? CATEGORY_LABELS[category as CategoryKey] : 'Empty'

                return (
                  <div key={category} className="relative group">
                    <button
                      className="px-2 py-1 w-full text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <span
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: colors.bg }}
                      />
                      <span className="flex-1 dark:text-gray-200">{label}</span>
                      {subs.length > 0 && <span className="text-gray-400">›</span>}
                    </button>

                    {/* Subcategory submenu */}
                    {subs.length > 0 && (
                      <div className="absolute left-full top-0 ml-1 bg-white border rounded-lg shadow-lg p-2 min-w-[200px] hidden group-hover:block dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))]">
                        <div className="px-2 py-1 font-medium text-gray-900 dark:text-gray-100">
                          Subcategory
                        </div>
                        <div className="flex flex-col gap-1">
                          {subs.map((sub, idx) => {
                            const shades = SUBCATEGORY_SHADES[category as keyof typeof SUBCATEGORY_SHADES]
                            const shadeColor = shades[idx % shades.length]
                            return (
                              <button
                                key={sub}
                                className="px-2 py-1 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                onClick={() => handleCategorySelect(category, sub)}
                              >
                                <span
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  style={{ backgroundColor: shadeColor }}
                                />
                                <span className="dark:text-gray-200">{sub}</span>
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
