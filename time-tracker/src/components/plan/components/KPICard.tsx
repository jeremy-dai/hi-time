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
        'group relative bg-linear-to-br from-white to-gray-50/50 rounded-xl border transition-all duration-300',
        compact ? 'p-4' : 'p-5',
        !isEditing && 'border-gray-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50',
        isEditing && `ring-2 border-transparent shadow-lg ${ringColorClass}`,
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
    </div>
  )
}
