/**
 * Timesheet grid configuration constants
 */

// Time slot configuration
export const TIME_SLOT_START = '08:00'
export const TIME_SLOT_END = '23:30'
export const TIME_SLOT_INTERVAL_MINUTES = 30

// Generate time slots from start to end
export function generateTimeSlots(
  start: string = TIME_SLOT_START,
  end: string = TIME_SLOT_END,
  intervalMinutes: number = TIME_SLOT_INTERVAL_MINUTES
): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)

  let currentMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  while (currentMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const minutes = currentMinutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    currentMinutes += intervalMinutes
  }

  return slots
}

// Default time slots (08:00 to 23:30 in 30-minute intervals)
export const TIME_SLOTS = generateTimeSlots()

// Day configuration
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export const DAYS_PER_WEEK = 7

// Grid dimensions
export const TOTAL_TIME_SLOTS = TIME_SLOTS.length
export const TOTAL_BLOCKS_PER_WEEK = TOTAL_TIME_SLOTS * DAYS_PER_WEEK
