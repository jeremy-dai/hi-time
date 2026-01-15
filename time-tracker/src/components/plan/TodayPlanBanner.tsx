import { useState } from 'react'
import type { UseQuarterlyPlanReturn, PlanWeek } from '../../hooks/useQuarterlyPlan'
import { Target, ChevronDown, ChevronRight, CheckCircle2, Circle, Sparkles, Calendar } from 'lucide-react'
import { cn } from '../../utils/classNames'

interface TodayPlanBannerProps {
  planData: UseQuarterlyPlanReturn
}

function getDayName(dayStr: string): string {
  const days: Record<string, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  }
  return days[dayStr] || dayStr.slice(0, 3)
}

function getCurrentDayOfWeek(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

export default function TodayPlanBanner({ planData }: TodayPlanBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { currentWeek, currentCycle, updateTodoStatus, updateDeliverableStatus } = planData

  if (!currentWeek || !currentCycle) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-3">
        <div className="max-w-5xl mx-auto text-sm text-gray-600">
          No active plan loaded. Visit Mission Control to import your quarterly plan.
        </div>
      </div>
    )
  }

  const todayDayName = getCurrentDayOfWeek()
  const todayPlan = currentWeek.dailyPlan.find(d => d.day === todayDayName)

  const totalTodos = currentWeek.todos.length
  const completedTodos = currentWeek.todos.filter(t => t.status === 'done').length
  const totalDeliverables = currentWeek.deliverables.length
  const completedDeliverables = currentWeek.deliverables.filter(d => d.status === 'done').length

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 px-8 py-3">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={cn("flex items-center justify-between", isExpanded && "mb-3")}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:bg-white/50 rounded px-2 py-1 -ml-2 transition-colors"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <Sparkles size={20} className="text-purple-600" />
            <div className="text-left">
              <h2 className="text-base font-semibold text-gray-900">
                Week {currentWeek.weekNumber}: {currentWeek.name}
              </h2>
              <p className="text-xs text-gray-600">
                {currentCycle.name} • {formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)}
              </p>
            </div>
          </button>

          {isExpanded && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-gray-700">
                  {completedTodos}/{totalTodos} todos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target size={16} className="text-blue-600" />
                <span className="text-gray-700">
                  {completedDeliverables}/{totalDeliverables} deliverables
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-3">
            {/* Theme & Focus */}
            {currentWeek.theme && (
              <div className="bg-white/60 rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 mb-1">This Week's Theme</div>
                <div className="text-sm text-gray-800">{currentWeek.theme}</div>
              </div>
            )}

            {/* Today's Plan */}
            {todayPlan && (
              <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-blue-600" />
                  <div className="text-xs font-semibold text-blue-700">
                    Today's Plan ({todayDayName})
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {todayPlan.techWork && (
                    <div>
                      <span className="font-medium text-gray-700">Tech:</span>{' '}
                      <span className="text-gray-600">{todayPlan.techWork}</span>
                      {todayPlan.techHours && (
                        <span className="text-xs text-gray-500 ml-2">({todayPlan.techHours}h)</span>
                      )}
                    </div>
                  )}
                  {todayPlan.productAction && (
                    <div>
                      <span className="font-medium text-gray-700">Product:</span>{' '}
                      <span className="text-gray-600">{todayPlan.productAction}</span>
                      {todayPlan.productMinutes && (
                        <span className="text-xs text-gray-500 ml-2">({todayPlan.productMinutes}m)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Todos */}
            {totalTodos > 0 && (
              <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Week Todos</div>
                <div className="space-y-1.5">
                  {currentWeek.todos.slice(0, 5).map(todo => (
                    <div key={todo.id} className="flex items-start gap-2">
                      <button
                        onClick={() => {
                          const newStatus = todo.status === 'done' ? 'not_started' : 'done'
                          updateTodoStatus(currentWeek.weekNumber, todo.id, newStatus)
                        }}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {todo.status === 'done' ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <Circle size={16} className="text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm',
                            todo.status === 'done'
                              ? 'text-gray-500 line-through'
                              : 'text-gray-700'
                          )}
                        >
                          {todo.name}
                        </div>
                        {todo.priority === 'high' && (
                          <span className="text-xs text-red-600 font-medium">High Priority</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {totalTodos > 5 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{totalTodos - 5} more todos (view in Mission Control)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deliverables */}
            {totalDeliverables > 0 && (
              <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
                <div className="text-xs font-semibold text-amber-700 mb-2">Week Deliverables</div>
                <div className="space-y-1.5">
                  {currentWeek.deliverables.map(deliverable => (
                    <div key={deliverable.id} className="flex items-start gap-2">
                      <button
                        onClick={() => {
                          const newStatus = deliverable.status === 'done' ? 'not_started' : 'done'
                          updateDeliverableStatus(currentWeek.weekNumber, deliverable.id, newStatus)
                        }}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {deliverable.status === 'done' ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <Circle size={16} className="text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm',
                            deliverable.status === 'done'
                              ? 'text-gray-500 line-through'
                              : 'text-gray-700'
                          )}
                        >
                          {deliverable.name}
                        </div>
                        {deliverable.resumeValue && deliverable.resumeValue >= 3 && (
                          <span className="text-xs text-amber-600 font-medium">
                            Resume Impact: {deliverable.resumeValue}/5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
