import type { CalendarEvent } from '../../utils/eventTransform'
import { EventCard } from './EventCard'
import { TIME_SLOTS } from '../../constants/timesheet'

const SLOT_HEIGHT = 48 // pixels per 30-min slot
const TOTAL_HEIGHT = TIME_SLOTS.length * SLOT_HEIGHT // 32 slots * 48px = 1536px

interface DayColumnProps {
  day: number
  events: CalendarEvent[]
  selectedBlocks: Set<string>
  editingBlock: { day: number; timeIndex: number } | null
  onEventClick: (event: CalendarEvent) => void
  onEventContextMenu: (e: React.MouseEvent, event: CalendarEvent) => void
  onEventDoubleClick: (event: CalendarEvent) => void
  onNotesChange: (event: CalendarEvent, notes: string) => void
  onFinishEdit: () => void
  onMouseDown?: (day: number, e: React.MouseEvent) => void
  onMouseMove?: (day: number, e: React.MouseEvent) => void
  onMouseUp?: () => void
  selectionRect?: { startIndex: number; currentIndex: number } | null
}

export function DayColumn({
  day,
  events,
  selectedBlocks,
  editingBlock,
  onEventClick,
  onEventContextMenu,
  onEventDoubleClick,
  onNotesChange,
  onFinishEdit,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  selectionRect
}: DayColumnProps) {
  // Check if event is selected (any of its time slots are selected)
  const isEventSelected = (event: CalendarEvent): boolean => {
    for (let i = 0; i < event.duration; i++) {
      if (selectedBlocks.has(`${event.day}-${event.startTimeIndex + i}`)) {
        return true
      }
    }
    return false
  }

  // Check if event is being edited
  const isEventEditing = (event: CalendarEvent): boolean => {
    return editingBlock?.day === event.day && editingBlock?.timeIndex === event.startTimeIndex
  }

  return (
    <div
      className="relative border-r border-gray-200 dark:border-gray-700"
      style={{ height: `${TOTAL_HEIGHT}px` }}
    >
      {/* Background grid lines (visual reference) */}
      <div className="absolute inset-0 pointer-events-none">
        {TIME_SLOTS.map((_, index) => (
          <div
            key={index}
            className="border-t border-gray-100 dark:border-gray-800"
            style={{
              position: 'absolute',
              top: `${index * SLOT_HEIGHT}px`,
              left: 0,
              right: 0,
              height: '1px'
            }}
          />
        ))}
      </div>

      {/* Selection overlay (for drag selection) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onMouseDown={(e) => onMouseDown?.(day, e)}
        onMouseMove={(e) => onMouseMove?.(day, e)}
        onMouseUp={() => onMouseUp?.()}
      >
        {/* Selection rectangle */}
        {selectionRect && (
          <div
            className="absolute left-0 right-0 bg-blue-100/30 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 rounded pointer-events-none"
            style={{
              top: `${Math.min(selectionRect.startIndex, selectionRect.currentIndex) * SLOT_HEIGHT}px`,
              height: `${(Math.abs(selectionRect.currentIndex - selectionRect.startIndex) + 1) * SLOT_HEIGHT}px`
            }}
          />
        )}
      </div>

      {/* Floating events */}
      <div className="absolute inset-0 pointer-events-none">
        {events.map((event) => (
          <div key={event.id} className="pointer-events-auto">
            <EventCard
              event={event}
              isSelected={isEventSelected(event)}
              isEditing={isEventEditing(event)}
              onClick={() => onEventClick(event)}
              onContextMenu={(e) => onEventContextMenu(e, event)}
              onDoubleClick={() => onEventDoubleClick(event)}
              onNotesChange={(notes) => onNotesChange(event, notes)}
              onFinishEdit={onFinishEdit}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DayColumn
