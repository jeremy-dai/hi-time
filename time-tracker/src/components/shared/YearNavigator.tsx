import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface YearNavigatorProps {
  year: number
  onYearChange: (year: number) => void
  minYear?: number
  maxYear?: number
  variant?: 'default' | 'emerald'
}

export default function YearNavigator({
  year,
  onYearChange,
  minYear = 2024,
  maxYear = new Date().getFullYear(),
  variant = 'default'
}: YearNavigatorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const canGoPrevious = year > minYear
  const canGoNext = year < maxYear

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
      onYearChange(year - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onYearChange(year + 1)
    }
  }

  const handleYearSelect = (selectedYear: number) => {
    onYearChange(selectedYear)
    setIsPickerOpen(false)
  }

  // Generate year list for picker
  const yearList = []
  for (let y = maxYear; y >= minYear; y--) {
    yearList.push(y)
  }

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          container: 'bg-white border-2 border-emerald-200',
          button: 'hover:bg-emerald-50 text-emerald-600',
          buttonDisabled: 'text-emerald-200',
          year: 'text-emerald-900',
          yearButton: 'hover:bg-emerald-50',
          pickerBg: 'bg-white border-2 border-emerald-200',
          pickerItem: 'hover:bg-emerald-50 text-gray-700',
          pickerItemActive: 'bg-emerald-600 text-white hover:bg-emerald-700'
        }
      default:
        return {
          container: 'bg-white border-2 border-gray-200',
          button: 'hover:bg-gray-100 text-gray-600',
          buttonDisabled: 'text-gray-300',
          year: 'text-gray-900',
          yearButton: 'hover:bg-gray-100',
          pickerBg: 'bg-white border-2 border-gray-200',
          pickerItem: 'hover:bg-gray-100 text-gray-700',
          pickerItemActive: 'bg-emerald-600 text-white hover:bg-emerald-700'
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
        {/* Previous Year Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={cn(
            'px-3 py-2 transition-colors disabled:cursor-not-allowed',
            canGoPrevious ? styles.button : styles.buttonDisabled
          )}
          aria-label="Previous year"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* Year Display - Now Clickable */}
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={cn(
            'px-4 py-2 font-bold text-base min-w-[80px] text-center transition-colors',
            styles.year,
            styles.yearButton
          )}
          aria-label="Select year"
        >
          {year}
        </button>

        {/* Next Year Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            'px-3 py-2 transition-colors disabled:cursor-not-allowed',
            canGoNext ? styles.button : styles.buttonDisabled
          )}
          aria-label="Next year"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Year Picker Dropdown */}
      {isPickerOpen && (
        <div className={cn(
          'absolute top-full mt-2 rounded-xl shadow-lg overflow-hidden z-50',
          'max-h-64 overflow-y-auto',
          styles.pickerBg
        )}>
          <div className="py-1">
            {yearList.map((y) => (
              <button
                key={y}
                onClick={() => handleYearSelect(y)}
                className={cn(
                  'w-full px-6 py-2 text-left font-semibold text-sm transition-colors',
                  y === year ? styles.pickerItemActive : styles.pickerItem
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
