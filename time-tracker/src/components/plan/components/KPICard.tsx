import { useState, useRef, useEffect, useMemo } from 'react'
import type { PlanTracker, PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Target, Edit2, Check, X, CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '../../../utils/classNames'
import { Modal } from '../../shared/Modal'

interface KPICardProps {
  tracker: PlanTracker
  className?: string
  onUpdate?: (value: string | number) => void
  compact?: boolean
  weeks?: PlanWeek[]
}

export function KPICard({ tracker, className, onUpdate, compact = false, weeks }: KPICardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(tracker.current)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const Icon = Target

  // Get tasks for this tracker grouped by week
  const tasksByWeek = useMemo(() => {
    if (!weeks) return []

    const grouped: Array<{
      weekNumber: number
      weekName: string
      tasks: Array<{
        id: string
        title: string
        status: string
      }>
    }> = []

    for (const week of weeks) {
      const matchingTasks = week.todos.filter(todo => todo.typeId === tracker.id)
      if (matchingTasks.length > 0) {
        grouped.push({
          weekNumber: week.weekNumber,
          weekName: week.name || week.theme || `Week ${week.weekNumber}`,
          tasks: matchingTasks.map(t => ({
            id: t.id,
            title: t.title || t.name || '',
            status: t.status || 'not_started'
          }))
        })
      }
    }

    return grouped
  }, [weeks, tracker.id])

  const hasDetails = tasksByWeek.length > 0
  const isClickable = hasDetails && !isEditing

  // Calculate progress percentage for numeric values
  const baseline = typeof tracker.baseline === 'number' ? tracker.baseline : 0
  const target = typeof tracker.target === 'number' ? tracker.target : 100
  const current = typeof tracker.current === 'number' ? tracker.current : 0
  const range = target - baseline
  const progress = range > 0 ? Math.min(100, Math.max(0, ((current - baseline) / range) * 100)) : 0

  const isNumeric = typeof tracker.baseline === 'number' && typeof tracker.target === 'number'

  // Map color names to Tailwind classes
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
  }
  
  const iconColorClass = tracker.color && colorMap[tracker.color] ? colorMap[tracker.color] : 'text-emerald-600'
  const ringColorClass = tracker.color && colorMap[tracker.color] ? `ring-${tracker.color}-500` : 'ring-emerald-500'
  const barColorClass = tracker.color && colorMap[tracker.color] ? `bg-${tracker.color}-500` : 'bg-emerald-500'

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (onUpdate) {
      const val = isNumeric ? Number(editValue) : editValue
      onUpdate(val)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(tracker.current)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const handleCardClick = () => {
    if (isClickable) {
      setShowDetailModal(true)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Done'
      case 'in_progress':
        return 'In Progress'
      case 'blocked':
        return 'Blocked'
      default:
        return 'Not Started'
    }
  }

  return (
    <>
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative bg-linear-to-br from-white to-gray-50/50 rounded-xl border transition-all duration-300',
        compact ? 'p-4' : 'p-5',
        !isEditing && 'border-gray-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50',
        isEditing && `ring-2 border-transparent shadow-lg ${ringColorClass}`,
        isClickable && 'cursor-pointer',
        className
      )}
    >
      {/* Icon decoration - top right */}
      <div className={cn(
        "absolute top-3 right-3 opacity-5 group-hover:opacity-10 transition-opacity",
        compact ? "h-16 w-16" : "h-20 w-20"
      )}>
        <Icon className="h-full w-full" />
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              "p-1.5 rounded-lg bg-linear-to-br transition-colors",
              iconColorClass.includes('blue') ? 'from-blue-100 to-blue-50' :
              iconColorClass.includes('purple') ? 'from-purple-100 to-purple-50' :
              iconColorClass.includes('yellow') ? 'from-yellow-100 to-yellow-50' :
              iconColorClass.includes('green') && !iconColorClass.includes('emerald') ? 'from-green-100 to-green-50' :
              iconColorClass.includes('red') ? 'from-red-100 to-red-50' :
              iconColorClass.includes('indigo') ? 'from-indigo-100 to-indigo-50' :
              'from-emerald-100 to-emerald-50'
            )}>
              <Icon className={cn(iconColorClass, compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </div>
            {onUpdate && !isEditing && (
              <button
                onClick={() => {
                  setEditValue(tracker.current)
                  setIsEditing(true)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
              >
                <Edit2 className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
              </button>
            )}
          </div>
          <h4 className={cn("font-semibold text-gray-700 leading-tight", compact ? "text-xs" : "text-sm")}>
            {tracker.name}
          </h4>
        </div>
      </div>

      {/* Value */}
      <div className={cn("relative", compact ? "mb-2" : "mb-3")}>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={isNumeric ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full px-3 text-gray-900 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500",
                compact ? "py-1.5 text-base font-bold" : "py-2 text-xl font-bold"
              )}
            />
            <button
              onClick={handleSave}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm transition-colors"
            >
              <Check size={compact ? 14 : 16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X size={compact ? 14 : 16} />
            </button>
          </div>
        ) : (
          isNumeric ? (
            <div className="flex items-baseline gap-1">
              <span className={cn("font-black bg-linear-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent", compact ? "text-3xl" : "text-4xl")}>
                {tracker.current}
              </span>
              <span className={cn("font-bold text-gray-400", compact ? "text-base" : "text-lg")}>
                / {tracker.target}
              </span>
              {tracker.unit && <span className="text-xs text-gray-500 ml-1">{tracker.unit}</span>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-sm font-medium text-gray-900">
                {tracker.current}
              </div>
              <div className="text-xs text-gray-500">
                Target: <span className="font-semibold text-gray-600">{tracker.target}</span>
              </div>
            </div>
          )
        )}
      </div>

      {/* Progress bar (only for numeric) */}
      {isNumeric && (
        <div className="relative">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
                barColorClass
              )}
              style={{ width: `${progress}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          {/* Percentage label */}
          <div className={cn(
            "absolute -top-5 right-0 text-xs font-bold transition-opacity",
            progress > 0 ? "opacity-100" : "opacity-0",
            iconColorClass
          )}>
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Click indicator for cards with details */}
      {hasDetails && !isEditing && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>

    {/* Detail Modal */}
    <Modal
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      title={tracker.name}
      description={`${tracker.current} / ${tracker.target} tasks completed`}
      icon={<Target className={iconColorClass} />}
      maxWidth="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {tasksByWeek.map(({ weekNumber, weekName, tasks }) => (
          <div key={weekNumber} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  Week {weekNumber}
                </span>
                <span className="text-sm font-medium text-gray-700">{weekName}</span>
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-100">
              {tasks.map(task => (
                <div key={task.id} className="bg-white px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  {getStatusIcon(task.status)}
                  <span className={cn(
                    "flex-1 text-sm",
                    task.status === 'done' && "text-gray-500 line-through"
                  )}>
                    {task.title}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    task.status === 'done' && "bg-green-100 text-green-700",
                    task.status === 'in_progress' && "bg-blue-100 text-blue-700",
                    task.status === 'blocked' && "bg-red-100 text-red-700",
                    task.status === 'not_started' && "bg-gray-100 text-gray-600"
                  )}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tasksByWeek.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tasks found for this tracker.
          </div>
        )}
      </div>
    </Modal>
    </>
  )
}
