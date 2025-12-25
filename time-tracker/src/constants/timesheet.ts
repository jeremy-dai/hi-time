/**
 * Timesheet grid configuration constants
 */

// Time slot configuration
// 17 hours per day (08:00 to 01:00 next day = 34 time slots with 30-min intervals)
export const TIME_SLOT_START = '08:00'
export const TIME_SLOT_END = '01:00'
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
  let endMinutes = endHour * 60 + endMinute

  // Handle wrap-around to next day (e.g., 08:00 to 01:00 means until 1am next day)
  if (endMinutes < currentMinutes) {
    endMinutes += 24 * 60  // Add 24 hours to represent next day
  }

  while (currentMinutes < endMinutes) {  // Use < instead of <= since endMinutes is the END of last slot
    const hours = Math.floor(currentMinutes / 60) % 24  // Use modulo to wrap hours back to 0-23
    const minutes = currentMinutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    currentMinutes += intervalMinutes
  }

  return slots
}

// Default time slots (08:00 to 01:00 in 30-minute intervals = 34 slots for 17 hours)
export const TIME_SLOTS = generateTimeSlots()

// Day configuration
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DAYS_PER_WEEK = 7

// Grid dimensions
export const TOTAL_TIME_SLOTS = TIME_SLOTS.length
export const TOTAL_BLOCKS_PER_WEEK = TOTAL_TIME_SLOTS * DAYS_PER_WEEK
