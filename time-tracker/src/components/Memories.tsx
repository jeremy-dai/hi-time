import { useState, useMemo } from 'react'
import { useYearMemories } from '../hooks/useYearMemories'
import AnnualMemoryCalendar from './dashboard/AnnualMemoryCalendar'
import MasonryMemoryGrid from './dashboard/MasonryMemoryGrid'
import { SegmentedTabs } from './shared/SegmentedTabs'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { CalendarRange, LayoutGrid, List, Info, Sparkles } from 'lucide-react'
import { PageContainer } from './layout/PageContainer'
import { PageHeader } from './layout/PageHeader'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export default function Memories() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<'list' | 'masonry'>('list')
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
          actions={
            <div className="flex items-center gap-3">
              {viewMode === 'masonry' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50">
                        <Info size={18} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-4 bg-white/90 backdrop-blur-md border border-zinc-200 shadow-xl text-zinc-700">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                          <Sparkles size={14} />
                          <span>Magic Styling</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          The Bento Grid automatically styles your memories based on keywords. Try starting your memories with:
                        </p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-zinc-500">
                          <li>• Movie / 电影</li>
                          <li>• Code / 代码</li>
                          <li>• Travel / 旅行</li>
                          <li>• Love / 约会</li>
                          <li>• Idea / 想法</li>
                          <li>• Food / 聚餐</li>
                          <li>• Music / 音乐</li>
                          <li>• Game / 游戏</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <SegmentedTabs
                activeTab={viewMode}
                onChange={(id) => setViewMode(id as 'list' | 'masonry')}
                tabs={[
                  { id: 'list', label: 'List', icon: <List size={16} /> },
                  { id: 'masonry', label: 'Grid', icon: <LayoutGrid size={16} /> }
                ]}
              />
            </div>
          }
        />
      }
    >
      {/* Memory Content */}
      {isLoading ? (
        <SkeletonLoader variant="card" height="600px" />
      ) : (
        <>
          {viewMode === 'list' ? (
            <AnnualMemoryCalendar
              year={selectedYear}
              memories={memories}
              onUpdateMemory={updateMemory}
              onDeleteMemory={deleteMemory}
            />
          ) : (
            <MasonryMemoryGrid
              year={selectedYear}
              memories={filteredMemories}
            />
          )}
        </>
      )}
    </PageContainer>
  )
}
