import { DAYS_SHORT } from '../../constants/timesheet'
import { cn } from '../../utils/classNames'

interface CalendarHeaderProps {
  weekStartDate?: Date
  dayAllCategorized: boolean[]
}

export function CalendarHeader({ weekStartDate, dayAllCategorized }: CalendarHeaderProps) {
  const days = DAYS_SHORT

  // Generate day labels with dates
  const dayLabels = days.map((d, i) => {
    if (!weekStartDate) return d
    const date = new Date(weekStartDate)
    date.setDate(weekStartDate.getDate() + i)
    return `${d} ${date.getDate()}`
  })

  return (
    <div className="grid grid-cols-8 gap-0 mb-0 sticky top-0 z-10 bg-white dark:bg-[hsl(var(--color-dark-surface))]">
      {/* Time column header */}
      <div className={cn('text-center font-medium p-2 border-r border-gray-200 dark:border-gray-700', 'text-gray-700 dark:text-gray-200')}>
        Time
      </div>

      {/* Day headers */}
      {dayLabels.map((label, i) => (
        <div
          key={label}
          className={cn(
            'text-center font-medium p-2 border-r border-gray-200 dark:border-gray-700',
            'text-gray-700 dark:text-gray-200'
          )}
        >
          <span>{label}</span>
          {/* Completion indicator (green dot if all slots categorized) */}
          <span
            className={cn(
              'ml-1 inline-block align-middle w-1.5 h-1.5 rounded-full',
              dayAllCategorized[i]
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        </div>
      ))}
    </div>
  )
}

export default CalendarHeader
