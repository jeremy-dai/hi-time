import { useState, useMemo } from 'react'
import { useYearMemories } from '../hooks/useYearMemories'
import AnnualMemoryCalendar from './dashboard/AnnualMemoryCalendar'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { CalendarRange } from 'lucide-react'
import { PageContainer } from './layout/PageContainer'
import { PageHeader } from './layout/PageHeader'

export default function Memories() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { memories, updateMemory, deleteMemory, syncStatus, lastSynced, hasUnsavedChanges, syncNow, isLoading } = useYearMemories(selectedYear)

  // Calculate date range for the selected year
  const dateRangeLabel = useMemo(() => {
    return `${selectedYear}`
  }, [selectedYear])

  // Filter memories to ensure we only show/count those for the selected year
  const filteredMemories = useMemo(() => {
    if (!memories) return {}
    const filtered: Record<string, typeof memories[string]> = {}
    const yearPrefix = `${selectedYear}-`
    
    Object.entries(memories).forEach(([date, memory]) => {
      if (date.startsWith(yearPrefix)) {
        filtered[date] = memory
      }
    })
    return filtered
  }, [memories, selectedYear])

  const totalMemories = Object.keys(filteredMemories).length

  return (
    <PageContainer
      header={
        <PageHeader
          title={`Annual Memories: ${dateRangeLabel}`}
          subtitle={
            <>
              {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} recorded <span className="hidden sm:inline text-gray-400">• Click to edit, Enter to save, Esc to cancel</span>
            </>
          }
          icon={CalendarRange}
          useGradientTitle={true}
          animateIcon={true}
          sync={{
            status: syncStatus,
            lastSynced,
            hasUnsavedChanges,
            onSyncNow: syncNow
          }}
          yearNav={{
            year: selectedYear,
            onYearChange: setSelectedYear
          }}
        />
      }
    >
      {/* Memory Calendar */}
      {isLoading ? (
        <SkeletonLoader variant="card" height="600px" />
      ) : (
        <AnnualMemoryCalendar
          year={selectedYear}
          memories={memories}
          onUpdateMemory={updateMemory}
          onDeleteMemory={deleteMemory}
        />
      )}
    </PageContainer>
  )
}
