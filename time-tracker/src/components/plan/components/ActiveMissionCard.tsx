import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Target } from 'lucide-react'
import { cn } from '../../../utils/classNames'
import { WeekCard } from './WeekCard'

interface ActiveMissionCardProps {
  week: PlanWeek
  templates?: Record<string, string>
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
    <div
      className={cn(
        'bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-200 p-4 h-full flex flex-col gap-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Active Mission</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{progressPct}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Week Card */}
      <WeekCard
        week={week}
        templates={templates}
        onTodoStatusChange={onTodoStatusChange}
        onEdit={onWeekEdit}
        onDelete={onWeekDelete}
      />
    </div>
  )
}
