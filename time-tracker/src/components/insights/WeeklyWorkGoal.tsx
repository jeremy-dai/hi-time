import { cn } from '../../utils/classNames'
import type { WorkGoalMetrics } from '../../types/insights'
import { Target } from 'lucide-react'

interface WeeklyWorkGoalProps {
  metrics: WorkGoalMetrics
}

export default function WeeklyWorkGoal({ metrics }: WeeklyWorkGoalProps) {
  const { targetHours, actualHours, weeklyAverage, goalPercentage, delta } = metrics

  // Determine color based on percentage without status labels
  const getProgressColor = () => {
    if (goalPercentage >= 100) return 'bg-green-500'
    if (goalPercentage >= 80) return 'bg-emerald-500'
    if (goalPercentage >= 60) return 'bg-purple-500'
    if (goalPercentage >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getTextColor = () => {
    if (goalPercentage >= 100) return 'text-green-600'
    if (goalPercentage >= 80) return 'text-emerald-600'
    if (goalPercentage >= 60) return 'text-purple-600'
    if (goalPercentage >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          Weekly Work Goal
        </h3>
      </div>

      {/* Main Display - Horizontal Layout */}
      <div className="flex items-end justify-between mb-4">
        {/* Left: Current hours */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-4xl font-bold', getTextColor())}>
              {actualHours.toFixed(1)}h
            </span>
            <span className="text-lg text-gray-400">
              of {targetHours}h
            </span>
          </div>
        </div>

        {/* Right: Percentage */}
        <div className="text-right">
          <div className={cn('text-2xl font-bold', getTextColor())}>
            {goalPercentage.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
        <div
          className={cn('h-full transition-all duration-500', getProgressColor())}
          style={{ width: `${Math.min(100, goalPercentage)}%` }}
        />
      </div>

      {/* Bottom Stats - Horizontal Layout */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          4-week avg: <span className="font-medium text-gray-700">{weeklyAverage.toFixed(1)}h</span>
        </span>
        {delta >= 0 ? (
          <span className="text-green-600 font-medium">
            +{delta.toFixed(1)}h above target
          </span>
        ) : (
          <span className="text-red-600 font-medium">
            {delta.toFixed(1)}h below target
          </span>
        )}
      </div>
    </div>
  )
}
