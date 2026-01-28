import { useState, useRef, useEffect, useMemo } from 'react'
import type { PlanTracker, PlanWeek } from '../../../hooks/useQuarterlyPlan'
import { Target, Edit2, Check, X, CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '../../../utils/classNames'
import { Modal } from '../../shared/Modal'
import { useEditModal } from '../../../hooks/useEditModal'

// Color mappings (defined once outside component for performance)
const COLOR_CLASSES = {
  border: {
    blue: 'border-blue-100',
    purple: 'border-purple-100',
    yellow: 'border-yellow-100',
    green: 'border-green-100',
    red: 'border-red-100',
    indigo: 'border-indigo-100',
    emerald: 'border-emerald-100',
    lime: 'border-lime-100',
  },
  bgIcon: {
    blue: 'text-blue-500/10',
    purple: 'text-purple-500/10',
    yellow: 'text-yellow-500/10',
    green: 'text-green-500/10',
    red: 'text-red-500/10',
    indigo: 'text-indigo-500/10',
    emerald: 'text-emerald-500/10',
    lime: 'text-lime-500/10',
  },
  label: {
    blue: 'text-blue-600/70',
    purple: 'text-purple-600/70',
    yellow: 'text-yellow-600/70',
    green: 'text-green-600/70',
    red: 'text-red-600/70',
    indigo: 'text-indigo-600/70',
    emerald: 'text-emerald-600/70',
    lime: 'text-lime-600/70',
  },
  icon: {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    lime: 'text-lime-600',
  },
  bar: {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    lime: 'bg-lime-600',
  },
} as const

type ColorName = keyof typeof COLOR_CLASSES.border

function getColorClass(color: string | undefined, type: keyof typeof COLOR_CLASSES, fallback: string): string {
  if (!color || !(color in COLOR_CLASSES[type])) return fallback
  return COLOR_CLASSES[type][color as ColorName]
}

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
  const { isOpen: showDetailModal, open: openDetailModal, close: closeDetailModal } = useEditModal()
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

  // Get color classes using helper function
  const borderColorClass = getColorClass(tracker.color, 'border', 'border-emerald-100')
  const bgIconColorClass = getColorClass(tracker.color, 'bgIcon', 'text-emerald-500/10')
  const labelColorClass = getColorClass(tracker.color, 'label', 'text-emerald-600/70')
  const iconColorClass = getColorClass(tracker.color, 'icon', 'text-emerald-600')
  const barColorClass = getColorClass(tracker.color, 'bar', 'bg-emerald-600')
  const ringColorClass = tracker.color ? `ring-${tracker.color}-500` : 'ring-emerald-500'

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
      openDetailModal()
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
        'group relative rounded-xl overflow-hidden transition-all duration-300',
        compact ? 'p-4' : 'p-5',
        'bg-white border shadow-sm',
        borderColorClass,
        !isEditing && 'hover:scale-[1.02]',
        isEditing && `ring-2 border-transparent shadow-lg ${ringColorClass}`,
        isClickable && 'cursor-pointer',
        className
      )}
    >
      {/* Decorative background icon */}
      <Icon className={cn("absolute -right-2 -bottom-2 w-16 h-16 rotate-12", bgIconColorClass)} />

      {/* Content */}
      <div className="relative z-10">
        {/* Label */}
        <div className="flex items-center justify-between mb-1">
          <div className={cn("text-2xs font-bold uppercase tracking-wider", labelColorClass)}>
            {tracker.name}
          </div>
          {onUpdate && !isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditValue(tracker.current)
                setIsEditing(true)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Value */}
        {isEditing ? (
          <div className="flex items-center gap-2 mt-2">
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
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm transition-colors"
            >
              <Check size={compact ? 14 : 16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCancel()
              }}
              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X size={compact ? 14 : 16} />
            </button>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <div className={cn(
              "font-bold tracking-tight text-zinc-900",
              compact ? "text-4xl" : "text-3xl"
            )}>
              {tracker.current}
            </div>
            <div className="text-xs font-medium text-zinc-400">
              {tracker.unit && <span>{tracker.unit} </span>}
              {tracker.target !== undefined && (
                <span>/ {tracker.target}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar (only for numeric) */}
      {isNumeric && !isEditing && (
        <div
          className={cn("absolute bottom-0 left-0 h-1 transition-all duration-1000", barColorClass)}
          style={{ width: `${progress}%` }}
        />
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
      onClose={closeDetailModal}
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
