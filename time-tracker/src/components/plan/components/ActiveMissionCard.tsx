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
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Target className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-none">Active Mission</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Week {week.weekNumber}</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
          <div className="text-xl font-bold text-emerald-600">{progressPct}%</div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Complete</div>
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
