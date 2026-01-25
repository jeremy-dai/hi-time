import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/classNames'
import { addWeeks, formatWeekKey } from '../../utils/date'

interface WeekNavigatorProps {
  selectedWeekKey: string
  onWeekChange: (weekKey: string) => void
  minWeekKey?: string
  maxWeekKey: string
  variant?: 'default' | 'emerald'
}

export default function WeekNavigator({
  selectedWeekKey,
  onWeekChange,
  minWeekKey,
  maxWeekKey,
  variant = 'default'
}: WeekNavigatorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Parse week key to Date
  const parseWeekKey = (weekKey: string): Date => {
    const [yearStr, weekStr] = weekKey.split('-W')
    const year = parseInt(yearStr)
    const week = parseInt(weekStr)

    // Start with Jan 1 of the year
    const jan1 = new Date(Date.UTC(year, 0, 1))
    const jan1Day = jan1.getUTCDay() // 0 = Sunday

    // Find the Sunday that starts Week 1
    const week1Sunday = new Date(jan1)
    if (jan1Day !== 0) {
      week1Sunday.setUTCDate(jan1.getUTCDate() - jan1Day)
    }

    // Add the appropriate number of weeks
    const targetDate = new Date(week1Sunday)
    targetDate.setUTCDate(week1Sunday.getUTCDate() + (week - 1) * 7)
    return targetDate
  }

  const canGoPrevious = minWeekKey ? selectedWeekKey > minWeekKey : true
  const canGoNext = selectedWeekKey < maxWeekKey

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false)
      }
    }

    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPickerOpen])

  const handlePrevious = () => {
    if (canGoPrevious) {
      const currentDate = parseWeekKey(selectedWeekKey)
      const previousWeek = addWeeks(currentDate, -1)
      onWeekChange(formatWeekKey(previousWeek))
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const currentDate = parseWeekKey(selectedWeekKey)
      const nextWeek = addWeeks(currentDate, 1)
      onWeekChange(formatWeekKey(nextWeek))
    }
  }

  const handleWeekSelect = (weekKey: string) => {
    onWeekChange(weekKey)
    setIsPickerOpen(false)
  }

  // Generate week list for picker (last 52 weeks up to maxWeekKey)
  const weekList = []
  const maxDate = parseWeekKey(maxWeekKey)
  for (let i = 0; i < 52; i++) {
    const weekDate = addWeeks(maxDate, -i)
    const weekKey = formatWeekKey(weekDate)
    if (!minWeekKey || weekKey >= minWeekKey) {
      weekList.push(weekKey)
    }
  }

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          container: 'bg-white border-2 border-emerald-200',
          button: 'hover:bg-emerald-50 text-emerald-600',
          buttonDisabled: 'text-emerald-200',
          week: 'text-emerald-900',
          weekButton: 'hover:bg-emerald-50',
          pickerBg: 'bg-white border-2 border-emerald-200',
          pickerItem: 'hover:bg-emerald-50 text-gray-700',
          pickerItemActive: 'bg-emerald-500 text-white hover:bg-emerald-600'
        }
      default:
        return {
          container: 'bg-white border-2 border-gray-200',
          button: 'hover:bg-gray-100 text-gray-600',
          buttonDisabled: 'text-gray-300',
          week: 'text-gray-900',
          weekButton: 'hover:bg-gray-100',
          pickerBg: 'bg-white border-2 border-gray-200',
          pickerItem: 'hover:bg-gray-100 text-gray-700',
          pickerItemActive: 'bg-emerald-500 text-white hover:bg-emerald-600'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="relative" ref={pickerRef}>
      <div className={cn(
        'flex items-center rounded-xl overflow-hidden shadow-sm transition-all',
        styles.container
      )}>
        {/* Previous Week Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={cn(
            'px-3 py-2 transition-colors disabled:cursor-not-allowed',
            canGoPrevious ? styles.button : styles.buttonDisabled
          )}
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Week Display - Now Clickable */}
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={cn(
            'px-4 py-2 font-bold text-base min-w-[110px] text-center transition-colors',
            styles.week,
            styles.weekButton
          )}
          aria-label="Select week"
        >
          {selectedWeekKey}
        </button>

        {/* Next Week Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            'px-3 py-2 transition-colors disabled:cursor-not-allowed',
            canGoNext ? styles.button : styles.buttonDisabled
          )}
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Week Picker Dropdown */}
      {isPickerOpen && (
        <div className={cn(
          'absolute top-full mt-2 rounded-xl shadow-lg overflow-hidden z-50',
          'max-h-64 overflow-y-auto',
          styles.pickerBg
        )}>
          <div className="py-1">
            {weekList.map((weekKey) => (
              <button
                key={weekKey}
                onClick={() => handleWeekSelect(weekKey)}
                className={cn(
                  'w-full px-6 py-2 text-left font-semibold text-sm transition-colors',
                  weekKey === selectedWeekKey ? styles.pickerItemActive : styles.pickerItem
                )}
              >
                {weekKey}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
