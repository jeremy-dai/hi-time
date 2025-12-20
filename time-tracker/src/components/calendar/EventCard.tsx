import type { CalendarEvent } from '../../utils/eventTransform'
import { CATEGORY_COLORS, CATEGORY_SUB_LEFT } from '../../constants/colors'

const SLOT_HEIGHT = 48 // pixels per 30-min slot

interface EventCardProps {
  event: CalendarEvent
  isSelected: boolean
  isEditing: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onNotesChange?: (notes: string) => void
  onFinishEdit?: () => void
}

export function EventCard({
  event,
  isSelected,
  isEditing,
  onClick,
  onContextMenu,
  onDoubleClick,
  onNotesChange,
  onFinishEdit
}: EventCardProps) {
  // Calculate subcategory border color using hash (same logic as TimeBlock.tsx)
  const getSubcategoryBorderIndex = (subcategory: string): number => {
    if (!subcategory) return 0
    let hash = 0
    for (let i = 0; i < subcategory.length; i++) {
      hash = subcategory.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 4
  }

  const subIdx = getSubcategoryBorderIndex(event.subcategory)
  const category = event.category || ''
  const subLeftClass = CATEGORY_SUB_LEFT[category as keyof typeof CATEGORY_SUB_LEFT]?.[subIdx] || CATEGORY_SUB_LEFT[''][subIdx]

  // Get category background color
  const categoryColorClasses = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['']

  // Calculate position and size
  const top = event.startTimeIndex * SLOT_HEIGHT
  const height = event.duration * SLOT_HEIGHT

  return (
    <div
      className={`
        absolute left-1 right-1 rounded-lg border-l-4 transition-all duration-150 cursor-pointer overflow-hidden
        ${subLeftClass}
        ${event.isGhost
          ? 'border-dashed border opacity-40 dark:opacity-30'
          : categoryColorClasses
        }
        ${isSelected
          ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg z-10'
          : 'shadow-sm hover:shadow-md'
        }
        ${!event.isGhost && 'hover:-translate-y-px'}
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '48px'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onContextMenu={(e) => {
        e.stopPropagation()
        onContextMenu(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick()
      }}
      title={`${category}: ${event.subcategory || 'No subcategory'} - ${event.notes || 'No notes'}`}
    >
      {!isEditing && (
        <div className="p-2 h-full flex flex-col">
          {/* Subcategory */}
          {event.subcategory && (
            <div className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">
              {event.subcategory}
            </div>
          )}

          {/* Time range */}
          <div className="text-[10px] mt-0.5 text-gray-600 dark:text-gray-400">
            {event.startTime} - {event.endTime}
          </div>

          {/* Notes */}
          {event.notes?.trim() && (
            <div className="text-[10px] mt-1 line-clamp-3 text-gray-700 dark:text-gray-300">
              {event.notes}
            </div>
          )}

          {/* Ghost indicator */}
          {event.isGhost && (
            <div className="mt-auto text-[9px] text-gray-500 dark:text-gray-400 italic">
              Ghost event - double-click to activate
            </div>
          )}
        </div>
      )}

      {/* Notes editing overlay */}
      {isEditing && !event.isGhost && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded flex items-center p-1">
          <textarea
            autoFocus
            defaultValue={event.notes}
            rows={Math.max(2, Math.floor(height / 24))}
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
    </div>
  )
}

export default EventCard
