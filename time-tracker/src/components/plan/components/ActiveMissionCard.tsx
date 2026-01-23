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
      {/* Refined Header */}
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-400 to-teal-500 opacity-60" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200/80 shadow-sm shrink-0">
              <Target className="h-5 w-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">Active Mission</h3>
              <p className="text-gray-500 text-sm font-medium mt-0.5">Week {week.weekNumber}</p>
            </div>
          </div>

          {/* Compact Progress Badge */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 leading-none">{progressPct}%</div>
            </div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Complete</span>
          </div>
        </div>

        {/* Refined Progress Bar */}
        <div className="relative mt-5">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
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
