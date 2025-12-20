import type { CalendarEvent } from '../../utils/eventTransform'
import { TimeAxis } from './TimeAxis'
import { DayColumn } from './DayColumn'
import { groupEventsByDay } from '../../utils/eventTransform'

interface CalendarGridProps {
  events: CalendarEvent[]
  selectedBlocks: Set<string>
  editingBlock: { day: number; timeIndex: number } | null
  onEventClick: (event: CalendarEvent) => void
  onEventContextMenu: (e: React.MouseEvent, event: CalendarEvent) => void
  onEventDoubleClick: (event: CalendarEvent) => void
  onNotesChange: (event: CalendarEvent, notes: string) => void
  onFinishEdit: () => void
  onDayMouseDown?: (day: number, e: React.MouseEvent) => void
  onDayMouseMove?: (day: number, e: React.MouseEvent) => void
  onDayMouseUp?: () => void
  selectionRect?: { day: number; startIndex: number; currentIndex: number } | null
}

export function CalendarGrid({
  events,
  selectedBlocks,
  editingBlock,
  onEventClick,
  onEventContextMenu,
  onEventDoubleClick,
  onNotesChange,
  onFinishEdit,
  onDayMouseDown,
  onDayMouseMove,
  onDayMouseUp,
  selectionRect
}: CalendarGridProps) {
  // Group events by day for rendering
  const eventsByDay = groupEventsByDay(events)

  return (
    <div className="grid grid-cols-8 gap-0">
      {/* Time axis column */}
      <TimeAxis />

      {/* Day columns (7 days) */}
      {Array.from({ length: 7 }, (_, day) => (
        <DayColumn
          key={day}
          day={day}
          events={eventsByDay[day]}
          selectedBlocks={selectedBlocks}
          editingBlock={editingBlock}
          onEventClick={onEventClick}
          onEventContextMenu={onEventContextMenu}
          onEventDoubleClick={onEventDoubleClick}
          onNotesChange={onNotesChange}
          onFinishEdit={onFinishEdit}
          onMouseDown={onDayMouseDown}
          onMouseMove={onDayMouseMove}
          onMouseUp={onDayMouseUp}
          selectionRect={selectionRect?.day === day ? selectionRect : null}
        />
      ))}
    </div>
  )
}

export default CalendarGrid
