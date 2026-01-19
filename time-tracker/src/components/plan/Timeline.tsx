import { useState, useRef, useEffect } from 'react'
import type { UseQuarterlyPlanReturn } from '../../hooks/useQuarterlyPlan'
import { WeekCard } from './components/WeekCard'
import { WeekAddModal } from './components/WeekAddModal'
import { CycleCard } from './components/CycleCard'
import { WeekNavigation } from './components/WeekNavigation'
import { SyncStatusIndicator } from '../SyncStatusIndicator'
import { Plus } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface TimelineProps {
  data: UseQuarterlyPlanReturn
}

export function Timeline({ data }: TimelineProps) {
  const {
    cycles,
    allWeeks,
    updateTodoStatus,
    updateCycleDetails,
    updateWeekComprehensive,
    deleteWeek,
    addWeek,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    syncNow
  } = data

  // State for expanded cycles
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(() => {
    // Default to expanding cycles that are active or upcoming
    const initial = new Set<string>()
    cycles.forEach(c => {
      if (c.status !== 'completed') {
        initial.add(c.id)
      }
    })
    // If no active cycles, expand the last one
    if (initial.size === 0 && cycles.length > 0) {
      initial.add(cycles[cycles.length - 1].id)
    }
    return initial
  })

  // State for Add Week modal
  const [addWeekModalOpen, setAddWeekModalOpen] = useState(false)
  const [selectedCycleForAdd, setSelectedCycleForAdd] = useState<{
    id: string
    name: string
    insertPosition?: 'start' | 'after' | 'end'
    insertAfterWeekNumber?: number
  } | null>(null)

  // State for sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Week refs for scrolling
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const cycleRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeWeekNumber, setActiveWeekNumber] = useState<number | undefined>()

  // Track visible week on scroll (using scroll container as root)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible week
        let mostVisibleWeek: number | undefined
        let maxRatio = 0

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            const weekNumber = Number(entry.target.getAttribute('data-week-number'))
            if (!isNaN(weekNumber)) {
              maxRatio = entry.intersectionRatio
              mostVisibleWeek = weekNumber
            }
          }
        })

        if (mostVisibleWeek !== undefined) {
          setActiveWeekNumber(mostVisibleWeek)
        }
      },
      {
        root: container,
        rootMargin: '-50px 0px -50px 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      }
    )

    // Observe all week elements
    weekRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [allWeeks])

  // Handle navigation click - scroll within container
  const handleWeekClick = (weekNumber: number) => {
    const element = weekRefs.current.get(weekNumber)
    const container = scrollContainerRef.current
    if (element && container) {
      const headerOffset = 24
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const offsetPosition = elementRect.top - containerRect.top + container.scrollTop - headerOffset

      container.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setActiveWeekNumber(weekNumber)
    }
  }

  const handleCycleClick = (cycleId: string) => {
    const element = cycleRefs.current.get(cycleId)
    const container = scrollContainerRef.current
    if (element && container) {
      const headerOffset = 24
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const offsetPosition = elementRect.top - containerRect.top + container.scrollTop - headerOffset
      container.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  const toggleCycle = (cycleId: string) => {
    setExpandedCycles(prev => {
      const next = new Set(prev)
      if (next.has(cycleId)) {
        next.delete(cycleId)
      } else {
        next.add(cycleId)
      }
      return next
    })
  }

  return (
    <div className="bg-gray-50 h-[calc(100vh-6rem)] flex overflow-hidden">
      {/* Left Sidebar - Fixed height, scrolls independently */}
      <div className={cn(
        "h-full overflow-y-auto border-r border-gray-200 bg-gray-50/95 transition-all duration-300 shrink-0",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <WeekNavigation
          cycles={cycles}
          allWeeks={allWeeks}
          activeWeekNumber={activeWeekNumber}
          onWeekClick={handleWeekClick}
          onCycleClick={handleCycleClick}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Content - Scrolls independently */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-w-0 overflow-y-auto"
      >
        <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Timeline</h1>
          <SyncStatusIndicator
            status={syncStatus}
            lastSynced={lastSynced}
            hasUnsavedChanges={hasUnsavedChanges}
            onSyncNow={syncNow}
            compact={true}
          />
        </div>

        {/* Timeline by Cycle */}
        <div className="flex-1 space-y-6">
        {cycles.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No cycles defined. Import a plan to get started.
          </div>
        ) : (
          cycles.map((cycle, index) => {
            const cycleWeeks = allWeeks
              .filter(w => w.cycleId === cycle.id)
              .sort((a, b) => a.weekNumber - b.weekNumber)

            const isExpanded = expandedCycles.has(cycle.id)
            const isLast = index === cycles.length - 1

            return (
              <div key={cycle.id} className="relative">
                {/* Cycle Card with expand/collapse toggle */}
                <div
                  ref={(el) => {
                    if (el) {
                      cycleRefs.current.set(cycle.id, el)
                    } else {
                      cycleRefs.current.delete(cycle.id)
                    }
                  }}
                  data-cycle-id={cycle.id}
                  className="cursor-pointer"
                  onClick={() => toggleCycle(cycle.id)}
                >
                  <CycleCard
                    cycle={cycle}
                    cycleIndex={index + 1}
                    onStatusChange={(status) => updateCycleDetails(cycle.id, { status })}
                    onEdit={(details) => updateCycleDetails(cycle.id, details)}
                    isExpanded={isExpanded}
                  />
                </div>

                {/* Weeks in Cycle (collapsible) */}
                {isExpanded && (
                  <div className="space-y-0 pl-6 pb-8 mt-4">
                    {/* Add Week at Start */}
                    <div className="relative pl-8 group">
                      <button
                        onClick={() => {
                          setSelectedCycleForAdd({
                            id: cycle.id,
                            name: cycle.name,
                            insertPosition: 'start',
                            insertAfterWeekNumber: undefined
                          })
                          setAddWeekModalOpen(true)
                        }}
                        className="w-full py-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border-2 border-dashed border-transparent hover:border-emerald-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add week at start</span>
                      </button>
                    </div>

                    {cycleWeeks.map((week) => (
                      <div key={week.weekNumber}>
                        {/* Week Card Container */}
                        <div
                          ref={(el) => {
                            if (el) {
                              weekRefs.current.set(week.weekNumber, el)
                            } else {
                              weekRefs.current.delete(week.weekNumber)
                            }
                          }}
                          data-week-number={week.weekNumber}
                          className="relative pl-8 pb-4"
                        >
                          {/* Timeline node */}
                          <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full border-2 border-white bg-gray-300 ring-4 ring-gray-50" />

                          {/* Vertical line for weeks */}
                          <div className="absolute left-0 top-8 bottom-0 w-0.5 bg-gray-200" />

                          <WeekCard
                            week={week}
                            templates={data.planData?.templates}
                            workTypes={data.planData?.work_types}
                            onTodoStatusChange={(todoId, status) => updateTodoStatus(week.weekNumber, todoId, status)}
                            onEdit={(updates) => updateWeekComprehensive(week.weekNumber, updates)}
                            onDelete={() => deleteWeek(week.weekNumber)}
                          />
                        </div>

                        {/* Add Week After (appears on hover between weeks) */}
                        <div className="relative pl-8 group">
                          <button
                            onClick={() => {
                              setSelectedCycleForAdd({
                                id: cycle.id,
                                name: cycle.name,
                                insertPosition: 'after',
                                insertAfterWeekNumber: week.weekNumber
                              })
                              setAddWeekModalOpen(true)
                            }}
                            className="w-full py-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border-2 border-dashed border-transparent hover:border-emerald-300"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add week after</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Separator between cycles */}
                {!isLast && <div className="border-t border-gray-200 my-8" />}
              </div>
            )
          })
        )}
        </div>

        {/* Add Week Modal */}
        {selectedCycleForAdd && (
          <WeekAddModal
            cycleId={selectedCycleForAdd.id}
            cycleName={selectedCycleForAdd.name}
            isOpen={addWeekModalOpen}
            onClose={() => {
              setAddWeekModalOpen(false)
              setSelectedCycleForAdd(null)
            }}
            onAdd={addWeek}
            insertAfterWeekNumber={selectedCycleForAdd.insertAfterWeekNumber}
            insertPosition={selectedCycleForAdd.insertPosition}
          />
        )}
        </div>
      </div>
    </div>
  )
}
