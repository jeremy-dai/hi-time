import type { PlanWeek, PlanCycle } from '../../../hooks/useQuarterlyPlan'
import { Circle, CheckCircle2, Clock, Target, FileText, Layers, HelpCircle } from 'lucide-react'
import { cn } from '../../../utils/classNames'

interface ActiveMissionCardProps {
  week: PlanWeek
  cycle?: PlanCycle | null
  onTodoStatusChange?: (todoId: string, status: 'not_started' | 'in_progress' | 'blocked' | 'done') => void
  onDeliverableStatusChange?: (deliverableId: string, status: 'not_started' | 'in_progress' | 'done') => void
  className?: string
}

export function ActiveMissionCard({ week, cycle, onTodoStatusChange, onDeliverableStatusChange, className }: ActiveMissionCardProps) {
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
        'bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-200 p-4 h-full flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 min-h-[28px]">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Active Mission</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{progressPct}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Cycle Info */}
      {cycle && (
        <div className="mb-4 pb-4 border-b border-emerald-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                Cycle {cycle.startWeek === cycle.endWeek ? cycle.startWeek : `${cycle.startWeek}-${cycle.endWeek}`}
              </span>
              <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
            </div>
          </div>
          {cycle.theme && (
            <p className="text-sm text-gray-600 mb-2 ml-6">{cycle.theme}</p>
          )}
          {cycle.description && (
            <p className="text-sm text-gray-600 ml-6">{cycle.description}</p>
          )}
        </div>
      )}

      {/* Week Info */}
      <div className="mb-4 pb-4 border-b border-emerald-200/50">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              Week {week.weekNumber}
            </span>
            {week.theme && (
              <h3 className="font-semibold text-gray-900">{week.theme}</h3>
            )}
          </div>
        </div>
        {week.description && (
          <p className="text-sm text-gray-600 mb-3 ml-6">{week.description}</p>
        )}

        {/* Goals & Reflection Questions - Two Column Layout */}
        {(week.goals.length > 0 || week.reflectionQuestions.length > 0) && (
          <div className="grid grid-cols-2 gap-4 ml-6 mb-3">
            {/* Goals */}
            {week.goals.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Goals
                </h4>
                <ul className="space-y-1">
                  {week.goals.map((goal, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-1">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflection Questions */}
            {week.reflectionQuestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Reflection Questions
                </h4>
                <ul className="space-y-1">
                  {week.reflectionQuestions.map((question, i) => (
                    <li key={i} className="text-sm text-gray-600 italic flex items-start gap-2">
                      <span className="text-gray-400 mt-1">?</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Todos & Deliverables Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4 flex-1">
        {/* Todos */}
        {week.todos.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="h-3 w-3" />
              Todos ({completedTodos}/{totalTodos})
            </h3>
            <ul className="space-y-2">
              {week.todos.slice(0, 5).map((todo) => (
                <li
                  key={todo.id}
                  className={cn(
                    'flex items-start gap-2 text-sm p-2 rounded',
                    todo.status === 'done' && 'bg-green-50',
                    todo.status === 'in_progress' && 'bg-yellow-50',
                    todo.status === 'blocked' && 'bg-red-50'
                  )}
                >
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
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-gray-700',
                      todo.status === 'done' && 'line-through text-gray-500'
                    )}>
                      {todo.name}
                    </span>
                    {todo.priority === 'high' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                        High
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {week.todos.length > 5 && (
                <li className="text-xs text-gray-500 pl-6">
                  +{week.todos.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Deliverables */}
        {week.deliverables.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Deliverables ({completedDeliverables}/{totalDeliverables})
            </h3>
            <ul className="space-y-2">
              {week.deliverables.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 text-sm bg-white/50 p-2 rounded border border-gray-200',
                    item.status === 'done' && 'bg-green-50 border-green-200'
                  )}
                >
                  <button
                    onClick={() => {
                      if (onDeliverableStatusChange) {
                        const nextStatus = item.status === 'done' ? 'not_started' : 'done'
                        onDeliverableStatusChange(item.id, nextStatus)
                      }
                    }}
                  >
                    {item.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-green-500" />
                    )}
                  </button>
                  <span className={cn(
                    'font-mono text-xs text-gray-600 flex-1',
                    item.status === 'done' && 'line-through text-gray-400'
                  )}>
                    {item.name}
                  </span>
                  {item.format && (
                    <span className="text-xs text-gray-400">.{item.format}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  )
}
