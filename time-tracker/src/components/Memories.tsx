import { useState, useMemo } from 'react'
import { useYearMemories } from '../hooks/useYearMemories'
import AnnualMemoryCalendar from './dashboard/AnnualMemoryCalendar'
import { ChevronDown, CalendarRange } from 'lucide-react'
import { cn } from '../utils/classNames'

export default function Memories() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { memories, updateMemory, deleteMemory, syncStatus, lastSynced } = useYearMemories(selectedYear)

  // Generate year options (current year and past 10 years)
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i)
    }
    return years
  }, [currentYear])

  // Calculate date range for the selected year
  const dateRangeLabel = useMemo(() => {
    const start = new Date(selectedYear, 0, 1) // January 1st
    const end = new Date(selectedYear, 11, 31) // December 31st

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [selectedYear])

  const formatLastSynced = () => {
    if (!lastSynced) return 'Never'
    const now = new Date()
    const diffMs = now.getTime() - lastSynced.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600'
      case 'syncing':
        return 'text-emerald-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced'
      case 'syncing':
        return 'Syncing...'
      case 'pending':
        return 'Pending sync'
      case 'error':
        return 'Sync failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="h-full overflow-auto bg-white rounded-xl p-6 shadow-sm">
      {/* Analysis Period Banner with Year Selector */}
      <div className="mb-6">
        <div className={cn(
          'rounded-xl p-4 flex items-center justify-between',
          'bg-emerald-50 text-emerald-900'
        )}>
          <div className="flex items-center space-x-3">
            <CalendarRange className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-sm">
                Annual Memories: {dateRangeLabel}
              </h3>
              <p className="text-xs mt-0.5 opacity-90">
                <span className={cn('font-medium', getSyncStatusColor())}>
                  {getSyncStatusText()}
                </span>
                {' • '}
                Last synced: {formatLastSynced()}
              </p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={cn(
                'appearance-none pl-4 pr-10 py-2 rounded-xl font-semibold',
                'bg-white border-2 border-gray-200',
                'text-gray-900 text-base',
                'hover:border-emerald-300 focus:border-emerald-500 focus:outline-none',
                'transition-colors cursor-pointer'
              )}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Memory Calendar */}
      <AnnualMemoryCalendar
        year={selectedYear}
        memories={memories}
        onUpdateMemory={updateMemory}
        onDeleteMemory={deleteMemory}
      />
    </div>
  )
}
