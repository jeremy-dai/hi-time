import { cn } from '../../../utils/classNames'
import type { PlanCycle, PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekNavigationProps {
  cycles: PlanCycle[]
  allWeeks: PlanWeek[]
  activeWeekNumber?: number
  onWeekClick: (weekNumber: number) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function WeekNavigation({ cycles, allWeeks, activeWeekNumber, onWeekClick, isCollapsed, onToggleCollapse }: WeekNavigationProps) {
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-4">
        <button
          onClick={onToggleCollapse}
          className="bg-white border border-gray-200 rounded-xl p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title="Show navigation"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-0 h-full">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Timeline
        </h3>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Hide navigation"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="py-4">
        {cycles.length === 0 ? (
          <div className="px-4 text-sm text-gray-500">
            No cycles available
          </div>
        ) : (
          cycles.map((cycle) => {
            const cycleWeeks = allWeeks
              .filter(w => w.cycleId === cycle.id)
              .sort((a, b) => a.weekNumber - b.weekNumber)

            return (
              <div key={cycle.id} className="mb-6">
                {/* Cycle Header */}
                <div className="px-4 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      cycle.status === 'in_progress' ? "bg-emerald-500" :
                      cycle.status === 'completed' ? "bg-green-500" :
                      "bg-gray-300"
                    )} />
                    <h4 className="text-sm font-bold text-gray-900">
                      {cycle.name}
                    </h4>
                  </div>
                  {cycle.theme && (
                    <p className="text-xs text-gray-500 pl-4">
                      {cycle.theme}
                    </p>
                  )}
                </div>

                {/* Week List */}
                <div className="space-y-0.5">
                  {cycleWeeks.length === 0 ? (
                    <div className="px-4 text-xs text-gray-400 italic">
                      No weeks in this cycle
                    </div>
                  ) : (
                    cycleWeeks.map((week) => {
                      const isActive = activeWeekNumber === week.weekNumber
                      const isDone = week.status === 'completed'
                      const isCurrent = week.status === 'current'

                      return (
                        <button
                          key={week.weekNumber}
                          onClick={() => onWeekClick(week.weekNumber)}
                          className={cn(
                            "w-full text-left px-4 py-2 transition-colors group",
                            isActive && "bg-emerald-100 border-l-4 border-emerald-600",
                            !isActive && "hover:bg-gray-100 border-l-4 border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn(
                              "text-xs font-mono font-medium shrink-0",
                              isActive ? "text-emerald-700" : "text-gray-500"
                            )}>
                              W{week.weekNumber}
                            </span>
                            <span className={cn(
                              "text-sm font-semibold truncate",
                              isActive ? "text-emerald-900" : "text-gray-700",
                              isDone && !isActive && "text-gray-500"
                            )}>
                              {week.name}
                            </span>
                          </div>

                          {/* Status indicator */}
                          <div className="flex items-center gap-1.5 pl-10">
                            {isCurrent && (
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                                Current
                              </span>
                            )}
                            {isDone && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                Done
                              </span>
                            )}

                            {/* Todo completion indicator */}
                            {week.todos.length > 0 && (
                              <span className={cn(
                                "text-xs",
                                isActive ? "text-emerald-600" : "text-gray-400"
                              )}>
                                {week.todos.filter(t => t.status === 'done').length}/{week.todos.length}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
