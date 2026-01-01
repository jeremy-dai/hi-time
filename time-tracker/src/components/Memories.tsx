import { useState, useMemo } from 'react'
import { useYearMemories } from '../hooks/useYearMemories'
import AnnualMemoryCalendar from './dashboard/AnnualMemoryCalendar'
import YearNavigator from './shared/YearNavigator'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { CalendarRange } from 'lucide-react'
import { cn } from '../utils/classNames'

export default function Memories() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { memories, updateMemory, deleteMemory, syncStatus, lastSynced } = useYearMemories(selectedYear)

  // Calculate date range for the selected year
  const dateRangeLabel = useMemo(() => {
    const start = new Date(selectedYear, 0, 1) // January 1st
    const end = new Date(selectedYear, 11, 31) // December 31st

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [selectedYear])


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
              <div className="mt-0.5">
                <SyncStatusIndicator
                  status={syncStatus}
                  lastSynced={lastSynced}
                  hasUnsavedChanges={false}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Year Navigator */}
          <YearNavigator
            year={selectedYear}
            onYearChange={setSelectedYear}
            variant="emerald"
          />
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
