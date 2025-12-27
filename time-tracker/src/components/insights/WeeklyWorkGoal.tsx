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
      bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      accent: 'text-green-600 dark:text-green-400',
      progress: 'bg-green-500',
      label: 'On Target'
    },
    good: {
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      accent: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-blue-500',
      label: 'Good Progress'
    },
    acceptable: {
      bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
      accent: 'text-purple-600 dark:text-purple-400',
      progress: 'bg-purple-500',
      label: 'Acceptable'
    },
    review: {
      bg: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      accent: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500',
      label: 'Review Needed'
    },
    concern: {
      bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      accent: 'text-red-600 dark:text-red-400',
      progress: 'bg-red-500',
      label: 'Needs Attention'
    }
  }

  const colors = statusColors[status] || statusColors.acceptable

  return (
    <div className={cn(
      'rounded-xl p-4',
      'bg-white shadow-sm dark:bg-[hsl(var(--color-dark-surface))]',
      'border border-gray-100 dark:border-gray-800'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className={cn('text-sm font-semibold', 'text-gray-900 dark:text-gray-100')}>
          Weekly Work Goal
        </h3>
      </div>

      {/* Main Hours Display - grouped together */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn('text-3xl font-bold', colors.accent)}>
            {actualHours.toFixed(1)}h
          </span>
          <span className={cn('text-base text-gray-500 dark:text-gray-400')}>
            of {targetHours}h
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>4-week avg: {weeklyAverage.toFixed(1)}h</span>
          <span>•</span>
          {delta >= 0 ? (
            <span className={cn('text-green-600 dark:text-green-400')}>
              +{delta.toFixed(1)}h above target
            </span>
          ) : (
            <span className={cn('text-red-600 dark:text-red-400')}>
              {delta.toFixed(1)}h below target
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mb-2">
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
          status === 'excellent' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          status === 'good' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          status === 'acceptable' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          status === 'review' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          status === 'concern' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {colors.label}
        </span>
      </div>
    </div>
  )
}
