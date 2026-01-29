import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Target } from 'lucide-react'
import { cn } from '../../../utils/classNames'
import { WeekCard } from './WeekCard'

interface WorkType {
  name: string
  description?: string
  color?: string
}

interface ActiveMissionCardProps {
  week: PlanWeek
  templates?: Record<string, string>
  workTypes?: WorkType[]
  onTodoStatusChange?: (todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => void
  onDeliverableStatusChange?: (deliverableId: string, status: 'not_started' | 'in_progress' | 'done') => void
  onWeekEdit?: (updates: {
    name?: string
    theme?: string
    status?: PlanWeek['status']
    todos?: PlanWeek['todos']
    deliverables?: PlanWeek['deliverables']
  }) => void
  onWeekDelete?: () => void
  className?: string
}

export function ActiveMissionCard({
  week,
  templates,
  workTypes,
  onTodoStatusChange,
  onWeekEdit,
  onWeekDelete,
  className
}: ActiveMissionCardProps) {
  // Calculate completion percentage
  const totalTodos = week.todos.length
  const completedTodos = week.todos.filter(t => t.status === 'done').length
  const totalDeliverables = week.deliverables.length
  const completedDeliverables = week.deliverables.filter(d => d.status === 'done').length
  const totalItems = totalTodos + totalDeliverables
  const completedItems = completedTodos + completedDeliverables
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className={cn("flex flex-col gap-3 h-full", className)}>
      {/* Enhanced Header with More Visual Weight */}
      <div className="relative bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-lg shadow-emerald-100/50 overflow-hidden">
        {/* Bold decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-emerald-500 to-emerald-600" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-3 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 shadow-sm shrink-0">
              <Target className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xl leading-tight">Active Mission</h3>
              <p className="text-gray-600 text-sm font-semibold mt-0.5">Week {week.weekNumber}</p>
            </div>
          </div>

          {/* Enhanced Progress Badge */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="bg-linear-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 px-4 py-2 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-emerald-700 leading-none">{progressPct}%</div>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Complete</span>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative mt-5">
          <div className="h-2 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week Card */}
      <WeekCard
        week={week}
        templates={templates}
        workTypes={workTypes}
        onTodoStatusChange={onTodoStatusChange}
        onEdit={onWeekEdit}
        onDelete={onWeekDelete}
        className="flex-1"
      />
    </div>
  )
}
