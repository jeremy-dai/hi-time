import { useRef, useMemo, useState } from 'react'
import { HotTable } from '@handsontable/react-wrapper'
import { registerAllModules } from 'handsontable/registry'
import Handsontable from 'handsontable'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import type { CellProperties } from 'handsontable/settings'
import type { TimeBlock, CategoryKey, SubcategoryRef } from '../../types/time'
import type { UserSettings } from '../../api'
import { TIME_SLOTS } from '../../constants/timesheet'
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
  onUpdateBlock: (day: number, timeIndex: number, block: TimeBlock) => void
  onUpdateBlocks?: (updates: { day: number, timeIndex: number, block: TimeBlock }[]) => void
  referenceData?: TimeBlock[][] | null
  userSettings?: UserSettings
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
    td.style.padding = '4px'
    td.style.position = 'relative'
    td.style.verticalAlign = 'middle'
    td.style.height = '28px'
    td.style.minHeight = '28px'
    td.style.maxHeight = '28px'
    td.style.overflow = 'hidden'

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
    const subcategoryRaw = cellData.isGhost ? cellData.ghostSubcategory : cellData.subcategory
    const notes = cellData.isGhost ? cellData.ghostNotes : cellData.notes
    const isGhost = cellData.isGhost

    // Get subcategory name and index using helper functions
    const subcategory = getSubcategoryName(subcategoryRaw)
    const subcategoryIndex = getSubcategoryIndex(subcategoryRaw)

    // Apply background color - use ghost colors for ghost cells
    const colorMap = isGhost ? GHOST_CATEGORY_COLORS_HEX : CATEGORY_COLORS_HEX
    const colors = colorMap[category as keyof typeof CATEGORY_COLORS_HEX] || colorMap['']
    td.style.backgroundColor = colors.bg
    td.style.color = colors.text

    // Ghost cells have dashed border to differentiate them
    if (isGhost) {
      td.style.borderStyle = 'dashed'
      td.style.borderWidth = '1px'
      td.style.borderColor = colors.text
    }

    // Add left border for subcategory - use index for consistent colors
    if (category && subcategory) {
      const shades = SUBCATEGORY_SHADES_HEX[category as keyof typeof SUBCATEGORY_SHADES_HEX] || SUBCATEGORY_SHADES_HEX['']
      td.style.borderLeft = `4px solid ${shades[subcategoryIndex % shades.length]}`
    }

    // Build tooltip content for full text
    const tooltipParts = []
    if (subcategory) tooltipParts.push(subcategory)
    if (notes) tooltipParts.push(notes)
    const tooltipText = tooltipParts.join(' - ')

    if (tooltipText) {
      td.title = tooltipText
    }

    // Content container - single row with subcategory and notes
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.height = '100%'
    container.style.fontSize = '11px'  // Slightly larger for better readability
    container.style.overflow = 'hidden'

    if (subcategory || notes) {
      const contentDiv = document.createElement('div')
      contentDiv.style.overflow = 'hidden'
      contentDiv.style.textOverflow = 'ellipsis'
      contentDiv.style.whiteSpace = 'nowrap'
      contentDiv.style.width = '100%'

      if (subcategory && notes) {
        // Both subcategory and notes: show as "subcategory - notes"
        const subSpan = document.createElement('span')
        subSpan.textContent = subcategory
        subSpan.style.fontWeight = '600'  // Bold for all cells (ghost distinction is via border)
        contentDiv.appendChild(subSpan)

        const separator = document.createElement('span')
        separator.textContent = ' - '
        separator.style.opacity = '0.7'
        separator.style.fontWeight = '400'
        contentDiv.appendChild(separator)

        const noteSpan = document.createElement('span')
        noteSpan.textContent = notes
        noteSpan.style.opacity = '0.9'  // Slightly more opaque for better readability
        noteSpan.style.fontWeight = '400'
        contentDiv.appendChild(noteSpan)
      } else if (subcategory) {
        // Only subcategory
        contentDiv.textContent = subcategory
        contentDiv.style.fontWeight = '600'  // Bold for all cells
      } else if (notes) {
        // Only notes
        contentDiv.textContent = notes
        contentDiv.style.opacity = '0.9'  // Slightly more opaque for better readability
      }

      container.appendChild(contentDiv)
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

    changes.forEach(([row, prop, _oldValue, newValue]: any) => {
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
        category = newValue.category || ''
        subcategory = newValue.subcategory || null
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

    setContextMenu(null)
  }

  // Get subcategories for a category
  const getSubcategories = (category: string) => {
    return userSettings?.subcategories?.[category] || []
  }

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
    <div className="rounded-xl shadow-lg p-6 border bg-white dark:bg-[hsl(var(--color-dark-surface))] dark:border-[hsl(var(--color-dark-border))]">
      {/* Handsontable */}
      <div>
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
          className="htCenter"
          stretchH="all"
          rowHeights={28}
        />
      </div>

      {/* Instructions */}
      <div className="mt-6 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border dark:border-gray-700">
        <span className="font-semibold text-gray-900 dark:text-gray-200 mr-2">How to use:</span>
        <span className="inline-block mr-3">↔️ Drag to select</span>
        <span className="inline-block mr-3">📋 Cmd+C/V to copy/paste</span>
        <span className="inline-block mr-3">⬇️ Drag corner to fill</span>
        <span className="inline-block mr-3">🖱️ Right-click to set category</span>
        <span className="inline-block mr-3">✏️ Double-click to edit notes</span>
        <span className="inline-block">🔍 Hover for full text</span>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-[hsl(var(--color-dark-border))]">
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Category Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const colors = CATEGORY_COLORS_HEX[key as keyof typeof CATEGORY_COLORS_HEX]
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
                const normalizedSubs = normalizeSubcategories(subs)
                const colors = CATEGORY_COLORS_HEX[category as keyof typeof CATEGORY_COLORS_HEX]
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
                      {normalizedSubs.length > 0 && <span className="text-gray-400">›</span>}
                    </button>

                    {/* Subcategory submenu */}
                    {normalizedSubs.length > 0 && (
                      <div className="absolute left-full top-0 ml-1 bg-white border rounded-lg shadow-lg p-2 min-w-[200px] max-w-[250px] hidden group-hover:block dark:bg-[hsl(var(--color-dark-surface-elevated))] dark:border-[hsl(var(--color-dark-border))] z-50">
                        <div className="px-2 py-1 font-medium text-gray-900 dark:text-gray-100 text-xs">
                          Subcategory
                        </div>
                        <div className="flex flex-col gap-1">
                          {normalizedSubs.map((sub) => {
                            const shades = SUBCATEGORY_SHADES_HEX[category as keyof typeof SUBCATEGORY_SHADES_HEX]
                            const shadeColor = shades[sub.index % shades.length]
                            return (
                              <button
                                key={sub.index}
                                className="px-2 py-1 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"
                                onClick={() => handleCategorySelect(category, sub.name, sub.index)}
                              >
                                <span
                                  className="w-3 h-3 rounded flex-shrink-0"
                                  style={{ backgroundColor: shadeColor }}
                                />
                                <span className="dark:text-gray-200 truncate">{sub.name}</span>
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
