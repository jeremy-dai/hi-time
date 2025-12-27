import { cn } from '../../utils/classNames'
import type { WorkGoalMetrics } from '../../types/insights'
import { Target } from 'lucide-react'

interface WeeklyWorkGoalProps {
  metrics: WorkGoalMetrics
}

export default function WeeklyWorkGoal({ metrics }: WeeklyWorkGoalProps) {
  const { targetHours, actualHours, weeklyAverage, goalPercentage, status, delta } = metrics

  // Color coding based on status
  const statusColors = {
    excellent: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-900',
      accent: 'text-green-600',
      progress: 'bg-green-500',
      label: 'On Target'
    },
    good: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-900',
      accent: 'text-blue-600',
      progress: 'bg-blue-500',
      label: 'Good Progress'
    },
    acceptable: {
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-900',
      accent: 'text-purple-600',
      progress: 'bg-purple-500',
      label: 'Acceptable'
    },
    review: {
      bg: 'from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-900',
      accent: 'text-amber-600',
      progress: 'bg-amber-500',
      label: 'Review Needed'
    },
    concern: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-900',
      accent: 'text-red-600',
      progress: 'bg-red-500',
      label: 'Needs Attention'
    }
  }

  const colors = statusColors[status] || statusColors.acceptable

  return (
    <div className={cn(
      'rounded-xl p-4',
      'bg-white shadow-sm',
      'border border-gray-100'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gray-500" />
        <h3 className={cn('text-sm font-semibold', 'text-gray-900')}>
          Weekly Work Goal
        </h3>
      </div>

      {/* Main Hours Display - grouped together */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn('text-3xl font-bold', colors.accent)}>
            {actualHours.toFixed(1)}h
          </span>
          <span className={cn('text-base text-gray-500')}>
            of {targetHours}h
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>4-week avg: {weeklyAverage.toFixed(1)}h</span>
          <span>•</span>
          {delta >= 0 ? (
            <span className={cn('text-green-600')}>
              +{delta.toFixed(1)}h above target
            </span>
          ) : (
            <span className={cn('text-red-600')}>
              {delta.toFixed(1)}h below target
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-2">
        <div
          className={cn('h-full transition-all duration-500', colors.progress)}
          style={{ width: `${Math.min(100, goalPercentage)}%` }}
        />
      </div>

      {/* Status - grouped together */}
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', colors.accent)}>
          {goalPercentage.toFixed(0)}% complete
        </span>
        <span className={cn('text-xs px-2 py-1 rounded-full', 
          status === 'excellent' && 'bg-green-100 text-green-700',
          status === 'good' && 'bg-blue-100 text-blue-700',
          status === 'acceptable' && 'bg-purple-100 text-purple-700',
          status === 'review' && 'bg-amber-100 text-amber-700',
          status === 'concern' && 'bg-red-100 text-red-700'
        )}>
          {colors.label}
        </span>
      </div>
    </div>
  )
}
