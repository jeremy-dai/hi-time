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

  const getStrokeColor = () => {
    if (goalPercentage >= 100) return '#10b981'
    if (goalPercentage >= 80) return '#34d399'
    if (goalPercentage >= 60) return '#6366f1'
    if (goalPercentage >= 40) return '#f59e0b'
    return '#ef4444'
  }

  // Circular progress ring calculations
  const size = 80
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(goalPercentage, 100) / 100) * circumference

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <CardHeader
        title="Weekly Work Goal"
        icon={Target}
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

        {/* Right: Circular Progress Ring with Percentage */}
        <div className="text-right relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getStrokeColor()}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Percentage text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-xl font-bold', getTextColor())}>
              {goalPercentage.toFixed(0)}%
            </span>
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
