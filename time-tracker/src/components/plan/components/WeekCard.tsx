import { useState } from 'react'
import type { PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { cn } from '../../../utils/classNames'
import { CheckCircle2, Circle, Edit2 } from 'lucide-react'
import { WeekEditModal } from './WeekEditModal'

interface WeekCardProps {
  week: PlanWeek
  onTodoStatusChange?: (todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => void
  onEdit?: (updates: {
    name?: string
    theme?: string
    status?: PlanWeek['status']
    todos?: PlanWeek['todos']
    deliverables?: PlanWeek['deliverables']
  }) => void
  onDelete?: () => void
  className?: string
}

const STATUS_STYLES: Record<PlanWeek['status'], string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  current: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  not_started: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_LABELS: Record<PlanWeek['status'], string> = {
  completed: 'Done',
  current: 'Current',
  in_progress: 'In Progress',
  not_started: 'Todo',
}

export function WeekCard({ week, onTodoStatusChange, onEdit, onDelete, className }: WeekCardProps) {
  const isDone = week.status === 'completed'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Calculate completion
  const totalTodos = week.todos.length
  const completedTodos = week.todos.filter(t => t.status === 'done').length
  const totalDeliverables = week.deliverables.length
  const completedDeliverables = week.deliverables.filter(d => d.status === 'done').length

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-xl border p-6 transition-all hover:border-emerald-300',
          isDone && 'opacity-60 bg-gray-50',
          week.status === 'current' && 'border-emerald-400 shadow-md shadow-emerald-50',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 flex-1">
            <span className="px-2.5 py-1.5 text-xs font-mono bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shrink-0 font-medium">
              Week {week.weekNumber}
            </span>
            <h4 className="text-lg font-bold text-gray-900">{week.name}</h4>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Edit week"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            <span
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg border',
                STATUS_STYLES[week.status]
              )}
            >
              {STATUS_LABELS[week.status]}
            </span>
          </div>
        </div>

        {/* Theme Banner */}
        {week.theme && (
          <div className="mb-5 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Theme</span>
              <span className="text-sm font-medium text-gray-800 italic">{week.theme}</span>
            </div>
          </div>
        )}

        {/* Goals & Reflection Questions - Two Column Layout */}
        {((week.goals && week.goals.length > 0) || (week.reflectionQuestions && week.reflectionQuestions.length > 0)) && (
          <div className="grid grid-cols-2 gap-6 mb-5">
            {/* Goals Section */}
            {week.goals && week.goals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Goals</h5>
                </div>
                <ul className="space-y-2 pl-7">
                  {week.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span className="leading-relaxed">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflection Questions Section */}
            {week.reflectionQuestions && week.reflectionQuestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Reflection Questions</h5>
                </div>
                <ul className="space-y-3 pl-7">
                  {week.reflectionQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 italic">
                      <span className="text-purple-500 font-bold shrink-0">?</span>
                      <span className="leading-relaxed">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Todos & Deliverables Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Todos */}
          {week.todos.length > 0 && (
            <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span>Todos</span>
                <span className="text-gray-500 font-normal">
                  {completedTodos}/{totalTodos}
                </span>
              </h5>
              <ul className="space-y-2">
                {week.todos.slice(0, 5).map((todo) => (
                  <li key={todo.id} className="text-sm text-gray-700 flex items-start gap-2">
                    <button
                      onClick={() => {
                        if (onTodoStatusChange) {
                          const nextStatus = todo.status === 'done' ? 'not_started' : 'done'
                          onTodoStatusChange(todo.id, nextStatus)
                        }
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {todo.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 hover:text-emerald-600" />
                      )}
                    </button>
                    <span className={cn(
                      'leading-relaxed',
                      todo.status === 'done' && 'line-through text-gray-400'
                    )}>
                      {todo.name || todo.title}
                    </span>
                  </li>
                ))}
                {week.todos.length > 5 && (
                  <li className="text-xs text-gray-500 pl-6">+{week.todos.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Deliverables */}
          {week.deliverables.length > 0 && (
            <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span>Deliverables</span>
                <span className="text-gray-500 font-normal">
                  {completedDeliverables}/{totalDeliverables}
                </span>
              </h5>
              <div className="flex flex-wrap gap-2">
                {week.deliverables.map((del) => (
                  <span
                    key={del.id}
                    className={cn(
                      'text-xs font-medium bg-white px-3 py-1.5 rounded-lg border text-gray-700 shadow-sm',
                      del.status === 'done' && 'bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    {del.name || del.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {onEdit && (
        <WeekEditModal
          week={week}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  )
}
