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


  return (
    <PageContainer
      header={
        <PageHeader
          title={`Annual Memories: ${dateRangeLabel}`}
          icon={CalendarRange}
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
