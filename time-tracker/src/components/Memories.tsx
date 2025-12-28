import { useState, useMemo } from 'react'
import { useYearMemories } from '../hooks/useYearMemories'
import AnnualMemoryCalendar from './dashboard/AnnualMemoryCalendar'
import { ChevronDown, BookHeart } from 'lucide-react'
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
        return 'text-blue-600'
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
    <div className="h-full overflow-auto bg-white rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BookHeart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Memories</h1>
              <p className="text-sm text-gray-500">Capture and reflect on your daily moments</p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={cn(
                'appearance-none pl-4 pr-10 py-2.5 rounded-lg font-semibold',
                'bg-white border-2 border-gray-200',
                'text-gray-900 text-lg',
                'hover:border-purple-300 focus:border-purple-500 focus:outline-none',
                'transition-colors cursor-pointer'
              )}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <span className={cn('font-medium', getSyncStatusColor())}>
              {getSyncStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Last synced:</span>
            <span className="font-medium">{formatLastSynced()}</span>
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
