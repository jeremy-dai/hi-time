import { TIME_SLOTS } from '../../constants/timesheet'

const SLOT_HEIGHT = 48 // pixels per 30-min slot

export function TimeAxis() {
  // Show only hourly labels (every 2 slots)
  const hourlySlots = TIME_SLOTS.filter((_, index) => index % 2 === 0)

  return (
    <div className="relative border-r border-gray-200 dark:border-gray-700" style={{ height: `${TIME_SLOTS.length * SLOT_HEIGHT}px` }}>
      {hourlySlots.map((time, index) => (
        <div
          key={time}
          className="absolute right-2 text-xs text-gray-500 dark:text-gray-400 font-medium"
          style={{
            top: `${index * 2 * SLOT_HEIGHT - 8}px` // Center on the hour mark
          }}
        >
          {time}
        </div>
      ))}
    </div>
  )
}

export default TimeAxis
