import type { TimeBlock, CategoryKey } from '../types/time'
import { TIME_SLOTS } from '../constants/timesheet'

/**
 * Calendar event representation for rendering
 * Represents a continuous block of time with the same category/subcategory/notes
 */
export interface CalendarEvent {
  id: string
  day: number
  startTimeIndex: number
  duration: number // number of 30-min slots
  category: CategoryKey
  subcategory: string
  notes: string
  isGhost: boolean
  startTime: string // e.g., "08:00"
  endTime: string // e.g., "10:30"
}

/**
 * Generate a unique key for grouping consecutive blocks
 * Blocks with the same category, subcategory, and notes are merged
 */
function groupKey(block: TimeBlock): string {
  return `${block.category}||${block.subcategory}||${(block.notes || '').trim()}`
}

/**
 * Convert TimeBlock[][] to CalendarEvent[] for rendering
 * Merges consecutive blocks with the same category/subcategory/notes into single events
 *
 * @param weekData - Current week's time blocks
 * @param ghostData - Reference data (e.g., last year's same week) for ghost events
 * @returns Array of calendar events for rendering
 */
export function blocksToEvents(
  weekData: TimeBlock[][],
  ghostData?: TimeBlock[][] | null
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  for (let day = 0; day < 7; day++) {
    const dayBlocks = weekData[day] || []
    const ghostBlocks = ghostData?.[day] || []

    // Process real events first
    let i = 0
    while (i < TIME_SLOTS.length) {
      const block = dayBlocks[i] || createEmptyBlock(day, i)

      // Skip empty blocks (will handle ghosts separately)
      if (!block.category) {
        i++
        continue
      }

      // Find consecutive blocks with same properties
      const key = groupKey(block)
      let j = i + 1
      while (j < TIME_SLOTS.length) {
        const nextBlock = dayBlocks[j] || createEmptyBlock(day, j)
        if (groupKey(nextBlock) !== key) break
        j++
      }

      // Create event from merged blocks
      const duration = j - i
      events.push({
        id: `${day}-${i}-${j}`,
        day,
        startTimeIndex: i,
        duration,
        category: block.category,
        subcategory: block.subcategory,
        notes: block.notes,
        isGhost: false,
        startTime: TIME_SLOTS[i],
        endTime: j < TIME_SLOTS.length ? TIME_SLOTS[j] : '23:59'
      })

      i = j
    }

    // Process ghost events (only where real events don't exist)
    if (ghostData) {
      let i = 0
      while (i < TIME_SLOTS.length) {
        const realBlock = dayBlocks[i]
        const ghostBlock = ghostBlocks[i]

        // Only show ghost if no real event exists at this slot
        if (!realBlock?.category && ghostBlock?.category) {
          const key = groupKey(ghostBlock)
          let j = i + 1

          // Find consecutive ghost blocks with same properties
          while (j < TIME_SLOTS.length) {
            const nextRealBlock = dayBlocks[j]
            const nextGhostBlock = ghostBlocks[j]

            // Stop if real event exists or ghost properties change
            if (nextRealBlock?.category) break
            if (!nextGhostBlock?.category) break
            if (groupKey(nextGhostBlock) !== key) break

            j++
          }

          // Create ghost event
          const duration = j - i
          events.push({
            id: `ghost-${day}-${i}-${j}`,
            day,
            startTimeIndex: i,
            duration,
            category: ghostBlock.category,
            subcategory: ghostBlock.subcategory,
            notes: ghostBlock.notes,
            isGhost: true,
            startTime: TIME_SLOTS[i],
            endTime: j < TIME_SLOTS.length ? TIME_SLOTS[j] : '23:59'
          })

          i = j
        } else {
          i++
        }
      }
    }
  }

  return events
}

/**
 * Create an empty time block
 */
function createEmptyBlock(day: number, timeIndex: number): TimeBlock {
  return {
    id: `${day}-${timeIndex}`,
    time: TIME_SLOTS[timeIndex],
    day,
    category: '',
    subcategory: '',
    notes: ''
  }
}

/**
 * Group events by day for easier rendering
 */
export function groupEventsByDay(events: CalendarEvent[]): CalendarEvent[][] {
  const grouped: CalendarEvent[][] = Array.from({ length: 7 }, () => [])

  for (const event of events) {
    grouped[event.day].push(event)
  }

  // Sort events within each day by start time
  for (const dayEvents of grouped) {
    dayEvents.sort((a, b) => a.startTimeIndex - b.startTimeIndex)
  }

  return grouped
}
