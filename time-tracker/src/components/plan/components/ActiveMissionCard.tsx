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
    <div className={cn("flex flex-col gap-4 h-full", className)}>
      {/* Enhanced Header */}
      <div className="relative bg-linear-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-xl p-5 shadow-lg shadow-emerald-200/50 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/30">
              <Target className="h-6 w-6 text-white drop-shadow" />
            </div>
            <div>
              <h3 className="font-black text-white text-xl leading-tight drop-shadow-sm">Active Mission</h3>
              <p className="text-emerald-50 text-sm font-semibold mt-1">Week {week.weekNumber}</p>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg ring-1 ring-white/30">
              <div className="text-3xl font-black text-white drop-shadow-sm">{progressPct}%</div>
            </div>
            <span className="text-xs text-emerald-50 font-bold uppercase tracking-wider">Complete</span>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="relative mt-4">
          <div className="h-2 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-white via-emerald-100 to-white rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
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
