import { cn } from '../../utils/classNames'
import type { WorkGoalMetrics } from '../../types/insights'
import { Target } from 'lucide-react'
import CardHeader from '../shared/CardHeader'
import ProgressBar from '../shared/ProgressBar'

interface WeeklyWorkGoalProps {
  metrics: WorkGoalMetrics
}

export default function WeeklyWorkGoal({ metrics }: WeeklyWorkGoalProps) {
  const { targetHours, actualHours, weeklyAverage, goalPercentage, delta } = metrics

  // Determine color based on percentage without status labels
  const getProgressColor = () => {
    if (goalPercentage >= 100) return 'bg-emerald-500'
    if (goalPercentage >= 80) return 'bg-emerald-400'
    if (goalPercentage >= 60) return 'bg-indigo-500'
    if (goalPercentage >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getTextColor = () => {
    if (goalPercentage >= 100) return 'text-emerald-600'
    if (goalPercentage >= 80) return 'text-emerald-500'
    if (goalPercentage >= 60) return 'text-indigo-600'
    if (goalPercentage >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <CardHeader 
        title="Weekly Work Goal" 
        icon={Target}
        titleClassName="text-sm text-zinc-900"
        className="mb-5"
      />

      {/* Main Display - Horizontal Layout */}
      <div className="flex items-end justify-between mb-4">
        {/* Left: Current hours */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-4xl font-bold tracking-tight', getTextColor())}>
              {actualHours.toFixed(1)}h
            </span>
            <span className="text-lg text-zinc-400 font-medium">
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
      <ProgressBar 
        value={goalPercentage} 
        className="h-1.5 mb-3"
        barClassName={getProgressColor()}
      />

      {/* Bottom Stats - Horizontal Layout */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          4-week avg: <span className="font-medium text-zinc-700">{weeklyAverage.toFixed(1)}h</span>
        </span>
        {delta >= 0 ? (
          <span className="text-emerald-600 font-medium">
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
