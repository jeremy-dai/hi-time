import type { TimeBlock } from '../types/time'
import { CATEGORY_BORDER_COLORS, CATEGORY_SUB_LEFT } from '../constants/colors'

interface TimeBlockProps {
  block: TimeBlock
  ghost?: TimeBlock | null
  isSelected: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDoubleClick?: () => void
  isEditing?: boolean
  onNotesChange?: (notes: string) => void
  onFinishEdit?: () => void
  onMouseDown?: () => void
  onMouseEnter?: () => void
  onMouseUp?: () => void
}

export function TimeBlock({ block, ghost, isSelected, onClick, onContextMenu, onDoubleClick, isEditing, onNotesChange, onFinishEdit, onMouseDown, onMouseEnter, onMouseUp }: TimeBlockProps) {

  const getBorderClass = (category: string) => {
    return CATEGORY_BORDER_COLORS[category as keyof typeof CATEGORY_BORDER_COLORS] || CATEGORY_BORDER_COLORS['']
  }

  const subIdx = (() => {
    const s = block.subcategory || ghost?.subcategory
    const sStr = typeof s === 'string' ? s : s?.name || ''
    if (!sStr) return 0
    let hash = 0
    for (let i = 0; i < sStr.length; i++) hash = sStr.charCodeAt(i) + ((hash << 5) - hash)
    return Math.abs(hash) % 4
  })()
  const baseCat = block.category || ghost?.category || ''
  const subLeftClass = CATEGORY_SUB_LEFT[baseCat as keyof typeof CATEGORY_SUB_LEFT]?.[subIdx] || CATEGORY_SUB_LEFT[''][subIdx]

  return (
    <div
      className={`
        h-full min-h-[48px] border cursor-pointer transition-all duration-200 relative rounded-xl border-l-4 ${subLeftClass}
        bg-white dark:bg-[hsl(var(--color-dark-surface-elevated))]
        ${getBorderClass(block.category || (ghost ? '' : ''))}
        ${isSelected ? 'ring-2 ring-blue-400 shadow-md' : 'shadow-sm'}
        hover:shadow-md
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      title={`${block.category || ghost?.category || ''}: ${(block.subcategory || ghost?.subcategory || '') || 'No subcategory'} - ${(block.notes || ghost?.notes || '') || 'No notes'}`}
    >
      {!isEditing && (
        <div className="p-2">
          {(block.subcategory || ghost?.subcategory) && (
            <div className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
              {(() => {
                const s = block.subcategory || ghost?.subcategory
                return typeof s === 'string' ? s : s?.name
              })()}
            </div>
          )}
          <div className="text-[10px] mt-0.5 text-gray-500 dark:text-gray-300">
            {block.time}
          </div>
          {(block.notes?.trim() || ghost?.notes?.trim()) && (
            <div className="text-[10px] mt-1 line-clamp-2 text-gray-600 dark:text-gray-300">
              {block.notes || ghost?.notes}
            </div>
          )}
        </div>
      )}
      {isEditing && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded flex items-center p-1">
          <textarea
            autoFocus
            defaultValue={block.notes}
            rows={2}
            className="w-full text-xs rounded px-2 py-1 border dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            onBlur={(e) => {
              onNotesChange?.(e.currentTarget.value)
              onFinishEdit?.()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const v = (e.target as HTMLTextAreaElement).value
                onNotesChange?.(v)
                onFinishEdit?.()
              }
            }}
          />
        </div>
      )}
      {(!block.category && ghost) && (
        <div className="absolute inset-0 bg-gray-100/60 dark:bg-gray-700/50 rounded" />
      )}
    </div>
  )
}

export default TimeBlock
