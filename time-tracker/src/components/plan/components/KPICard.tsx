import { useState, useRef, useEffect } from 'react'
import type { PlanTracker } from '../../../hooks/useQuarterlyPlan'
import { Target, Edit2, Check, X } from 'lucide-react'
import { cn } from '../../../utils/classNames'

interface KPICardProps {
  tracker: PlanTracker
  className?: string
  onUpdate?: (value: string | number) => void
  compact?: boolean
}

export function KPICard({ tracker, className, onUpdate, compact = false }: KPICardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(tracker.current)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const Icon = Target

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

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 transition-all',
        compact ? 'p-3' : 'p-4',
        !isEditing && 'hover:border-emerald-300',
        isEditing && `ring-2 border-transparent ${ringColorClass}`,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn("font-medium text-gray-600 truncate", compact ? "text-xs" : "text-sm")}>{tracker.name}</span>
        <div className="flex items-center gap-2">
          {onUpdate && !isEditing && (
            <button
              onClick={() => {
                setEditValue(tracker.current)
                setIsEditing(true)
              }}
              className="p-1 text-gray-400 hover:text-emerald-600 rounded transition-colors"
            >
              <Edit2 className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
            </button>
          )}
          <Icon className={cn(iconColorClass, compact ? "h-3 w-3" : "h-4 w-4")} />
        </div>
      </div>

      {/* Value */}
      <div className={cn("mb-2", compact ? "mb-1" : "mb-3")}>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={isNumeric ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full px-2 text-gray-900 bg-gray-50 border border-gray-200 rounded focus:outline-none",
                compact ? "py-0.5 text-sm" : "py-1 text-lg font-bold"
              )}
            />
            <button
              onClick={handleSave}
              className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
            >
              <Check size={compact ? 12 : 16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              <X size={compact ? 12 : 16} />
            </button>
          </div>
        ) : (
          isNumeric ? (
            <div className="flex items-baseline">
              <span className={cn("font-bold text-gray-900", compact ? "text-xl" : "text-2xl")}>{tracker.current}</span>
              {tracker.unit && <span className="text-xs text-gray-500 ml-1">{tracker.unit}</span>}
              <span className="text-xs text-gray-500 ml-1">/ {tracker.target}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Current: </span>
                <span className="text-gray-900">{tracker.current}</span>
              </div>
              <div className="text-xs text-gray-500">
                Target: {tracker.target}
              </div>
            </div>
          )
        )}
      </div>

      {/* Progress bar (only for numeric) */}
      {isNumeric && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColorClass)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
